// src/microsoft-azure/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { MicrosoftIpRanges } from '../types'

const OUTPUT_DIR = 'microsoft-azure'
const CLOUD_TYPES = {
  'public-cloud': '56519',
  'us-gov': '57063',
  germany: '57064',
  china: '57062'
}

const saveIpList = async (ipAddresses: string[], outputPath: string) => {
  if (ipAddresses.length > 0) {
    const data = ipAddresses.join('\n')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, data)
  }
}

const sanitizeFolderName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9-_]/g, '_')

const extractIpAddresses = (prefixes: string[]) => {
  const ipv4 = prefixes.filter((prefix) => !prefix.includes(':'))
  const ipv6 = prefixes.filter((prefix) => prefix.includes(':'))
  return {
    ipv4: sortAndUnique(ipv4),
    ipv6: sortAndUnique(ipv6)
  }
}

const saveRegionFiles = async (
  ipv4: string[],
  ipv6: string[],
  cloudType: string,
  region: string,
  systemService: string
) => {
  const serviceDir = path.join(
    OUTPUT_DIR,
    sanitizeFolderName(cloudType),
    sanitizeFolderName(region),
    sanitizeFolderName(systemService)
  )

  await Promise.all([
    saveIpList(ipv4, path.join(serviceDir, 'ipv4.txt')),
    saveIpList(ipv6, path.join(serviceDir, 'ipv6.txt'))
  ])

  console.log(
    `[Azure] Processed and saved IPs for region: ${region}, cloud type: ${cloudType}, systemService: ${systemService}`
  )
}

const downloadAndParseCloudType = async (
  cloudType: string,
  cloudId: string
) => {
  try {
    const pageContent = await fetchWithRetryAndTimeout<string>(
      `https://www.microsoft.com/en-us/download/confirmation.aspx?id=${cloudId}`
    )

    const downloadUrl = pageContent.match(
      /https:\/\/download\.microsoft\.com\/download\/[^"]+/
    )?.[0]
    if (!downloadUrl) throw new Error('[Azure] Download URL not found')

    const data = await fetchWithRetryAndTimeout<MicrosoftIpRanges>(
      downloadUrl,
      {},
      async (response) => JSON.parse(await response.text())
    )

    if (!data.values)
      throw new Error('[Azure] Invalid data format: missing "values" property')

    const cloudIpv4 = new Set<string>()
    const cloudIpv6 = new Set<string>()
    const regionAggregates: Record<
      string,
      { ipv4: Set<string>; ipv6: Set<string> }
    > = {}

    for (const item of data.values) {
      const {
        region,
        addressPrefixes,
        systemService = 'default'
      } = item.properties

      if (!region) {
        console.warn(`[Azure] Skipping entry due to missing region name.`)
        continue
      }

      const { ipv4, ipv6 } = extractIpAddresses(addressPrefixes || [])
      await saveRegionFiles(ipv4, ipv6, cloudType, region, systemService)

      regionAggregates[region] ??= { ipv4: new Set(), ipv6: new Set() }
      ipv4.forEach((ip) => regionAggregates[region].ipv4.add(ip))
      ipv6.forEach((ip) => regionAggregates[region].ipv6.add(ip))

      ipv4.forEach((ip) => cloudIpv4.add(ip))
      ipv6.forEach((ip) => cloudIpv6.add(ip))
    }

    await saveAggregatedFiles(
      cloudType,
      regionAggregates,
      Array.from(cloudIpv4),
      Array.from(cloudIpv6)
    )
    console.log(`[Azure] Saved aggregated IPs for cloud type: ${cloudType}`)
  } catch (error) {
    console.error(
      `[Azure] Error processing cloud type ${cloudType} (ID: ${cloudId}):`,
      error
    )
  }
}

const saveAggregatedFiles = async (
  cloudType: string,
  regionAggregates: Record<string, { ipv4: Set<string>; ipv6: Set<string> }>,
  cloudIpv4: string[],
  cloudIpv6: string[]
) => {
  await Promise.all(
    Object.entries(regionAggregates).map(async ([region, { ipv4, ipv6 }]) => {
      const regionDir = path.join(
        OUTPUT_DIR,
        sanitizeFolderName(cloudType),
        sanitizeFolderName(region)
      )
      await saveIpList(
        sortAndUnique(Array.from(ipv4)),
        path.join(regionDir, 'ipv4.txt')
      )
      await saveIpList(
        sortAndUnique(Array.from(ipv6)),
        path.join(regionDir, 'ipv6.txt')
      )
      console.log(
        `[Azure] Saved aggregated IPs for region: ${region} under cloud type: ${cloudType}`
      )
    })
  )

  const cloudDir = path.join(OUTPUT_DIR, sanitizeFolderName(cloudType))
  await saveIpList(sortAndUnique(cloudIpv4), path.join(cloudDir, 'ipv4.txt'))
  await saveIpList(sortAndUnique(cloudIpv6), path.join(cloudDir, 'ipv6.txt'))
}

const consolidateFiles = async () => {
  const allIpv4Addresses: Set<string> = new Set()
  const allIpv6Addresses: Set<string> = new Set()

  try {
    const cloudDirs = (
      await fs.readdir(OUTPUT_DIR, { withFileTypes: true })
    ).filter((d) => d.isDirectory())

    await Promise.all(
      cloudDirs.map(async ({ name }) => {
        const cloudDirPath = path.join(OUTPUT_DIR, name)
        const ipv4Content = await readAndAggregateIpFiles(
          path.join(cloudDirPath, 'ipv4.txt')
        )
        const ipv6Content = await readAndAggregateIpFiles(
          path.join(cloudDirPath, 'ipv6.txt')
        )

        ipv4Content.forEach((ip) => allIpv4Addresses.add(ip))
        ipv6Content.forEach((ip) => allIpv6Addresses.add(ip))
      })
    )

    await saveIpList(
      sortAndUnique(Array.from(allIpv4Addresses)),
      path.join(OUTPUT_DIR, 'ipv4.txt')
    )
    await saveIpList(
      sortAndUnique(Array.from(allIpv6Addresses)),
      path.join(OUTPUT_DIR, 'ipv6.txt')
    )

    console.log('[Azure] Consolidated IP addresses saved successfully.')
  } catch (error) {
    console.error('[Azure] Error consolidating IP addresses:', error)
  }
}

const readAndAggregateIpFiles = async (filePath: string): Promise<string[]> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

const main = async () => {
  try {
    await Promise.all(
      Object.entries(CLOUD_TYPES).map(([cloudType, cloudId]) =>
        downloadAndParseCloudType(cloudType, cloudId)
      )
    )
    await consolidateFiles()
    console.log('[Azure] IP ranges have been processed and saved.')
  } catch (error) {
    console.error('[Azure] Error:', error)
    process.exit(1)
  }
}

export default main
