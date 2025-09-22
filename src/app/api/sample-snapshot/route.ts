import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

const outputDirectory = path.join(process.cwd(), 'sampleoutput');

function getUniqueFilename(baseDir: string, baseName: string, extension: string): string {
    const timestamp = format(new Date(), 'MMdd-HHmm');
    let counter = 1;
    let filename = `${baseName}-${timestamp}${extension}`;
    let filepath = path.join(baseDir, filename);

    try {
        while (require('fs').existsSync(filepath)) {
            filename = `${baseName}-${timestamp}-${counter}${extension}`;
            filepath = path.join(baseDir, filename);
            counter++;
        }
    } catch (e) {
        // if existsSync fails, we can just proceed, hoping the file doesn't exist.
    }
    return filepath;
}

function printTree(files: string[]): string {
    const sortedFiles = [...files].sort();
    if (sortedFiles.length === 0) return "No files found.";

    const root = sortedFiles[0].split('/')[0] || 'root';
    let tree = `${root}/\n`;

    const structure: any = {};
    for (const file of sortedFiles) {
        let currentLevel = structure;
        const parts = file.split('/').slice(1);
        for (const part of parts) {
            if (!currentLevel[part]) {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part];
        }
    }

    function buildTreeString(level: any, prefix = '    ') {
        const entries = Object.keys(level).sort();
        entries.forEach((entry, index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            tree += `${prefix}${connector}${entry}\n`;
            if (Object.keys(level[entry]).length > 0) {
                buildTreeString(level[entry], newPrefix);
            }
        });
    }

    buildTreeString(structure);
    return tree;
}

export async function POST(request: Request) {
    try {
        console.log('Receiving pre-processed snapshot data...');

        const body = await request.json();
        const { outputName, snapshotData } = body;
        
        if (!outputName || !snapshotData || !snapshotData.files) {
            return NextResponse.json(
                { message: "Invalid request body. Missing 'outputName' or 'snapshotData'." },
                { status: 400 }
            );
        }

        const fileContents = snapshotData.files;
        const filePaths = Object.keys(fileContents);

        if (filePaths.length === 0) {
             return NextResponse.json(
                { message: "Received snapshot data but it contains no files." },
                { status: 400 }
            );
        }

        const fileTree = printTree(filePaths);

        const finalJson = {
            file_tree: fileTree,
            files: fileContents,
        };

        await fs.mkdir(outputDirectory, { recursive: true });
        const outputFilePath = getUniqueFilename(outputDirectory, outputName, '.json');
        
        await fs.writeFile(outputFilePath, JSON.stringify(finalJson, null, 2), 'utf-8');

        console.log(`Sample snapshot created successfully at: ${outputFilePath}`);

        return NextResponse.json({
            message: 'Sample snapshot created successfully.',
            snapshotPath: path.relative(process.cwd(), outputFilePath),
        });

    } catch (error: any) {
        console.error('Failed to create sample snapshot:', error);
        return NextResponse.json(
            { message: `Failed to create sample snapshot: ${error.message}` },
            { status: 500 }
        );
    }
}