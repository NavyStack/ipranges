import merge from "cidr-tools/merge";
import fs from "fs";
import readline from "readline";
import path from "path";

const findFilesRecursively = async (dir, fileList = []) => {
    const files = await fs.promises.readdir(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isDirectory()) {
            await findFilesRecursively(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }

    return fileList;
};


const processFiles = async (filesToProcess, outputSuffix) => {
    for (const fileName of filesToProcess) {
        const filesFound = await findFilesRecursively(process.cwd());

        const sourceFilePaths = filesFound.filter(file => file.toLowerCase().endsWith(fileName.toLowerCase()));

        for (const sourceFilePath of sourceFilePaths) {
            try {
                const readInterface = readline.createInterface({
                    input: fs.createReadStream(sourceFilePath),
                    output: process.env.DEBUG === 'true' ? process.stdout : null,
                });
                

                const addresses = [];

                for await (const line of readInterface) {
                    addresses.push(line.trim());
                }

                const mergedNetworks = merge(addresses);
                const outputFileName = path.join(path.dirname(sourceFilePath), `${path.basename(sourceFilePath, '.txt')}${outputSuffix}.txt`);
                const outputPath = path.resolve(outputFileName);

                await fs.promises.writeFile(outputPath, mergedNetworks.join('\n'));

                console.log(`File "${outputFileName}" created with merged CIDR addresses.`);
            } catch (error) {
                console.error(`Error processing file "${sourceFilePath}": ${error.message}`);
            }
        }

        if (sourceFilePaths.length === 0) {
            console.error(`File "${fileName}" not found in the current directory or its subdirectories.`);
        }
    }
};

const filesToProcess = ["ipv4.txt", "ipv6.txt"];
const outputSuffix = "_mini";

processFiles(filesToProcess, outputSuffix);
