// src/betterstack/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'

// Define output file paths
const IPV4_OUTPUT = path.join('betterstack', 'ipv4.txt')
const IPV6_OUTPUT = path.join('betterstack', 'ipv6.txt')

// Define BetterStack URL
const BETTERSTACK_URL = 'https://uptime.betterstack.com/ips.txt'

// Fetch IP ranges and save to file
const fetchBetterstackIps = async (): Promise<void> => {
  const text = await fetchWithRetryAndTimeout<string>(BETTERSTACK_URL)

  // Split lines and filter out comments
  const lines = text
    .split('\n')
    .filter((line) => !line.startsWith('#') && line.trim() !== '')

  // Process and separate IPv4 and IPv6 addresses
  const ipv4Addresses = lines.filter((line) => !line.includes(':'))
  const ipv6Addresses = lines.filter((line) => line.includes(':'))

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

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
