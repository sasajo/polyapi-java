import fs from 'fs';
import handlebars from 'handlebars';
import set from 'lodash/set';
import chalk from 'chalk';
import shell from 'shelljs';
import { toPascalCase } from '@guanghechen/helper-string';

import { FunctionDto } from '@poly/common';
import { getPolyFunctions } from '../api';
import { POLY_USER_FOLDER_NAME } from '../constants';
import { loadConfig } from '../config';

const POLY_LIB_PATH = `${__dirname}/../../../${POLY_USER_FOLDER_NAME}/lib`;

interface Context {
  name: string;
  interfaceName: string;
}

const prepareDir = () => {
  fs.rmSync(POLY_LIB_PATH, { recursive: true, force: true });
  fs.mkdirSync(POLY_LIB_PATH, { recursive: true });
};

const loadTemplate = async (fileName: string) =>
  fs.readFileSync(`${__dirname}/../templates/${fileName}`, 'utf8');

const generateJSFiles = async (functions: FunctionDto[]) => {
  const template = handlebars.compile(await loadTemplate('index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.js`,
    template({
      functions,
      apiBaseUrl: process.env.POLY_API_BASE_URL,
    }),
  );
};

const generateTSDeclarationFilesForContext = async (
  parentContextPath: string | null,
  contextName: string,
  contextData: any,
  contextFilesCollector: string[] = [],
) => {
  const contextPath = `${
    parentContextPath ? `${parentContextPath}.` : ''
  }${contextName}`;
  const contextDataKeys = Object.keys(contextData);
  const contextDataFunctions = contextDataKeys
    .filter((key) => contextData[key].type === 'function')
    .map((key) => contextData[key]);
  const contextDataSubContexts = contextDataKeys
    .filter((key) => contextData[key].type !== 'function')
    .map((key) => ({
      name: key,
      interfaceName: toPascalCase(`${contextPath}.${key}`),
    }));

  const contextFiles = await generateTSContextDeclarationFile(
    contextPath,
    contextDataFunctions,
    contextDataSubContexts,
  );
  contextFilesCollector = [...contextFilesCollector, contextFiles];

  for await (const subContext of contextDataSubContexts) {
    contextFilesCollector = await generateTSDeclarationFilesForContext(
      contextPath,
      subContext.name,
      contextData[subContext.name],
      contextFilesCollector,
    );
  }

  return contextFilesCollector;
};

const generateTSDeclarationFiles = async (functions: FunctionDto[]) => {
  const contextData = getContextData(functions);
  const { default: defaultContext, ...otherContexts } = contextData;
  const contextFiles = await generateTSDeclarationFilesForContext(null, '', {
    ...otherContexts,
    ...defaultContext,
  });

  await generateTSIndexDeclarationFile(contextFiles);
};

const generateTSIndexDeclarationFile = async (contextFiles: string[]) => {
  const template = handlebars.compile(await loadTemplate('index.d.ts.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.d.ts`,
    template({
      contextFiles,
    }),
  );
};

const generateTSContextDeclarationFile = async (
  context: string,
  functions: FunctionDto[],
  subContexts: Context[],
) => {
  const template = handlebars.compile(
    await loadTemplate('{{context}}.d.ts.hbs'),
  );
  const fileName = `${context === '' ? 'default' : context}.d.ts`;
  const returnTypeDefinitions = functions.reduce((result, func) => {
    return `${result}${func.returnType}\n`;
  }, '');

  const toFunctionData = (func: FunctionDto) => ({
    ...func,
    returnType: func.returnType
      ? 'Promise<' +
        toPascalCase(`${context}.${func.name}`) +
        "Type['response']>"
      : 'Promise<any>',
  });
  fs.writeFileSync(
    `${POLY_LIB_PATH}/${fileName}`,
    template({
      interfaceName: context === '' ? 'Poly' : toPascalCase(context),
      context,
      functions: functions.map(toFunctionData),
      subContexts,
      returnTypeDefinitions,
    }),
  );

  return fileName;
};

const getContextData = (functions: FunctionDto[]) =>
  functions.reduce((acc, func) => {
    const contextFunctionName = `${func.context || 'default'}.${func.name}`;
    return set(acc, contextFunctionName, {
      ...func,
      type: 'function',
      name: func.name.split('.').pop(),
    });
  }, {} as Record<string, any>);

const generate = async () => {
  shell.echo('-n', chalk.rgb(255, 255, 255)(`Generating Poly functions...`));

  prepareDir();
  loadConfig();

  const functions = await getPolyFunctions();

  await generateJSFiles(functions);
  await generateTSDeclarationFiles(functions);

  shell.echo(chalk.green('DONE'));
};

export default generate;
