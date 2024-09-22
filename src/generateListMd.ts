// src/generateListMd.ts

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirnamePath = path.dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://raw.githubusercontent.com/NavyStack/ipranges/main'
const OUTPUT_FILE = 'list.md'
const DIRECTORIES = [
  'amazon',
  'betterstack',
  'bingbot',
  'cloudflare',
  'cloudflare-cn',
  'digitalocean',
  'github',
  'google',
  'googlebot',
  'linode',
  'microsoft-azure',
  'oracle',
  'vultr'
]
const FILE_ORDER = [
  'ipv4.txt',
  'ipv4_mini.txt',
  'ipv4_comma.txt',
  'ipv6.txt',
  'ipv6_mini.txt',
  'ipv6_comma.txt'
]

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1)

interface Counts {
  directories: number
  files: number
}

const generateListMd = async (): Promise<void> => {
  const counts: Counts = { directories: 0, files: 0 }
  const sections = await Promise.all(
    DIRECTORIES.map((dir) =>
      processDirectory(path.join(__dirnamePath, '..', dir), dir, 0, counts)
    )
  )

  const markdown = [
    ...sections.filter(Boolean),
    `\n${counts.directories} directories, ${counts.files} files\n`
  ].join('')

  await fs.writeFile(
    path.join(__dirnamePath, '..', OUTPUT_FILE),
    markdown,
    'utf-8'
  )
  console.log(`Markdown file created: ${OUTPUT_FILE}`)
}

const processDirectory = async (
  dirPath: string,
  relativePath: string,
  depth: number,
  counts: Counts
): Promise<string> => {
  try {
    const entries = (await fs.readdir(dirPath, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name)
    )

    const txtFiles = entries.filter(
      (e) => e.isFile() && e.name.endsWith('.txt')
    )
    const subDirs = entries.filter((e) => e.isDirectory())

    if (!txtFiles.length && !subDirs.length) return ''

    counts.directories++
    const dirName = capitalize(path.basename(dirPath))
    const header =
      depth === 0
        ? `## ${dirName}\n\n`
        : `<details>\n<summary>${dirName}</summary>\n\n`

    const filesContent = txtFiles
      .sort((a, b) => FILE_ORDER.indexOf(a.name) - FILE_ORDER.indexOf(b.name))
      .map((file) => {
        const fileName = path.parse(file.name).name
        const filePath = path
          .join(relativePath, file.name)
          .split(path.sep)
          .map(encodeURIComponent)
          .join('/')
        const fileUrl = `${BASE_URL}/${filePath}`
        counts.files++
        const headerLevel = Math.min(depth + 3, 4)
        return `${'#'.repeat(headerLevel)} ${fileName}\n\n\`\`\`bash\n${fileUrl}\n\`\`\`\n`
      })
      .join('\n')

    const subDirsContent = await Promise.all(
      subDirs.map((sub) =>
        processDirectory(
          path.join(dirPath, sub.name),
          path.join(relativePath, sub.name),
          depth + 1,
          counts
        )
      )
    )

    const closingTag = depth > 0 ? '</details>\n\n' : ''
    return `${header}${filesContent}\n${subDirsContent.filter(Boolean).join('')}${closingTag}`
  } catch (error) {
    console.error(`Error processing directory "${dirPath}":`, error)
    return ''
  }
}

generateListMd().catch((error) => {
  console.error('Unexpected error generating list.md:', error)
  process.exit(1)
})
