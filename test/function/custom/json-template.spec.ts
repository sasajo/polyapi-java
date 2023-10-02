import { getMetadataTemplateObject, mergeArgumentsInTemplateObject, POLY_ARG_NAME_KEY } from 'function/custom/json-template';

describe('json-template', () => {
  describe('getMetadataTemplateObject', () => {
    it('Should get same object structure replacing arguments by `ArgMetadata` object.', () => {
      const result = getMetadataTemplateObject(`
            {
                "name": {{name}},
                "lastName": "{{lastName}}",
                "list": [
                    {{title}},
                    2,
                    "3",
                    null,
                    false
                ]
            }
      `);

      expect(result).toStrictEqual({
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: false,
        },
        lastName: {
          [POLY_ARG_NAME_KEY]: 'lastName',
          quoted: true,
        },
        list: [
          {
            [POLY_ARG_NAME_KEY]: 'title',
            quoted: false,
          },
          2,
          '3',
          null,
          false,
        ],
      });
    });

    it('Should support duplicated arguments.', () => {
      const result = getMetadataTemplateObject(`
            {
                "name": {{name}},
                "lastName": "{{name}}",
                "list": [
                    "{{item}}",
                    {{item}}
                ]
            }
      `);

      expect(result).toStrictEqual({
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: false,
        },
        lastName: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: true,
        },
        list: [
          {
            [POLY_ARG_NAME_KEY]: 'item',
            quoted: true,
          },
          {
            [POLY_ARG_NAME_KEY]: 'item',
            quoted: false,
          },
        ],
      });
    });

    it('Should not transform arguments concatenated with other string content', () => {
      const result = getMetadataTemplateObject(`
            {
                "name": "The name is {{name}}"
            }
        `);

      expect(result).toStrictEqual({
        name: 'The name is {{name}}',
      });
    });
  });

  describe('mergeArgumentsInTemplateObject', () => {
    it('Should be able to send an object inside a double quoted arg.', () => {
      const templateObject = {
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: true,
        },
        keywords: [
          {
            [POLY_ARG_NAME_KEY]: 'firstTag',
            quoted: true,
          },
        ],
      };

      const result = mergeArgumentsInTemplateObject(
        templateObject,
        {
          name: 'foo',
          firstTag: 'typescript',
        },
      );

      expect(result).toStrictEqual({
        name: 'foo',
        keywords: ['typescript'],
      });
    });

    it('Should be able to send a string inside a non-quoted arg.', () => {
      const templateObject = {
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: false,
        },
        keywords: [
          {
            [POLY_ARG_NAME_KEY]: 'firstTag',
            quoted: false,
          },
        ],
      };

      const result = mergeArgumentsInTemplateObject(
        templateObject,
        {
          name: 'foo',
          firstTag: 'typescript',
        },
      );

      expect(result).toStrictEqual({
        name: 'foo',
        keywords: ['typescript'],
      });
    });

    it('Should be able to send an string containing double quotes through a quoted arg.', () => {
      const templateObject = {
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: true,
        },
        keywords: [
          {
            [POLY_ARG_NAME_KEY]: 'firstTag',
            quoted: true,
          },
        ],
      };

      const result = mergeArgumentsInTemplateObject(
        templateObject,
        {
          name: '"foo"',
          firstTag: '"typescript"',
        },
      );

      expect(result).toStrictEqual({
        name: '"foo"',
        keywords: ['"typescript"'],
      });
    });

    it('Should be able to send an object in a double quoted arg.', () => {
      const templateObject = {
        name: {
          [POLY_ARG_NAME_KEY]: 'name',
          quoted: true,
        },
        keywords: [
          {
            [POLY_ARG_NAME_KEY]: 'firstTag',
            quoted: true,
          },
        ],
      };

      const result = mergeArgumentsInTemplateObject(
        templateObject,
        {
          name: { foo: 'bar' },
          firstTag: { foo: 'bar' },
        },
      );

      expect(result).toStrictEqual({
        name: { foo: 'bar' },
        keywords: [{ foo: 'bar' }],
      });
    });

    it('Should respect all json data types', () => {
      const templateObject = {
        name: 'bar',
        lastName: null,
        boolean: false,
        boolean2: true,
        data: {
          list: [1, false, null, 'lorem ipsum'],
          innerData: {
            name: 'bar',
            lastName: null,
          },
        },
        list: [1, false, null, 'lorem ipsum'],
      };

      const result = mergeArgumentsInTemplateObject(
        templateObject,
        {
          name: { foo: 'bar' },
          firstTag: { foo: 'bar' },
        },
      );

      expect(result).toStrictEqual(templateObject);
    });
  });
});
