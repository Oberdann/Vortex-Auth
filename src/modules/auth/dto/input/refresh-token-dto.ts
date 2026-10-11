import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token emitido no login ou em uma renovação anterior.',
  })
  @IsJWT({ message: 'O campo [refreshToken] precisa ser um JWT válido.' })
  @IsNotEmpty({ message: 'O campo [refreshToken] não pode estar vazio.' })
  refreshToken: string;
}
