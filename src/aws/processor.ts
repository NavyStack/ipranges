// src/aws/processor.ts
import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique, saveIpAddresses } from '../utils/ipUtils'
import { AwsIpRanges } from '../types'

// Define output file paths
const IPV4_OUTPUT = path.join('amazon', 'ipv4.txt')
const IPV6_OUTPUT = path.join('amazon', 'ipv6.txt')
const TIMESTAMP_FILE = path.join('amazon', 'timestamp.txt')

// Fetch AWS IP ranges
const fetchAwsIpRanges = async (): Promise<void> => {
  const url = 'https://ip-ranges.amazonaws.com/ip-ranges.json'
  const data = await fetchWithRetryAndTimeout<AwsIpRanges>(url)

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
  const sortedIpv4 = sortAndUnique(ipv4Prefixes)
  const sortedIpv6 = sortAndUnique(ipv6Prefixes)

  // Write to output files
  await saveIpAddresses(sortedIpv4, sortedIpv6, IPV4_OUTPUT, IPV6_OUTPUT)

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
