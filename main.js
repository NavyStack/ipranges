import { merge } from 'cidr-tools';
import { promises as fs } from 'fs';
import path from 'path';
const debugMode = process.env.NODE_ENV === 'development';
const outputSuffix = '_mini';
const logMessage = ({ outputRelativePath, sourceFilePath }) => {
    debugMode &&
        console.log(`File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`);
};
const logError = (message, error) => {
    console.error(`Error: ${message}`, error?.message || error);
};
const readFile = async ({ filePath }) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.trim().split('\n');
    }
    catch (error) {
        logError(`reading file "${filePath}"`, error);
        throw error;
    }
};
const writeFile = async ({ filePath, content }) => {
    try {
        await fs.writeFile(filePath, content.join('\n'));
    }
    catch (error) {
        logError(`writing to file "${filePath}"`, error);
        throw error;
    }
};
const mergeAddresses = (addresses) => {
    try {
        const mergedAddresses = merge(addresses);
        return Promise.resolve(mergedAddresses);
    }
    catch (error) {
        logError('merging addresses', error);
        throw error;
    }
};
const processFile = async ({ sourceFilePath, outputSuffix }) => {
    try {
        const inputAddresses = await readFile({ filePath: sourceFilePath });
        const mergedAddresses = await mergeAddresses(inputAddresses);
        const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath));
        const outputFileName = `${baseName}${outputSuffix}${path.extname(sourceFilePath)}`;
        const outputRelativePath = path.join(path.dirname(sourceFilePath), outputFileName);
        const outputPath = path.resolve(outputRelativePath);
        await writeFile({ filePath: outputPath, content: mergedAddresses });
        logMessage({ outputRelativePath, sourceFilePath });
        return outputRelativePath;
    }
    catch (error) {
        logError(`processing file "${sourceFilePath}"`, error);
        throw error;
    }
};
const findFilesRecursively = async function* (dir) {
    try {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                yield* findFilesRecursively(filePath);
            }
            else {
                yield filePath;
            }
        }
    }
    catch (error) {
        logError(`finding files in directory "${dir}"`, error);
        throw error;
    }
};
const processFiles = async ({ filesToProcess }) => {
    try {
        const filesFound = [];
        for await (const file of findFilesRecursively(process.cwd())) {
            filesFound.push(file);
        }
        const results = await Promise.all(filesToProcess.map(async (fileName) => {
            const sourceFilePaths = filesFound.filter((file) => file.toLowerCase().endsWith(fileName.toLowerCase()));
            if (sourceFilePaths.length === 0) {
                console.error(`File "${fileName}" not found in the current directory or its subdirectories.`);
                return [];
            }
            const processFileResults = await Promise.all(sourceFilePaths.map(async (sourceFilePath) => processFile({ sourceFilePath, outputSuffix })));
            const flattenedResults = processFileResults
                .map((result) => (result ? result : []))
                .flat();
            return flattenedResults;
        }));
        const finalResults = results
            .flat()
            .filter((result) => result !== null && result !== undefined);
        return finalResults;
    }
    catch (error) {
        logError(`processing files`, error);
        return [];
    }
};
const filesToProcess = process.argv.slice(2);
processFiles({ filesToProcess })
    .then((result) => console.log('All files processed successfully:', result))
    .catch((error) => console.error('Error during file processing:', error));
