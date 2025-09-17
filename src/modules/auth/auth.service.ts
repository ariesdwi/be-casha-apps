import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 🔐 Signup → returns token only
  async signUp(signUpDto: SignUpDto) {
    const { email, password, ...rest } = signUpDto;

    // Validate required fields
    if (!email) {
      throw new ConflictException('Email is required');
    }
    if (!password) {
      throw new ConflictException('Password is required');
    }

    // Check for duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  // 🔑 Login → returns token only
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email) throw new UnauthorizedException('Email is required');
    if (!password) throw new UnauthorizedException('Password is required');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found'); // <-- explicit
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect'); // <-- explicit
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async validateUser(payload: any) {
    return await this.prisma.user.findUnique({ where: { id: payload.sub } });
  }
}
