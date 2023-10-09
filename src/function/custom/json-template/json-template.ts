export const POLY_ARG_NAME_KEY = '$polyArgName';

export type ArgumentInfo = {
    [POLY_ARG_NAME_KEY]: string;
    quoted: boolean;
}

export type TemplateValue = null | string | boolean | number | ArgumentInfo | {[key: string]: TemplateValue } | TemplateValue[];

export interface JsonTemplateInterface {
    parse(template: string): Record<string, TemplateValue> | TemplateValue[];

    render(template: string | ReturnType<JsonTemplateInterface['parse']>, args: Record<string, any>): Record<string, any> | any[];

    toTemplateString(template: ReturnType<JsonTemplateInterface['parse']>): string;
};
