// src/linode/processor.ts

import fetch from 'node-fetch'
import { promises as fs } from 'fs'
import path from 'path'

// Define output file paths
const ipv4Output = path.join('linode', 'ipv4.txt')
const ipv6Output = path.join('linode', 'ipv6.txt')

// Fetch Linode IP ranges
const fetchLinodeIpRanges = async (): Promise<string[]> => {
  const linodeUrl = 'https://geoip.linode.com/'
  const response = await fetch(linodeUrl)
  if (!response.ok) {
    throw new Error('[Linode] Failed to fetch IP ranges')
  }
  const data = await response.text()
  // Filter out comments and extract only the IP ranges
  return data
    .split('\n')
    .map((line) => line.split(',')[0])
    .filter((line) => line && !line.startsWith('#'))
}

// Utility function to sort and filter IP addresses
const sortAndFilterIpAddresses = (
  lines: string[],
  isIPv6: boolean
): string[] => {
  return lines
    .filter((line) => (isIPv6 ? line.includes(':') : !line.includes(':')))
    .sort((a, b) => a.localeCompare(b))
    .filter((item, pos, arr) => !pos || item !== arr[pos - 1]) // Remove duplicates
}

// Process IP ranges
const processIpRanges = async (data: string[]): Promise<void> => {
  const ipv4Lines = sortAndFilterIpAddresses(data, false)
  const ipv6Lines = sortAndFilterIpAddresses(data, true)

  // Ensure the output directory exists
  await fs.mkdir('linode', { recursive: true })

  // Write sorted and unique IPs to respective files
  await fs.writeFile(ipv4Output, ipv4Lines.join('\n'))
  await fs.writeFile(ipv6Output, ipv6Lines.join('\n'))

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

main().catch((error) => {
  console.error('[Linode] Unhandled Error:', error)
  process.exit(1)
})

export default main
