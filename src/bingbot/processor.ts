// src/bingbot/processor.ts
import path from 'path'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'
import { BingBotIpRanges } from '../types'

// Define file paths
const IPV4_OUTPUT_FILE_PATH = path.join('bingbot', 'ipv4.txt')
const IPV6_OUTPUT_FILE_PATH = path.join('bingbot', 'ipv6.txt')

// Fetch and process BingBot IP ranges
const fetchAndProcessBingBotData = async (): Promise<void> => {
  const url = 'https://www.bing.com/toolbox/bingbot.json'
  const data = await fetchWithRetryAndTimeout<BingBotIpRanges>(url)

  // Extract IPv4 and IPv6 addresses
  const ipv4Addresses = data.prefixes
    .map((item) => item.ipv4Prefix)
    .filter((ip): ip is string => typeof ip === 'string')
  const ipv6Addresses = data.prefixes
    .map((item) => item.ipv6Prefix)
    .filter((ip): ip is string => typeof ip === 'string')

  // Sort and remove duplicates
  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  await saveIpAddresses(
    sortedIpv4,
    sortedIpv6,
    IPV4_OUTPUT_FILE_PATH,
    IPV6_OUTPUT_FILE_PATH
  )

  console.log('[Bingbot] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessBingBotData()
    console.log('[Bingbot] Complete!')
  } catch (error) {
    console.error('[Bingbot] Error:', error)
    process.exit(1)
  }
}

export default main
