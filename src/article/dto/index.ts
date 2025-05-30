import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class articleDraftDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  thumbnail: string;
}

export class articleUploadDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  thumbnail: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  document: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  articleId?: string;
}

export class articleFeedbackDTO {
  @ApiProperty()
  @IsOptional()
  message: string;
}
