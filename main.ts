import { merge } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'
import {
  FileOperationParams,
  LogParams,
  FileProcessFunction,
  AddressMergeResult
} from 'types'

// Check if the application is running in development mode
const debugMode = process.env.NODE_ENV === 'development'

// Log a message if debug mode is enabled
const logMessage = ({
  outputRelativePath,
  sourceFilePath
}: LogParams): void => {
  debugMode &&
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
}

// Log an error message
const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, (error as Error)?.message || error)
}

// Asynchronously read the content of a file
const readFile = async ({
  filePath
}: FileOperationParams): Promise<string[]> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.trim().split('\n')
  } catch (error: unknown) {
    logError(`reading file "${filePath}"`, error as Error)
    throw error
  }
}

// Asynchronously write content to a file
const writeFile = async ({
  filePath,
  content
}: FileOperationParams & { content: string[] }): Promise<void> => {
  try {
    await fs.writeFile(filePath, content.join('\n'))
  } catch (error: unknown) {
    logError(`writing to file "${filePath}"`, error as Error)
    throw error
  }
}

// Asynchronously merge CIDR addresses
const mergeAddresses = async (
  addresses: string[]
): Promise<AddressMergeResult> => {
  try {
    const mergedAddresses = await Promise.resolve(merge(addresses))
    return { mergedAddresses }
  } catch (error: unknown) {
    logError('merging addresses', error as Error)
    throw error
  }
}

// Process a single file asynchronously
const processFile: FileProcessFunction = async ({
  sourceFilePath,
  outputSuffix
}) => {
  try {
    const addresses = await readFile({ filePath: sourceFilePath })
    const { mergedAddresses } = await mergeAddresses(addresses)
    const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix)
    await writeFile({ filePath: outputRelativePath, content: mergedAddresses })
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
  }
}

// Generate the output path for a file
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

// Asynchronously get files recursively from a directory
const getFileRecursively = async function* (
  dir: string
): AsyncGenerator<string> {
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        yield* getFileRecursively(filePath)
      } else {
        yield filePath
      }
    }
  } catch (error: unknown) {
    logError(`finding files in directory "${dir}"`, error as Error)
    throw error
  }
}

// Process multiple files asynchronously
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
    // Iterate over files recursively in the current directory
    for await (const file of getFileRecursively(process.cwd())) {
      filesFound.push(file)
    }

    // Process each file in parallel
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

        const promises = sourceFilePaths.map(async (sourceFilePath) =>
          processFunction({ sourceFilePath, outputSuffix })
        )

        return await Promise.all(promises)
      })
    )

    return processResults.flat().filter(Boolean)
  } catch (error: unknown) {
    logError(`processing files`, error as Error)
    return []
  }
}

// Extract file paths from command line arguments
const filesToProcess = process.argv.slice(3)

// Map of process options
const processOptionsMap: Record<
  string,
  { outputSuffix: string; processFunction: FileProcessFunction }
> = {
  '-m': { outputSuffix: '_mini', processFunction: processFile },
  '-c': { outputSuffix: '_comma', processFunction: processFile }
}

// Get the process option from command line arguments
const processOption = process.argv[2]

// Execute file processing based on the process option
if (processOptionsMap[processOption] && filesToProcess.length >= 1) {
  const { outputSuffix, processFunction } = processOptionsMap[processOption]
  processFiles({ filesToProcess, outputSuffix, processFunction })
    .then((result) => console.log('All files processed successfully:', result))
    .catch((error: unknown) =>
      console.error('Error during file processing:', error as Error)
    )
} else {
  console.error(
    'Invalid command. Please use: tsc && node main.js [-m | -c] file1.txt [file2.txt ...]'
  )
}
