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
