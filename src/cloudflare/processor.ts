// src/cloudflare/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'

// Define file paths
const IPV4_OUTPUT = path.join('cloudflare', 'ipv4.txt')
const IPV6_OUTPUT = path.join('cloudflare', 'ipv6.txt')

// Fetch Cloudflare IP ranges
const fetchCloudflareIpRanges = async (): Promise<void> => {
  const ipv4Text = await fetchWithRetryAndTimeout<string>(
    'https://www.cloudflare.com/ips-v4/'
  )
  const ipv6Text = await fetchWithRetryAndTimeout<string>(
    'https://www.cloudflare.com/ips-v6/'
  )

  const ipv4Addresses = ipv4Text.split('\n').filter(Boolean)
  const ipv6Addresses = ipv6Text.split('\n').filter(Boolean)

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

  console.log('[Cloudflare] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchCloudflareIpRanges()
    console.log('[Cloudflare] Complete!')
  } catch (error) {
    console.error('[Cloudflare] Error:', error)
    process.exit(1)
  }
}

export default main
