import fs from 'fs';
import handlebars from 'handlebars';
import set from 'lodash/set';
import chalk from 'chalk';
import shell from 'shelljs';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import prettier from 'prettier';

import { FunctionDefinitionDto, WebhookHandleDefinitionDto } from '@poly/common';
import { getFunctions, getWebhookHandles } from '../api';
import { POLY_USER_FOLDER_NAME } from '../constants';
import { loadConfig } from '../config';

const POLY_LIB_PATH = `${__dirname}/../../../${POLY_USER_FOLDER_NAME}/lib`;

interface Context {
  name: string;
  path: string;
  interfaceName: string;
  fileName?: string;
  level?: number;
}

const prepareDir = () => {
  fs.rmSync(POLY_LIB_PATH, { recursive: true, force: true });
  fs.mkdirSync(POLY_LIB_PATH, { recursive: true });
  fs.mkdirSync(`${POLY_LIB_PATH}/custom`);
};

const loadTemplate = async (fileName: string) => fs.readFileSync(`${__dirname}/../templates/${fileName}`, 'utf8');

const generateJSFiles = async (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const urlFunctions = functions.filter((func) => !func.customCode);
  const customFunctions = functions.filter((func) => func.customCode);

  await generateIndexJSFile(urlFunctions, webhookHandles);
  await generateCustomFunctionJSFiles(customFunctions);
};

const generateIndexJSFile = async (
  functions: FunctionDefinitionDto[],
  webhookHandles: WebhookHandleDefinitionDto[],
) => {
  const indexJSTemplate = handlebars.compile(await loadTemplate('index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.js`,
    indexJSTemplate({
      functions,
      webhookHandles,
      apiBaseUrl: process.env.POLY_API_BASE_URL,
      apiKey: process.env.POLY_API_KEY,
    }),
  );
};

const generateCustomFunctionJSFiles = async (customFunctions: FunctionDefinitionDto[]) => {
  const customIndexJSTemplate = handlebars.compile(await loadTemplate('custom-index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/custom/index.js`,
    customIndexJSTemplate({
      customFunctions,
    }),
  );

  if (customFunctions.length === 0) {
    return;
  }
  const customFunctionJSTemplate = handlebars.compile(await loadTemplate('custom-function.js.hbs'));
  customFunctions.forEach((customFunction) => {
    fs.writeFileSync(
      `${POLY_LIB_PATH}/custom/${customFunction.context ? `${customFunction.context}-` : ''}${customFunction.name}.js`,
      prettier.format(
        customFunctionJSTemplate({
          ...customFunction,
        }),
        {
          parser: 'babel',
        },
      ),
    );
  });
};

const generateTSDeclarationFilesForContext = async (
  context: Context,
  contextData: any,
  contextCollector: Context[] = [],
) => {
  const contextDataKeys = Object.keys(contextData);
  const contextDataFunctions = contextDataKeys
    .filter((key) => contextData[key].type === 'function')
    .map((key) => contextData[key]);
  const contextDataWebhookHandles = contextDataKeys
    .filter((key) => contextData[key].type === 'webhookHandle')
    .map((key) => contextData[key]);
  const contextDataSubContexts = contextDataKeys
    .filter((key) => !contextData[key].type)
    .map((key) => {
      const path = `${context.path ? `${context.path}.` : ''}${key}`;
      return {
        name: key,
        path,
        fileName: `${path}.d.ts`,
        interfaceName: toPascalCase(path),
        level: context.level + 1,
      };
    });

  await generateTSContextDeclarationFile(
    context,
    contextDataFunctions,
    contextDataWebhookHandles,
    contextDataSubContexts,
  );
  contextCollector = [...contextCollector, context];

  for await (const subContext of contextDataSubContexts) {
    contextCollector = await generateTSDeclarationFilesForContext(
      subContext,
      contextData[subContext.name],
      contextCollector,
    );
  }

  return contextCollector;
};

const generateTSDeclarationFiles = async (
  functions: FunctionDefinitionDto[],
  webhookHandles: WebhookHandleDefinitionDto[],
) => {
  const contextData = getContextData(functions, webhookHandles);
  const { default: defaultContext, ...otherContexts } = contextData;
  const contexts = await generateTSDeclarationFilesForContext(
    {
      name: '',
      path: '',
      interfaceName: 'Poly',
      fileName: 'default.d.ts',
      level: 0,
    },
    {
      ...otherContexts,
      ...defaultContext,
    },
  );

  await generateTSIndexDeclarationFile(contexts);
};

const generateTSIndexDeclarationFile = async (contexts: Context[]) => {
  const template = handlebars.compile(await loadTemplate('index.d.ts.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.d.ts`,
    template({
      contexts: contexts.map((context) => ({
        ...context,
        firstLevel: context.level === 1,
      })),
    }),
  );
};

const generateTSContextDeclarationFile = async (
  context: Context,
  functions: FunctionDefinitionDto[],
  webhookHandles: WebhookHandleDefinitionDto[],
  subContexts: Context[],
) => {
  const template = handlebars.compile(await loadTemplate('{{context}}.d.ts.hbs'));
  const returnTypeDefinitions = functions
    .filter((func) => func.returnType && !func.customCode)
    .reduce((result, func) => `${result}${func.returnType}\n`, '');
  const webhookHandlesEventTypeDefinitions = webhookHandles
    .filter((handle) => handle.eventType)
    .reduce((result, handle) => `${result}${handle.eventType}\n`, '');

  const toFunctionData = (func: FunctionDefinitionDto) => ({
    ...func,
    arguments: func.arguments.map((arg) => ({
      ...arg,
      name: toCamelCase(arg.name),
    })),
    returnType: func.customCode
      ? func.returnType
      : func.returnType
      ? `Promise<${toPascalCase(`${context}.${func.name}`)}Type['content']>`
      : 'Promise<any>',
  });
  const toWebhookHandleData = (handle: WebhookHandleDefinitionDto) => ({
    ...handle,
    eventType: handle.eventType ? `${toPascalCase(`${context}.${handle.name}`)}EventType['content']` : 'any',
  });
  fs.writeFileSync(
    `${POLY_LIB_PATH}/${context.fileName}`,
    template({
      interfaceName: context.interfaceName,
      functions: functions.map(toFunctionData),
      webhookHandles: webhookHandles.map(toWebhookHandleData),
      subContexts,
      returnTypeDefinitions,
      webhookHandlesEventTypeDefinitions,
    }),
  );
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
    functions = await getFunctions();
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
  shell.echo(chalk.rgb(255, 255, 255)(`\nPlease, restart your TS server to see the changes.`));
};

export default generate;
