// src/google/processor.ts
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import {
  GoogleCloudIpRanges,
  GooglebotIpRanges,
  GoogleAddressFiles
} from '../types'

// Define file paths and URLs
const GOOGLE_DIR = 'google'
const BASE_URLS = {
  goog: 'https://www.gstatic.com/ipranges/goog.txt',
  cloud: 'https://www.gstatic.com/ipranges/cloud.json',
  googlebot: 'https://developers.google.com/search/apis/ipranges/googlebot.json'
}

// Fetch and parse IP ranges from URLs
const fetchIpRanges = async () => {
  const [googText, cloudJson, googlebotJson] = await Promise.all([
    fetch(BASE_URLS.goog).then((res) => res.text()),
    fetch(BASE_URLS.cloud).then(
      (res) => res.json() as Promise<GoogleCloudIpRanges>
    ),
    fetch(BASE_URLS.googlebot).then(
      (res) => res.json() as Promise<GooglebotIpRanges>
    )
  ])

  return { googText, cloudJson, googlebotJson }
}

// Extract IP addresses from text
const extractAddresses = (text: string, isIPv6: boolean) => {
  const addresses = text.split('\n').filter((line) => line.trim())
  return addresses.reduce(
    (result, address) => {
      if (isIPv6) address.includes(':') ? result.ipv6.add(address) : null
      else !address.includes(':') ? result.ipv4.add(address) : null
      return result
    },
    { ipv4: new Set<string>(), ipv6: new Set<string>() }
  )
}

// Process IP ranges
const processIpRanges = ({
  googText,
  cloudJson,
  googlebotJson
}: {
  googText: string
  cloudJson: GoogleCloudIpRanges
  googlebotJson: GooglebotIpRanges
}) => {
  const { ipv4, ipv6 } = extractAddresses(googText, false)

  const extractPrefixes = (
    prefixes: Array<{ ipv4Prefix?: string; ipv6Prefix?: string }>
  ) => ({
    ipv4: prefixes.map((prefix) => prefix.ipv4Prefix).filter(Boolean),
    ipv6: prefixes.map((prefix) => prefix.ipv6Prefix).filter(Boolean)
  })

  const cloudAddresses = extractPrefixes(cloudJson.prefixes || [])
  const googlebotAddresses = extractPrefixes(googlebotJson.prefixes || [])

  cloudAddresses.ipv4.forEach((ip) => ipv4.add(ip))
  cloudAddresses.ipv6.forEach((ip) => ipv6.add(ip))
  googlebotAddresses.ipv4.forEach((ip) => ipv4.add(ip))
  googlebotAddresses.ipv6.forEach((ip) => ipv6.add(ip))

  return {
    ipv4Addresses: Array.from(ipv4).sort(),
    ipv6Addresses: Array.from(ipv6).sort(),
    cloudIpv4: cloudAddresses.ipv4.join('\n'),
    cloudIpv6: cloudAddresses.ipv6.join('\n'),
    googlebotIpv4: googlebotAddresses.ipv4.join('\n'),
    googlebotIpv6: googlebotAddresses.ipv6.join('\n'),
    googIpv4: googText
      .split('\n')
      .filter((line) => !line.includes(':'))
      .join('\n'),
    googIpv6: googText
      .split('\n')
      .filter((line) => line.includes(':'))
      .join('\n')
  }
}

// Save addresses to files
const saveAddressesToFile = async (addresses: GoogleAddressFiles) => {
  await fs.mkdir(GOOGLE_DIR, { recursive: true })

  const files = {
    ipv4: 'ipv4.txt',
    ipv6: 'ipv6.txt',
    ipv4_goog: 'ipv4_goog.txt',
    ipv6_goog: 'ipv6_goog.txt',
    ipv4_cloud: 'ipv4_cloud.txt',
    ipv6_cloud: 'ipv6_cloud.txt',
    ipv4_googlebot: 'ipv4_googlebot.txt',
    ipv6_googlebot: 'ipv6_googlebot.txt'
  }

  await Promise.all(
    Object.entries(files).map(([key, filename]) =>
      fs.writeFile(
        path.join(GOOGLE_DIR, filename),
        addresses[key as keyof GoogleAddressFiles]
      )
    )
  )

  console.log('IP ranges have been saved to the', GOOGLE_DIR, 'directory.')
}

// Main function
const main = async () => {
  try {
    const data = await fetchIpRanges()
    const addresses = processIpRanges(data)
    await saveAddressesToFile(addresses)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
