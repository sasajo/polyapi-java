export const POLY_ARG_NAME_KEY = '$polyArgName';

export type ArgMetadata = {
    [POLY_ARG_NAME_KEY]: string;
    quoted: boolean;
}

export type TemplateValue = null | string | boolean | number | ArgMetadata | {[key: string]: TemplateValue } | TemplateValue[];

export interface JsonTemplateProcessor {
    /**
   * This function replaces all value arguments from raw json string for valid objects of type {@link ArgMetadata}
   * and returns a valid json object..
   * @example
   * let result = new JsonTemplateProcessor().parse('{"name": {{name}}, lastName: "{{userLastName}}"}')
   * console.log(result) // { name: { $polyArgName: "name", quoted: false }, lastName: { $polyArgName: "userLastName", quoted: true }}
   */
    parse(template: string): Record<string, TemplateValue> | TemplateValue[];

    render(template: string | ReturnType<JsonTemplateProcessor['parse']>, args: Record<string, any>): Record<string, any> | any[];

    /**
   * Converts a parsed template to its string version.
   * @example
   * const jsonTemplate = new JsonTemplateProcessor();
   * const result = jsonTemplate.parse('{"name": {{name}}, lastName: "{{userLastName}}"}');
   * console.log(result) // { name: { $polyArgName: "name", quoted: false }, lastName: { $polyArgName: "userLastName", quoted: true }}
   * const templateString = jsonTemplate.toTemplateString(result);
   * console.log(templateString) // '{"name": {{name}}, lastName: "{{userLastName}}"}'
   */
    toTemplateString(template: string): string;
    toTemplateString(template: Record<string, any>, prettify?: boolean): string;

    /**
     * Filter json comments from json template.
     */
    filterComments(template: string): string;
};
