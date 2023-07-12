import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import {
  CONTEXT_ALLOWED_CHARACTERS_PATTERN,
  DOTS_AT_BEGINNING_PATTERN,
  DOTS_AT_END_PATTERN,
  NUMBERS_AT_BEGINNING_PATTERN,
} from './constants';

@ValidatorConstraint({ name: 'ContextIdentifier ' })
export class ContextIdentifier implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    const trimmedValue = value.trim();

    return !(
      trimmedValue.match(CONTEXT_ALLOWED_CHARACTERS_PATTERN) ||
      trimmedValue.match(NUMBERS_AT_BEGINNING_PATTERN) ||
      trimmedValue.match(DOTS_AT_BEGINNING_PATTERN) ||
      trimmedValue.match(DOTS_AT_END_PATTERN)
    );
  }

  defaultMessage(): string {
    return '"$value" context cannot have numbers or dots at the beginning, cannot have characters that are not letters, numbers, underscores and cannot have dots at the end.';
  }
}
