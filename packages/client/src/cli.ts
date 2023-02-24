#!/usr/bin/env node
import yargs from 'yargs';
import shell from 'shelljs';
import setup from './commands/setup';
import generate from './commands/generate';
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
          shell.echo(
            'Poly is not configured. Please run `poly generate` manually.',
          );
          return;
        }

        await setup();
      }

      await generate();
    },
  )
  .help(true).argv;
