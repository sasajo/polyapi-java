import { Injectable } from '@nestjs/common';
import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import jsonpath from 'jsonpath';
import { PathError } from './path-error';

@Injectable()
export class CommonService {
  public async generateTypeDeclaration(typeName: string, content: any, namespace: string) {
    const wrapToNamespace = (code: string) => `namespace ${namespace} {\n  ${code}\n};`;

    if (!content) {
      return wrapToNamespace(`type ${typeName} = any;`);
    }

    const name = 'TemporaryUniqueHardToGuessType';
    const jsonInput = jsonInputForTargetLanguage('ts');
    await jsonInput.addSource({
      name,
      samples: [JSON.stringify({
        content,
      })],
    });
    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const { lines } = await quicktype({
      lang: 'ts',
      inputData,
      combineClasses: true,
      indentation: '  ',
      rendererOptions: {
        'just-types': 'true',
      },
    });

    const temporaryTypeRegex = new RegExp(`interface ${name}\\s*\{\\s*content: (\\S+);\\s*\}\\s*`, 'g');
    let typeDeclaration = lines
      .map(line => line.replaceAll('export interface', 'interface'))
      .map(line => line.replace('interface Content', `interface ${typeName}`))
      .join('\n');

    const match = temporaryTypeRegex.exec(typeDeclaration);
    if (match) {
      const [temporaryType, type] = match;
      if (type === 'Content') {
        typeDeclaration = typeDeclaration.replace(temporaryType, '');
      } else {
        typeDeclaration = typeDeclaration.replace(temporaryType, `type ${typeName} = ${type};`);
      }
    }

    return wrapToNamespace(typeDeclaration);
  }

  public getPathContent(content: any, path: string | null): unknown {
    if (!path) {
      return content;
    }

    try {
      const result = jsonpath.query(content, path);
      if (path.includes('[*]')) {
        return result;
      } else if (result.length === 0) {
        return null;
      } else {
        return result[0];
      }
    } catch (e) {
      throw new PathError(path);
    }
  }

  public async resolveType(typeName: string, namespace: string, value: string): Promise<[string, string?]> {
    const numberRegex = /^-?\d+\.?\d*$/;
    const booleanRegex = /^(true|false)$/;

    if (numberRegex.test(value)) {
      return ['number'];
    }
    if (booleanRegex.test(value)) {
      return ['boolean'];
    }
    try {
      const obj = JSON.parse(value);
      if (obj && typeof obj === 'object') {
        const type = await this.generateTypeDeclaration(typeName, obj, namespace);
        return [`${namespace}.${typeName}`, type];
      }
    } catch (e) {
      // not json
    }

    return ['string'];
  }

  public trimDownObject(obj: any, maxArrayItems = 1): any {
    if (typeof obj !== 'object') {
      return obj;
    }

    const trimDownArray = (array: any[]) => array.slice(0, maxArrayItems).map((item: any) => this.trimDownObject(item, maxArrayItems));

    if (Array.isArray(obj)) {
      return trimDownArray(obj);
    }

    const newObj = {};
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        newObj[key] = trimDownArray(obj[key]);
      } else {
        newObj[key] = this.trimDownObject(obj[key], maxArrayItems);
      }
    }
    return newObj;
  }
}
