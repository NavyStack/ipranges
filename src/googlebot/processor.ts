// src/googlebot/processor.ts
/**
 * https://www.gstatic.com/ipranges/goog.txt
 * https://www.gstatic.com/ipranges/cloud.json
 * https://developers.google.com/search/apis/ipranges/googlebot.json
 */
import fetch, { RequestInit } from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { GooglebotIpRanges, GoogleAddressFiles } from '../types'

// Define base directory and URL for googlebot
const GOOGLE_DIR = 'googlebot'
const BASE_URL =
  'https://developers.google.com/search/apis/ipranges/googlebot.json'

// Fetch Googlebot IP ranges with retry and timeout logic
const fetchGooglebotIpRanges = async (
  retries: number = 3,
  timeout: number = 10000
): Promise<GooglebotIpRanges> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(BASE_URL, {
        signal: controller.signal
      } as RequestInit)
      clearTimeout(id)

      if (!response.ok) {
        throw new Error('[Googlebot] Failed to fetch IP ranges')
      }

      return (await response.json()) as GooglebotIpRanges
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `[Googlebot] Fetch failed after ${retries} attempts: ${error.message}`
        )
      }
      console.warn(
        `[Googlebot] Fetch attempt ${attempt} failed: ${error.message}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
  throw new Error(`[Googlebot] Fetch failed after ${retries} attempts`) // This line should theoretically never be reached
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

// Utility function to save Googlebot IPs to files
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
