import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchBetweenFields', async: false })
export class MatchBetweenFields<
  T = any,
> implements ValidatorConstraintInterface {
  validate(value: T, args: ValidationArguments) {
    // console.log(args);
    return value == args.object[args.constraints[0]];
  }

  defaultMessage(args?: ValidationArguments): string {
    return `Fail to match between ${args?.constraints[0]} and ${args?.property}`;
  }
}

export function IsMatch<T = any>(
  constraints: string[] = [],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: MatchBetweenFields<T>,
    });
  };
}
