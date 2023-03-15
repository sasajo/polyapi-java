export class Auth {
  type: 'basic' | 'bearer';
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
