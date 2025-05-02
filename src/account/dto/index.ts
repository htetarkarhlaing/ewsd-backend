import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class StudentRegisterDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationalityId: string;
}

export class AdminInviteDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiProperty()
  @IsBoolean()
  isAdmin: boolean;
}

export class GuestRegisterDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facultyId: string;
}

export class manageStudentRegisterDTO {
  @ApiProperty()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  reason?: string;
}

export class updatePasswordByAdmin {
  @ApiProperty()
  @IsNotEmpty()
  newPassword: string;
}

export class updatePasswordSelf {
  @ApiProperty()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  currentPassword: string;
}
