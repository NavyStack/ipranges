// src/utils/ipUtils.ts

import { saveIfNotEmpty } from './fileUtils'

export const sortAndUnique = (arr: string[]): string[] => {
  return Array.from(new Set(arr)).sort((a, b) => {
    if (!a.includes(':') && !b.includes(':')) {
      const aParts = a.split('/')[0].split('.').map(Number)
      const bParts = b.split('/')[0].split('.').map(Number)
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    } else if (a.includes(':') && b.includes(':')) {
      return a.localeCompare(b)
    } else {
      return a.includes(':') ? 1 : -1
    }
  })
}

export const saveIpAddresses = async (
  ipv4Addresses: string[],
  ipv6Addresses: string[],
  ipv4Path: string,
  ipv6Path: string
): Promise<void> => {
  const ipv4Content = ipv4Addresses.join('\n')
  const ipv6Content = ipv6Addresses.join('\n')

  await Promise.all([
    saveIfNotEmpty(ipv4Content, ipv4Path),
    saveIfNotEmpty(ipv6Content, ipv6Path)
  ])
}
