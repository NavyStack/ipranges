// src/utils/fileUtils.ts

import { promises as fs } from 'fs'
import path from 'path'

export const saveIfNotEmpty = async (
  content: string,
  filePath: string
): Promise<void> => {
  if (content.trim().length === 0) return

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

export const removeFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath)
    console.log(`File ${filePath} removed successfully.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`File ${filePath} does not exist. Skipping removal.`)
    } else {
      throw err
    }
  }
}
