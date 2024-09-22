// src/types.ts

export interface IpPrefix {
  ipv4Prefix?: string
  ipv6Prefix?: string
}

export interface IpRange {
  ipv4: string[]
  ipv6: string[]
}

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
  options: { commaSeparated: boolean }
}

export type FileProcessFunction = (
  sourceFilePath: string,
  outputSuffix: string,
  options: { commaSeparated: boolean }
) => Promise<string>

export interface AddressMergeResult {
  mergedAddresses: string[]
}

// AWS
export interface AwsIpRanges {
  createDate: string
  prefixes: Array<{
    ip_prefix: string
    region: string
    service: string
  }>
  ipv6_prefixes: Array<{
    ipv6_prefix: string
    region: string
    service: string
  }>
}

// Oracle
export interface OracleCidr {
  cidr: string
  tags?: string[]
}

export interface OracleRegion {
  region: string
  cidrs: OracleCidr[]
}

export interface OracleIpRanges {
  last_updated_timestamp: string
  regions: OracleRegion[]
}

// Vultr
export interface VultrSubnet {
  ip_prefix: string
  alpha2code?: string
  region?: string
  city?: string
  postal_code?: string
}

export interface VultrIpRanges {
  subnets: VultrSubnet[]
}

// BingBot
export interface BingBotIpRanges {
  creationTime: string
  prefixes: IpPrefix[]
}

// Cloudflare
export interface CloudflareError {
  code: number
  message: string
}

export interface CloudflareMessage {
  code: number
  message: string
}

export interface CloudflareCnResponse {
  result: {
    ipv4_cidrs: string[]
    ipv6_cidrs: string[]
    jdcloud_cidrs: string[]
    etag: string
  }
  success: boolean
  errors: CloudflareError[]
  messages: CloudflareMessage[]
}

// Google
export interface GoogleIpRangePrefix extends IpPrefix {
  service?: string
  scope?: string
}

export interface GoogleCloudIpRanges {
  syncToken: string
  creationTime: string
  prefixes: GoogleIpRangePrefix[]
}

export interface GooglebotIpRanges {
  creationTime: string
  prefixes: IpPrefix[]
}

// GitHub
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

// Microsoft Azure
export interface MicrosoftIpRanges {
  values: Array<{
    properties: {
      addressPrefixes?: string[]
    }
  }>
}
