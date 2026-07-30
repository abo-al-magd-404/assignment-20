import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'CheckGTE', async: false })
export class CheckGTE implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    return !(value < args.object[args.constraints[0]]);
  }

  defaultMessage(args?: ValidationArguments): string {
    return `Can Not Accept ${args?.property} To Be Lower Than ${args?.constraints[0]}`;
  }
}

export function IsGTE(
  constraints: string[] = [],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: CheckGTE,
    });
  };
}
