import fs from 'fs';
import chalk from 'chalk';
import shell from 'shelljs';
import { createServerFunction, createClientFunction } from '../api';
import { loadConfig } from '../config';
import generate from './generate';

export const addCustomFunction = async (context: string | null, name: string, file: string, server: boolean) => {
  loadConfig();

  try {
    const code = fs.readFileSync(file, 'utf8');
    if (server) {
      shell.echo('-n', chalk.rgb(255, 255, 255)(`Adding custom server side function...`));
      await createServerFunction(context, name, code);
    } else {
      shell.echo('-n', chalk.rgb(255, 255, 255)(`Adding custom client side function...`));
      await createClientFunction(context, name, code);
    }
    shell.echo(chalk.green('DONE'));
    await generate();
  } catch (e) {
    shell.echo(chalk.red('ERROR\n'));
    shell.echo(`${e.response?.data?.message || e.message}`);
  }
};
