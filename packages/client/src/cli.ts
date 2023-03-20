#!/usr/bin/env node
/* tslint:disable:no-shadowed-variable */
import yargs from 'yargs';
import shell from 'shelljs';
import setup from './commands/setup';
import generate from './commands/generate';
import { addCustomFunction } from './commands/function';
import { loadConfig } from './config';

const checkPolyConfig = () => {
  loadConfig();

  if (!process.env.POLY_API_KEY) {
    return false;
  }

  return true;
};

// tslint:disable-next-line:no-unused-expression
yargs
  .usage('$0 <cmd> [args]')
  .command('setup', 'Setups your Poly connection', setup)
  .command(
    'generate',
    'Generates client types for Poly service',
    async ({ argv: { exitWhenNoConfig } }: { argv: any }) => {
      if (!checkPolyConfig()) {
        if (exitWhenNoConfig) {
          shell.echo('Poly is not configured. Please run `poly generate` manually.');
          return;
        }

        await setup();
      }

      await generate();
    },
  )
  .command('function <command>', 'Manages functions', (yargs) => {
    yargs.command(
      'add <name> <file> [context]',
      'Adds a custom function',
      (yargs) =>
        yargs
          .usage('$0 function add <name> <file> [options]')
          .default('context', '')
          .positional('name', {
            describe: 'Name of the function',
            type: 'string',
          })
          .positional('file', {
            describe: 'Path to the function TS file',
            type: 'string',
          })
          .option('context', {
            describe: 'Context of the function',
            type: 'string',
          })
          .option('description', {
            describe: 'Description of the function',
            type: 'string',
          }),
      async ({ name, file, context }) => {
        if (!name || !file) {
          yargs.showHelp();
          return;
        }

        await addCustomFunction(context, name, file);
      },
    );
  })
  .help(true).argv;
