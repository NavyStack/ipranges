import { merge } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'
import { FileOperationParams, LogParams, FileProcessFunction } from 'types'

// Check if the environment is set to development mode
const debugMode = process.env.NODE_ENV === 'development'

// Function to log messages if in debug mode
const logMessage = ({
  outputRelativePath,
  sourceFilePath
}: LogParams): void => {
  debugMode &&
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
}

// Function to log errors
const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, (error as Error)?.message || error)
}

// Function to read a file asynchronously
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

// Function to write to a file asynchronously
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

// Function to merge CIDR addresses
const mergeAddresses = (addresses: string[]): Promise<string[]> => {
  try {
    const mergedAddresses = merge(addresses)
    return Promise.resolve(mergedAddresses)
  } catch (error: unknown) {
    logError('merging addresses', error as Error)
    throw error
  }
}

// Function to process a single file
const processFile: FileProcessFunction = async ({
  sourceFilePath,
  outputSuffix
}) => {
  try {
    const mergedAddresses = await mergeAddresses(
      await readFile({ filePath: sourceFilePath })
    )
    const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix)
    await writeFile({ filePath: outputRelativePath, content: mergedAddresses })
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
  }
}

// Function to process a single file and separate addresses with commas
const processFileWithComma: FileProcessFunction = async ({
  sourceFilePath,
  outputSuffix
}) => {
  try {
    const mergedAddresses = await mergeAddresses(
      await readFile({ filePath: sourceFilePath })
    )
    const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix)
    // Join addresses with commas
    const addressesWithComma = mergedAddresses.join(',')
    await writeFile({
      filePath: outputRelativePath,
      content: [addressesWithComma]
    }) // Write addresses as a single line with commas
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
  }
}

// Function to generate the output path for a file
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

// Asynchronous generator function to recursively iterate through directories
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

// Function to process multiple files
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

        return await Promise.all(
          sourceFilePaths.map(async (sourceFilePath) =>
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

// Extract files to process from command line arguments
const filesToProcess = process.argv.slice(3)

// Map of process options and their corresponding output suffix and process function
const processOptionsMap: Record<
  string,
  { outputSuffix: string; processFunction: FileProcessFunction }
> = {
  '-m': { outputSuffix: '_mini', processFunction: processFile },
  '-c': { outputSuffix: '_comma', processFunction: processFileWithComma } // Use processFileWithComma for -c option
}

// Extract the process option from command line arguments
const processOption = process.argv[2]

// If a valid process option and at least one file to process are provided
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
