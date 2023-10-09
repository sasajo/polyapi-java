import { transpileCode } from 'function/custom/transpiler';

const myInterface = `
    interface MyInterface {
      prop1: string;
      prop2: number;
    }
  `;

const myEnum = `
    enum Colors {
      Red = 'red',
      Green = 'green',
      Blue = 'blue'
    }
  `;

const myClass = `
    class MyClass {
      prop1: string;
      prop2: number;

      constructor(prop1: string, prop2: number) {
        this.prop1 = prop1;
        this.prop2 = prop2;  
      }
    }
  `;

describe('transpiler', () => {
  describe('transpileCode', () => {
    jest.setTimeout(30000);

    it('args should contain all function arguments', async () => {
      const code = `
      export function testFunc(arg1: string, arg2: number, arg3: boolean) {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.args.map(arg => arg.name)).toEqual(['arg1', 'arg2', 'arg3']);
    });

    it('optional function arguments should have required: false', async () => {
      const code = `
      export function testFunc(arg1?: string, arg2: number, arg3?: boolean) {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.args.find(arg => arg.name === 'arg1')?.required).toBe(false);
      expect(result.args.find(arg => arg.name === 'arg2')?.required).not.toBeDefined();
      expect(result.args.find(arg => arg.name === 'arg3')?.required).toBe(false);
    });

    it('typeSchema should be set correctly for args when function argument uses interface', async () => {
      const code = `
      ${myInterface}
      export function testFunc(arg1: MyInterface) {
        return arg1.prop1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.args[0].type).toBe('MyInterface');
      expect(result.args[0].typeSchema).toBeDefined();
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({ type: 'object', properties: { prop1: { type: 'string' }, prop2: { type: 'number' } } });
    });

    it('returnType should have the correct type', async () => {
      const code = `
      export function testFunc(arg1: string): string {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.returnType).toBe('string');
    });

    it('returnType should have correct type in case function return type is interface', async () => {
      const code = `
      ${myInterface}
      export function testFunc(arg1: string): MyInterface {
        return { prop1: arg1, prop2: 42 };
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(JSON.parse(result.returnType)).toMatchObject({ type: 'object', properties: { prop1: { type: 'string' }, prop2: { type: 'number' } } });
    });

    it('synchronous should be set to false and returnType should be correct if return type is Promise', async () => {
      const code = `
      export function testFunc(arg1: string): Promise<string> {
        return new Promise((resolve, reject) => {
          resolve(arg1);
        });
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.synchronous).toBe(false);
      expect(result.returnType).toBe('string'); // After removing Promise<>
    });

    it('synchronous should be set to true if return type is not a Promise', async () => {
      const code = `
      export function testFunc(arg1: string): string {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.synchronous).toBe(true);
    });

    it('synchronous should be set to false if return type is a Promise', async () => {
      const code = `
      export async function testFunc(arg1: string): Promise<string> {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.synchronous).toBe(false);
    });

    it('requirements should contain imported libraries', async () => {
      const code = `
      import njwt from 'njwt';
      export function testFunc(arg1: string) {
        return njwt.test(arg1);
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.requirements).toContain('njwt');
    });

    it('requirements should not contain excluded libraries', async () => {
      const code = `
      import path from 'path';
      import fs from 'fs';
      export function testFunc(arg1: string) {
        return path.basename(arg1);
      }
    `;
      const result = await transpileCode('testFunc', code, {});
      expect(result.requirements).not.toContain('path');
      expect(result.requirements).not.toContain('fs');
    });

    it('should handle enum types correctly', async () => {
      const code = `
        ${myEnum}
        export function testFunc(color: Colors) {
          return color; 
        }
      `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('Colors');
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({
        type: 'string',
        enum: ['blue', 'green', 'red'],
      });
    });

    it('should handle array types correctly', async () => {
      const code = `
        export function testFunc(items: string[]) {
          return items[0];
        }
      `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('string[]');
      expect(result.args[0].typeSchema).toBeUndefined();
    });

    it('should handle arrays of interfaces', async () => {
      const code = `
        ${myInterface}
        export function testFunc(items: MyInterface[]) {
          return items[0].prop1; 
        }
      `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('MyInterface[]');
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prop1: { type: 'string' },
            prop2: { type: 'number' },
          },
        },
      });
    });

    it('should handle arrays of enums', async () => {
      const code = `
        ${myEnum}
        export function testFunc(colors: Colors[]) {
          return colors[0];
        }
      `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('Colors[]');
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({
        type: 'array',
        items: {
          type: 'string',
          enum: ['blue', 'green', 'red'],
        },
      });
    });

    it('should handle class types correctly', async () => {
      const code = `
        ${myClass}
        export function testFunc(obj: MyClass) {
          return obj.prop1;
        }
      `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('MyClass');
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({
        type: 'object',
        properties: {
          prop1: { type: 'string' },
          prop2: { type: 'number' },
        },
      });
    });

    it('should handle class array types', async () => {
      const code = `
      ${myClass}
      export function testFunc(items: MyClass[]) {
        return items[0].prop1;
      }
    `;

      const result = await transpileCode('testFunc', code, {});

      expect(result.args[0].type).toBe('MyClass[]');
      expect(JSON.parse(result.args[0].typeSchema!)).toMatchObject({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prop1: { type: 'string' },
            prop2: { type: 'number' },
          },
        },
      });
    });
  });
});
