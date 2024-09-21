// src/google/processor.ts
import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { GoogleCloudIpRanges, GooglebotIpRanges } from '../types'

// Define base directory and URLs
const GOOGLE_DIR = 'google'
const BASE_URLS = {
  goog: 'https://www.gstatic.com/ipranges/goog.txt',
  cloud: 'https://www.gstatic.com/ipranges/cloud.json',
  googlebot: 'https://developers.google.com/search/apis/ipranges/googlebot.json'
}

// Fetch and process Google IP ranges
const fetchAndProcessGoogleIpRanges = async (): Promise<void> => {
  const [googText, cloudJson, googlebotJson] = await Promise.all([
    fetchWithRetryAndTimeout<string>(BASE_URLS.goog),
    fetchWithRetryAndTimeout<GoogleCloudIpRanges>(BASE_URLS.cloud),
    fetchWithRetryAndTimeout<GooglebotIpRanges>(BASE_URLS.googlebot)
  ])

  // Prepare sets for combined IP addresses
  const combinedIpv4Addresses: Set<string> = new Set()
  const combinedIpv6Addresses: Set<string> = new Set()

  // Process goog.txt
  const googIpv4: string[] = []
  const googIpv6: string[] = []
  googText
    .split('\n')
    .filter(Boolean)
    .forEach((ip) => {
      if (ip.includes(':')) {
        googIpv6.push(ip)
        combinedIpv6Addresses.add(ip)
      } else {
        googIpv4.push(ip)
        combinedIpv4Addresses.add(ip)
      }
    })

  // Process cloud.json
  const cloudIpv4: string[] = []
  const cloudIpv6: string[] = []
  cloudJson.prefixes.forEach((prefix) => {
    if (prefix.ipv4Prefix) {
      cloudIpv4.push(prefix.ipv4Prefix)
      combinedIpv4Addresses.add(prefix.ipv4Prefix)
    }
    if (prefix.ipv6Prefix) {
      cloudIpv6.push(prefix.ipv6Prefix)
      combinedIpv6Addresses.add(prefix.ipv6Prefix)
    }
  })

  // Process googlebot.json
  const googlebotIpv4: string[] = []
  const googlebotIpv6: string[] = []
  googlebotJson.prefixes.forEach((prefix) => {
    if (prefix.ipv4Prefix) {
      googlebotIpv4.push(prefix.ipv4Prefix)
      combinedIpv4Addresses.add(prefix.ipv4Prefix)
    }
    if (prefix.ipv6Prefix) {
      googlebotIpv6.push(prefix.ipv6Prefix)
      combinedIpv6Addresses.add(prefix.ipv6Prefix)
    }
  })

  // Sort and remove duplicates for each category
  const sortedGoogIpv4 = sortAndUnique(googIpv4)
  const sortedGoogIpv6 = sortAndUnique(googIpv6)
  const sortedCloudIpv4 = sortAndUnique(cloudIpv4)
  const sortedCloudIpv6 = sortAndUnique(cloudIpv6)
  const sortedGooglebotIpv4 = sortAndUnique(googlebotIpv4)
  const sortedGooglebotIpv6 = sortAndUnique(googlebotIpv6)

  // Save per-category IP addresses
  await Promise.all([
    saveCategoryIpAddresses('goog', sortedGoogIpv4, sortedGoogIpv6),
    saveCategoryIpAddresses('cloud', sortedCloudIpv4, sortedCloudIpv6),
    saveCategoryIpAddresses(
      'googlebot',
      sortedGooglebotIpv4,
      sortedGooglebotIpv6
    )
  ])

  // Save combined IP addresses
  const sortedCombinedIpv4 = sortAndUnique(Array.from(combinedIpv4Addresses))
  const sortedCombinedIpv6 = sortAndUnique(Array.from(combinedIpv6Addresses))

  await Promise.all([
    fs.writeFile(
      path.join(GOOGLE_DIR, 'ipv4.txt'),
      sortedCombinedIpv4.join('\n')
    ),
    fs.writeFile(
      path.join(GOOGLE_DIR, 'ipv6.txt'),
      sortedCombinedIpv6.join('\n')
    )
  ])

  console.log('[Google] IP addresses processed and saved successfully.')
}

// Utility function to save IP addresses per category
const saveCategoryIpAddresses = async (
  category: string,
  ipv4Addresses: string[],
  ipv6Addresses: string[]
) => {
  const dirPath = path.join(GOOGLE_DIR, category)
  await fs.mkdir(dirPath, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(dirPath, 'ipv4.txt'), ipv4Addresses.join('\n')),
    fs.writeFile(path.join(dirPath, 'ipv6.txt'), ipv6Addresses.join('\n'))
  ])

  console.log(`[Google] ${category} IP addresses saved successfully.`)
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessGoogleIpRanges()
    console.log('[Google] Complete!')
  } catch (error) {
    console.error('[Google] Error:', error)
    process.exit(1)
  }
}

export default main
