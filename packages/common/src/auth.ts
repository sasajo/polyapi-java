export class Auth {
  type: 'basic' | 'bearer' | 'apikey';
}

export class BasicAuth extends Auth {
  type: 'basic';
  basic: [
    {
      key: 'username';
      value: string;
    },
    {
      key: 'password';
      value: string;
    }
  ];
}

export class BearerAuth extends Auth {
  type: 'bearer';
  bearer: [
    {
      key: 'token';
      value: string;
    }
  ];
}

export class ApiKeyAuth extends Auth {
  type: 'apikey';
  apikey: [
    {
      key: 'in';
      value: 'header' | 'query';
    },
    {
      key: 'key';
      value: string;
    },
    {
      key: 'value';
      value: string;
    }
  ];
}
