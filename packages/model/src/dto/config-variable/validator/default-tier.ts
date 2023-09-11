import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { validateObjectValue } from '../../utils';

export class DefaultTierValue {
  @IsString()
  @IsOptional()
  @ValidateIf(o => o.tierId !== null)
  tierId: string | null;
}

export const validate = (value: unknown) => {
  const validationClass: any = plainToClass(DefaultTierValue, value);

  validateObjectValue(validationClass, value);
};
