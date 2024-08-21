// src/github/processor.ts
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

// Utility function to save addresses to files
const saveAddressesToFile = async (
  addresses: { [key: string]: string[] },
  filePrefix: string
): Promise<void> => {
  const writePromises = Object.entries(addresses).map(
    async ([key, addressList]) => {
      const filePath = path.join('github', `${filePrefix}_${key}.txt`)
      await fs.writeFile(filePath, addressList.sort().join('\n'))
      console.log(`Addresses for ${key} saved to ${filePath}`)
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

// Function to fetch and process GitHub API data
const fetchAndProcessGithubData = async (): Promise<void> => {
  const url = 'https://api.github.com/meta'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch data from GitHub API.')
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

  console.log('All files saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessGithubData()
    console.log('Github data processing complete!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
