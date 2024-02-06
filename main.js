import { merge } from 'cidr-tools';
import { promises as fs } from 'fs';
import path from 'path';
// Check if the application is running in development mode
const debugMode = process.env.NODE_ENV === 'development';
// Log a message if debug mode is enabled
const logMessage = ({ outputRelativePath, sourceFilePath }) => {
    debugMode &&
        console.log(`File "${outputRelativePath}" created with merged CIDR addresses from "${sourceFilePath}".`);
};
// Log an error message
const logError = (message, error) => {
    console.error(`Error: ${message}`, error?.message || error);
};
// Asynchronously read the content of a file
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
// Asynchronously write content to a file
const writeFile = async ({ filePath, content }) => {
    try {
        await fs.writeFile(filePath, content.join('\n'));
    }
    catch (error) {
        logError(`writing to file "${filePath}"`, error);
        throw error;
    }
};
// Asynchronously merge CIDR addresses
const mergeAddresses = async (addresses) => {
    try {
        const mergedAddresses = await Promise.resolve(merge(addresses));
        return { mergedAddresses };
    }
    catch (error) {
        logError('merging addresses', error);
        throw error;
    }
};
// Process a single file asynchronously
const processFile = async ({ sourceFilePath, outputSuffix }) => {
    try {
        const addresses = await readFile({ filePath: sourceFilePath });
        const { mergedAddresses } = await mergeAddresses(addresses);
        const outputRelativePath = generateOutputPath(sourceFilePath, outputSuffix);
        await writeFile({ filePath: outputRelativePath, content: mergedAddresses });
        logMessage({ outputRelativePath, sourceFilePath });
        return outputRelativePath;
    }
    catch (error) {
        logError(`processing file "${sourceFilePath}"`, error);
        throw error;
    }
};
// Generate the output path for a file
const generateOutputPath = (sourceFilePath, outputSuffix) => {
    const baseName = path.basename(sourceFilePath, path.extname(sourceFilePath));
    return path.join(path.dirname(sourceFilePath), `${baseName}${outputSuffix}${path.extname(sourceFilePath)}`);
};
// Asynchronously get files recursively from a directory
const getFileRecursively = async function* (dir) {
    try {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                yield* getFileRecursively(filePath);
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
// Process multiple files asynchronously
const processFiles = async ({ filesToProcess, outputSuffix, processFunction }) => {
    try {
        const filesFound = [];
        // Iterate over files recursively in the current directory
        for await (const file of getFileRecursively(process.cwd())) {
            filesFound.push(file);
        }
        // Process each file in parallel
        const processResults = await Promise.all(filesToProcess.map(async (fileName) => {
            const sourceFilePaths = filesFound.filter((file) => file.toLowerCase().endsWith(fileName.toLowerCase()));
            if (sourceFilePaths.length === 0) {
                console.error(`File "${fileName}" not found in the current directory or its subdirectories.`);
                return [];
            }
            const promises = sourceFilePaths.map(async (sourceFilePath) => processFunction({ sourceFilePath, outputSuffix }));
            return await Promise.all(promises);
        }));
        return processResults.flat().filter(Boolean);
    }
    catch (error) {
        logError(`processing files`, error);
        return [];
    }
};
// Extract file paths from command line arguments
const filesToProcess = process.argv.slice(3);
// Map of process options
const processOptionsMap = {
    '-m': { outputSuffix: '_mini', processFunction: processFile },
    '-c': { outputSuffix: '_comma', processFunction: processFile }
};
// Get the process option from command line arguments
const processOption = process.argv[2];
// Execute file processing based on the process option
if (processOptionsMap[processOption] && filesToProcess.length >= 1) {
    const { outputSuffix, processFunction } = processOptionsMap[processOption];
    processFiles({ filesToProcess, outputSuffix, processFunction })
        .then((result) => console.log('All files processed successfully:', result))
        .catch((error) => console.error('Error during file processing:', error));
}
else {
    console.error('Invalid command. Please use: tsc && node main.js [-m | -c] file1.txt [file2.txt ...]');
}
