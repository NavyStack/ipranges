// src/vultr/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'
import { VultrIpRanges } from '../types'

// Define output file paths
const IPV4_OUTPUT = path.join('vultr', 'ipv4.txt')
const IPV6_OUTPUT = path.join('vultr', 'ipv6.txt')

// Fetch Vultr IP ranges
const fetchVultrIpRanges = async (): Promise<void> => {
  const data = await fetchWithRetryAndTimeout<VultrIpRanges>(
    'https://geofeed.constant.com/?json'
  )

  // Extract IP prefixes
  const ipPrefixes = data.subnets
    .map((subnet) => subnet.ip_prefix)
    .filter(Boolean)

  // Separate IPv4 and IPv6
  const ipv4Addresses = ipPrefixes.filter((ip) => !ip.includes(':'))
  const ipv6Addresses = ipPrefixes.filter((ip) => ip.includes(':'))

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

  console.log('[Vultr] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchVultrIpRanges()
    console.log('[Vultr] Complete!')
  } catch (error) {
    console.error('[Vultr] Error:', error)
    process.exit(1)
  }
}

export default main
