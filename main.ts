import { merge } from 'cidr-tools'
import { promises as fs } from 'fs'
import { FileProcessingParams, LogParams, FileOperationParams } from './types'
import path from 'path'

const debugMode = process.env.NODE_ENV === 'development'
const outputSuffix = '_mini'

const logMessage = ({
  outputRelativePath,
  sourceFilePath
}: LogParams): void => {
  debugMode &&
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
}

const logError = (message: string, error?: Error): void => {
  console.error(`Error: ${message}`, (error as Error)?.message || error)
}

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

const mergeAddresses = (addresses: string[]): Promise<string[]> => {
  try {
    const mergedAddresses = merge(addresses)
    return Promise.resolve(mergedAddresses)
  } catch (error: unknown) {
    logError('merging addresses', error as Error)
    throw error
  }
}

const processFile = async ({
  sourceFilePath,
  outputSuffix
}: FileProcessingParams): Promise<string> => {
  try {
    const inputAddresses = await readFile({ filePath: sourceFilePath })
    const mergedAddresses = await mergeAddresses(inputAddresses)

    const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath))
    const outputFileName = `${baseName}${outputSuffix}${path.extname(sourceFilePath)}`
    const outputRelativePath = path.join(
      path.dirname(sourceFilePath),
      outputFileName
    )
    const outputPath = path.resolve(outputRelativePath)
    await writeFile({ filePath: outputPath, content: mergedAddresses })
    logMessage({ outputRelativePath, sourceFilePath })
    return outputRelativePath
  } catch (error: unknown) {
    logError(`processing file "${sourceFilePath}"`, error as Error)
    throw error
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

const processFiles = async ({
  filesToProcess
}: {
  filesToProcess: string[]
}): Promise<string[]> => {
  try {
    const filesFound: string[] = []
    for await (const file of findFilesRecursively(process.cwd())) {
      filesFound.push(file)
    }

    const results = await Promise.all(
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

        const processFileResults = await Promise.all(
          sourceFilePaths.map(async (sourceFilePath) =>
            processFile({ sourceFilePath, outputSuffix })
          )
        )

        const flattenedResults = processFileResults
          .map((result) => (result ? result : []))
          .flat()
        return flattenedResults
      })
    )

    const finalResults = results
      .flat()
      .filter((result) => result !== null && result !== undefined)
    return finalResults
  } catch (error: unknown) {
    logError(`processing files`, error as Error)
    return []
  }
}

const filesToProcess = process.argv.slice(2)

processFiles({ filesToProcess })
  .then((result) => console.log('All files processed successfully:', result))
  .catch((error: unknown) =>
    console.error('Error during file processing:', error as Error)
  )
