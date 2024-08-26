// src/cloudflare/processor.ts
/**
 * https://www.cloudflare.com/ips/
 */

import fetch, { RequestInit } from 'node-fetch'
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
      console.log(`[Cloudflare] File ${filePath} does not exist. Skip.`)
    } else {
      throw err
    }
  }
}

// Function to fetch IP ranges from Cloudflare with retry and timeout logic
const fetchCloudflareIpRanges = async (
  retries: number = 3,
  timeout: number = 10000
): Promise<CloudflareIpRanges> => {
  const urls = [
    'https://www.cloudflare.com/ips-v4/',
    'https://www.cloudflare.com/ips-v6/'
  ]

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const [ipv4Response, ipv6Response] = await Promise.all([
        fetch(urls[0], { signal: controller.signal } as RequestInit),
        fetch(urls[1], { signal: controller.signal } as RequestInit)
      ])
      clearTimeout(id)

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
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `[Cloudflare] Fetch failed after ${retries} attempts: ${error.message}`
        )
      }
      console.warn(
        `[Cloudflare] Fetch attempt ${attempt} failed: ${error.message}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
  throw new Error(`[Cloudflare] Fetch failed after ${retries} attempts`) // This line should theoretically never be reached
}

// Function to process and save IP addresses
const processAndSaveIpAddresses = async (
  ipAddresses: string[],
  outputFilePath: string
): Promise<void> => {
  const sortedUniqueIps = Array.from(new Set(ipAddresses)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
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

    await processAndSaveIpAddresses(ipv4, ipv4Output)
    await processAndSaveIpAddresses(ipv6, ipv6Output)

    const timestamp = new Date().toISOString().replace('.000Z', '.000000Z')
    await fs.writeFile(timestampFile, timestamp)
    console.log('[Cloudflare] Timestamp saved successfully.')

    console.log('[Cloudflare] Complete!')
  } catch (error) {
    console.error('[Cloudflare] Error:', error)
    process.exit(1)
  }
}

export default main
