import fetch, { RequestInit } from 'node-fetch'
import { promises as fs } from 'fs'
import path from 'path'

// Define output file paths
const ipv4Output = path.join('linode', 'ipv4.txt')
const ipv6Output = path.join('linode', 'ipv6.txt')

// Fetch Linode IP ranges with retry and timeout logic
const fetchLinodeIpRanges = async (
  retries: number = 3,
  timeout: number = 10000
): Promise<string[]> => {
  const linodeUrl = 'https://geoip.linode.com/'

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(linodeUrl, {
        signal: controller.signal
      } as RequestInit)
      clearTimeout(id)

      if (!response.ok) {
        const errorText = await response.text() // Get the response body text in case of error
        throw new Error(
          `[Linode] Failed to fetch IP ranges. Status: ${response.status}, Response: ${errorText}`
        )
      }

      const data = await response.text()
      // Filter out comments and extract only the IP ranges
      return data
        .split('\n')
        .map((line) => line.split(',')[0])
        .filter((line) => line && !line.startsWith('#'))
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `[Linode] Fetch failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
      console.warn(
        `[Linode] Fetch attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
  throw new Error(`[Linode] Fetch failed after ${retries} attempts`) // This line should theoretically never be reached
}

// Utility function to sort and filter IP addresses
const sortAndFilterIpAddresses = (
  lines: string[],
  isIPv6: boolean
): string[] => {
  return lines
    .filter((line) => (isIPv6 ? line.includes(':') : !line.includes(':')))
    .sort((a, b) => a.localeCompare(b))
    .filter((item, pos, arr) => !pos || item !== arr[pos - 1]) // Remove duplicates
}

// Process IP ranges
const processIpRanges = async (data: string[]): Promise<void> => {
  const ipv4Lines = sortAndFilterIpAddresses(data, false)
  const ipv6Lines = sortAndFilterIpAddresses(data, true)

  // Ensure the output directory exists
  await fs.mkdir('linode', { recursive: true })

  // Write sorted and unique IPs to respective files
  await fs.writeFile(ipv4Output, ipv4Lines.join('\n'))
  await fs.writeFile(ipv6Output, ipv6Lines.join('\n'))

  console.log('[Linode] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    const data = await fetchLinodeIpRanges()
    await processIpRanges(data)
  } catch (error) {
    console.error('[Linode] Error:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('[Linode] Unhandled Error:', error)
  process.exit(1)
})

export default main
