// src/utils/ipUtils.ts
import { promises as fs } from 'fs'

export const sortAndUnique = (arr: string[]): string[] => {
  return Array.from(new Set(arr)).sort((a, b) => {
    if (!a.includes(':') && !b.includes(':')) {
      // IPv4 comparison
      const aParts = a.split('/')[0].split('.').map(Number)
      const bParts = b.split('/')[0].split('.').map(Number)
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    } else if (a.includes(':') && b.includes(':')) {
      // IPv6 comparison
      return a.localeCompare(b)
    } else {
      // IPv4 comes before IPv6
      return a.includes(':') ? 1 : -1
    }
  })
}

export const saveIpAddresses = async (
  ipv4Addresses: string[],
  ipv6Addresses: string[],
  ipv4Path: string,
  ipv6Path: string
) => {
  await Promise.all([
    fs.writeFile(ipv4Path, ipv4Addresses.join('\n')),
    fs.writeFile(ipv6Path, ipv6Addresses.join('\n'))
  ])
}
