import shell from 'shelljs';
import inquirer from 'inquirer';
import fs from 'fs';
import { loadConfig, saveConfig } from '../config';
import chalk from 'chalk';
// import { checkNodeVersion, checkLibraryVersions, getUpdateLibraryVersionMessage, checkTsConfig } from '@poly/common/client/dependencies';

const URL_REGEX = /https?:\/\/(?:w{1,3}\.)?[^\s.]+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))/;

const setup = async () => {
  loadConfig();

  if (!process.env.ENVIRONMENT_SETUP_COMPLETE) {
    await setupEnvironment();
  }

  await shell.echo('Please setup your connection to Poly service.');

  const { polyApiBaseUrl, polyApiKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'polyApiBaseUrl',
      message: 'Poly API Base URL:',
      default: process.env.POLY_API_BASE_URL || 'https://na1.polyapi.io',
      filter: (value) => value.trim(),
      validate: (url) => {
        if (!URL_REGEX.test(url)) {
          return 'Given URL is not valid. Please enter valid URL.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'polyApiKey',
      message: 'Poly App Key or User Key:',
      default: process.env.POLY_API_KEY,
      filter: (value) => value.trim(),
    },
  ]);

  saveConfig({
    POLY_API_BASE_URL: polyApiBaseUrl,
    POLY_API_KEY: polyApiKey,
    ENVIRONMENT_SETUP_COMPLETE: 'true',
  });
};

const setupEnvironment = async () => {
  loadConfig();
  /*
  checkNodeVersion({
    onOldVersion(message) {
      shell.echo(chalk.red(message));
      throw new Error('Node.js version is too old.');
    },
  });*/

  const packageJson = getPackageJson();
  /*
  await checkLibraryVersions(packageJson, {
    async createOrUpdateLib(library, create) {
      await shell.echo(`${create ? 'Installing' : 'Updating'} ${library}...`);
      await shell.exec(`${getPackageManager()} add ${library}@latest`);
    },

    async requestUserPermissionToUpdateLib(library, version, minVersion) {
      const { updateVersion } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'updateVersion',
          message: getUpdateLibraryVersionMessage(version, minVersion, library),
          default: true,
        },
      ]);

      return updateVersion;
    },
  });

  await checkTsConfig({
    async getCurrentConfig() {
      if (!fs.existsSync(`${process.cwd()}/tsconfig.json`)) {
        return undefined;
      }

      return fs.readFileSync(`${process.cwd()}/tsconfig.json`).toString();
    },
    async requestUserPermissionToCreateTsConfig() {
      const { createTsConfig } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createTsConfig',
          message: 'tsconfig.json does not exist. Do you want to create it?',
          default: true,
        },
      ]);

      return createTsConfig;
    },
    async requestUserPermissionToUpdateTsConfig() {
      const { updateTsConfig } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'updateTsConfig',
          message: 'tsconfig.json does not have esModuleInterop set to true. Do you want to update it?',
          default: true,
        },
      ]);

      return updateTsConfig;
    },
    async saveTsConfig(tsConfig) {
      fs.writeFileSync(`${process.cwd()}/tsconfig.json`, tsConfig);
    },
  }); */
};

const getPackageManager = () : 'npm' | 'yarn' => {
  return fs.existsSync(`${process.cwd()}/yarn.lock`) ? 'yarn' : 'npm';
};

const getPackageJson = () => {
  const packageJson = fs.readFileSync(`${process.cwd()}/package.json`);
  return JSON.parse(packageJson.toString());
};

export default setup;
