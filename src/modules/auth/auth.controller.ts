import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/input/register-dto';
import { LoginDto } from './dto/input/login-dto';
import { RefreshTokenDto } from './dto/input/refresh-token-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  private USERS_SERVICE_URL =
    process.env.USERS_SERVICE_URL || 'http://localhost:3003/api/v1/users';

  @Post('register')
  @HttpCode(200)
  async register(@Body() body: RegisterDto) {
    const { name, email, password } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const response = await axios.post(this.USERS_SERVICE_URL, {
      name,
      email,
      password: hashedPassword,
    });

    return response.data;
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const user = await this.validateUser(body.email, body.password);

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const payload = { sub: user.id, email: user.email, roles: user.roles };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1d' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  @Post('refresh')
  @HttpCode(200)
  refreshToken(@Body() body: RefreshTokenDto) {
    const payload = this.jwtService.verify(body.refreshToken);

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1d' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  private async validateUser(email: string, password: string) {
    const data = await axios.get(`${this.USERS_SERVICE_URL}/by-email/${email}`);

    const user = data?.data?.data;

    if (!user) return null;

    const passwordMatches = await bcrypt.compare(
      password,
      user.password as string,
    );

    if (!passwordMatches) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return result;
  }
}
