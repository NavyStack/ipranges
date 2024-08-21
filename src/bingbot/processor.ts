// src/bingbot/processor.ts
/**
 * https://www.bing.com/toolbox/bingbot.json
 */
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { BingBotIpRanges } from '../types'

// Define file paths
const timestampFilePath = path.join('bingbot', 'timestamp.txt')
const ipv4OutputFilePath = path.join('bingbot', 'ipv4.txt')
const ipv6OutputFilePath = path.join('bingbot', 'ipv6.txt')

// Function to remove a file if it exists
const removeFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath)
    console.log(`[Bingbot] File ${filePath} removed successfully.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`[Bingbot] File ${filePath} does not exist. Skip.`)
    } else {
      throw err
    }
  }
}

// Function to fetch BingBot IP ranges and process data
const fetchAndProcessBingBotData = async (): Promise<void> => {
  const url = 'https://www.bing.com/toolbox/bingbot.json'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('[Bingbot] Error: Failed to fetch data from BingBot API.')
  }

  const data = (await response.json()) as BingBotIpRanges

  // Extract IPv4 addresses
  const ipv4Addresses = data.prefixes
    .map((item) => item.ipv4Prefix)
    .filter((ip): ip is string => typeof ip === 'string')

  // Save IPv4 addresses
  await fs.writeFile(
    ipv4OutputFilePath,
    Array.from(new Set(ipv4Addresses))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .join('\n')
  )
  console.log('[Bingbot] IPv4 addresses saved successfully.')

  // Extract IPv6 addresses
  const ipv6Addresses = data.prefixes
    .map((item) => item.ipv6Prefix)
    .filter((ip): ip is string => typeof ip === 'string')

  if (ipv6Addresses.length > 0) {
    // Save IPv6 addresses if they exist
    await fs.writeFile(
      ipv6OutputFilePath,
      Array.from(new Set(ipv6Addresses))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .join('\n')
    )
    console.log('[Bingbot] IPv6 addresses saved successfully.')
  } else {
    console.log(
      '[Bingbot] No IPv6 addresses found. Skipping IPv6 file creation.'
    )
  }

  // Save timestamp
  const timestamp = new Date().toISOString().replace('.000Z', '.000000Z')
  await fs.writeFile(timestampFilePath, timestamp)
  console.log('[Bingbot] Timestamp saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await removeFileIfExists(timestampFilePath)
    await fetchAndProcessBingBotData()
    console.log('[Bingbot] Complete!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

export default main
