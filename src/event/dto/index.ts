import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class eventCreateDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  image: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  closureDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class eventUpdateDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  image: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  closureDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endDate: string;
}
