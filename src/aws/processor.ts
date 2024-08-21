// src/aws/processor.ts
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { AwsIpRanges } from '../types'

// Define output file paths
const ipv4Output = path.join('amazon', 'ipv4.txt')
const ipv6Output = path.join('amazon', 'ipv6.txt')
const timestampFile = path.join('amazon', 'timestamp.txt')

// Fetch AWS IP ranges
const fetchAwsIpRanges = async (): Promise<void> => {
  const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json')

  if (!response.ok) {
    throw new Error('Failed to fetch AWS IP ranges')
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
  const sortAndUnique = (arr: string[]): string[] => {
    return Array.from(new Set(arr)).sort((a, b) => {
      // Compare IPv4 addresses numerically
      if (!a.includes(':') && !b.includes(':')) {
        return a.localeCompare(b, undefined, { numeric: true })
      }
      // Compare IPv6 addresses lexicographically
      return a.localeCompare(b)
    })
  }

  const sortedIpv4 = sortAndUnique(ipv4Prefixes)
  const sortedIpv6 = sortAndUnique(ipv6Prefixes)

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('AWS IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAwsIpRanges()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
