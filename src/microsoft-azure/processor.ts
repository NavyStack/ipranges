// src/microsoft-azure/processor.ts

/*
 * https://azure.microsoft.com/en-us/updates/service-tag-discovery-api-in-preview/
 * https://docs.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide
 * From: https://github.com/jensihnow/AzurePublicIPAddressRanges/blob/main/.github/workflows/main.yml
 */

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

// Fetch data from a URL with retry logic and timeout using AbortController
const fetchData = async (
  url: string,
  retries = 3,
  timeout = 10000
): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(id)

      if (!response.ok) {
        throw new Error(`[Azure] Failed to fetch ${url}, Status: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      clearTimeout(id)

      if (error.name === 'AbortError') {
        console.log(`[Azure] Request to ${url} timed out`)
      } else {
        console.log(`[Azure] Error fetching ${url}: ${error.message}`)
      }

      if (i === retries - 1) {
        throw error
      }

      console.log(`[Azure] Retrying fetch for ${url} (${i + 1}/${retries})`)
      await new Promise((res) => setTimeout(res, 1000))
    }
  }

  throw new Error(`[Azure] Failed to fetch ${url} after ${retries} retries`)
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
  if (!urlMatch) throw new Error('[Azure] Download URL not found')
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
  const allIpv4Addresses: Set<string> = new Set()
  const allIpv6Addresses: Set<string> = new Set()

  for (const [regionName] of Object.entries(REGION_IDS)) {
    const ipv4File = path.join(OUTPUT_DIR, regionName, 'ipv4.txt')
    const ipv6File = path.join(OUTPUT_DIR, regionName, 'ipv6.txt')

    const ipv4Content = await fs.readFile(ipv4File, 'utf-8')
    const ipv6Content = await fs.readFile(ipv6File, 'utf-8')

    ipv4Content.split('\n').forEach((line) => allIpv4Addresses.add(line.trim()))
    ipv6Content.split('\n').forEach((line) => allIpv6Addresses.add(line.trim()))
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

    console.log('[Azure] IP ranges have been processed and saved.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

export default main
