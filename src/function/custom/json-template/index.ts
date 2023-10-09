import hls from 'highlight.js';
import { parse } from 'node-html-parser';
import { getExtendedJsonLanguage, LANGUAGE_NAME } from './extended-json-language';
import { ARGUMENT_PATTERN } from '../constants';
import { cloneDeep, isPlainObject } from 'lodash';
import { JsonTemplateInterface, TemplateValue, POLY_ARG_NAME_KEY } from './json-template';
import hljs from 'highlight.js';

export { POLY_ARG_NAME_KEY } from './json-template';

hls.registerLanguage(LANGUAGE_NAME, getExtendedJsonLanguage);

export const isTemplateArg = (value): value is ArgMetadata => typeof value[POLY_ARG_NAME_KEY] !== 'undefined';

export type ArgMetadata = {
    /**
     * Argument name
     */
    [POLY_ARG_NAME_KEY]: string;
    /**
     * If argument is surrounded by double quotes or not in template's string.
     */
    quoted: boolean;
}

/**
 * Use this when you need to parse and modify raw json from api functions.
*/
export class JsonTemplate implements JsonTemplateInterface {
  /**
   * This function replaces all arguments from raw json string for valid objects of type {@link ArgMetadata}
   * and returns a valid json object. This is useful when you need to modify something from client json string that has
   * extended syntax `{"foo": {{myArgument}}}` and you need to modify it based on some argument state.
   * @example
   * const result = new JsonTemplate().parse('{"name": {{name}}, lastName: "{{userLastName}}"}')
   * console.log(result) // { name: { $polyArgName: "name", quoted: false }, lastName: { $polyArgName: "userLastName", quoted: true }}
   */
  parse(template: string): Record<string, TemplateValue> | TemplateValue[] {
    const { value } = hls.highlight(template, {
      language: LANGUAGE_NAME,
    });

    const dom = parse(value);

    for (const node of dom.querySelectorAll('.hljs-argument')) {
      const argName = node.innerText.replace('\{\{', '').replace('\}\}', '');

      node.textContent = `{"${POLY_ARG_NAME_KEY}": "${argName}", "quoted": false}`;
    }

    for (const node of dom.querySelectorAll('.hljs-string')) {
      if (node.textContent.match(/^"\{{2}[^\{\}]+?\}{2}"$/)) {
        const argName = node.textContent.replace('{{', '').replace('}}', '').replace(/"/g, '');

        node.textContent = `{"${POLY_ARG_NAME_KEY}": "${argName}", "quoted": true}`;
      }
    }

    return JSON.parse(dom.textContent);
  }

  render(template: string | Record<string, TemplateValue> | TemplateValue[], args: Record<string, any>): any[] | Record<string, any> {
    const result = typeof template === 'string' ? this.parse(template) : cloneDeep<ReturnType<typeof this.parse>>(template);

    const isTemplateArg = (value): value is ArgMetadata => typeof value[POLY_ARG_NAME_KEY] !== 'undefined';

    const assignArgValues = (value: unknown) => {
      if ((isPlainObject as (value: any) => value is Record<string, any>)(value)) {
        if (isTemplateArg(value)) {
          const argValue = args[value.$polyArgName];

          if (!value.quoted) {
            return argValue;
          }

          /*
          Quoted arg, example: {"key": "{{myArg}}"}
          In this particular case we can consider that user wanted
          to send the arg value inside double quotes, so we respect that decision.
        */
          if (typeof argValue === 'boolean' || typeof argValue === 'number') {
            return `${argValue}`;
          }

          /*
          If user sends an object or an array (because it patched the argument after training)
          we should return it here as native object/array
        */
          return argValue;
        }
        for (const key of Object.keys(value)) {
          value[key] = assignArgValues(value[key]);
        }
        return value;
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = assignArgValues(value[i]);
        }
      }

      if (typeof value === 'string') {
        const matchedArgs = value.match(ARGUMENT_PATTERN);

        if (matchedArgs?.length) {
          let newValue = value;
          for (const argName of matchedArgs) {
            const argValue = args[argName];

            if (typeof args[argName] !== 'undefined') {
              newValue = newValue.replace(`{{${argName}}}`, argValue);
            }
          }

          return newValue;
        }
      }

      return value;
    };

    assignArgValues(result);

    return result as any;
  }

  /**
   * Reverts a parsed template to its string version.
   * @example
   * const jsonTemplate = new JsonTemplate();
   * const result = jsonTemplate.parse('{"name": {{name}}, lastName: "{{userLastName}}"}');
   * console.log(result) // { name: { $polyArgName: "name", quoted: false }, lastName: { $polyArgName: "userLastName", quoted: true }}
   * const templateString = jsonTemplate.toTemplateString(result);
   * console.log(templateString) // '{"name": {{name}}, lastName: "{{userLastName}}"}'
   */
  toTemplateString(template: Record<string, TemplateValue> | TemplateValue[], prettify = true): string {
    const { value } = hljs.highlight(JSON.stringify(template, null, prettify ? 4 : undefined), {
      language: LANGUAGE_NAME,
    });

    const dom = parse(value);

    for (const node of dom.querySelectorAll('.argument-object')) {
      const arg = (JSON.parse(node.textContent) as ArgMetadata);

      node.textContent = arg.quoted ? `"{{${arg[POLY_ARG_NAME_KEY]}}}"` : `{{${arg[POLY_ARG_NAME_KEY]}}}`;
    }

    return dom.textContent;
  }
}
