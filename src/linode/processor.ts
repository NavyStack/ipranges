// src/linode/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'

const IPV4_OUTPUT = path.join('linode', 'ipv4.txt')
const IPV6_OUTPUT = path.join('linode', 'ipv6.txt')

const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, data)
}

const fetchLinodeIpRanges = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout<string>(
    'https://geoip.linode.com/'
  )

  const lines = text.split('\n').filter((line) => line && !line.startsWith('#'))

  const headers = ['ip_prefix', 'alpha2code', 'region', 'city', 'postal_code']

  const entries = lines.map((line) => {
    const values = line.split(',')
    const entry: Record<string, string> = {}
    headers.forEach((header, index) => {
      entry[header] = values[index]
    })
    return entry
  })

  const ipv4ByRegion: Record<string, string[]> = {}
  const ipv6ByRegion: Record<string, string[]> = {}

  entries.forEach((entry) => {
    const ipPrefix = entry['ip_prefix']
    const region = entry['region']
    if (ipPrefix && region) {
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
      const ipv4OutputPath = path.join('linode', 'regions', region, 'ipv4.txt')
      await saveIpList(sortedIpv4, ipv4OutputPath)
    }

    if (ipv6Prefixes.length > 0) {
      const sortedIpv6 = sortAndUnique(ipv6Prefixes)
      const ipv6OutputPath = path.join('linode', 'regions', region, 'ipv6.txt')
      await saveIpList(sortedIpv6, ipv6OutputPath)
    }
  }
  const allIpv4Prefixes = entries
    .map((entry) => entry['ip_prefix'])
    .filter((ip) => ip && !ip.includes(':'))

  const allIpv6Prefixes = entries
    .map((entry) => entry['ip_prefix'])
    .filter((ip) => ip && ip.includes(':'))

  const sortedAllIpv4 = sortAndUnique(allIpv4Prefixes)
  const sortedAllIpv6 = sortAndUnique(allIpv6Prefixes)

  await saveIpList(sortedAllIpv4, IPV4_OUTPUT)
  await saveIpList(sortedAllIpv6, IPV6_OUTPUT)

  console.log('[Linode] IP addresses processed and saved successfully.')
}

const main = async (): Promise<void> => {
  try {
    await fetchLinodeIpRanges()
    console.log('[Linode] Complete!')
  } catch (error) {
    console.error('[Linode] Error:', error)
    process.exit(1)
  }
}

export default main
