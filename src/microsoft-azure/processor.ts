// src/microsoft-azure/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { MicrosoftIpRanges } from '../types'

// Define constants and URLs
const OUTPUT_DIR = 'microsoft-azure'
const REGION_IDS: Record<string, string> = {
  'public-cloud': '56519',
  'us-gov': '57063',
  germany: '57064',
  china: '57062'
}

// Create output directories
const createOutputDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true })
}

// Download, parse, and save IP ranges for a region
const downloadAndParseBackground = async (
  regionId: string,
  regionName: string
) => {
  const outputDir = path.join(OUTPUT_DIR, regionName)
  await createOutputDir(outputDir)

  // Fetch download page and extract download URL
  const pageContent = await fetchWithRetryAndTimeout<string>(
    `https://www.microsoft.com/en-us/download/confirmation.aspx?id=${regionId}`
  )

  const urlMatch = pageContent.match(
    /https:\/\/download\.microsoft\.com\/download\/[^"]+/
  )
  if (!urlMatch) throw new Error('[Azure] Download URL not found')
  const downloadUrl = urlMatch[0]

  // Extract timestamp from URL
  const timestampMatch = downloadUrl.match(/\d{8}/)
  const timestamp = timestampMatch ? timestampMatch[0] : 'unknown'

  // Fetch and parse JSON data
  const data = await fetchWithRetryAndTimeout<MicrosoftIpRanges>(
    downloadUrl,
    {},
    async (response) => {
      // 수동으로 JSON 파싱
      const text = await response.text()
      return JSON.parse(text)
    }
  )

  if (!data.values) {
    throw new Error('[Azure] Invalid data format: missing "values" property')
  }

  const ipv4Addresses: string[] = []
  const ipv6Addresses: string[] = []

  const addressPrefixes = data.values.flatMap(
    (item) => item.properties.addressPrefixes || []
  )

  addressPrefixes.forEach((prefix) => {
    if (prefix.includes(':')) {
      ipv6Addresses.push(prefix)
    } else {
      ipv4Addresses.push(prefix)
    }
  })

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Save addresses and timestamp
  await fs.writeFile(path.join(outputDir, 'ipv4.txt'), sortedIpv4.join('\n'))
  await fs.writeFile(path.join(outputDir, 'ipv6.txt'), sortedIpv6.join('\n'))
  await fs.writeFile(path.join(outputDir, 'timestamp.txt'), timestamp)
}

// Consolidate files into single files for all regions
const consolidateFiles = async () => {
  const allIpv4Addresses: Set<string> = new Set()
  const allIpv6Addresses: Set<string> = new Set()

  for (const [regionName] of Object.entries(REGION_IDS)) {
    const ipv4File = path.join(OUTPUT_DIR, regionName, 'ipv4.txt')
    const ipv6File = path.join(OUTPUT_DIR, regionName, 'ipv6.txt')

    const ipv4Content = await fs.readFile(ipv4File, 'utf-8')
    const ipv6Content = await fs.readFile(ipv6File, 'utf-8')

    ipv4Content.split('\n').forEach((line) => {
      if (line.trim()) allIpv4Addresses.add(line.trim())
    })
    ipv6Content.split('\n').forEach((line) => {
      if (line.trim()) allIpv6Addresses.add(line.trim())
    })
  }

  const sortedAllIpv4 = sortAndUnique(Array.from(allIpv4Addresses))
  const sortedAllIpv6 = sortAndUnique(Array.from(allIpv6Addresses))

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'all_ipv4.txt'),
    sortedAllIpv4.join('\n')
  )
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'all_ipv6.txt'),
    sortedAllIpv6.join('\n')
  )
}

// Main function
const main = async () => {
  try {
    await Promise.all(
      Object.entries(REGION_IDS).map(([regionName, regionId]) =>
        downloadAndParseBackground(regionId, regionName)
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
