// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { PrismaService } from '../../common/prisma/prisma.service.js';
// import { AuthService } from './auth.service.js';
// import { AuthController } from './auth.controller.js';
// import { JwtStrategy } from './jwt.strategy.js';

// @Module({
//   imports: [
//     PassportModule,
//     JwtModule.register({
//       secret: process.env.JWT_SECRET || 'supersecret', // ⚠️ put in .env
//       signOptions: { expiresIn: '7d' },
//     }),
//   ],
//   providers: [AuthService, PrismaService, JwtStrategy],
//   controllers: [AuthController],
//   exports: [AuthService],
// })
// export class AuthModule {}


import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service'; 
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../common/prisma/prisma.service.js'; // Adjust path

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ProfileService, JwtStrategy, PrismaService], // Added ProfileService
  exports: [AuthService, ProfileService], // Export if needed elsewhere
})
export class AuthModule {}