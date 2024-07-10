import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { WebGrudDefinitionsLanguageMetaData } from '../language/generated/module.js';
import { createWebGrudDefinitionsServices } from '../language/web-grud-definitions-module.js';
import { extractAstNode } from './cli-util.js';
import { generateN3 } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createWebGrudDefinitionsServices(NodeFileSystem).WebGrudDefinitions;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateN3(model, fileName, opts.destination);
    console.log(chalk.green(`N3 rules generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = WebGrudDefinitionsLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates N3 rules for each factor in a source file')
        .action(generateAction);

    program.parse(process.argv);
}
