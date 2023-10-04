import fs from 'fs';
import chalk from 'chalk';
import shell from 'shelljs';
import ts from 'typescript';
import * as TJS from 'typescript-json-schema';
import { createOrUpdateServerFunction, createOrUpdateClientFunction, getSpecs } from '../api';
import { loadConfig } from '../config';
import { generateSingleCustomFunction } from './generate';
import { FunctionDetailsDto } from '@poly/model';
import { EXCLUDED_REQUIREMENTS } from '@poly/common/transpiler';

interface SchemaDef {
  schema: Record<string, any>;
  typeParameterVariations?: Record<string, string>[];
}

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

const generateTypeSchemas = (fileName: string): { [typeName: string]: any } => {
  const fileContent = fs.readFileSync(fileName, 'utf-8');
  const sourceFile = ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const program = ts.createProgram([fileName], { allowJs: true });
  const schemaDefs: { [typeName: string]: SchemaDef } = {};
  const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
  };
  const generator = TJS.buildGenerator(program, settings);

  const visitor = (node: ts.Node) => {
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText();
      const symbolRefs = generator.getSymbols(typeName);
      const isGenericType = node.typeArguments?.length > 0;
      if (!symbolRefs.length) {
        // not a reference to a type
        return;
      }

      const typeParameterVariations = schemaDefs[typeName]?.typeParameterVariations || [];

      if (isGenericType) {
        const symbolRef = symbolRefs[0];
        const typeParameters = [];

        if (typeParameters.length === 0 && symbolRef) {
          // read type parameters from declaration
          symbolRef.symbol.declarations.forEach(declaration => {
            if (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) {
              if (declaration.parent && ts.isSourceFile(declaration.parent) && declaration.parent.hasNoDefaultLib) {
                // skipping, this is a default lib
                return;
              }
              typeParameters.push(...declaration.typeParameters?.map(typeParameter => typeParameter.name.text) || []);
            }
          });
        }

        if (typeParameters.length) {
          const parameterSchemaTypes: Record<string, string> = {};

          typeParameters.forEach((typeParameter, index) => {
            const typeArgument = node.typeArguments[index];
            if (typeArgument) {
              parameterSchemaTypes[typeParameter] = typeArgument.getText();
            }
          });

          typeParameterVariations.push(parameterSchemaTypes);
        }
      }

      const schema = schemaDefs[typeName]?.schema || TJS.generateSchema(program, typeName, settings, undefined, generator);
      if (schema) {
        schemaDefs[typeName] = {
          schema,
          typeParameterVariations,
        };
      }
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(sourceFile, visitor);

  enhanceWithParameterTypeSchemas(schemaDefs);

  return extractSchemas(schemaDefs);
};

const enhanceWithParameterTypeSchemas = (schemaDefs: Record<string, SchemaDef>) => {
  Object.keys(schemaDefs)
    .forEach(typeName => {
      const schemaDef = schemaDefs[typeName];
      const typeVariations = schemaDef.typeParameterVariations;

      if (!typeVariations.length) {
        return;
      }
      typeVariations.forEach(typeVariation => {
        const typeParameters = Object.keys(typeVariation); // e.g. <T, S>
        if (!typeParameters.length) {
          return;
        }
        const parameterTypes = `${Object.values(typeVariation).join(', ')}`;
        const updatedDefinitions = {
          ...schemaDef.schema.definitions,
          ...typeParameters.reduce((acc, typeParameter) => ({
            ...acc,
            ...schemaDefs[typeVariation[typeParameter]].schema.definitions,
            [typeParameter]: {
              ...schemaDefs[typeVariation[typeParameter]].schema,
              $schema: undefined,
              definitions: undefined,
            },
          }), {}),
        };

        schemaDefs[`${typeName}<${parameterTypes}>`] = {
          schema: {
            ...schemaDef.schema,
            definitions: updatedDefinitions,
          },
        };
      });
    });
};

const extractSchemas = (schemaDefs: Record<string, SchemaDef>) => Object.keys(schemaDefs)
  .reduce((acc, typeName) => {
    return {
      ...acc,
      [typeName]: schemaDefs[typeName].schema,
    };
  }, {});

export const addOrUpdateCustomFunction = async (
  context: string | null,
  name: string,
  description: string | null,
  file: string,
  server: boolean | undefined,
) => {
  loadConfig();

  try {
    let customFunction: FunctionDetailsDto;

    const specs = await getSpecs([context], [name]);
    const functionSpec = specs.find(spec => spec.name === name && spec.context === context);
    const updating = !!functionSpec;
    if (server === undefined && updating) {
      server = functionSpec.type === 'serverFunction';
    } else {
      server = server ?? false;
    }

    const code = fs.readFileSync(file, 'utf8');

    if (server) {
      shell.echo('-n', chalk.rgb(255, 255, 255)(`${updating ? 'Updating' : 'Adding'} custom server side function...`));

      if (getDependencies(code).length) {
        shell.echo(chalk.yellow('Please note that deploying your functions will take a few minutes because it makes use of libraries other than polyapi.'));
      }

      const typeSchemas = generateTypeSchemas(file);
      // console.log(JSON.stringify(typeSchemas, null, 2));

      customFunction = await createOrUpdateServerFunction(context, name, description, code, typeSchemas);
      shell.echo(chalk.green('DEPLOYED'));

      shell.echo(chalk.rgb(255, 255, 255)(`Function ID: ${customFunction.id}`));
    } else {
      shell.echo('-n', chalk.rgb(255, 255, 255)(`${updating ? 'Updating' : 'Adding'} custom client side function...`));
      customFunction = await createOrUpdateClientFunction(context, name, description, code);
      shell.echo(chalk.green('DONE'));
      shell.echo(chalk.rgb(255, 255, 255)(`Function ID: ${customFunction.id}`));
    }

    await generateSingleCustomFunction(customFunction.id, updating);
  } catch (e) {
    shell.echo(chalk.red('ERROR\n'));
    shell.echo(`${e.response?.data?.message || e.message}`);
  }
};
