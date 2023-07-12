import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { NAME_ALLOWED_CHARACTERS_PATTERN, NUMBERS_AT_BEGINNING_PATTERN } from './constants';

@ValidatorConstraint({ name: 'NameIdentifier' })
export class NameIdentifier implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    const trimmedValue = value.trim();

    return !(trimmedValue.match(NAME_ALLOWED_CHARACTERS_PATTERN) || trimmedValue.match(NUMBERS_AT_BEGINNING_PATTERN));
  }

  defaultMessage(): string {
    return '"$value" identifier cannot have numbers at the beginning and cannot have characters that are not letters, numbers or underscores.';
  }
}
