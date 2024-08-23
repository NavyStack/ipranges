// src/linode/processor.ts

import fetch from 'node-fetch'
import { promises as fs } from 'fs'
import path from 'path'

// Define output file paths
const ipv4Output = path.join('linode', 'ipv4.txt')
const ipv6Output = path.join('linode', 'ipv6.txt')

// Utility function to fetch data with retry logic
const fetchWithRetry = async (
  url: string,
  retries: number = 3,
  timeout: number = 10000
): Promise<string> => {
  const fetchWithTimeout = async (
    url: string,
    timeout: number
  ): Promise<Response> => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, timeout)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      return response.text()
    } catch (error) {
      if (attempt < retries) {
        console.log(`[Linode] Retry ${attempt} failed, retrying...`)
      } else {
        console.error('[Linode] Max retries reached, failing...')
        throw error
      }
    }
  }
}

// Fetch Linode IP ranges
const fetchLinodeIpRanges = async (): Promise<string[]> => {
  const linodeUrl = 'https://geoip.linode.com/'
  const data = await fetchWithRetry(linodeUrl, 3, 10000) // 3 retries, 10 seconds timeout each
  return data
    .split('\n')
    .map((line) => line.split(',')[0])
    .filter((line) => line && !line.startsWith('#'))
}

// Process IP ranges
const processIpRanges = async (lines: string[]): Promise<void> => {
  // Separate IPv4 and IPv6
  const ipv4Lines = lines.filter((line) =>
    /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+$/.test(line)
  )
  const ipv6Lines = lines.filter((line) => /^[0-9a-fA-F:]+\/[0-9]+$/.test(line))

  // Sort and remove duplicates
  const sortedIpv4 = Array.from(new Set(ipv4Lines)).sort((a, b) => {
    const aParts = a.split('/')[0].split('.').map(Number)
    const bParts = b.split('/')[0].split('.').map(Number)
    for (let i = 0; i < 4; i++) {
      if (aParts[i] !== bParts[i]) {
        return aParts[i] - bParts[i]
      }
    }
    return 0
  })

  const sortedIpv6 = Array.from(new Set(ipv6Lines)).sort((a, b) =>
    a.localeCompare(b)
  )

  // Write to output files
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  await fs.writeFile(ipv6Output, sortedIpv6.join('\n'))

  console.log('[Linode] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    const data = await fetchLinodeIpRanges()
    await processIpRanges(data)
  } catch (error) {
    console.error('[Linode] Error:', error)
    process.exit(1)
  }
}

export default main
