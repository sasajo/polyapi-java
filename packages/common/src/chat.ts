export type ChatText = {
  type: TextType;
  value: string;
};

type TextType = 'plain' | 'js' | 'markdown';
