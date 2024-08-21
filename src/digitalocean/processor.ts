// src/digitalocean/processor.ts
import { promises as fs } from 'fs'
import path from 'path'
import fetch from 'node-fetch'

// Define output file paths
const ipv4Output = path.join('digitalocean', 'ipv4.txt')
const ipv6Output = path.join('digitalocean', 'ipv6.txt')

// Fetch DigitalOcean IP ranges
const fetchDigitalOceanIpRanges = async (): Promise<string[]> => {
  const response = await fetch('https://www.digitalocean.com/geo/google.csv')
  if (!response.ok) {
    throw new Error('Failed to fetch DigitalOcean IP ranges')
  }

  // Read the response as text
  const text = await response.text()

  // Split by lines, filter out comments and empty lines, and extract the IP addresses
  const lines = text
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    .map((line) => line.split(',')[0].trim())

  return lines
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
      const aParts = a.split('.').map(Number)
      const bParts = b.split('.').map(Number)
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
const processIpRanges = async (lines: string[]): Promise<void> => {
  // Separate IPv4 and IPv6
  const ipv4Lines = lines.filter((line) => !line.includes(':'))
  const ipv6Lines = lines.filter((line) => line.includes(':'))

  // Sort and remove duplicates
  const sortedIpv4 = sortIpAddresses(ipv4Lines)
  const sortedIpv6 = sortIpAddresses(ipv6Lines)

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('DigitalOcean IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    const lines = await fetchDigitalOceanIpRanges()
    await processIpRanges(lines)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
