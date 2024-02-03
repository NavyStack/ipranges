import { merge } from 'cidr-tools'
import fs from 'fs'
import readline from 'readline'
import path from 'path'

// const FILE_EXTENSIONS = ['.txt']
const OUTPUT_SUFFIX = '_mini'

const findFilesRecursively = async (dir, fileList = []) => {
  try {
    const files = await fs.promises.readdir(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fs.promises.stat(filePath)

      if (stats.isDirectory()) {
        await findFilesRecursively(filePath, fileList)
      } else {
        fileList.push(filePath)
      }
    }
  } catch (error) {
    console.error(`Error reading directory "${dir}": ${error.message}`)
  }

  return fileList
}

const processFile = async (sourceFilePath, outputSuffix) => {
  try {
    const readInterface = readline.createInterface({
      input: fs.createReadStream(sourceFilePath),
      output: process.env.DEBUG === 'true' ? process.stdout : null,
      console: false
    })

    const addresses = []

    for await (const line of readInterface) {
      addresses.push(line.trim())
    }

    const mergedNetworks = merge(addresses)
    const outputFileName = path.join(
      path.dirname(sourceFilePath),
      `${path.basename(sourceFilePath, path.extname(sourceFilePath))}${outputSuffix}${path.extname(sourceFilePath)}`
    )
    const outputPath = path.resolve(outputFileName)

    await fs.promises.writeFile(outputPath, mergedNetworks.join('\n'))

    console.log(`File "${outputFileName}" created with merged CIDR addresses.`)
  } catch (error) {
    console.error(`Error processing file "${sourceFilePath}": ${error.message}`)
  }
}

const processFiles = async (filesToProcess) => {
  try {
    const filesFound = await findFilesRecursively(process.cwd())

    await Promise.all(
      filesToProcess.map(async (fileName) => {
        const sourceFilePaths = filesFound.filter((file) =>
          file.toLowerCase().endsWith(fileName.toLowerCase())
        )

        if (sourceFilePaths.length === 0) {
          console.error(
            `File "${fileName}" not found in the current directory or its subdirectories.`
          )
        }

        await Promise.all(
          sourceFilePaths.map(async (sourceFilePath) => {
            await processFile(sourceFilePath, OUTPUT_SUFFIX)
          })
        )
      })
    )
  } catch (error) {
    console.error(`Error processing files: ${error.message}`)
  }
}

const filesToProcess = ['ipv4.txt', 'ipv6.txt']

processFiles(filesToProcess)
