// src/cloudflare/processor.ts

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
    console.log(`Step 0: File ${filePath} removed successfully.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`Step 0: File ${filePath} does not exist. Skip.`)
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
    throw new Error('Error: Failed to fetch IPv4 addresses.')
  }
  if (!ipv6Response.ok) {
    throw new Error('Error: Failed to fetch IPv6 addresses.')
  }

  const ipv4Text = await ipv4Response.text()
  const ipv6Text = await ipv6Response.text()

  return {
    ipv4: ipv4Text.split('\n').filter(Boolean),
    ipv6: ipv6Text.split('\n').filter(Boolean)
  }
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
    `IP addresses sorted and duplicates removed successfully: ${outputFilePath}`
  )
}

// Main function
const main = async (): Promise<void> => {
  try {
    await removeFileIfExists(timestampFile)

    const { ipv4, ipv6 } = await fetchCloudflareIpRanges()

    await processAndSaveIpAddresses(ipv4, ipv4Output)
    await processAndSaveIpAddresses(ipv6, ipv6Output)

    const timestamp = new Date().toISOString()
    await fs.writeFile(timestampFile, timestamp)
    console.log('Step 5: Timestamp saved successfully.')

    console.log('Cloudflare Complete!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
