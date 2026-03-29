import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { context, propagation } from '@opentelemetry/api';

@Injectable()
export class HttpServiceVortex implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    this.httpService.axiosRef.interceptors.request.use((config) => {
      propagation.inject(context.active(), config.headers);
      return config;
    });
  }
}
