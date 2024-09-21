// src/types.ts

// 공통 타입 정의
export interface IpPrefix {
  ipv4Prefix?: string
  ipv6Prefix?: string
}

export interface IpRange {
  ipv4: string[]
  ipv6: string[]
}

// 파일 관련 인터페이스
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

// 주소 병합 결과
export interface AddressMergeResult {
  mergedAddresses: string[]
}

// 서비스별 타입 정의

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
export interface OracleIpRanges {
  last_updated_timestamp: string
  regions: OracleRegion[]
}

export interface OracleRegion {
  region: string
  cidrs: Array<{
    cidr: string
  }>
}

// Vultr
export interface VultrIpRanges {
  subnets: Array<{
    ip_prefix: string
  }>
}

// BingBot
export interface BingBotIpRanges {
  creationTime: string
  prefixes: IpPrefix[]
}

// Cloudflare
export interface CloudflareIpRanges {
  ipv4: string[]
  ipv6: string[]
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
