import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRoomCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class sendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chatRoomId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
