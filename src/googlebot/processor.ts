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

// Define base directory and URL for Googlebot
const GOOGLE_DIR = 'googlebot'
const BASE_URL =
  'https://developers.google.com/search/apis/ipranges/googlebot.json'

// Utility function to fetch and parse Googlebot IP ranges from URL
const fetchGooglebotIpRanges = async (): Promise<GooglebotIpRanges> => {
  const response = await fetch(BASE_URL)
  if (!response.ok) {
    throw new Error(
      `[Googlebot] Failed to fetch IP ranges: ${response.statusText}`
    )
  }
  return response.json() as Promise<GooglebotIpRanges>
}

// Utility function to sort IP addresses
const sortIpAddresses = (lines: string[]): string[] => {
  return lines.sort((a, b) => {
    if (a.includes(':') && b.includes(':')) {
      // Sort IPv6 addresses lexicographically
      return a.localeCompare(b)
    } else if (!a.includes(':') && !b.includes(':')) {
      // Sort IPv4 addresses numerically
      const aParts = a.split('/')[0].split('.').map(Number)
      const bParts = b.split('/')[0].split('.').map(Number)
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    } else {
      // IPv4 addresses should come before IPv6 addresses
      return a.includes(':') ? 1 : -1
    }
  })
}

// Utility function to process Googlebot IP ranges
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
    ipv4Addresses: sortIpAddresses(googlebotIpv4),
    ipv6Addresses: sortIpAddresses(googlebotIpv6),
    googlebotIpv4: googlebotIpv4.join('\n'),
    googlebotIpv6: googlebotIpv6.join('\n'),
    cloudIpv4: '', // Empty string as placeholder
    cloudIpv6: '', // Empty string as placeholder
    googIpv4: '', // Empty string as placeholder
    googIpv6: '' // Empty string as placeholder
  }
}

// Utility function to save Googlebot IPs to files
const saveGooglebotIpRangesToFile = async (addresses: GoogleAddressFiles) => {
  const dirPath = path.join(GOOGLE_DIR)
  await fs.mkdir(dirPath, { recursive: true })

  await Promise.all([
    fs.writeFile(
      path.join(dirPath, 'ipv4.txt'),
      addresses.ipv4Addresses.join('\n')
    ),
    fs.writeFile(
      path.join(dirPath, 'ipv6.txt'),
      addresses.ipv6Addresses.join('\n')
    )
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
