// src/aws/processor.ts
/*
 * https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html
 */
import fetch, { RequestInit } from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { AwsIpRanges } from '../types'

// Define output file paths
const IPV4_OUTPUT = path.join('amazon', 'ipv4.txt')
const IPV6_OUTPUT = path.join('amazon', 'ipv6.txt')
const TIMESTAMP_FILE = path.join('amazon', 'timestamp.txt')

// Utility function to fetch data with retry and timeout
const fetchWithRetryAndTimeout = async (
  url: string,
  retries: number = 3,
  timeout: number = 10000
): Promise<AwsIpRanges> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      const response = await fetch(url, {
        signal: controller.signal
      } as RequestInit)

      clearTimeout(id)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }

      return (await response.json()) as AwsIpRanges
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `Fetch failed for ${url} after ${retries} attempts: ${error.message}`
        )
      }
      console.warn(
        `Fetch attempt ${attempt} for ${url} failed: ${error.message}. Retrying in ${timeout / 1000} seconds...`
      )
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
}

// Fetch AWS IP ranges
const fetchAwsIpRanges = async (): Promise<void> => {
  const url = 'https://ip-ranges.amazonaws.com/ip-ranges.json'
  const data = await fetchWithRetryAndTimeout(url)

  // Extract creation date
  const createDate = data.createDate
  await fs.writeFile(TIMESTAMP_FILE, createDate)

  // Extract IPv4 and IPv6 prefixes
  const ipv4Prefixes = data.prefixes
    .map((prefix) => prefix.ip_prefix)
    .filter(Boolean)
  const ipv6Prefixes = data.ipv6_prefixes
    .map((prefix) => prefix.ipv6_prefix)
    .filter(Boolean)

  // Sort and remove duplicates
  const sortAndUnique = (arr: string[]): string[] => {
    return Array.from(new Set(arr)).sort((a, b) => {
      // Compare IPv4 addresses numerically
      if (!a.includes(':') && !b.includes(':')) {
        return a.localeCompare(b, undefined, { numeric: true })
      }
      // Compare IPv6 addresses lexicographically
      return a.localeCompare(b)
    })
  }

  const sortedIpv4 = sortAndUnique(ipv4Prefixes)
  const sortedIpv6 = sortAndUnique(ipv6Prefixes)

  // Write to output files
  await fs.writeFile(IPV4_OUTPUT, sortedIpv4.join('\n'))
  await fs.writeFile(IPV6_OUTPUT, sortedIpv6.join('\n'))

  console.log('[AWS] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchAwsIpRanges()
    console.log('[AWS] Complete!')
  } catch (error) {
    console.error('[AWS] Error:', error)
    process.exit(1)
  }
}

export default main
