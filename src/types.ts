// src/types.ts

export interface FilePathParams {
  filePath: string
}

export interface FileContentParams extends FilePathParams {
  content: string[]
}

export interface LogParams {
  outputRelativePath: string
  sourceFilePath: string
}

export interface FileProcessingParams {
  sourceFilePath: string
  outputSuffix: string
}

export type FileProcessFunction = (
  params: FileProcessingParams
) => Promise<string>

export interface AddressMergeResult {
  mergedAddresses: string[]
}

export interface AwsIpRanges {
  createDate: string
  prefixes: {
    ip_prefix: string
    region: string
    service: string
  }[]
  ipv6_prefixes: {
    ipv6_prefix: string
    region: string
    service: string
  }[]
}

export interface OracleRegion {
  region: string
  cidrs: {
    cidr: string
  }[]
}

export interface OracleIpRanges {
  last_updated_timestamp: string
  regions: OracleRegion[]
}

export interface VultrSubnet {
  ip_prefix: string
}

export interface VultrIpRanges {
  subnets: VultrSubnet[]
}

export interface BingBotIpRanges {
  creationTime: string
  prefixes: {
    ipv6Prefix?: string
    ipv4Prefix?: string
  }[]
}

export interface CloudflareIpRanges {
  ipv4: string[]
  ipv6: string[]
}

export interface GoogleCloudIpRanges {
  syncToken: string
  creationTime: string
  prefixes: {
    ipv4Prefix?: string
    ipv6Prefix?: string
    service: string
    scope: string
  }[]
}

export interface GooglebotIpRanges {
  creationTime: string
  prefixes: {
    ipv4Prefix?: string
    ipv6Prefix?: string
  }[]
}

export interface GoogleAddressFiles {
  ipv4Addresses: string[]
  ipv6Addresses: string[]
  cloudIpv4: string
  cloudIpv6: string
  googlebotIpv4: string
  googlebotIpv6: string
  googIpv4: string
  googIpv6: string
}

export interface GithubIpRanges {
  ipv4: string[]
  ipv6: string[]
}

export interface GithubApiResponse {
  verifiable_password_authentication?: boolean
  ssh_key_fingerprints?: {
    SHA256_ECDSA?: string
    SHA256_ED25519?: string
    SHA256_RSA?: string
  }
  ssh_keys?: string[]
  hooks?: string[]
  web?: string[]
  api?: string[]
  git?: string[]
  github_enterprise_importer?: string[]
  packages?: string[]
  pages?: string[]
  importer?: string[]
  actions?: string[]
  actions_macos?: string[]
  dependabot?: string[]
  copilot?: string[]
  domains?: {
    website?: string[]
    codespaces?: string[]
    copilot?: string[]
    packages?: string[]
    actions?: string[]
    artifact_attestations?: {
      trust_domain: string
      services: string[]
    }
  }
}

export interface MicrosoftIpRanges {
  values: Array<{
    properties: {
      addressPrefixes?: string[]
    }
  }>
}
