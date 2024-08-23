// src/compress.ts
import { mergeCidr } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'
import {
  FilePathParams,
  FileContentParams,
  LogParams,
  FileProcessFunction,
  AddressMergeResult
} from './types'

const debugMode = process.env.NODE_ENV === 'development'

const logMessage = ({
  outputRelativePath,
  sourceFilePath
}: LogParams): void => {
  if (debugMode) {
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
  }
}

const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, error?.message || error)
}

const readFile = async ({ filePath }: FilePathParams): Promise<string[]> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.trim().split('\n')
  } catch (error: unknown) {
    logError(`reading file "${filePath}"`, error as Error)
    throw error
  }
}

const writeFile = async ({
  filePath,
  content
}: FileContentParams): Promise<void> => {
  try {
    await fs.writeFile(filePath, content.join('\n'))
  } catch (error: unknown) {
    logError(`writing to file "${filePath}"`, error as Error)
    throw error
  }
}

const mergeAddresses = (addresses: string[]): AddressMergeResult => {
  try {
    const mergedAddresses = mergeCidr(addresses)
    return { mergedAddresses }
  } catch (error: unknown) {
    logError('merging addresses', error as Error)
    throw error
  }
}

const processFile: FileProcessFunction = async ({
  sourceFilePath,
  outputSuffix
}) => {
  try {
    const addresses = await readFile({ filePath: sourceFilePath })
    const { mergedAddresses } = mergeAddresses(addresses)
    const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix)
    await writeFile({ filePath: outputRelativePath, content: mergedAddresses })
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
  }
}

const processFileWithComma: FileProcessFunction = async ({
  sourceFilePath,
  outputSuffix
}) => {
  try {
    const addresses = await readFile({ filePath: sourceFilePath })
    const { mergedAddresses } = mergeAddresses(addresses)
    const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix)
    const addressesWithComma = mergedAddresses.join(',')
    await writeFile({
      filePath: outputRelativePath,
      content: [addressesWithComma]
    })
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
  }
}

const generateOutputPath = (
  sourceFilePath: string,
  outputSuffix: string
): string => {
  const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath))
  return path.join(
    path.dirname(sourceFilePath),
    `${baseName}${outputSuffix}${path.extname(sourceFilePath)}`
  )
}

const Recursively = async function* (dir: string): AsyncGenerator<string> {
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        yield* Recursively(filePath)
      } else {
        yield filePath
      }
    }
  } catch (error: unknown) {
    logError(`finding files in directory "${dir}"`, error as Error)
    throw error
  }
}

const processFiles = async ({
  filesToProcess,
  outputSuffix,
  processFunction
}: {
  filesToProcess: string[]
  outputSuffix: string
  processFunction: FileProcessFunction
}): Promise<string[]> => {
  try {
    const filesFound: string[] = []
    for await (const file of Recursively(process.cwd())) {
      filesFound.push(file)
    }

    const processResults = await Promise.all(
      filesToProcess.map(async (fileName) => {
        const sourceFilePaths = filesFound.filter((file) =>
          file.toLowerCase().endsWith(fileName.toLowerCase())
        )

        if (sourceFilePaths.length === 0) {
          console.error(
            `File "${fileName}" not found in the current directory or its subdirectories.`
          )
          return []
        }

        return Promise.all(
          sourceFilePaths.map((sourceFilePath) =>
            processFunction({ sourceFilePath, outputSuffix })
          )
        )
      })
    )

    return processResults.flat().filter(Boolean)
  } catch (error: unknown) {
    logError(`processing files`, error as Error)
    return []
  }
}

const filesToProcess = process.argv.slice(3)

const processOptionsMap: Record<
  string,
  { outputSuffix: string; processFunction: FileProcessFunction }
> = {
  '-m': { outputSuffix: '_mini', processFunction: processFile },
  '-c': { outputSuffix: '_comma', processFunction: processFileWithComma }
}

const processOption = process.argv[2]

if (processOptionsMap[processOption] && filesToProcess.length >= 1) {
  const { outputSuffix, processFunction } = processOptionsMap[processOption]
  processFiles({ filesToProcess, outputSuffix, processFunction })
    .then((result) => console.log('All files processed successfully:', result))
    .catch((error: unknown) =>
      logError('Error during file processing:', error as Error)
    )
} else {
  console.error(
    'Invalid command. Please use: tsc && node dist/compress.js [-m | -c] file1.txt [file2.txt ...]'
  )
}
