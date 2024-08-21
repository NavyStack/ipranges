// src/google/processor.ts
/**
 * https://www.gstatic.com/ipranges/goog.txt
 * https://www.gstatic.com/ipranges/cloud.json
 * https://developers.google.com/search/apis/ipranges/googlebot.json
 */
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import {
  GoogleCloudIpRanges,
  GooglebotIpRanges,
  GoogleAddressFiles
} from '../types'

// Define base directory and URLs
const GOOGLE_DIR = 'google'
const BASE_URLS = {
  goog: 'https://www.gstatic.com/ipranges/goog.txt',
  cloud: 'https://www.gstatic.com/ipranges/cloud.json',
  googlebot: 'https://developers.google.com/search/apis/ipranges/googlebot.json'
}

// Utility function to fetch and parse IP ranges from URLs
const fetchAndParseIpRanges = async () => {
  const responses = await Promise.all([
    fetch(BASE_URLS.goog),
    fetch(BASE_URLS.cloud),
    fetch(BASE_URLS.googlebot)
  ])

  const [googText, cloudJson, googlebotJson] = await Promise.all([
    responses[0].text(),
    responses[1].json() as Promise<GoogleCloudIpRanges>,
    responses[2].json() as Promise<GooglebotIpRanges>
  ])

  return { googText, cloudJson, googlebotJson }
}

// Utility function to extract and classify IP addresses
const extractAddresses = (text: string, isIPv6: boolean) => {
  return text.split('\n').reduce(
    (addresses, line) => {
      const address = line.trim()
      if (address) {
        if (isIPv6 && address.includes(':')) addresses.ipv6.add(address)
        else if (!isIPv6 && !address.includes(':')) addresses.ipv4.add(address)
      }
      return addresses
    },
    { ipv4: new Set<string>(), ipv6: new Set<string>() }
  )
}

// Utility function to process IP ranges
const processIpRanges = (data: {
  googText: string
  cloudJson: GoogleCloudIpRanges
  googlebotJson: GooglebotIpRanges
}) => {
  const { ipv4, ipv6 } = extractAddresses(data.googText, false)
  const cloudAddresses = data.cloudJson.prefixes || []
  const googlebotAddresses = data.googlebotJson.prefixes || []

  const cloudIpv4 = cloudAddresses
    .map((prefix) => prefix.ipv4Prefix)
    .filter(Boolean)
  const cloudIpv6 = cloudAddresses
    .map((prefix) => prefix.ipv6Prefix)
    .filter(Boolean)
  const googlebotIpv4 = googlebotAddresses
    .map((prefix) => prefix.ipv4Prefix)
    .filter(Boolean)
  const googlebotIpv6 = googlebotAddresses
    .map((prefix) => prefix.ipv6Prefix)
    .filter(Boolean)

  cloudIpv4.forEach((ip) => ipv4.add(ip))
  cloudIpv6.forEach((ip) => ipv6.add(ip))
  googlebotIpv4.forEach((ip) => ipv4.add(ip))
  googlebotIpv6.forEach((ip) => ipv6.add(ip))

  return {
    ipv4Addresses: Array.from(ipv4).sort(),
    ipv6Addresses: Array.from(ipv6).sort(),
    cloudIpv4: cloudIpv4.join('\n'),
    cloudIpv6: cloudIpv6.join('\n'),
    googlebotIpv4: googlebotIpv4.join('\n'),
    googlebotIpv6: googlebotIpv6.join('\n'),
    googIpv4: data.googText
      .split('\n')
      .filter((line) => !line.includes(':'))
      .join('\n'),
    googIpv6: data.googText
      .split('\n')
      .filter((line) => line.includes(':'))
      .join('\n')
  }
}

// Utility function to save addresses to files
const saveAddressesToFile = async (addresses: GoogleAddressFiles) => {
  // Save combined results into separate directories and files
  await Promise.all([
    saveToCategoryDir('goog', addresses.googIpv4, addresses.googIpv6),
    saveToCategoryDir('cloud', addresses.cloudIpv4, addresses.cloudIpv6),
    saveToCategoryDir(
      'googlebot',
      addresses.googlebotIpv4,
      addresses.googlebotIpv6
    ),
    saveToCombinedFiles(addresses)
  ])

  console.log(
    '[Google] IP ranges have been saved to the',
    GOOGLE_DIR,
    'directory.'
  )
}

// Utility function to save IPs to category directories
const saveToCategoryDir = async (
  category: string,
  ipv4: string,
  ipv6: string
) => {
  const dirPath = path.join(GOOGLE_DIR, category)
  await fs.mkdir(dirPath, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(dirPath, 'ipv4.txt'), ipv4),
    fs.writeFile(path.join(dirPath, 'ipv6.txt'), ipv6)
  ])
}

// Utility function to save combined IPs to google directory
const saveToCombinedFiles = async (addresses: GoogleAddressFiles) => {
  await Promise.all([
    fs.writeFile(
      path.join(GOOGLE_DIR, 'ipv4.txt'),
      addresses.ipv4Addresses.join('\n')
    ),
    fs.writeFile(
      path.join(GOOGLE_DIR, 'ipv6.txt'),
      addresses.ipv6Addresses.join('\n')
    )
  ])
}

// Main function
const main = async (): Promise<void> => {
  try {
    const data = await fetchAndParseIpRanges()
    const addresses = processIpRanges(data)
    await saveAddressesToFile(addresses)
  } catch (error) {
    console.error('[Google] Error:', error)
    process.exit(1)
  }
}

export default main
