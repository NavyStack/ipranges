// src/aws/processor.ts

/*
 * https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html
 */

import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { AwsIpRanges } from '../types'

// Define output file paths
const ipv4Output = path.join('amazon', 'ipv4.txt')
const ipv6Output = path.join('amazon', 'ipv6.txt')
const timestampFile = path.join('amazon', 'timestamp.txt')

// Utility function to sort IP addresses
const sortIpAddresses = (addresses: string[]): string[] => {
  return addresses.sort((a, b) => {
    // Determine if addresses are IPv4 or IPv6
    const isIPv4 = (addr: string) => !addr.includes(':')

    if (isIPv4(a) && isIPv4(b)) {
      // Sort IPv4 addresses numerically
      const aParts = a.split('/')[0].split('.').map(Number)
      const bParts = b.split('/')[0].split('.').map(Number)

      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    }

    if (isIPv4(a) && !isIPv4(b)) {
      // IPv4 addresses should come before IPv6 addresses
      return -1
    }

    if (!isIPv4(a) && isIPv4(b)) {
      // IPv6 addresses should come after IPv4 addresses
      return 1
    }

    // Sort IPv6 addresses lexicographically
    return a.localeCompare(b)
  })
}

// Fetch AWS IP ranges
const fetchAwsIpRanges = async (): Promise<void> => {
  const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json')

  if (!response.ok) {
    throw new Error('[AWS] Failed to fetch AWS IP ranges')
  }

  const data = (await response.json()) as AwsIpRanges // Type assertion

  // Extract creation date
  const createDate = data.createDate
  await fs.writeFile(timestampFile, createDate)

  // Extract IPv4 and IPv6 prefixes
  const ipv4Prefixes = data.prefixes
    .map((prefix) => prefix.ip_prefix)
    .filter(Boolean)
  const ipv6Prefixes = data.ipv6_prefixes
    .map((prefix) => prefix.ipv6_prefix)
    .filter(Boolean)

  // Sort and remove duplicates
  const sortedIpv4 = sortIpAddresses(Array.from(new Set(ipv4Prefixes)))
  const sortedIpv6 = sortIpAddresses(Array.from(new Set(ipv6Prefixes)))

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('[AWS] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAwsIpRanges()
  } catch (error) {
    console.error('[AWS] Error:', error)
    process.exit(1)
  }
}

export default main
