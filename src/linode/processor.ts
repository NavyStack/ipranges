// src/linode/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'

// Define output file paths
const IPV4_OUTPUT = path.join('linode', 'ipv4.txt')
const IPV6_OUTPUT = path.join('linode', 'ipv6.txt')

// Fetch Linode IP ranges
const fetchLinodeIpRanges = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout<string>(
    'https://geoip.linode.com/'
  )

  // Extract IP addresses
  const lines = text
    .split('\n')
    .map((line) => line.split(',')[0])
    .filter((line) => line && !line.startsWith('#'))

  // Separate IPv4 and IPv6
  const ipv4Addresses = lines.filter((line) => !line.includes(':'))
  const ipv6Addresses = lines.filter((line) => line.includes(':'))

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

  console.log('[Linode] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchLinodeIpRanges()
    console.log('[Linode] Complete!')
  } catch (error) {
    console.error('[Linode] Error:', error)
    process.exit(1)
  }
}

export default main
