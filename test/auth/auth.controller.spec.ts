import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/modules/auth/auth.controller';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from 'src/modules/auth/dto/input/register-dto';
import { LoginDto } from 'src/modules/auth/dto/input/login-dto';
import { RefreshTokenDto } from 'src/modules/auth/dto/input/refresh-token-dto';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

describe('AuthController', () => {
  let controller: AuthController;
  let jwtService: jest.Mocked<JwtService>;
  let httpService: jest.Mocked<HttpService>;

  const mockUser = {
    id: '1',
    name: 'User 1',
    email: 'user@test.com',
    password: 'hashed-password',
    roles: ['USER'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jwtService = module.get(JwtService);
    httpService = module.get(HttpService);
  });

  describe('register', () => {
    it('should call httpService.post and return response', async () => {
      const dto: RegisterDto = {
        name: 'User 1',
        email: 'user@test.com',
        password: '123456',
      };

      const responseMock: AxiosResponse<{ success: boolean }> = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {} as Record<string, string>,
        config: {
          url: '',
          method: 'post',
          headers: {} as Record<string, string>,
        } as InternalAxiosRequestConfig,
      };

      httpService.post.mockReturnValue(of(responseMock));

      const result = await controller.register(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpService.post).toHaveBeenCalledWith(
        `${process.env.USERS_SERVICE_URL}/users`,
        expect.objectContaining({
          name: dto.name,
          email: dto.email,
          password: expect.any(String),
        }),
      );
      expect(result).toEqual(responseMock.data);
    });
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      (controller as any).validateUser = jest.fn().mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      const dto: LoginDto = { email: 'user@test.com', password: '123456' };
      const result = await controller.login(dto);

      expect((controller as any).validateUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
      });
    });

    it('should throw UnauthorizedException if user is invalid', async () => {
      (controller as any).validateUser = jest.fn().mockResolvedValue(null);
      const dto: LoginDto = { email: 'user@test.com', password: '123456' };

      await expect(controller.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should verify refresh token and return new tokens', () => {
      const dto: RefreshTokenDto = { refreshToken: 'oldToken' };
      const payload = { id: '1', email: 'user@test.com', roles: ['USER'] };

      jwtService.verify.mockReturnValue(payload);
      jwtService.sign.mockReturnValue('newToken');

      const result = controller.refreshToken(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verify).toHaveBeenCalledWith(dto.refreshToken);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        access_token: 'newToken',
        refresh_token: 'newToken',
      });
    });
  });

  describe('validateUser (private)', () => {
    it('should return user without password if credentials are valid', async () => {
      const httpResponse: AxiosResponse<{ data: typeof mockUser }> = {
        data: { data: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {} as Record<string, string>,
        config: {
          url: '',
          method: 'get',
          headers: {} as Record<string, string>,
        } as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(httpResponse));
      const compareSpied = jest.spyOn(bcrypt, 'compare') as any;
      compareSpied.mockResolvedValue(true);

      const result = await (controller as any).validateUser(
        mockUser.email,
        '123456',
      );

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockUser.roles,
      });
    });

    it('should return null if user not found', async () => {
      const httpResponse: AxiosResponse<{ data: null }> = {
        data: { data: null },
        status: 200,
        statusText: 'OK',
        headers: {} as Record<string, string>,
        config: {
          url: '',
          method: 'get',
          headers: {} as Record<string, string>,
        } as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(httpResponse));

      const result = await (controller as any).validateUser(
        'notfound@test.com',
        '123456',
      );

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const httpResponse: AxiosResponse<{ data: typeof mockUser }> = {
        data: { data: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {} as Record<string, string>,
        config: {
          url: '',
          method: 'get',
          headers: {} as Record<string, string>,
        } as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(httpResponse));
      const compareSpied = jest.spyOn(bcrypt, 'compare') as any;
      compareSpied.mockResolvedValue(false);

      const result = await (controller as any).validateUser(
        mockUser.email,
        'wrongPassword',
      );

      expect(result).toBeNull();
    });
  });
});
