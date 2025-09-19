// import {
//   Injectable,
//   ConflictException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { PrismaService } from '../../common/prisma/prisma.service.js';
// import * as bcrypt from 'bcrypt';
// import { SignUpDto } from './dto/sign-up.dto';
// import { LoginDto } from './dto/login.dto';

// @Injectable()
// export class AuthService {
//   constructor(
//     private prisma: PrismaService,
//     private jwtService: JwtService,
//   ) {}

//   // 🔐 Signup → returns token only
//   async signUp(signUpDto: SignUpDto) {
//     const { email, password, ...rest } = signUpDto;

//     // Validate required fields
//     if (!email) {
//       throw new ConflictException('Email is required');
//     }
//     if (!password) {
//       throw new ConflictException('Password is required');
//     }

//     // Check for duplicate email
//     const existingUser = await this.prisma.user.findUnique({
//       where: { email },
//     });
//     if (existingUser) {
//       throw new ConflictException('User already exists');
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await this.prisma.user.create({
//       data: {
//         email,
//         password: hashedPassword,
//         ...rest,
//       },
//       select: {
//         id: true,
//         email: true,
//       },
//     });

//     // Generate JWT
//     const payload = { sub: user.id, email: user.email };
//     const accessToken = this.jwtService.sign(payload);

//     return {
//       access_token: accessToken,
//     };
//   }

//   // 🔑 Login → returns token only
//   async login(loginDto: LoginDto) {
//     const { email, password } = loginDto;

//     if (!email) throw new UnauthorizedException('Email is required');
//     if (!password) throw new UnauthorizedException('Password is required');

//     const user = await this.prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       throw new UnauthorizedException('User not found'); // <-- explicit
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       throw new UnauthorizedException('Password is incorrect'); // <-- explicit
//     }

//     const payload = { sub: user.id, email: user.email };
//     const accessToken = this.jwtService.sign(payload);

//     return { access_token: accessToken };
//   }

//   async validateUser(payload: any) {
//     return await this.prisma.user.findUnique({ where: { id: payload.sub } });
//   }
// }

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService, // injected EmailService
  ) {}

  // ✨ Signup → create user + send verification email
  async signUp(signUpDto: SignUpDto) {
    const { email, password, ...rest } = signUpDto;

    if (!email) throw new ConflictException('Email is required');
    if (!password) throw new ConflictException('Password is required');

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, ...rest },
    });

    // Create email verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h expiry

    await this.prisma.verificationToken.create({
      data: { token, userId: user.id, email: user.email, expiresAt },
    });

    // Send verification email via MailHog (dev) or SMTP (prod)
    await this.emailService.sendVerificationEmail(user.email, token);

    return { message: 'Signup successful, please verify your email.' };
  }

  // ✅ Verify email
  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!record) throw new BadRequestException('Invalid token');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Token expired');

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    });

    // Delete token after use
    await this.prisma.verificationToken.delete({ where: { id: record.id } });

    return { message: 'Email verified successfully' };
  }

  // 🔑 Login → only verified users
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Password is incorrect');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  // 🔒 Forgot password → generate reset token + send email
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, email: user.email, expiresAt },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Password reset link sent' };
  }

  // 🔑 Reset password
  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!record) throw new BadRequestException('Invalid token');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Token expired');
    if (record.used) throw new BadRequestException('Token already used');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Optional: notify user their password was changed
    await this.emailService.sendPasswordChangedEmail(record.email, record.email);

    return { message: 'Password reset successful' };
  }

  async validateUser(payload: any) {
    return await this.prisma.user.findUnique({ where: { id: payload.sub } });
  }
}
