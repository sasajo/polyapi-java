import { Injectable } from '@nestjs/common';
import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import jsonpath from 'jsonpath';
import { PathError } from 'common/path-error';

@Injectable()
export class CommonService {
  public async generateContentType(typeName: string, content: any, path?: string) {
    if (!content) {
      return '';
    }

    content = this.getPathContent(content, path);

    const jsonInput = jsonInputForTargetLanguage('ts');
    await jsonInput.addSource({
      name: typeName,
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
      rendererOptions: {
        'just-types': 'true',
      },
    });

    return lines
      .map(line => line.replace('content: Content', `content: ${typeName}Content`))
      .map(line => line.replace('export interface', 'interface'))
      .map(line => line.replace('interface Content', `interface ${typeName}Content`))
      .join('\n');
  }

  public getPathContent(response: any, path: string | null): unknown {
    if (!path) {
      return response;
    }

    try {
      const result = jsonpath.query(response, path);
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
}
