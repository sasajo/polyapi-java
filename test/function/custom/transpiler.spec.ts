import { transpileCode } from 'function/custom/transpiler';

const myInterface = `
    interface MyInterface {
      prop1: string;
      prop2: number;
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
      const result = await transpileCode('testFunc', code);
      expect(result.args.map(arg => arg.name)).toEqual(['arg1', 'arg2', 'arg3']);
    });

    it('optional function arguments should have required: false', async () => {
      const code = `
      export function testFunc(arg1?: string, arg2: number, arg3?: boolean) {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code);
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
      const result = await transpileCode('testFunc', code);
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
      const result = await transpileCode('testFunc', code);
      expect(result.returnType).toBe('string');
    });

    it('returnType should have correct type in case function return type is interface', async () => {
      const code = `
      ${myInterface}
      export function testFunc(arg1: string): MyInterface {
        return { prop1: arg1, prop2: 42 };
      }
    `;
      const result = await transpileCode('testFunc', code);
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
      const result = await transpileCode('testFunc', code);
      expect(result.synchronous).toBe(false);
      expect(result.returnType).toBe('string'); // After removing Promise<>
    });

    it('synchronous should be set to true if return type is not a Promise', async () => {
      const code = `
      export function testFunc(arg1: string): string {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code);
      expect(result.synchronous).toBe(true);
    });

    it('synchronous should be set to false if return type is a Promise', async () => {
      const code = `
      export async function testFunc(arg1: string): Promise<string> {
        return arg1;
      }
    `;
      const result = await transpileCode('testFunc', code);
      expect(result.synchronous).toBe(false);
    });

    it('requirements should contain imported libraries', async () => {
      const code = `
      import njwt from 'njwt';
      export function testFunc(arg1: string) {
        return njwt.test(arg1);
      }
    `;
      const result = await transpileCode('testFunc', code);
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
      const result = await transpileCode('testFunc', code);
      expect(result.requirements).not.toContain('path');
      expect(result.requirements).not.toContain('fs');
    });
  });
});
