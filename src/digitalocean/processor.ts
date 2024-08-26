// src/digitalocean/processor.ts

/** https://docs.digitalocean.com/products/platform/
 * From: https://github.com/nccgroup/cloud_ip_ranges
 * https://github.com/nccgroup/cloud_ip_ranges/blob/24c34811976763b5fa7911ec69b961e671b76e34/cloud_ip_ranges.py#L100
 */
import fetch, { RequestInit } from 'node-fetch'
import { promises as fs } from 'fs'
import path from 'path'

// Define output file paths
const IPV4_OUTPUT = path.join('digitalocean', 'ipv4.txt')
const IPV6_OUTPUT = path.join('digitalocean', 'ipv6.txt')

// Define DigitalOcean URL
const DIGITALOCEAN_URL = 'https://www.digitalocean.com/geo/google.csv'

// Utility function to fetch data with retry and timeout
const fetchWithRetryAndTimeout = async (
  url: string,
  retries: number = 3,
  timeout: number = 10000
): Promise<string> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(url, {
        signal: controller.signal
      } as RequestInit)

      clearTimeout(id)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `Fetch failed for ${url} after ${retries} attempts: ${error.message}`
        )
      }
      console.warn(
        `Fetch attempt ${attempt} for ${url} failed: ${error.message}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
}

// Fetch DigitalOcean IP ranges
const fetchDigitalOceanIpRanges = async (): Promise<string[]> => {
  const text = await fetchWithRetryAndTimeout(DIGITALOCEAN_URL)

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
  await fs.writeFile(IPV4_OUTPUT, sortedIpv4.join('\n'))
  await fs.writeFile(IPV6_OUTPUT, sortedIpv6.join('\n'))

  console.log('[Digitalocean] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    const lines = await fetchDigitalOceanIpRanges()
    await processIpRanges(lines)
    console.log('[Digitalocean] Complete!')
  } catch (error) {
    console.error('[Digitalocean] Error:', error)
    process.exit(1)
  }
}

export default main
