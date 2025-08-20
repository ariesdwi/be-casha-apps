import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // biar bisa diakses dari semua module tanpa import berkali-kali
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
