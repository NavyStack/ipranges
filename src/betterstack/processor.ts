// src/betterstack/processor.ts
import fetch, { RequestInit } from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'

// Define output file paths
const IPV4_OUTPUT = path.join('betterstack', 'ipv4.txt')
const IPV6_OUTPUT = path.join('betterstack', 'ipv6.txt')

// Define BetterStack URL
const BETTERSTACK_URL = 'https://uptime.betterstack.com/ips.txt'

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

// Fetch IP ranges and save to file
const fetchBetterstackIps = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout(BETTERSTACK_URL)

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
  await fs.writeFile(IPV4_OUTPUT, sortedIpv4.join('\n'))
  await fs.writeFile(IPV6_OUTPUT, sortedIpv6.join('\n'))

  console.log('[BetterStack] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchBetterstackIps()
    console.log('[BetterStack] Complete!')
  } catch (error) {
    console.error('[BetterStack] Error:', error)
    process.exit(1)
  }
}

export default main
