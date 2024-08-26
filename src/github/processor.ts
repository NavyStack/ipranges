import fetch, { RequestInit } from 'node-fetch'
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
      await fs.writeFile(filePath, addressList.sort().join('\n'))
      console.log(`[Github] Addresses for ${key} saved to ${filePath}`)
    }
  )
  await Promise.all(writePromises)
}

// Utility function to sort and separate addresses
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

// Function to fetch and process GitHub API data with retry and timeout logic
const fetchAndProcessGithubData = async (
  retries: number = 3,
  timeout: number = 10000
): Promise<void> => {
  const url = 'https://api.github.com/meta'

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(url, {
        signal: controller.signal
      } as RequestInit)
      clearTimeout(id)

      if (!response.ok) {
        throw new Error('[Github] Failed to fetch data from GitHub API.')
      }

      const data = (await response.json()) as GithubApiResponse
      const { ipv4Files, ipv6Files, ipv4Addresses, ipv6Addresses } =
        processAddresses(data)

      await Promise.all([
        saveAddressesToFile(ipv4Files, 'ipv4'),
        saveAddressesToFile(ipv6Files, 'ipv6'),
        fs.writeFile(GITHUB_IPV4_FILE_PATH, ipv4Addresses.sort().join('\n')),
        fs.writeFile(GITHUB_IPV6_FILE_PATH, ipv6Addresses.sort().join('\n')),
        fs.writeFile(
          TIMESTAMP_FILE_PATH,
          new Date().toISOString().replace('.000Z', '.000000Z')
        )
      ])

      console.log('[Github] All files saved successfully.')
      return // Exit after successful fetch and processing
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `[Github] Fetch failed after ${retries} attempts: ${error.message}`
        )
      }
      console.warn(
        `[Github] Fetch attempt ${attempt} failed: ${error.message}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
  throw new Error(`[Github] Fetch failed after ${retries} attempts`) // This line should theoretically never be reached
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
