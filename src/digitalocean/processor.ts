// src/digitalocean/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'

// Define output file paths
const IPV4_OUTPUT = path.join('digitalocean', 'ipv4.txt')
const IPV6_OUTPUT = path.join('digitalocean', 'ipv6.txt')

// Fetch DigitalOcean IP ranges
const fetchDigitalOceanIpRanges = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout<string>(
    'https://www.digitalocean.com/geo/google.csv'
  )

  // Extract IP addresses
  const lines = text
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    .map((line) => line.split(',')[0].trim())

  // Separate IPv4 and IPv6
  const ipv4Addresses = lines.filter((line) => !line.includes(':'))
  const ipv6Addresses = lines.filter((line) => line.includes(':'))

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

  console.log('[DigitalOcean] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchDigitalOceanIpRanges()
    console.log('[DigitalOcean] Complete!')
  } catch (error) {
    console.error('[DigitalOcean] Error:', error)
    process.exit(1)
  }
}

export default main
