// src/github/processor.ts
import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { GithubApiResponse } from '../types'

// Define base directory
const GITHUB_DIR = 'github'

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

// Fetch and process GitHub API data
const fetchAndProcessGithubData = async (): Promise<void> => {
  const url = 'https://api.github.com/meta'
  const data = await fetchWithRetryAndTimeout<GithubApiResponse>(url, {
    headers: {
      'User-Agent': 'ipranges-fetcher'
    }
  })

  const ipv4Addresses: Set<string> = new Set()
  const ipv6Addresses: Set<string> = new Set()

  // Prepare per-category address lists
  const categoryAddresses: {
    [key: string]: { ipv4: string[]; ipv6: string[] }
  } = {}

  for (const key of ADDRESS_KEYS) {
    const addressList = data[key]
    if (Array.isArray(addressList)) {
      const ipv4List: string[] = []
      const ipv6List: string[] = []

      for (const address of addressList) {
        if (address.includes(':')) {
          ipv6List.push(address)
          ipv6Addresses.add(address)
        } else {
          ipv4List.push(address)
          ipv4Addresses.add(address)
        }
      }

      categoryAddresses[key] = {
        ipv4: sortAndUnique(ipv4List),
        ipv6: sortAndUnique(ipv6List)
      }
    }
  }

  // Save per-category addresses
  await Promise.all(
    Object.entries(categoryAddresses).map(async ([category, addresses]) => {
      const dirPath = path.join(GITHUB_DIR, category)
      await fs.mkdir(dirPath, { recursive: true })

      await Promise.all([
        fs.writeFile(path.join(dirPath, 'ipv4.txt'), addresses.ipv4.join('\n')),
        fs.writeFile(path.join(dirPath, 'ipv6.txt'), addresses.ipv6.join('\n'))
      ])
    })
  )

  // Save combined IPv4 and IPv6 addresses
  const sortedIpv4 = sortAndUnique(Array.from(ipv4Addresses))
  const sortedIpv6 = sortAndUnique(Array.from(ipv6Addresses))

  await Promise.all([
    fs.writeFile(path.join(GITHUB_DIR, 'ipv4.txt'), sortedIpv4.join('\n')),
    fs.writeFile(path.join(GITHUB_DIR, 'ipv6.txt'), sortedIpv6.join('\n'))
  ])

  console.log('[GitHub] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAndProcessGithubData()
    console.log('[GitHub] Complete!')
  } catch (error) {
    console.error('[GitHub] Error:', error)
    process.exit(1)
  }
}

export default main
