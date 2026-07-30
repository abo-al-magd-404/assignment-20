import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common/decorator';

export class ResendConfirmEmailDto {
  @IsEmail({}, { message: 'Email is required' })
  email!: string;
}

export class ConfirmEmailDto extends ResendConfirmEmailDto {
  @Matches(/^\d{6}$/)
  otp!: string;
}

export class LoginDto extends ResendConfirmEmailDto {
  @IsStrongPassword({
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 3,
    minSymbols: 1,
  })
  password!: string;

  @IsOptional()
  @IsString()
  FCM?: string;
}

export class SignupDto extends LoginDto {
  @IsNotEmpty()
  @MinLength(2, { message: 'Min is 2 chars' })
  @MaxLength(55)
  username!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @ValidateIf((data: any) => {
    return Boolean(data.password);
  })
  @IsMatch(['password'])
  confirmPassword!: string;
}

export class SignupWithGmailDto {
  @IsNotEmpty()
  @IsString()
  idToken!: string;
}
