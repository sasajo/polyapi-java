import { Injectable, Logger } from '@nestjs/common';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  AuthFunctionSpecification,
  AuthProviderDto,
  PropertySpecification,
  PropertyType,
  SpecificationType,
} from '@poly/common';

@Injectable()
export class AuthProviderService {
  private logger = new Logger(AuthProviderService.name);

  constructor(private readonly prisma: PrismaService) {
  }

  async getAuthProviders(user: User) {
    return this.prisma.authProvider.findMany({
      where: {
        userId: user.id,
      },
    });
  }

  async getAuthProvider(user: User, id: string): Promise<AuthProvider | null> {
    return this.prisma.authProvider.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
  }

  createAuthProvider(user: User, context: string, authorizeUrl: string, tokenUrl: string, revokeUrl: string | null, introspectUrl: string | null, audienceRequired: boolean) {
    this.logger.debug(`Creating auth provider for user ${user.id} with context ${context} and authorizeUrl ${authorizeUrl}`);
    return this.prisma.authProvider.create({
      data: {
        context,
        authorizeUrl,
        tokenUrl,
        revokeUrl,
        introspectUrl,
        audienceRequired,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  updateAuthProvider(user: User, authProvider: AuthProvider, context: string, authorizeUrl: string, tokenUrl: string, revokeUrl: string | null, introspectUrl: string | null, audienceRequired: boolean) {
    this.logger.debug(`Updating auth provider ${authProvider.id} for user ${user.id}`);
    return this.prisma.authProvider.update({
      where: {
        id: authProvider.id,
      },
      data: {
        context,
        authorizeUrl,
        tokenUrl,
        revokeUrl,
        introspectUrl,
        audienceRequired,
      },
    });
  }

  async deleteAuthProvider(user, authProvider: AuthProvider) {
    this.logger.debug(`Deleting auth provider ${authProvider.id} for user ${user.id}`);
    return this.prisma.authProvider.delete({
      where: {
        id: authProvider.id,
      },
    });
  }

  toAuthProviderDto(authProvider: AuthProvider): AuthProviderDto {
    return {
      id: authProvider.id,
      context: authProvider.context,
      authorizeUrl: authProvider.authorizeUrl,
      tokenUrl: authProvider.tokenUrl,
      audienceRequired: authProvider.audienceRequired,
      revokeUrl: authProvider.revokeUrl,
      introspectUrl: authProvider.introspectUrl,
    };
  }

  // private getAuthFunctionCallbackUrl(authFunction: AuthFunction) {
  //   return `${this.config.hostUrl}/functions/auth/${authFunction.publicId}/callback`;
  // }
  // public async executeAuthFunction(user: User, authFunction: AuthFunction, eventsClientId: string, clientId: string, clientSecret: string, audience: string | null, scopes: string[], callbackUrl: string | null): Promise<ExecuteAuthFunctionResponseDto> {
  //   await this.prisma.authToken.deleteMany({
  //     where: {
  //       authFunction: {
  //         id: authFunction.id,
  //       },
  //       user: {
  //         id: user.id,
  //       },
  //       clientId,
  //       clientSecret,
  //     },
  //   });
  //
  //   const state = crypto.randomBytes(20).toString('hex');
  //   const authToken = await this.prisma.authToken.create({
  //     data: {
  //       user: {
  //         connect: {
  //           id: user.id,
  //         },
  //       },
  //       authFunction: {
  //         connect: {
  //           id: authFunction.id,
  //         },
  //       },
  //       clientId,
  //       clientSecret,
  //       audience,
  //       scopes: scopes.join(' '),
  //       state,
  //       callbackUrl,
  //       eventsClientId,
  //     },
  //   });
  //
  //   return {
  //     url: this.getAuthFunctionAuthorizationUrl(authFunction, authToken),
  //   };
  // }
  //
  // private getAuthFunctionAuthorizationUrl(authFunction: AuthFunction, authToken: AuthToken) {
  //   const params = new URLSearchParams({
  //     client_id: authToken.clientId,
  //     redirect_uri: this.getAuthFunctionCallbackUrl(authFunction),
  //     response_type: 'code',
  //     state: authToken.state,
  //   });
  //
  //   if (authToken.scopes) {
  //     params.append('scope', authToken.scopes);
  //   }
  //   if (authToken.audience) {
  //     params.append('audience', authToken.audience);
  //   }
  //
  //   return `${authFunction.authUrl}?${params.toString()}`;
  // }
  //
  // async processAuthFunctionCallback(publicId: string, query: any): Promise<string | null> {
  //   const { state, error, code } = query;
  //   if (!state) {
  //     this.logger.error('Missing state for auth function callback');
  //     throw new HttpException('Missing state', HttpStatus.BAD_REQUEST);
  //   }
  //
  //   let authToken = await this.prisma.authToken.findFirst({
  //     where: {
  //       state,
  //     },
  //   });
  //   if (!authToken) {
  //     this.logger.error(`Cannot find auth token for state: ${state}`);
  //     throw new HttpException('Invalid state', HttpStatus.BAD_REQUEST);
  //   }
  //
  //   const authFunction = await this.prisma.authFunction.findFirst({
  //     where: {
  //       publicId,
  //     },
  //   });
  //   if (!authFunction) {
  //     this.logger.error(`Cannot find auth function for publicId: ${publicId}`);
  //     throw new HttpException('Invalid publicId', HttpStatus.BAD_REQUEST);
  //   }
  //
  //   if (error) {
  //     this.logger.debug(`Auth function callback error: ${error}`);
  //     this.eventService.sendAuthFunctionEvent(publicId, {
  //       error,
  //     });
  //     return null;
  //   }
  //
  //   if (!code) {
  //     this.logger.error('Missing code for auth function callback');
  //     throw new HttpException('Missing code', HttpStatus.BAD_REQUEST);
  //   }
  //
  //   const tokenData = await lastValueFrom(
  //     this.httpService
  //       .request({
  //         url: authFunction.accessTokenUrl,
  //         method: 'POST',
  //         headers: {
  //           'Accept': 'application/json',
  //           'Content-Type': 'application/x-www-form-urlencoded',
  //         },
  //         data: {
  //           code,
  //           client_id: authToken.clientId,
  //           client_secret: authToken.clientSecret,
  //           audience: authToken.audience,
  //           grant_type: 'authorization_code',
  //           redirect_uri: this.getAuthFunctionCallbackUrl(authFunction),
  //         },
  //       })
  //       .pipe(
  //         map((response) => response.data),
  //       )
  //       .pipe(
  //         catchError((error: AxiosError) => {
  //           this.logger.error(`Error while performing token request for auth function (id: ${authFunction.id}): ${error}`);
  //
  //           this.eventService.sendAuthFunctionEvent(publicId, {
  //             url: this.getAuthFunctionAuthorizationUrl(authFunction, authToken),
  //             error: error.response ? error.response.data : error.message,
  //           });
  //
  //           return of(null);
  //         }),
  //       ),
  //   );
  //   if (!tokenData) {
  //     return null;
  //   }
  //
  //   this.logger.debug(`Received token data for auth function ${authFunction.id}: ${JSON.stringify(tokenData)}`);
  //
  //   authToken = await this.prisma.authToken.update({
  //     where: {
  //       id: authToken.id,
  //     },
  //     data: {
  //       accessToken: tokenData.access_token,
  //       refreshToken: tokenData.refresh_token,
  //       state: crypto.randomBytes(20).toString('hex'),
  //     },
  //   });
  //
  //   this.eventService.sendAuthFunctionEvent(publicId, {
  //     token: tokenData.access_token,
  //     url: this.getAuthFunctionAuthorizationUrl(authFunction, authToken),
  //   });
  //
  //   return authToken.callbackUrl;
  // }
  //
  // async revokeAuthFunction(user: User, authFunction: AuthFunction, clientId: string, clientSecret: string) {
  //   this.logger.debug(`Revoking auth function ${authFunction.id}...`);
  //   const authToken = await this.prisma.authToken.findFirst({
  //     where: {
  //       authFunction: {
  //         id: authFunction.id,
  //       },
  //       user: {
  //         id: user.id,
  //       },
  //       clientId,
  //       clientSecret,
  //     },
  //   });
  //   if (authToken) {
  //     await this.prisma.authToken.delete({
  //       where: {
  //         id: authToken.id,
  //       },
  //     });
  //   }
  //
  //   if (!authFunction.revokeUrl) {
  //     return;
  //   }
  //   if (!authToken?.accessToken) {
  //     this.logger.debug(`No auth token found for auth function ${authFunction.id}`);
  //     return;
  //   }
  //   await this.httpService
  //     .request({
  //       url: authFunction.revokeUrl,
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       data: {
  //         client_id: clientId,
  //         client_secret: clientSecret,
  //         token: authToken.accessToken,
  //       },
  //     })
  //     .pipe(
  //       catchError((error: AxiosError) => {
  //         this.logger.error(`Error while performing token revoke for auth function (id: ${authFunction.id}): ${error}`);
  //         return of(null);
  //       }),
  //     );
  // }
  //

  async toAuthFunctionSpecifications(authProvider: AuthProvider): Promise<AuthFunctionSpecification[]> {
    const specifications: AuthFunctionSpecification[] = [];

    specifications.push({
      type: 'authFunction',
      id: authProvider.id,
      context: authProvider.context,
      name: 'getToken',
      function: {
        arguments: this.getGetTokenFunctionArguments(authProvider),
        returnType: {
          kind: 'void',
        },
      },
    });
    if (authProvider.introspectUrl) {
      specifications.push({
        type: 'authFunction',
        id: authProvider.id,
        context: authProvider.context,
        name: 'introspectToken',
        function: {
          arguments: [{
            name: 'token',
            required: true,
            type: {
              kind: 'primitive',
              type: 'string',
            },
          }],
          returnType: {
            kind: 'object',
          },
        },
        subResource: 'introspect',
      });
    }
    if (authProvider.revokeUrl) {
      specifications.push({
        type: 'authFunction',
        id: authProvider.id,
        context: authProvider.context,
        name: 'revokeToken',
        function: {
          arguments: [{
            name: 'token',
            required: true,
            type: {
              kind: 'primitive',
              type: 'string',
            },
          }],
          returnType: {
            kind: 'void',
          },
        },
        subResource: 'revoke',
      });
    }

    return specifications;
  }

  private getGetTokenFunctionArguments(authProvider: AuthProvider): PropertySpecification[] {
    return [
      {
        name: 'clientId',
        required: true,
        type: {
          kind: 'primitive',
          type: 'string',
        },
      },
      {
        name: 'clientSecret',
        required: true,
        type: {
          kind: 'primitive',
          type: 'string',
        },
      },
      authProvider.audienceRequired
        ? {
          name: 'audience',
          required: true,
          type: {
            kind: 'primitive',
            type: 'string',
          },
        }
        : undefined,
      {
        name: 'scopes',
        required: true,
        type: {
          kind: 'array',
          items: {
            kind: 'primitive',
            type: 'string',
          },
        },
      },
      {
        name: 'callback',
        required: true,
        type: {
          kind: 'function',
          name: 'AuthFunctionCallback',
          spec: {
            arguments: [
              {
                name: 'token',
                required: false,
                nullable: true,
                type: {
                  kind: 'primitive',
                  type: 'string',
                },
              },
              {
                name: 'url',
                required: false,
                type: {
                  kind: 'primitive',
                  type: 'string',
                },
              },
              {
                name: 'error',
                required: false,
                nullable: true,
                type: {
                  kind: 'primitive',
                  type: 'object',
                },
              },
            ],
            returnType: {
              kind: 'void',
            },
            synchronous: true,
          },
        },
      },
      {
        name: 'options',
        required: false,
        type: {
          kind: 'object',
          properties: [
            {
              name: 'callbackUrl',
              required: false,
              type: {
                kind: 'primitive',
                type: 'string',
              },
            },
            {
              name: 'timeout',
              required: false,
              type: {
                kind: 'primitive',
                type: 'number',
              },
            },
            {
              name: 'audience',
              required: false,
              type: {
                kind: 'primitive',
                type: 'string',
              },
            },
          ],
        },
      },
    ].filter(Boolean) as PropertySpecification[];
  }
}
