// src/compress.ts

import { mergeCidr } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'

const debugMode = process.env.NODE_ENV === 'development'

const logMessage = (message: string): void => {
  if (debugMode) {
    console.log(message)
  }
}

const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, error?.message || error)
}

const readFileLines = async (filePath: string): Promise<string[]> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
  } catch (error) {
    logError(`Error reading file "${filePath}"`, error as Error)
    throw error
  }
}

const writeFileContent = async (
  filePath: string,
  content: string
): Promise<void> => {
  try {
    await fs.writeFile(filePath, content)
  } catch (error) {
    logError(`Error writing to file "${filePath}"`, error as Error)
    throw error
  }
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
    const addresses = await readFileLines(sourceFilePath)

    if (addresses.length === 0) {
      console.log(`File "${sourceFilePath}" is empty. Skipping processing.`)
      return null
    }

    const mergedAddresses = mergeAddresses(addresses)
    const outputFilePath = generateOutputPath(sourceFilePath, outputSuffix)
    const outputContent = options.commaSeparated
      ? mergedAddresses.join(',')
      : mergedAddresses.join('\n')

    await writeFileContent(outputFilePath, outputContent)
    logMessage(`Processed file "${sourceFilePath}" -> "${outputFilePath}"`)
    return outputFilePath
  } catch (error) {
    logError(`Error processing file "${sourceFilePath}"`, error as Error)
    throw error
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

const findFiles = async (dir: string, pattern: RegExp): Promise<string[]> => {
  let results: string[] = []
  const list = await fs.readdir(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(await findFiles(filePath, pattern))
    } else if (pattern.test(filePath)) {
      results.push(filePath)
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
    const processResults: string[] = []

    for (const fileName of filesToProcess) {
      const pattern = new RegExp(fileName.replace(/\./g, '\\.') + '$', 'i')
      const filesFound = await findFiles(process.cwd(), pattern)

      if (filesFound.length === 0) {
        console.error(`File "${fileName}" not found.`)
        continue
      }

      for (const sourceFilePath of filesFound) {
        const result = await processFile(sourceFilePath, outputSuffix, options)
        if (result) {
          processResults.push(result)
        }
      }
    }

    return processResults
  } catch (error: unknown) {
    logError(`Error processing files`, error as Error)
    return []
  }
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const option = args[0]
  const filesToProcess = args.slice(1)

  if (!['-m', '-c'].includes(option) || filesToProcess.length === 0) {
    console.error(
      'Invalid command. Usage: node dist/compress.js [-m | -c] file1.txt [file2.txt ...]'
    )
    process.exit(1)
  }

  const outputSuffix = option === '-m' ? '_mini' : '_comma'
  const commaSeparated = option === '-c'

  const results = await processFiles(filesToProcess, outputSuffix, {
    commaSeparated
  })

  console.log('All files processed successfully:', results)
}

main().catch((error) => {
  logError('Unhandled error in main execution', error as Error)
  process.exit(1)
})
