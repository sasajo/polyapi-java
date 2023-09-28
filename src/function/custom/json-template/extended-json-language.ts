import hlsLib from 'highlight.js';


export const LANGUAGE_NAME = 'extended-json';

const ARGUMENT_CLASS = 'argument';

const CUSTOM_ARGUMENT = {
  scope: 'argument',
  className: ARGUMENT_CLASS,
  begin: /\{\{/,
  end: /\}\}/,
};

/**
 * Json language definition taken from https://github.com/highlightjs/highlight.js/blob/main/src/languages/json.js
 * I've extended it adding support for arguments as values, see {@link CUSTOM_ARGUMENT}
 */
export const getExtendedJsonLanguage = (hljs: typeof hlsLib) => {
  const ATTRIBUTE = {
    className: 'attr',
    begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
    relevance: 1.01,
  };
  const PUNCTUATION = {
    match: /[{}[\],:]/,
    className: 'punctuation',
    relevance: 0,
  };
  const LITERALS = [
    'true',
    'false',
    'null',
  ];

  const LITERALS_MODE = {
    scope: 'literal',
    beginKeywords: LITERALS.join(' '),
  };

  return {
    name: 'my-custom-language',
    keywords: {
      literal: LITERALS,
    },
    contains: [
      ATTRIBUTE,
      CUSTOM_ARGUMENT, // Support for arguments.
      PUNCTUATION,
      hljs.QUOTE_STRING_MODE,
      LITERALS_MODE,
      hljs.C_NUMBER_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
    ],
    illegal: '\\S',
  };
};
