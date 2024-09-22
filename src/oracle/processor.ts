// src/oracle/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { OracleIpRanges } from '../types'

const IPV4_OUTPUT = path.join('oracle', 'ipv4.txt')

const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, data)
}

const fetchOracleIpRanges = async (): Promise<void> => {
  const data = await fetchWithRetryAndTimeout<OracleIpRanges>(
    'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json'
  )

  const ipv4ByRegion: Record<string, string[]> = {}
  const ipv4ByTag: Record<string, string[]> = {}

  data.regions.forEach((regionData) => {
    const regionName = regionData.region
    regionData.cidrs.forEach((cidrData) => {
      const cidr = cidrData.cidr
      const tags = cidrData.tags || []

      if (regionName && cidr) {
        if (!ipv4ByRegion[regionName]) {
          ipv4ByRegion[regionName] = []
        }
        ipv4ByRegion[regionName].push(cidr)
      }

      tags.forEach((tag) => {
        if (tag && cidr) {
          if (!ipv4ByTag[tag]) {
            ipv4ByTag[tag] = []
          }
          ipv4ByTag[tag].push(cidr)
        }
      })
    })
  })

  for (const region in ipv4ByRegion) {
    const ipv4Prefixes = ipv4ByRegion[region]
    const sortedIpv4 = sortAndUnique(ipv4Prefixes)
    const outputPath = path.join('oracle', 'regions', region, 'ipv4.txt')
    await saveIpList(sortedIpv4, outputPath)
  }

  for (const tag in ipv4ByTag) {
    const ipv4Prefixes = ipv4ByTag[tag]
    const sortedIpv4 = sortAndUnique(ipv4Prefixes)
    const outputPath = path.join('oracle', 'tags', tag, 'ipv4.txt')
    await saveIpList(sortedIpv4, outputPath)
  }

  const allIpv4Addresses = data.regions
    .flatMap((region) => region.cidrs.map((cidr) => cidr.cidr))
    .filter(Boolean)
  const sortedAllIpv4 = sortAndUnique(allIpv4Addresses)
  await saveIpList(sortedAllIpv4, IPV4_OUTPUT)

  console.log('[Oracle] IP addresses processed and saved successfully.')
}

const main = async (): Promise<void> => {
  try {
    await fetchOracleIpRanges()
    console.log('[Oracle] Complete!')
  } catch (error) {
    console.error('[Oracle] Error:', error)
    process.exit(1)
  }
}

export default main
