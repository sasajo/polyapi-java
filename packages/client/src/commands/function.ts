import fs from 'fs';
import chalk from 'chalk';
import shell from 'shelljs';
import ts from 'typescript';
import { createServerFunction, createClientFunction } from '../api';
import { loadConfig } from '../config';
import { generateSingleCustomFunction } from './generate';
import { FunctionDetailsDto } from '@poly/model';
import { EXCLUDED_REQUIREMENTS } from '@poly/common/transpiler';

const getDependencies = (code: string) => {
  const importedLibraries = new Set<string>();

  ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      noImplicitUseStrict: true,
    },
    transformers: {
      before: [
        (context) => {
          return (sourceFile) => {
            const visitor = (node: ts.Node): ts.Node => {
              if (ts.isImportDeclaration(node)) {
                const library = node.moduleSpecifier?.getText()
                  .replace(/'/g, '')
                  .replace(/"/g, '');
                if (library && !library.startsWith('.')) {
                  importedLibraries.add(library);
                }
              }
              return node;
            };
            return ts.visitEachChild(sourceFile, visitor, context);
          };
        },
      ],
    },
  });

  return Array.from(importedLibraries)
    .filter(library => !EXCLUDED_REQUIREMENTS.includes(library));
};

export const addCustomFunction = async (
  context: string | null,
  name: string,
  description: string | null,
  file: string,
  server: boolean,
) => {
  loadConfig();

  try {
    let customFunction: FunctionDetailsDto;
    let generate = false;

    const code = fs.readFileSync(file, 'utf8');

    if (server) {
      shell.echo('-n', chalk.rgb(255, 255, 255)('Adding custom server side function...\n'));

      if (getDependencies(code).length) {
        shell.echo(chalk.yellow('Please note that deploying your functions will take a few minutes because it makes use of libraries other than polyapi.'));
      }

      const result = await createServerFunction(context, name, description, code);
      customFunction = result;
      shell.echo(chalk.green('DEPLOYED'));
      generate = true;

      shell.echo(chalk.rgb(255, 255, 255)(`Function ID: ${result.id}`));
    } else {
      shell.echo('-n', chalk.rgb(255, 255, 255)('Adding custom client side function...'));
      customFunction = await createClientFunction(context, name, description, code);
      shell.echo(chalk.green('DONE'));
      shell.echo(chalk.rgb(255, 255, 255)(`Function ID: ${customFunction.id}`));
      generate = true;
    }

    if (generate) {
      await generateSingleCustomFunction(customFunction.id);
    }
  } catch (e) {
    shell.echo(chalk.red('ERROR\n'));
    shell.echo(`${e.response?.data?.message || e.message}`);
  }
};
