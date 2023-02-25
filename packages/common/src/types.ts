export type Headers = Record<string, string>;
export type RawBody = {
  mode: 'raw';
  raw: string;
};

export type UrlencodedBody = {
  mode: 'urlencoded';
  urlencoded: {
    key: string;
    value: string;
  }[];
}

export type FormDataBody = {
  mode: 'formdata';
  formdata: {
    key: string;
    value: string;
  }[];
}

export type EmptyBody = {
  mode: 'empty';
};

export type Body = RawBody | UrlencodedBody | FormDataBody | EmptyBody;
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export type ArgumentType = 'string' | 'number' | 'boolean';
export type ReturnType = 'string' | 'number' | 'boolean' | 'object' | 'void' | 'any';
