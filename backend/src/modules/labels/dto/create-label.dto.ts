import { IsString, IsNotEmpty, IsOptional, IsHexColor, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLabelDto {
  @ApiProperty({
    description: 'The name of the label',
    example: 'Bug Fix',
    minLength: 1,
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The color of the label in hexadecimal format',
    example: '#FF5733',
    format: 'hex-color',
    pattern: '^#[0-9A-Fa-f]{6}$',
    required: true,
  })
  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'Optional description of the label',
    example: 'Used for tasks related to fixing bugs and issues',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The unique identifier of the project this label belongs to',
    example: 'a7d2f3e4-1234-5678-9abc-def012345678',
    format: 'uuid',
    required: true,
  })
  @IsUUID('4')
  @IsNotEmpty()
  projectId: string;
}
