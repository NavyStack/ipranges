// src/types.ts

// Basic IP-related types
export interface IpPrefix {
  ipv4Prefix?: string
  ipv6Prefix?: string
}

export interface IpRange {
  ipv4: string[]
  ipv6: string[]
}

// File handling types
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

// AWS-specific types
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

// Oracle-specific types
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

// Vultr-specific types
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

// BingBot-specific types
export interface BingBotIpRanges {
  creationTime: string
  prefixes: IpPrefix[]
}

// Cloudflare-specific types
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

// Google-specific types
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

// GitHub-specific types
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

// Microsoft Azure-specific types
export interface AzureProperties {
  changeNumber: number
  region: string
  regionId: number
  platform: string
  systemService?: string
  addressPrefixes: string[]
  networkFeatures: string[]
}

export interface MicrosoftAzureValue {
  name: string
  id: string
  properties: AzureProperties
}

export interface MicrosoftIpRanges {
  values: MicrosoftAzureValue[]
}
