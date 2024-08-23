// src/cloudflare/processor.ts
/**
 * https://www.cloudflare.com/ips/
 */

import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { CloudflareIpRanges } from '../types'

// Define file paths
const timestampFile = path.join('cloudflare', 'timestamp.txt')
const ipv4Output = path.join('cloudflare', 'ipv4.txt')
const ipv6Output = path.join('cloudflare', 'ipv6.txt')

// Function to remove a file if it exists
const removeFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath)
    console.log(`[Cloudflare] ${filePath} removed successfully.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(
        `[Cloudflare] File ${filePath} does not exist. Skipping removal.`
      )
    } else {
      throw err
    }
  }
}

// Function to fetch IP ranges from Cloudflare
const fetchCloudflareIpRanges = async (): Promise<CloudflareIpRanges> => {
  const [ipv4Response, ipv6Response] = await Promise.all([
    fetch('https://www.cloudflare.com/ips-v4/'),
    fetch('https://www.cloudflare.com/ips-v6/')
  ])

  if (!ipv4Response.ok) {
    throw new Error('[Cloudflare] Error: Failed to fetch IPv4 addresses.')
  }
  if (!ipv6Response.ok) {
    throw new Error('[Cloudflare] Error: Failed to fetch IPv6 addresses.')
  }

  const ipv4Text = await ipv4Response.text()
  const ipv6Text = await ipv6Response.text()

  return {
    ipv4: ipv4Text.split('\n').filter(Boolean),
    ipv6: ipv6Text.split('\n').filter(Boolean)
  }
}

// Function to sort IP addresses
const sortIpAddresses = (addresses: string[], isIPv4: boolean): string[] => {
  return addresses.sort((a, b) => {
    if (isIPv4) {
      // Compare IPv4 addresses numerically
      const aParts = a.split('.').map(Number)
      const bParts = b.split('.').map(Number)
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    } else {
      // Compare IPv6 addresses lexicographically
      return a.localeCompare(b)
    }
  })
}

// Function to process and save IP addresses
const processAndSaveIpAddresses = async (
  ipAddresses: string[],
  outputFilePath: string,
  isIPv4: boolean
): Promise<void> => {
  // Remove duplicates and sort addresses
  const sortedUniqueIps = sortIpAddresses(
    Array.from(new Set(ipAddresses)),
    isIPv4
  )
  await fs.writeFile(outputFilePath, sortedUniqueIps.join('\n'))
  console.log(
    `[Cloudflare] IP addresses sorted and duplicates removed successfully: ${outputFilePath}`
  )
}

// Main function
const main = async (): Promise<void> => {
  try {
    await removeFileIfExists(timestampFile)

    const { ipv4, ipv6 } = await fetchCloudflareIpRanges()

    await processAndSaveIpAddresses(ipv4, ipv4Output, true)
    await processAndSaveIpAddresses(ipv6, ipv6Output, false)

    const timestamp = new Date().toISOString()
    await fs.writeFile(timestampFile, timestamp)
    console.log('[Cloudflare] Timestamp saved successfully.')

    console.log('[Cloudflare] Complete!')
  } catch (error) {
    console.error('[Cloudflare] Error:', error)
    process.exit(1)
  }
}

export default main
