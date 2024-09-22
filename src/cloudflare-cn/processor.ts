// src/cloudflare-cn/processor.ts

import path from 'path'
import fs from 'fs/promises'
import { fetchWithRetryAndTimeout } from '../utils/fetchUtils'
import { sortAndUnique } from '../utils/ipUtils'
import { CloudflareCnResponse } from '../types'

const IPV4_OUTPUT = path.join('cloudflare-cn', 'ipv4.txt')
const IPV6_OUTPUT = path.join('cloudflare-cn', 'ipv6.txt')

const saveIpList = async (
  ipAddresses: string[],
  outputPath: string
): Promise<void> => {
  const data = ipAddresses.join('\n')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, data)
}

const fetchCloudflareCnIpRanges = async (): Promise<void> => {
  const url = 'https://api.cloudflare.com/client/v4/ips?networks=jdcloud'
  const response = await fetchWithRetryAndTimeout<CloudflareCnResponse>(url)

  if (!response || !response.result || !response.result.jdcloud_cidrs) {
    throw new Error('Invalid response from Cloudflare API')
  }

  const jdcloudCidrs: string[] = response.result.jdcloud_cidrs

  const ipv4Addresses = jdcloudCidrs.filter((cidr) => !cidr.includes(':'))
  const ipv6Addresses = jdcloudCidrs.filter((cidr) => cidr.includes(':'))

  const sortedIpv4 = sortAndUnique(ipv4Addresses)
  const sortedIpv6 = sortAndUnique(ipv6Addresses)

  await saveIpList(sortedIpv4, IPV4_OUTPUT)
  await saveIpList(sortedIpv6, IPV6_OUTPUT)

  console.log('[Cloudflare CN] IP addresses processed and saved successfully.')
}

const main = async (): Promise<void> => {
  try {
    await fetchCloudflareCnIpRanges()
    console.log('[Cloudflare CN] Complete!')
  } catch (error) {
    console.error('[Cloudflare CN] Error:', error)
    process.exit(1)
  }
}

export default main
