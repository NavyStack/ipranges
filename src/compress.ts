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
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
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
    await fs.mkdir(path.dirname(filePath), { recursive: true })
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

const processFile = async (
  sourceFilePath: string,
  outputSuffix: string,
  options: { commaSeparated: boolean }
): Promise<string | null> => {
  try {
    const addresses = await readFileLines(sourceFilePath)

    if (addresses.length === 0) {
      logMessage(`File "${sourceFilePath}" is empty. Skipping processing.`)
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
    return null
  }
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

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const options = args[0]
  const filesToProcess = args.slice(1)

  if (
    !['-m', '-c', '-mc', '-cm'].includes(options) ||
    filesToProcess.length === 0
  ) {
    console.error(
      'Invalid command. Usage: node dist/compress.js [-m | -c | -mc] file1.txt [file2.txt ...]'
    )
    process.exit(1)
  }

  const outputSuffixes: string[] = []
  const commaSeparatedOptions: boolean[] = []

  if (options.includes('-m')) {
    outputSuffixes.push('_mini')
    commaSeparatedOptions.push(false)
  }

  if (options.includes('-c')) {
    outputSuffixes.push('_comma')
    commaSeparatedOptions.push(true)
  }

  try {
    const results = await Promise.all(
      outputSuffixes.map((suffix, index) =>
        processFiles(filesToProcess, suffix, {
          commaSeparated: commaSeparatedOptions[index]
        })
      )
    )
    const flattenedResults = results.flat()

    console.log('All files processed successfully:', flattenedResults)
  } catch (error) {
    logError('Unhandled error in main execution', error as Error)
    process.exit(1)
  }
}

main().catch((error) => {
  logError('Unhandled error in main execution', error as Error)
  process.exit(1)
})
