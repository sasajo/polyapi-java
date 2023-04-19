import fs from 'fs';
import handlebars from 'handlebars';
import set from 'lodash/set';
import chalk from 'chalk';
import shell from 'shelljs';
import { toCamelCase, toPascalCase } from '@guanghechen/helper-string';
import prettier from 'prettier';

import { FunctionArgument, FunctionDefinitionDto, WebhookHandleDefinitionDto } from '@poly/common';
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

const getApiBaseUrl = () => process.env.POLY_API_BASE_URL || 'http://localhost:8000';

const getApiKey = () => process.env.POLY_API_KEY;

const prepareDir = () => {
  fs.rmSync(POLY_LIB_PATH, { recursive: true, force: true });
  fs.mkdirSync(POLY_LIB_PATH, { recursive: true });
  fs.mkdirSync(`${POLY_LIB_PATH}/url`);
  fs.mkdirSync(`${POLY_LIB_PATH}/auth`);
  fs.mkdirSync(`${POLY_LIB_PATH}/custom`);
  fs.mkdirSync(`${POLY_LIB_PATH}/server`);
};

const loadTemplate = async (fileName: string) => fs.readFileSync(`${__dirname}/../templates/${fileName}`, 'utf8');

const generateJSFiles = async (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const urlFunctions = functions.filter((func) => func.type === 'url');
  const customFunctions = functions.filter((func) => func.type === 'custom');
  const serverFunctions = functions.filter((func) => func.type === 'server');
  const authFunctions = functions.filter((func) => func.type === 'auth');

  await generateIndexJSFile(urlFunctions, webhookHandles);
  await generateUrlFunctionJSFiles(urlFunctions);
  await generateCustomFunctionJSFiles(customFunctions);
  await generateServerFunctionJSFiles(serverFunctions);
  await generateAuthFunctionJSFiles(authFunctions);
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
      apiBaseUrl: getApiBaseUrl(),
      apiKey: getApiKey(),
    }),
  );
};

