// src/oracle/processor.ts
/**
 * https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json
 */
import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { OracleIpRanges } from '../types'

// Define file paths
const timestampFile = path.join('oracle', 'timestamp.txt')
const ipv4Output = path.join('oracle', 'ipv4.txt')

// Function to remove a file if it exists
const removeFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath)
    console.log(`[Oracle] ${filePath} removed successfully.`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`[Oracle] ${filePath} does not exist. Skip.`)
    } else {
      throw err
    }
  }
}

// Fetch Oracle IP ranges and save to file
const fetchOracleIpRanges = async (): Promise<void> => {
  const oracleUrl =
    'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json'
  const response = await fetch(oracleUrl)

  if (!response.ok) {
    throw new Error('[Oracle] Failed to download IP ranges')
  }

  const data = (await response.json()) as OracleIpRanges

  // Extract creationTime from JSON and convert to UTC
  const timestamp = data.last_updated_timestamp
  const oracleUtc = new Date(timestamp)
    .toISOString()
    .replace('.000Z', '.000000Z')

  // Save timestamp to file
  await fs.writeFile(timestampFile, oracleUtc)
  console.log('[Oracle] Timestamp saved successfully.')

  // Extract IPv4 addresses
  const ipv4Addresses = data.regions
    .flatMap((region) => region.cidrs.map((cidr) => cidr.cidr))
    .filter(Boolean)

  if (ipv4Addresses.length === 0) {
    throw new Error('[Oracle] No IPv4 addresses found')
  }

  // Sort and remove duplicates
  const sortedIpv4 = Array.from(new Set(ipv4Addresses)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )

  // Write IPv4 addresses to output file
  await fs.writeFile(ipv4Output, sortedIpv4.join('\n'))
  console.log(
    '[Oracle] IPv4 addresses processed, sorted, and saved successfully.'
  )
}

// Main function
const main = async (): Promise<void> => {
  try {
    await removeFileIfExists(timestampFile)
    await fetchOracleIpRanges()
    console.log('[Oracle] Complete!')
  } catch (error) {
    console.error('[Oracle] Error:', error)
    process.exit(1)
  }
}

export default main