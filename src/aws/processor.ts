import path from 'path'
import fs from 'fs'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { AwsIpRanges } from '../types'

// Define output file paths
const IPV4_OUTPUT = path.join('amazon', 'ipv4.txt')
const IPV6_OUTPUT = path.join('amazon', 'ipv6.txt')

// Utility function to save IP addresses to a file
const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.promises.writeFile(outputPath, data)
}

// Fetch AWS IP ranges
const fetchAwsIpRanges = async (): Promise<void> => {
  const url = 'https://ip-ranges.amazonaws.com/ip-ranges.json'
  const data = await fetchWithRetryAndTimeout<AwsIpRanges>(url)

  // Group IPv4 prefixes by region
  const ipv4ByRegion: Record<string, string[]> = {}
  data.prefixes.forEach((prefix) => {
    const region = prefix.region
    const ipPrefix = prefix.ip_prefix
    if (region && ipPrefix) {
      if (!ipv4ByRegion[region]) {
        ipv4ByRegion[region] = []
      }
      ipv4ByRegion[region].push(ipPrefix)
    }
  })

  // Group IPv6 prefixes by region
  const ipv6ByRegion: Record<string, string[]> = {}
  data.ipv6_prefixes.forEach((prefix) => {
    const region = prefix.region
    const ipPrefix = prefix.ipv6_prefix
    if (region && ipPrefix) {
      if (!ipv6ByRegion[region]) {
        ipv6ByRegion[region] = []
      }
      ipv6ByRegion[region].push(ipPrefix)
    }
  })

  // Process and save IP addresses per region
  const regions = new Set([
    ...Object.keys(ipv4ByRegion),
    ...Object.keys(ipv6ByRegion)
  ])
  for (const region of regions) {
    const ipv4Prefixes = ipv4ByRegion[region] || []
    const ipv6Prefixes = ipv6ByRegion[region] || []

    if (ipv4Prefixes.length > 0) {
      const sortedIpv4 = sortAndUnique(ipv4Prefixes)
      const ipv4OutputPath = path.join('amazon', 'regions', region, 'ipv4.txt')
      await saveIpList(sortedIpv4, ipv4OutputPath)
    }

    if (ipv6Prefixes.length > 0) {
      const sortedIpv6 = sortAndUnique(ipv6Prefixes)
      const ipv6OutputPath = path.join('amazon', 'regions', region, 'ipv6.txt')
      await saveIpList(sortedIpv6, ipv6OutputPath)
    }
  }

  // Merge all IPv4 and IPv6 prefixes and save to main files
  const allIpv4Prefixes = data.prefixes
    .map((prefix) => prefix.ip_prefix)
    .filter(Boolean)
  const allIpv6Prefixes = data.ipv6_prefixes
    .map((prefix) => prefix.ipv6_prefix)
    .filter(Boolean)

  const sortedAllIpv4 = sortAndUnique(allIpv4Prefixes)
  const sortedAllIpv6 = sortAndUnique(allIpv6Prefixes)

  // Save merged IP addresses
  await saveIpList(sortedAllIpv4, IPV4_OUTPUT)
  await saveIpList(sortedAllIpv6, IPV6_OUTPUT)

  console.log('[AWS] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAwsIpRanges()
    console.log('[AWS] Complete!')
  } catch (error) {
    console.error('[AWS] Error:', error)
    process.exit(1)
  }
}

export default main
