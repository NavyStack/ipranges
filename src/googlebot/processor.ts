// src/googlebot/processor.ts
import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { GooglebotIpRanges } from '../types'

// Define base directory and URL for googlebot
const GOOGLE_DIR = 'googlebot'
const BASE_URL =
  'https://developers.google.com/search/apis/ipranges/googlebot.json'

// Fetch and process Googlebot IP ranges
const fetchAndProcessGooglebotIpRanges = async (): Promise<void> => {
  const googlebotJson =
    await fetchWithRetryAndTimeout<GooglebotIpRanges>(BASE_URL)

  const ipv4Addresses = googlebotJson.prefixes
    .map((prefix) => prefix.ipv4Prefix)
    .filter(Boolean) as string[]

  const ipv6Addresses = googlebotJson.prefixes
    .map((prefix) => prefix.ipv6Prefix)
    .filter(Boolean) as string[]

  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  // Write to output files
  const dirPath = path.join(GOOGLE_DIR)
  await fs.mkdir(dirPath, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(dirPath, 'ipv4.txt'), sortedIpv4.join('\n')),
    fs.writeFile(path.join(dirPath, 'ipv6.txt'), sortedIpv6.join('\n'))
  ])

  console.log('[Googlebot] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessGooglebotIpRanges()
    console.log('[Googlebot] Complete!')
  } catch (error) {
    console.error('[Googlebot] Error:', error)
    process.exit(1)
  }
}

export default main
