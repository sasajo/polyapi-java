export const POLY_ARG_NAME_KEY = '$polyArgName';

export type ArgMetadata = {
    [POLY_ARG_NAME_KEY]: string;
    quoted: boolean;
}

export type TemplateValue = null | string | boolean | number | ArgMetadata | {[key: string]: TemplateValue } | TemplateValue[];

export interface JsonTemplateProcessor {
    /**
   * This function replaces all value arguments from raw json string for valid objects of type {@link ArgMetadata}
   * and returns a valid json object or a string If {@link getStringVersion} is true. This is useful when you need to modify something from client json string that has
   * extended syntax `{"foo": {{myArgument}}}` based on some argument state.
   * Notice if you set {@link getStringVersion} to true and json string contains comments, comments won't be removed.
   * @example
   * let result = new JsonTemplateProcessor().parse('{"name": {{name}}, lastName: "{{userLastName}}"}')
   * console.log(result) // { name: { $polyArgName: "name", quoted: false }, lastName: { $polyArgName: "userLastName", quoted: true }}
   * console.log(typeof result === 'string'); // false
   * result - new JsonTemplateProcessor().parse('{"name": {{name}} // The name, lastName: "{{userLastName}}"}', true);
   * console.log(result) // "{ name: { $polyArgName: "name", quoted: false } // The name, lastName: { $polyArgName: "userLastName", quoted: true }}"
   * console.log(typeof result === 'string'); // true
   */
    parse(template: string, getStringVersion: true): string;
    parse(template: string): Record<string, TemplateValue> | TemplateValue[];
    parse(template: string, returnString: boolean): Record<string, TemplateValue> | TemplateValue[] | string;

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
};
