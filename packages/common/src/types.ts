export type Headers = Record<string, string>;
export type Body = Record<string, unknown>;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export type ArgumentType = 'string' | 'number' | 'boolean';
export type ReturnType = 'string' | 'number' | 'boolean' | 'object' | 'void';