const generateUrlFunctionJSFiles = async (functions: FunctionDefinitionDto[]) => {
  const urlIndexJSTemplate = handlebars.compile(await loadTemplate('url-index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/url/index.js`,
    urlIndexJSTemplate({
      functions,
      apiBaseUrl: getApiBaseUrl(),
      apiKey: getApiKey(),
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
      prettyPrint(
        customFunctionJSTemplate({
          ...customFunction,
        }),
        'babel',
      ),
    );
  });
};

const generateServerFunctionJSFiles = async (functions: FunctionDefinitionDto[]) => {
  const serverIndexJSTemplate = handlebars.compile(await loadTemplate('server-index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/server/index.js`,
    serverIndexJSTemplate({
      functions,
      apiBaseUrl: getApiBaseUrl(),
      apiKey: getApiKey(),
    }),
  );
};

const generateAuthFunctionJSFiles = async (functions: FunctionDefinitionDto[]) => {
  const authIndexJSTemplate = handlebars.compile(await loadTemplate('auth-index.js.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/auth/index.js`,
    authIndexJSTemplate({
      functions,
    }),
  );

  if (functions.length === 0) {
    return;
  }
  const authFunctionJSTemplate = handlebars.compile(await loadTemplate('auth-function.js.hbs'));
  functions.forEach((authFunction) => {
    fs.writeFileSync(
      `${POLY_LIB_PATH}/auth/${authFunction.context ? `${authFunction.context}-` : ''}${authFunction.name}.js`,
      prettyPrint(
        authFunctionJSTemplate({
          ...authFunction,
          apiBaseUrl: getApiBaseUrl(),
          apiKey: getApiKey(),
        }),
        'babel',
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
    .filter((key) => ['url', 'custom', 'server'].includes(contextData[key].type))
    .map((key) => contextData[key]);
  const contextDataAuthFunctions = contextDataKeys
    .filter((key) => contextData[key].type === 'auth')
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
    contextDataAuthFunctions,
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
  const contexts = await generateTSDeclarationFilesForContext(
    {
      name: '',
      path: '',
      interfaceName: 'Poly',
      fileName: 'default.d.ts',
      level: 0,
    },
    contextData,
  );

  await generateTSIndexDeclarationFile(contexts);
  await generateContextDataFile(contextData);
};

const generateTSIndexDeclarationFile = async (contexts: Context[]) => {
  const template = handlebars.compile(await loadTemplate('index.d.ts.hbs'));
  fs.writeFileSync(
    `${POLY_LIB_PATH}/index.d.ts`,
    prettyPrint(
      template({
        contexts: contexts.map((context) => ({
          ...context,
          firstLevel: context.level === 1,
        })),
      }),
    ),
  );
};

const generateTSContextDeclarationFile = async (
  context: Context,
  functions: FunctionDefinitionDto[],
  authFunctions: FunctionDefinitionDto[],
  webhookHandles: WebhookHandleDefinitionDto[],
  subContexts: Context[],
) => {
  const template = handlebars.compile(await loadTemplate('{{context}}.d.ts.hbs'));
  const returnTypeDefinitions = functions
    .filter((func) => func.returnType)
    .reduce((result, func) => `${result}${func.returnType}\n`, '');
  const functionArgumentsTypeDeclarations = functions
    .reduce(
      (result, func) => result.concat(...func.arguments.filter((arg) => arg.typeDeclarations)),
      [] as FunctionArgument[],
    )
    .reduce((result, arg) => `${result}${arg.typeDeclarations}\n`, '');
  const webhookHandlesEventTypeDefinitions = webhookHandles
    .filter((handle) => handle.eventType)
    .reduce((result, handle) => `${result}${handle.eventType}\n`, '');

  const toFunctionData = (func: FunctionDefinitionDto) => {
    const functionArguments = func.arguments
      .filter((arg) => !arg.payload)
      .map((arg) => ({
        ...arg,
        name: toCamelCase(arg.name),
      }));

    return {
      ...func,
      arguments: functionArguments,
      requiredArguments: functionArguments.filter((arg) => arg.required),
      optionalArguments: functionArguments.filter((arg) => !arg.required),
      payloadArguments: func.arguments.filter((arg) => arg.payload),
      hasPayloadArguments: func.arguments.some((arg) => arg.payload),
    };
  };
  fs.writeFileSync(
    `${POLY_LIB_PATH}/${context.fileName}`,
    prettyPrint(
      template({
        interfaceName: context.interfaceName,
        functions: functions.map(toFunctionData),
        webhookHandles,
        authFunctions,
        subContexts,
        returnTypeDefinitions,
        functionArgumentsTypeDeclarations,
        webhookHandlesEventTypeDefinitions,
      }),
    ),
  );
};

const generateContextDataFile = async (contextData: Record<string, any>) => {
  fs.writeFileSync(`${POLY_LIB_PATH}/context-data.json`, JSON.stringify(contextData, null, 2));
};

const getContextData = (functions: FunctionDefinitionDto[], webhookHandles: WebhookHandleDefinitionDto[]) => {
  const contextData = {} as Record<string, any>;

  functions.forEach((func) => {
    const path = func.context ? `${func.context}.${func.name}` : func.name;
    set(contextData, path, {
      ...func,
      name: func.name.split('.').pop(),
      arguments: func.arguments.map((arg) => ({
        ...arg,
        name: toCamelCase(arg.name),
      })),
    });
  });
  webhookHandles.forEach((handle) => {
    const path = handle.context ? `${handle.context}.${handle.name}` : handle.name;
    set(contextData, path, {
      ...handle,
      type: 'webhookHandle',
      name: handle.name.split('.').pop(),
    });
  });

  return contextData;
};

const prettyPrint = (code: string, parser = 'typescript') =>
  prettier.format(code, {
    parser,
    singleQuote: true,
    printWidth: 160,
  });

const generate = async (contexts?: string[], names?: string[], functionIds?: string[]) => {
  let functions: FunctionDefinitionDto[] = [];
  let webhookHandles: WebhookHandleDefinitionDto[] = [];

  shell.echo('-n', chalk.rgb(255, 255, 255)(`Generating Poly functions...`));

  prepareDir();
  loadConfig();

  try {
    functions = await getFunctions(contexts, names, functionIds);
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
    shell.echo(chalk.red(error.stack));
    return;
  }

  shell.echo(chalk.green('DONE'));
  shell.echo(chalk.rgb(255, 255, 255)(`\nPlease, restart your TS server to see the changes.`));
};

export default generate;
