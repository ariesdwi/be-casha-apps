// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { AuthService } from './auth.service';
// import { ProfileService } from './profile.service';
// import { AuthController } from './auth.controller';
// import { JwtStrategy } from './jwt.strategy';
// import { PrismaService } from '../../common/prisma/prisma.service.js'; // Adjust path

// @Module({
//   imports: [
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: { expiresIn: '60d' },
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, ProfileService, JwtStrategy, PrismaService], // Added ProfileService
//   exports: [AuthService, ProfileService], // Export if needed elsewhere
// })
// export class AuthModule {}

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailModule } from '../email/email.module'; // 👈 import EmailModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // so you don’t have to re-import in other modules
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60d' },
      }),
    }),
    EmailModule, // 👈 add EmailModule here
  ],
  controllers: [AuthController],
  providers: [AuthService, ProfileService, JwtStrategy, PrismaService],
  exports: [
    AuthService,
    ProfileService,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
