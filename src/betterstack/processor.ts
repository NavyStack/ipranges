// src/betterstack/processor.ts

import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'

// Define output file paths
const ipv4Output = path.join('betterstack', 'ipv4.txt')
const ipv6Output = path.join('betterstack', 'ipv6.txt')

// Define BetterStack URL
const betterstackUrl = 'https://uptime.betterstack.com/ips.txt'

// Fetch IP ranges and save to file
const fetchBetterstackIps = async (): Promise<void> => {
  const response = await fetch(betterstackUrl)

  if (!response.ok) {
    throw new Error('Failed to fetch BetterStack IP ranges')
  }

  const text = await response.text()

  // Split lines and filter out comments
  const lines = text
    .split('\n')
    .filter((line) => !line.startsWith('#') && line.trim() !== '')

  // Process and separate IPv4 and IPv6 addresses
  const ipv4Addresses = lines.filter((line) => !line.includes(':'))
  const ipv6Addresses = lines.filter((line) => line.includes(':'))

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

  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('BetterStack IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchBetterstackIps()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
