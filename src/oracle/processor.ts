// src/oracle/processor.ts
import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { OracleIpRanges } from '../types'

// Define output file paths
const IPV4_OUTPUT = path.join('oracle', 'ipv4.txt')

// Fetch Oracle IP ranges
const fetchOracleIpRanges = async (): Promise<void> => {
  const data = await fetchWithRetryAndTimeout<OracleIpRanges>(
    'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json'
  )

  // Extract IPv4 addresses
  const ipv4Addresses = data.regions
    .flatMap((region) => region.cidrs.map((cidr) => cidr.cidr))
    .filter(Boolean)

  const sortedIpv4 = sortAndUnique(ipv4Addresses)

  // Write to output file
  await fs.writeFile(IPV4_OUTPUT, sortedIpv4.join('\n'))

  console.log('[Oracle] IP addresses processed and saved successfully.')
}

// Main function
const main = async (): Promise<void> => {
  try {
    await fetchOracleIpRanges()
    console.log('[Oracle] Complete!')
  } catch (error) {
    console.error('[Oracle] Error:', error)
    process.exit(1)
  }
}

export default main
