import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'josedantas@email.com',
    description: 'E-mail do usuário',
  })
  @IsEmail({}, { message: 'O campo [email] precisa ser um e-mail válido.' })
  @IsNotEmpty({ message: 'O campo [email] não pode estar vazio.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
  })
  @IsString({ message: 'O campo [password] precisa ser uma string.' })
  @MinLength(6, {
    message: 'O campo [password] precisa ter no mínimo 6 caracteres.',
  })
  @IsNotEmpty({ message: 'O campo [password] não pode estar vazio.' })
  password: string;
}
