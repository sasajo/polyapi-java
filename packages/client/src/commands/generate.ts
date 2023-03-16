import fs from 'fs';
import handlebars from 'handlebars';
import set from 'lodash/set';
import chalk from 'chalk';
import shell from 'shelljs';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';

import { FunctionDefinitionDto, WebhookHandleDefinitionDto } from '@poly/common';
import { getPolyFunctions, getWebhookHandles } from '../api';
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

const loadTemplate = async (fileName: string) => fs.readFileSync(`${__dirname}/../templates/${fileName}`, 'utf8');

const generateJSFiles = async (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const template = handlebars.compile(await loadTemplate('index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.js`,
    template({
      functions,
      webhookHandles,
      apiBaseUrl: process.env.POLY_API_BASE_URL,
      apiKey: process.env.POLY_API_KEY,
    }),
  );
};

const generateTSDeclarationFilesForContext = async (
  parentContextPath: string | null,
  contextName: string,
  contextData: any,
  contextFilesCollector: string[] = [],
) => {
  const contextPath = `${parentContextPath ? `${parentContextPath}.` : ''}${contextName}`;
  const contextDataKeys = Object.keys(contextData);
  const contextDataFunctions = contextDataKeys
    .filter((key) => contextData[key].type === 'function')
    .map((key) => contextData[key]);
  const contextDataWebhookHandles = contextDataKeys
    .filter((key) => contextData[key].type === 'webhookHandle')
    .map((key) => contextData[key]);
  const contextDataSubContexts = contextDataKeys
    .filter((key) => !contextData[key].type)
    .map((key) => ({
      name: key,
      interfaceName: toPascalCase(`${contextPath}.${key}`),
    }));

  const contextFiles = await generateTSContextDeclarationFile(
    contextPath,
    contextDataFunctions,
    contextDataWebhookHandles,
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

const generateTSDeclarationFiles = async (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const contextData = getContextData(functions, webhookHandles);
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
  functions: FunctionDefinitionDto[],
  webhookHandles: WebhookHandleDefinitionDto[],
  subContexts: Context[],
) => {
  const template = handlebars.compile(await loadTemplate('{{context}}.d.ts.hbs'));
  const fileName = `${context === '' ? 'default' : context}.d.ts`;
  const returnTypeDefinitions = functions
    .filter(func => func.returnType)
    .reduce((result, func) => `${result}${func.returnType}\n`, '');
  const webhookHandlesEventTypeDefinitions = webhookHandles
    .filter(handle => handle.eventType)
    .reduce((result, handle) => `${result}${handle.eventType}\n`, '');

  const toFunctionData = (func: FunctionDefinitionDto) => ({
    ...func,
    arguments: func.arguments.map((arg) => ({
      ...arg,
      name: toCamelCase(arg.name),
    })),
    returnType: func.returnType ? `Promise<${toPascalCase(`${context}.${func.name}`)}Type['content']>` : 'Promise<any>',
  });
  const toWebhookHandleData = (handle: WebhookHandleDefinitionDto) => ({
    ...handle,
    eventType: handle.eventType ? `${toPascalCase(`${context}.${handle.name}`)}EventType['content']` : 'any',
  });
  fs.writeFileSync(
    `${POLY_LIB_PATH}/${fileName}`,
    template({
      interfaceName: context === '' ? 'Poly' : toPascalCase(context),
      context,
      functions: functions.map(toFunctionData),
      webhookHandles: webhookHandles.map(toWebhookHandleData),
      subContexts,
      returnTypeDefinitions,
      webhookHandlesEventTypeDefinitions,
    }),
  );

  return fileName;
};

const getContextData = (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const contextData = {} as Record<string, any>;

  functions.forEach((func) => {
    const contextFunctionName = `${func.context || 'default'}.${func.name}`;
    set(contextData, contextFunctionName, {
      ...func,
      type: 'function',
      name: func.name.split('.').pop(),
    });
  });
  webhookHandles.forEach((handle) => {
    const contextFunctionName = `${handle.context || 'default'}.${handle.name}`;
    set(contextData, contextFunctionName, {
      ...handle,
      type: 'webhookHandle',
      name: handle.name.split('.').pop(),
    });
  });

  return contextData;
};

const generate = async () => {
  let functions: FunctionDefinitionDto[] = [];
  let webhookHandles: WebhookHandleDefinitionDto[] = [];

  shell.echo('-n', chalk.rgb(255, 255, 255)(`Generating Poly functions...`));

  prepareDir();
  loadConfig();

  try {
    functions = await getPolyFunctions();
    webhookHandles = await getWebhookHandles();
  } catch (error) {
    shell.echo(chalk.red('ERROR'));
    shell.echo('Error while getting data from Poly server. Make sure the version of library/server is up to date.');
    shell.echo(chalk.red(error.message), chalk.red(JSON.stringify(error.response?.data)));
    return;
  }

  try {
    await generateJSFiles(functions, webhookHandles);
    await generateTSDeclarationFiles(functions, webhookHandles);
  } catch (error) {
    shell.echo(chalk.red('ERROR'));
    shell.echo('Error while generating code files. Make sure the version of library/server is up to date.');
    shell.echo(chalk.red(error.message));
    return;
  }

  shell.echo(chalk.green('DONE'));
};

export default generate;
