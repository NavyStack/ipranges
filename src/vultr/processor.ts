// src/vultr/processor.ts

import path from 'path'
import fs from 'fs'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { VultrIpRanges } from '../types'

const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.promises.writeFile(outputPath, data)
}

const IPV4_OUTPUT = path.join('vultr', 'ipv4.txt')
const IPV6_OUTPUT = path.join('vultr', 'ipv6.txt')

const fetchVultrIpRanges = async (): Promise<void> => {
  const data = await fetchWithRetryAndTimeout<VultrIpRanges>(
    'https://geofeed.constant.com/?json'
  )

  const ipv4ByRegion: Record<string, string[]> = {}
  const ipv6ByRegion: Record<string, string[]> = {}

  data.subnets.forEach((subnet) => {
    const region = subnet.region
    const ipPrefix = subnet.ip_prefix
    if (region && ipPrefix) {
      if (ipPrefix.includes(':')) {
        if (!ipv6ByRegion[region]) {
          ipv6ByRegion[region] = []
        }
        ipv6ByRegion[region].push(ipPrefix)
      } else {
        if (!ipv4ByRegion[region]) {
          ipv4ByRegion[region] = []
        }
        ipv4ByRegion[region].push(ipPrefix)
      }
    }
  })

  const regions = new Set([
    ...Object.keys(ipv4ByRegion),
    ...Object.keys(ipv6ByRegion)
  ])
  for (const region of regions) {
    const ipv4Prefixes = ipv4ByRegion[region] || []
    const ipv6Prefixes = ipv6ByRegion[region] || []

    if (ipv4Prefixes.length > 0) {
      const sortedIpv4 = sortAndUnique(ipv4Prefixes)
      const ipv4OutputPath = path.join('vultr', 'regions', region, 'ipv4.txt')
      await saveIpList(sortedIpv4, ipv4OutputPath)
    }

    if (ipv6Prefixes.length > 0) {
      const sortedIpv6 = sortAndUnique(ipv6Prefixes)
      const ipv6OutputPath = path.join('vultr', 'regions', region, 'ipv6.txt')
      await saveIpList(sortedIpv6, ipv6OutputPath)
    }
  }

  const allIpv4Prefixes = data.subnets
    .map((subnet) => subnet.ip_prefix)
    .filter((ip) => ip && !ip.includes(':'))

  const allIpv6Prefixes = data.subnets
    .map((subnet) => subnet.ip_prefix)
    .filter((ip) => ip && ip.includes(':'))

  const sortedAllIpv4 = sortAndUnique(allIpv4Prefixes)
  const sortedAllIpv6 = sortAndUnique(allIpv6Prefixes)

  await saveIpList(sortedAllIpv4, IPV4_OUTPUT)
  await saveIpList(sortedAllIpv6, IPV6_OUTPUT)

  console.log('[Vultr] IP addresses processed and saved successfully.')
}

const main = async (): Promise<void> => {
  try {
    await fetchVultrIpRanges()
    console.log('[Vultr] Complete!')
  } catch (error) {
    console.error('[Vultr] Error:', error)
    process.exit(1)
  }
}

export default main
