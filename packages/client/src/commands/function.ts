import fs from 'fs';
import chalk from 'chalk';
import shell from 'shelljs';
import { createCustomFunction } from '../api';
import { loadConfig } from '../config';
import generate from './generate';

export const addCustomFunction = async (context: string | null, name: string, file: string, server: boolean) => {
  loadConfig();

  shell.echo('-n', chalk.rgb(255, 255, 255)(`Adding custom ${server ? 'server' : 'client'} side function...`));

  try {
    const code = fs.readFileSync(file, 'utf8');
    await createCustomFunction(context, name, code, server);
    shell.echo(chalk.green('DONE'));
    await generate();
  } catch (e) {
    shell.echo(chalk.red('ERROR\n'));
    shell.echo(`${e.response?.data?.message || e.message}`);
  }
};
