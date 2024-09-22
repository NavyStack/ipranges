// src/combined.ts

import { mergeCidr } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'
import awsMain from './aws/processor'
import betterstackMain from './betterstack/processor'
import bingbotMain from './bingbot/processor'
import cloudflareMain from './cloudflare/processor'
import cloudflareMainCN from './cloudflare-cn/processor'
import digitaloceanMain from './digitalocean/processor'
import githubMain from './github/processor'
import googleMain from './google/processor'
import googlebotMain from './googlebot/processor'
import microsoftAzureMain from './microsoft-azure/processor'
import oracleMain from './oracle/processor'
import vultrMain from './vultr/processor'
import linodeMain from './linode/processor'

const debugMode = process.env.NODE_ENV === 'development'

const logMessage = (message: string): void => {
  if (debugMode) {
    console.log(message)
  }
}

const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, error?.message || error)
}

const saveIfNotEmpty = async (
  content: string,
  filePath: string
): Promise<void> => {
  if (content.trim().length === 0) return

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

const mergeAddresses = (addresses: string[]): string[] => {
  try {
    return mergeCidr(addresses)
  } catch (error) {
    logError('Error merging addresses', error as Error)
    throw error
  }
}

const processFile = async (
  sourceFilePath: string,
  outputSuffix: string,
  options: { commaSeparated: boolean }
): Promise<string | null> => {
  try {
    const content = await fs.readFile(sourceFilePath, 'utf-8')
    const addresses = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')

    if (addresses.length === 0) {
      logMessage(`File "${sourceFilePath}" is empty. Skipping processing.`)
      return null
    }

    const mergedAddresses = mergeAddresses(addresses)
    const outputFilePath = generateOutputPath(sourceFilePath, outputSuffix)
    const outputContent = options.commaSeparated
      ? mergedAddresses.join(',')
      : mergedAddresses.join('\n')

    await saveIfNotEmpty(outputContent, outputFilePath)
    logMessage(`Processed file "${sourceFilePath}" -> "${outputFilePath}"`)
    return outputFilePath
  } catch (error) {
    logError(`Error processing file "${sourceFilePath}"`, error as Error)
    return null
  }
}

const generateOutputPath = (
  sourceFilePath: string,
  outputSuffix: string
): string => {
  const dirName = path.dirname(sourceFilePath)
  const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath))
  const extension = path.extname(sourceFilePath)
  return path.join(dirName, `${baseName}${outputSuffix}${extension}`)
}

const findFiles = async (
  dir: string,
  fileNames: Set<string>
): Promise<string[]> => {
  const results: string[] = []
  const stack: string[] = [dir]

  while (stack.length > 0) {
    const currentDir = stack.pop()!
    try {
      const list = await fs.readdir(currentDir, { withFileTypes: true })
      for (const dirent of list) {
        const filePath = path.join(currentDir, dirent.name)
        if (dirent.isDirectory()) {
          stack.push(filePath)
        } else if (fileNames.has(dirent.name)) {
          results.push(filePath)
        }
      }
    } catch (error) {
      logError(`Error reading directory "${currentDir}"`, error as Error)
    }
  }

  return results
}

const processFiles = async (
  filesToProcess: string[],
  outputSuffix: string,
  options: { commaSeparated: boolean }
): Promise<string[]> => {
  try {
    const fileNameSet = new Set(filesToProcess)
    const filesFound = await findFiles(process.cwd(), fileNameSet)

    if (filesFound.length === 0) {
      console.error('No files found to process.')
      return []
    }

    const processedFiles = await Promise.all(
      filesFound.map(async (sourceFilePath) => {
        const result = await processFile(sourceFilePath, outputSuffix, options)
        return result
      })
    )

    return processedFiles.filter((res): res is string => res !== null)
  } catch (error: unknown) {
    logError(`Error processing files`, error as Error)
    return []
  }
}

const runAll = async () => {
  try {
    await Promise.all([
      linodeMain(),
      awsMain(),
      betterstackMain(),
      bingbotMain(),
      cloudflareMain(),
      cloudflareMainCN(),
      digitaloceanMain(),
      githubMain(),
      googleMain(),
      googlebotMain(),
      microsoftAzureMain(),
      oracleMain(),
      vultrMain()
    ])

    logMessage('All IP address processors completed successfully.')

    const compressOptions = [
      { suffix: '_mini', commaSeparated: false },
      { suffix: '_comma', commaSeparated: true }
    ]

    const filesToCompress = ['ipv4.txt', 'ipv6.txt']

    const compressionPromises = compressOptions.map(async (option) => {
      const results = await processFiles(filesToCompress, option.suffix, {
        commaSeparated: option.commaSeparated
      })
      return results
    })

    const compressionResults = await Promise.all(compressionPromises)

    const flattenedResults = compressionResults.flat()

    console.log(
      'All files processed and compressed successfully:',
      flattenedResults
    )
  } catch (error) {
    logError('Unhandled error in combined execution', error as Error)
    process.exit(1)
  }
}

runAll().catch((error) => {
  logError('Unhandled error in combined execution', error as Error)
  process.exit(1)
})
