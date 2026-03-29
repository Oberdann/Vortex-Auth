import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpServiceVortex } from './http-vortex.service';

@Module({
  imports: [HttpModule],
  providers: [HttpServiceVortex],
  exports: [HttpServiceVortex],
})
export class HttpServiceModule {}
