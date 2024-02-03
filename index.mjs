import { merge } from 'cidr-tools'
import { promises as fs } from 'fs'
import path from 'path'

const DEBUG_MODE = Boolean(process.env.DEBUG)
const FILE_EXTENSION = '.txt'
const OUTPUT_SUFFIX = '_mini'

const logMessage = (outputRelativePath, sourceFilePath) => {
  DEBUG_MODE &&
    console.log(
      `File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`
    )
}

const readAddressesFromFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.trim().split('\n')
  } catch (error) {
    console.error(`Error reading file "${filePath}": ${error.message}`)
    throw error
  }
}

const writeAddressesToFile = async (outputPath, addresses) => {
  try {
    await fs.writeFile(outputPath, addresses.join('\n'))
  } catch (error) {
    console.error(`Error writing to file "${outputPath}": ${error.message}`)
    throw error
  }
}

const processFile = async (sourceFilePath, outputSuffix) => {
  try {
    const inputAddresses = await readAddressesFromFile(sourceFilePath)
    const mergedAddresses = merge(inputAddresses)

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
  } catch (error) {
    console.error(`Error processing file "${sourceFilePath}": ${error.message}`)
    return null
  }
}

const findFilesRecursively = async (dir) => {
  try {
    const files = await fs.readdir(dir)
    const fileLists = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file)
        const stats = await fs.stat(filePath)
        return stats.isDirectory() ? findFilesRecursively(filePath) : [filePath]
      })
    )
    return fileLists.flat()
  } catch (error) {
    console.error(`Error finding files in directory "${dir}": ${error.message}`)
    throw error
  }
}

const processFiles = async (filesToProcess) => {
  try {
    const filesFound = await findFilesRecursively(process.cwd())
    const supportedFiles = filesFound.filter((file) =>
      file.toLowerCase().endsWith(FILE_EXTENSION)
    )

    const processFileName = async (fileName) => {
      const sourceFilePaths = supportedFiles.filter((file) =>
        file.toLowerCase().endsWith(fileName.toLowerCase())
      )

      if (sourceFilePaths.length === 0) {
        console.error(
          `File "${fileName}" not found in the current directory or its subdirectories.`
        )
        return null
      }

      return Promise.all(
        sourceFilePaths.map((sourceFilePath) =>
          processFile(sourceFilePath, OUTPUT_SUFFIX)
        )
      )
    }

    const results = (await Promise.all(filesToProcess.map(processFileName)))
      .flat()
      .filter((result) => result !== null)

    return results
  } catch (error) {
    console.error(`Error processing files: ${error.message}`)
    return []
  }
}

const filesToProcess = ['ipv4.txt', 'ipv6.txt']

processFiles(filesToProcess)
  .then((result) => console.log('All files processed successfully:', result))
  .catch((error) => console.error('Error during file processing:', error))
