// src/digitalocean/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'

const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, data)
}

const IPV4_OUTPUT = path.join('digitalocean', 'ipv4.txt')
const IPV6_OUTPUT = path.join('digitalocean', 'ipv6.txt')

const fetchDigitalOceanIpRanges = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout<string>(
    'https://www.digitalocean.com/geo/google.csv'
  )

  const lines = text
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))

  interface DigitalOceanSubnet {
    ip_prefix: string
    country_code: string
    region_code: string
    city: string
    postal_code: string
  }

  const subnets: DigitalOceanSubnet[] = lines.map((line) => {
    const [ip_prefix, country_code, region_code, city, postal_code] = line
      .split(',')
      .map((item) => item.trim())
    return { ip_prefix, country_code, region_code, city, postal_code }
  })

  const ipv4ByRegion: Record<string, string[]> = {}
  const ipv6ByRegion: Record<string, string[]> = {}

  subnets.forEach((subnet) => {
    const { ip_prefix, region_code } = subnet
    if (ip_prefix && region_code) {
      if (ip_prefix.includes(':')) {
        if (!ipv6ByRegion[region_code]) {
          ipv6ByRegion[region_code] = []
        }
        ipv6ByRegion[region_code].push(ip_prefix)
      } else {
        if (!ipv4ByRegion[region_code]) {
          ipv4ByRegion[region_code] = []
        }
        ipv4ByRegion[region_code].push(ip_prefix)
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
      const ipv4OutputPath = path.join(
        'digitalocean',
        'regions',
        region,
        'ipv4.txt'
      )
      await saveIpList(sortedIpv4, ipv4OutputPath)
    }

    if (ipv6Prefixes.length > 0) {
      const sortedIpv6 = sortAndUnique(ipv6Prefixes)
      const ipv6OutputPath = path.join(
        'digitalocean',
        'regions',
        region,
        'ipv6.txt'
      )
      await saveIpList(sortedIpv6, ipv6OutputPath)
    }
  }

  const allIpv4Prefixes = subnets
    .map((subnet) => subnet.ip_prefix)
    .filter((ip) => ip && !ip.includes(':'))

  const allIpv6Prefixes = subnets
    .map((subnet) => subnet.ip_prefix)
    .filter((ip) => ip && ip.includes(':'))

  const sortedAllIpv4 = sortAndUnique(allIpv4Prefixes)
  const sortedAllIpv6 = sortAndUnique(allIpv6Prefixes)

  await saveIpList(sortedAllIpv4, IPV4_OUTPUT)
  await saveIpList(sortedAllIpv6, IPV6_OUTPUT)

  console.log('[DigitalOcean] IP addresses processed and saved successfully.')
}

const main = async (): Promise<void> => {
  try {
    await fetchDigitalOceanIpRanges()
    console.log('[DigitalOcean] Complete!')
  } catch (error) {
    console.error('[DigitalOcean] Error:', error)
    process.exit(1)
  }
}

export default main
