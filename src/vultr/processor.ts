// src/vultr/processor.ts

/*
 * https://docs.vultr.com/vultr-ip-space
 */

import fetch from 'node-fetch'
import { promises as fs } from 'fs'
import path from 'path'
import { VultrIpRanges } from '../types'

// Define output file paths
const ipv4Output = path.join('vultr', 'ipv4.txt')
const ipv6Output = path.join('vultr', 'ipv6.txt')

// Fetch Vultr IP ranges
const fetchVultrIpRanges = async (): Promise<VultrIpRanges> => {
  const response = await fetch('https://geofeed.constant.com/?json')
  if (!response.ok) {
    throw new Error('[Vultr] Failed to fetch IP ranges')
  }
  return response.json() as Promise<VultrIpRanges>
}

// Utility function to sort IP addresses
const sortIpAddresses = (lines: string[]): string[] => {
  return lines.sort((a, b) => {
    // IPv4 and IPv6 are handled differently
    if (a.includes(':') && b.includes(':')) {
      // Sort IPv6 addresses lexicographically
      return a.localeCompare(b)
    } else if (!a.includes(':') && !b.includes(':')) {
      // Sort IPv4 addresses numerically
      const aParts = a.split('/')[0].split('.').map(Number)
      const bParts = b.split('/')[0].split('.').map(Number)
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    } else {
      // IPv4 addresses should come before IPv6 addresses
      return a.includes(':') ? 1 : -1
    }
  })
}

// Process IP ranges
const processIpRanges = async (data: VultrIpRanges): Promise<void> => {
  const combinedLines: string[] = []

  // Extract IP prefixes
  for (const subnet of data.subnets) {
    if (subnet.ip_prefix) {
      combinedLines.push(subnet.ip_prefix)
    }
  }

  // Separate IPv4 and IPv6
  const ipv4Lines = combinedLines.filter((line) =>
    /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+$/.test(line)
  )
  const ipv6Lines = combinedLines.filter((line) =>
    /^[0-9a-fA-F:]+\/[0-9]+$/.test(line)
  )

  // Sort and remove duplicates
  const sortedIpv4 = sortIpAddresses(ipv4Lines)
  const sortedIpv6 = sortIpAddresses(ipv6Lines)

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('[Vultr] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    const data = await fetchVultrIpRanges()
    await processIpRanges(data)
  } catch (error) {
    console.error('[Vultr] Error:', error)
    process.exit(1)
  }
}

export default main
