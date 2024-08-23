// src/github/processor.ts

/**
 * https://api.github.com/meta
 */

import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { GithubApiResponse } from '../types'

// Define file paths
const TIMESTAMP_FILE_PATH = path.join('github', 'timestamp.txt')
const GITHUB_IPV4_FILE_PATH = path.join('github', 'ipv4.txt')
const GITHUB_IPV6_FILE_PATH = path.join('github', 'ipv6.txt')

// Define address categories
const ADDRESS_KEYS: Array<keyof GithubApiResponse> = [
  'hooks',
  'web',
  'api',
  'git',
  'github_enterprise_importer',
  'packages',
  'pages',
  'importer',
  'actions',
  'actions_macos',
  'dependabot',
  'copilot'
]

// Utility function to sort IP addresses
const sortIpAddresses = (addresses: string[]): string[] => {
  return addresses.sort((a, b) => {
    // Determine if addresses are IPv4 or IPv6
    const isIPv4 = (addr: string) => !addr.includes(':')

    if (isIPv4(a) && isIPv4(b)) {
      // Sort IPv4 addresses numerically
      const aParts = a.split('.').map(Number)
      const bParts = b.split('.').map(Number)

      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    }

    if (isIPv4(a) && !isIPv4(b)) {
      // IPv4 addresses should come before IPv6 addresses
      return -1
    }

    if (!isIPv4(a) && isIPv4(b)) {
      // IPv6 addresses should come after IPv4 addresses
      return 1
    }

    // Sort IPv6 addresses lexicographically
    return a.localeCompare(b)
  })
}

// Utility function to save addresses to files in separate directories
const saveAddressesToFile = async (
  addresses: { [key: string]: string[] },
  addressType: 'ipv4' | 'ipv6'
): Promise<void> => {
  const writePromises = Object.entries(addresses).map(
    async ([key, addressList]) => {
      const dirPath = path.join('github', key)
      await fs.mkdir(dirPath, { recursive: true })
      const filePath = path.join(dirPath, `${addressType}.txt`)
      await fs.writeFile(filePath, sortIpAddresses(addressList).join('\n'))
      console.log(`[Github] Addresses for ${key} saved to ${filePath}`)
    }
  )
  await Promise.all(writePromises)
}

// Utility function to process and sort IP addresses
const processAddresses = (data: GithubApiResponse) => {
  const ipv4Addresses: Set<string> = new Set()
  const ipv6Addresses: Set<string> = new Set()

  const ipv4Files: { [key: string]: string[] } = {}
  const ipv6Files: { [key: string]: string[] } = {}

  ADDRESS_KEYS.forEach((key) => {
    const addressList = data[key]
    if (Array.isArray(addressList)) {
      const ipv4: string[] = []
      const ipv6: string[] = []

      addressList.forEach((address) => {
        if (address.includes(':')) {
          ipv6.push(address)
          ipv6Addresses.add(address)
        } else {
          ipv4.push(address)
          ipv4Addresses.add(address)
        }
      })

      if (ipv4.length > 0) ipv4Files[key] = ipv4
      if (ipv6.length > 0) ipv6Files[key] = ipv6
    }
  })

  return {
    ipv4Files,
    ipv6Files,
    ipv4Addresses: Array.from(ipv4Addresses),
    ipv6Addresses: Array.from(ipv6Addresses)
  }
}

// Function to fetch and process GitHub API data
const fetchAndProcessGithubData = async (): Promise<void> => {
  const url = 'https://api.github.com/meta'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('[Github] Failed to fetch data from GitHub API.')
  }

  const data = (await response.json()) as GithubApiResponse
  const { ipv4Files, ipv6Files, ipv4Addresses, ipv6Addresses } =
    processAddresses(data)

  await Promise.all([
    saveAddressesToFile(ipv4Files, 'ipv4'),
    saveAddressesToFile(ipv6Files, 'ipv6'),
    fs.writeFile(
      GITHUB_IPV4_FILE_PATH,
      sortIpAddresses(ipv4Addresses).join('\n')
    ),
    fs.writeFile(
      GITHUB_IPV6_FILE_PATH,
      sortIpAddresses(ipv6Addresses).join('\n')
    ),
    fs.writeFile(
      TIMESTAMP_FILE_PATH,
      new Date().toISOString().replace('.000Z', '.000000Z')
    )
  ])

  console.log('[Github] All files saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessGithubData()
    console.log('[Github] Data processing complete!')
  } catch (error) {
    console.error('[Github] Error:', error)
    process.exit(1)
  }
}

export default main
