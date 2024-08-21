// src/microsoft-azure/processor.ts
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { MicrosoftIpRanges } from '../types'

// Define constants and URLs
const OUTPUT_DIR = 'microsoft-azure'
const REGION_IDS: Record<string, string> = {
  'public-cloud': '56519',
  'us-gov': '57063',
  germany: '57064',
  china: '57062'
}

// Create output directories
const createOutputDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true })
}

// Fetch data from a URL
const fetchData = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }
  return response.text()
}

// Parse Microsoft IP ranges from JSON data
const parseIpRanges = (
  jsonData: string
): { ipv4Addresses: string[]; ipv6Addresses: string[] } => {
  const ipv4Addresses: Set<string> = new Set()
  const ipv6Addresses: Set<string> = new Set()

  const data: MicrosoftIpRanges = JSON.parse(jsonData)
  const addressPrefixes = data.values.flatMap(
    (item) => item.properties.addressPrefixes || []
  )

  addressPrefixes.forEach((prefix) => {
    if (prefix.includes(':')) {
      ipv6Addresses.add(prefix)
    } else {
      ipv4Addresses.add(prefix)
    }
  })

  return {
    ipv4Addresses: Array.from(ipv4Addresses),
    ipv6Addresses: Array.from(ipv6Addresses)
  }
}

// Download, parse, and save IP ranges for a region
const downloadAndParseBackground = async (
  regionId: string,
  regionName: string
) => {
  const outputDir = path.join(OUTPUT_DIR, regionName)
  await createOutputDir(outputDir)

  // Fetch download page and extract download URL
  const pageContent = await fetchData(
    `https://www.microsoft.com/en-us/download/confirmation.aspx?id=${regionId}`
  )
  const urlMatch = pageContent.match(/<a href=['"][^'"]*ServiceTags_[^'"]*['"]/)
  if (!urlMatch) throw new Error('Download URL not found')
  const downloadUrl = urlMatch[0]
    .replace(/<a href=['"]/, '')
    .replace(/['"]/, '')

  // Extract timestamp from URL
  const timestampMatch = downloadUrl.match(/\d{8}/)
  const timestamp = timestampMatch ? timestampMatch[0] : 'unknown'

  // Fetch and parse JSON data
  const jsonData = await fetchData(downloadUrl)
  const { ipv4Addresses, ipv6Addresses } = parseIpRanges(jsonData)

  // Save addresses and timestamp
  await fs.writeFile(path.join(outputDir, 'ipv4.txt'), ipv4Addresses.join('\n'))
  await fs.writeFile(path.join(outputDir, 'ipv6.txt'), ipv6Addresses.join('\n'))
  await fs.writeFile(path.join(outputDir, 'timestamp.txt'), timestamp)
}

// Consolidate files into single files for all regions
const consolidateFiles = async () => {
  const ipv4Files: string[] = []
  const ipv6Files: string[] = []

  for (const [regionName] of Object.entries(REGION_IDS)) {
    ipv4Files.push(path.join(OUTPUT_DIR, regionName, 'ipv4.txt'))
    ipv6Files.push(path.join(OUTPUT_DIR, regionName, 'ipv6.txt'))
  }

  const allIpv4Addresses: Set<string> = new Set()
  const allIpv6Addresses: Set<string> = new Set()

  for (const file of ipv4Files) {
    const content = await fs.readFile(file, 'utf-8')
    content.split('\n').forEach((line) => allIpv4Addresses.add(line.trim()))
  }

  for (const file of ipv6Files) {
    const content = await fs.readFile(file, 'utf-8')
    content.split('\n').forEach((line) => allIpv6Addresses.add(line.trim()))
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'all_ipv4.txt'),
    Array.from(allIpv4Addresses).join('\n')
  )
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'all_ipv6.txt'),
    Array.from(allIpv6Addresses).join('\n')
  )
}

// Main function
const main = async () => {
  try {
    await Promise.all(
      Object.entries(REGION_IDS).map(([regionName, regionId]) =>
        downloadAndParseBackground(regionId, regionName)
      )
    )
    await consolidateFiles()

    console.log('Azure IP ranges have been processed and saved.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
