import { IsString, IsIn, ValidateIf, IsOptional, ValidateNested, IsArray, ArrayMaxSize, ArrayMinSize, ArrayUnique, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { Record } from '../../validators';
import { HTTP_METHODS } from '../../utils';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

class UpdateSourceEntry {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    value: string;
}

export class UpdateSourceNullableEntry {
    @IsString()
    key: string;

    @ValidateIf((object, value) => value !== null)
    @IsString()
    value: string | null;
}

class Body {
    @ApiProperty({
      name: 'mode',
    })
    @IsString()
    @IsIn(['urlencoded', 'formdata', 'raw', 'empty'])
    mode: 'urlencoded' | 'formdata' | 'raw' | 'empty';
}

class EmptyBody extends Body {
    @ApiProperty({
      enum: ['empty'],
    })
    @IsString()
    mode: 'empty';
}

class RawBody extends Body {
    @IsString()
    @ApiProperty({
      enum: ['raw'],
    })
    mode: 'raw';

    @IsObject()
    @ApiProperty()
    raw: Record<string, any>;
}

class UrlEncodedBody extends Body {
    @IsString()
    @ApiProperty({
      enum: ['urlencoded'],
    })
    mode: 'urlencoded';

    @ApiProperty({
      type: 'object',
      additionalProperties: {
        type: 'string',
        nullable: true,
      },
    })
    @Record({
      nullable: true,
      type: 'string',
    })
    urlencoded: Record<string, string | null>;
}

class FormDataBody extends Body {
    @IsString()
    @ApiProperty({
      enum: ['formdata'],
    })
    mode: 'formdata';

    @ApiProperty({
      type: 'object',
      additionalProperties: {
        type: 'string',
        nullable: true,
      },
    })
    @Record({
      nullable: true,
      type: 'string',
    })
    formdata: Record<string, string | null>;
}

export class UpdateAuth {
    @IsString()
    @IsIn(['basic', 'bearer', 'apikey', 'noauth'])
    type: 'basic' | 'bearer' | 'apikey' | 'noauth';
}

class BasicAuthEntries {
    @ApiProperty({
      enum: ['username', 'password'],
    })
    @IsString()
    @IsIn(['username', 'password'])
    key: 'username' | 'password';

    @ApiProperty()
    @IsString()
    value: string;
}

class BasicAuth extends UpdateAuth {
    @ApiProperty({
      enum: ['basic'],
    })
    @IsString()
    type: 'basic';

    @ApiProperty({
      type: 'array',
      items: {
        $ref: getSchemaPath(BasicAuthEntries),
      },
      uniqueItems: true,
      minimum: 2,
      maximum: 2,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMaxSize(2)
    @ArrayMinSize(2)
    @Type(() => BasicAuthEntries)
    @ArrayUnique(o => o.key)
    basic: BasicAuthEntries[];
}

class ApiKeyAuth extends UpdateAuth {
    @ApiProperty({
      enum: ['apikey'],
    })
    @IsString()
    type: 'apikey';

    @ApiProperty({
      type: 'array',
      items: {
        $ref: getSchemaPath(UpdateSourceEntry),
      },
      uniqueItems: true,
      minimum: 3,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSourceEntry)
    @ArrayUnique(o => o.key)
    @ArrayMinSize(3)
    apikey: UpdateSourceEntry[];
}

class BearerAuth extends UpdateAuth {
    @ApiProperty({
      enum: ['bearer'],
    })
    @IsString()
    type: 'bearer';

    @ApiProperty()
    @IsString()
    bearer: string;
}

class NoAuth extends UpdateAuth {
  @ApiProperty({
    enum: ['noauth'],
  })
  @IsString()
  type: 'noauth';
}

@ApiExtraModels(UrlEncodedBody, FormDataBody, RawBody, EmptyBody, BasicAuth, BearerAuth, ApiKeyAuth, NoAuth, BasicAuthEntries, UpdateSourceEntry)
export class UpdateSourceFunctionDto {
    @ApiProperty({
      name: 'url',
      required: false,
    })
    @IsOptional()
    @IsString()
    url?: string;

    @ApiProperty({
      name: 'method',
      enum: HTTP_METHODS,
      required: false,
    })
    @IsOptional()
    @IsIn(HTTP_METHODS)
    method?: string;

    @ApiProperty({
      name: 'headers',
      description: 'Set headers values through strings. Provide `null` to remove a header.',
      type: 'object',
      additionalProperties: {
        type: 'string',
        nullable: true,
      },
      example: {
        'X-My-Custom-Header': null,
        'X-Page': '{{page}}',
      },
      required: false,
    })
    @IsOptional()
    @Record({
      nullable: true,
      type: 'string',
    })
    headers?: Record<string, string | null>;

    @ApiProperty({
      name: 'auth',
      required: false,
      oneOf: [
        {
          $ref: getSchemaPath(BasicAuth),
        }, {
          $ref: getSchemaPath(BearerAuth),
        },
        {
          $ref: getSchemaPath(ApiKeyAuth),
        },
        {
          $ref: getSchemaPath(NoAuth),
        },
      ],
    })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateAuth, {
      keepDiscriminatorProperty: true,
      discriminator: {
        property: 'type',
        subTypes: [
          {
            value: BasicAuth,
            name: 'basic',
          }, {
            value: BearerAuth,
            name: 'bearer',
          }, {
            value: ApiKeyAuth,
            name: 'apikey',
          }, {
            value: NoAuth,
            name: 'noauth',
          },
        ],
      },
    })
    auth?: BasicAuth | BearerAuth | ApiKeyAuth | NoAuth;

    @ApiProperty({
      name: 'body',
      required: false,
      oneOf: [
        {
          $ref: getSchemaPath(UrlEncodedBody),
        }, {
          $ref: getSchemaPath(FormDataBody),
        },
        {
          $ref: getSchemaPath(RawBody),
        },
        {
          $ref: getSchemaPath(EmptyBody),
        },
      ],
    })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => Body, {
      keepDiscriminatorProperty: true,
      discriminator: {
        property: 'mode',
        subTypes: [
          {
            value: UrlEncodedBody,
            name: 'urlencoded',
          }, {
            value: FormDataBody,
            name: 'formdata',
          }, {
            value: RawBody,
            name: 'raw',
          }, {
            value: EmptyBody,
            name: 'empty',
          }, {
            value: NoAuth,
            name: 'noauth',
          },
        ],
      },
    })
    body?: UrlEncodedBody | FormDataBody | RawBody | EmptyBody;
}
