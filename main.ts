import { merge } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'

const debugMode = process.env.NODE_ENV === 'development'
const outputSuffix = '_mini'

const logMessage = (
  outputRelativePath: string,
  sourceFilePath: string
): void => {
  debugMode &&
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
}

const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, (error as Error)?.message || error)
}

const readAddressesFromFile = async (filePath: string): Promise<string[]> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.trim().split('\n')
  } catch (error: unknown) {
    logError(`reading file "${filePath}"`, error as Error)
    throw error
  }
}

const writeAddressesToFile = async (
  outputPath: string,
  addresses: string[]
): Promise<void> => {
  try {
    await fs.writeFile(outputPath, addresses.join('\n'))
  } catch (error: unknown) {
    logError(`writing to file "${outputPath}"`, error as Error)
    throw error
  }
}

const mergeAddresses = (addresses: string[]): Promise<string[]> => {
  try {
    const mergedAddresses = merge(addresses)
    return Promise.resolve(mergedAddresses)
  } catch (error: unknown) {
    logError('merging addresses', error as Error)
    return Promise.reject(error)
  }
}

const processFile = async (
  sourceFilePath: string,
  outputSuffix: string
): Promise<string | null> => {
  try {
    const inputAddresses = await readAddressesFromFile(sourceFilePath)
    const mergedAddresses = await mergeAddresses(inputAddresses)

    const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath))
    const outputFileName = `${baseName}${outputSuffix}${path.extname(sourceFilePath)}`
    const outputRelativePath = path.join(
      path.dirname(sourceFilePath),
      outputFileName
    )
    const outputPath = path.resolve(outputRelativePath)

    await writeAddressesToFile(outputPath, mergedAddresses)
    logMessage(outputRelativePath, sourceFilePath)

    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    return null
  }
}

const findFilesRecursively = async function* (
  dir: string
): AsyncGenerator<string> {
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        yield* findFilesRecursively(filePath)
      } else {
        yield filePath
      }
    }
  } catch (error: unknown) {
    logError(`finding files in directory "${dir}"`, error as Error)
    throw error
  }
}

const processFiles = async (filesToProcess: string[]): Promise<string[]> => {
  try {
    const filesFound: string[] = []

    for await (const file of findFilesRecursively(process.cwd())) {
      filesFound.push(file)
    }

    const results = await Promise.allSettled(
      filesToProcess.map(async (fileName) => {
        const sourceFilePaths = filesFound.filter((file) =>
          file.toLowerCase().endsWith(fileName.toLowerCase())
        )

        if (sourceFilePaths.length === 0) {
          console.error(
            `File "${fileName}" not found in the current directory or its subdirectories.`
          )
          return null
        }

        const processFileResults = await Promise.allSettled(
          sourceFilePaths.map(async (sourceFilePath) =>
            processFile(sourceFilePath, outputSuffix)
          )
        )

        const flattenedResults = processFileResults
          .map((result) =>
            result.status === 'fulfilled' ? result.value : null
          )
          .filter((result) => result !== null) as string[]

        return flattenedResults
      })
    )

    const finalResults = results
      .map((result) => (result.status === 'fulfilled' ? result.value : null))
      .flat()
      .filter((result) => result !== null) as string[]

    return finalResults
  } catch (error: unknown) {
    logError(`processing files`, error as Error)
    return []
  }
}

const filesToProcess = process.argv.slice(2)

processFiles(filesToProcess)
  .then((result) => console.log('All files processed successfully:', result))
  .catch((error: unknown) =>
    console.error('Error during file processing:', error as Error)
  )
