// src/googlebot/processor.ts
/**
 * https://www.gstatic.com/ipranges/goog.txt
 * https://www.gstatic.com/ipranges/cloud.json
 * https://developers.google.com/search/apis/ipranges/googlebot.json
 */
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { GooglebotIpRanges, GoogleAddressFiles } from '../types'

// Define base directory and URL for googlebot
const GOOGLE_DIR = 'googlebot'
const BASE_URL =
  'https://developers.google.com/search/apis/ipranges/googlebot.json'

// Utility function to fetch and parse googlebot IP ranges from URL
const fetchGooglebotIpRanges = async (): Promise<GooglebotIpRanges> => {
  const response = await fetch(BASE_URL)
  return response.json() as Promise<GooglebotIpRanges>
}

// Utility function to process googlebot IP ranges
const processGooglebotIpRanges = (
  data: GooglebotIpRanges
): GoogleAddressFiles => {
  const googlebotIpRanges = data.prefixes || []

  const googlebotIpv4 = googlebotIpRanges
    .map((prefix) => prefix.ipv4Prefix)
    .filter(Boolean) as string[]
  const googlebotIpv6 = googlebotIpRanges
    .map((prefix) => prefix.ipv6Prefix)
    .filter(Boolean) as string[]

  return {
    ipv4Addresses: googlebotIpv4.sort(),
    ipv6Addresses: googlebotIpv6.sort(),
    googlebotIpv4: googlebotIpv4.join('\n'),
    googlebotIpv6: googlebotIpv6.join('\n'),
    cloudIpv4: '', // Empty string as placeholder
    cloudIpv6: '', // Empty string as placeholder
    googIpv4: '', // Empty string as placeholder
    googIpv6: '' // Empty string as placeholder
  }
}

// Utility function to save googlebot IPs to files
const saveGooglebotIpRangesToFile = async (addresses: GoogleAddressFiles) => {
  const dirPath = path.join(GOOGLE_DIR)
  await fs.mkdir(dirPath, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(dirPath, 'ipv4.txt'), addresses.googlebotIpv4),
    fs.writeFile(path.join(dirPath, 'ipv6.txt'), addresses.googlebotIpv6)
  ])

  console.log(
    '[Googlebot] IP ranges have been saved to the',
    GOOGLE_DIR,
    'directory.'
  )
}

// Main function
const main = async (): Promise<void> => {
  try {
    const data = await fetchGooglebotIpRanges()
    const addresses = processGooglebotIpRanges(data)
    await saveGooglebotIpRangesToFile(addresses)
  } catch (error) {
    console.error('[Googlebot] Error:', error)
    process.exit(1)
  }
}

export default main
