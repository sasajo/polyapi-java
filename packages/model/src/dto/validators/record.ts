import { ValidationOptions, registerDecorator } from 'class-validator';
import { isPlainObject } from 'lodash';

import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export type RecordValidationOpts = {
  type?: 'string',
  nullable?: boolean,
  apiProperty?: ApiPropertyOptions,
}

@ValidatorConstraint({
  name: 'Record',
  async: false,
})
class RecordConstraint implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments) {
    const [opts] = (validationArguments.constraints) as RecordValidationOpts[];

    if (!isPlainObject(value)) {
      return false;
    }

    return !Object.values(value).some(currentValue => {
      if (opts.nullable && currentValue === null) {
        return false;
      }

      if (opts.type === 'string') {
        return typeof currentValue !== 'string';
      }

      return false;
    });
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    const [
      {
        type,
      },
    ] = validationArguments?.constraints as RecordValidationOpts[];

    return `$property must be a Record whose values should be of type ${type}`;
  }
}

/**
 * Intended to validate Records on JSON structures, for that reason you only have to provide value type and not index type
 * since in JSON all indexes will be string.
 */
export const Record = ({
  nullable = false,
  apiProperty = {
    required: true,
  },
  type = 'string',
}: RecordValidationOpts = {
  nullable: false,
  type: 'string',
  apiProperty: {
    required: true,
  },
}, validationOptions?: ValidationOptions) => {
  return applyDecorators(function (object: any, propertyName: string) {
    registerDecorator({
      name: 'Record',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [{ nullable, type }],
      validator: RecordConstraint,
    });
  }, ApiProperty({
    required: apiProperty.required,
    type: 'object',
    additionalProperties: {
      type,
    },
  }));
};
