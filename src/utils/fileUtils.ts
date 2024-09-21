// src/utils/fileUtils.ts

import { promises as fs } from 'fs'

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
