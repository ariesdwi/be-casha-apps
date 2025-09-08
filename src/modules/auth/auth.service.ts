
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

//   async signUp(signUpDto: SignUpDto) {
//     const { email, password, ...rest } = signUpDto;

//     const existingUser = await this.prisma.user.findUnique({
//       where: { email },
//     });
//     if (existingUser) throw new ConflictException('User already exists');

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await this.prisma.user.create({
//       data: {
//         email,
//         password: hashedPassword,
//         ...rest,
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         avatar: true,
//         phone: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return user;
//   }

//   async login(loginDto: LoginDto) {
//     const { email, password } = loginDto;

//     const user = await this.prisma.user.findUnique({ where: { email } });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const payload = { sub: user.id, email: user.email };

//     return {
//       access_token: this.jwtService.sign(payload),
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         avatar: user.avatar,
//         phone: user.phone,
//       },
//     };
//   }

//   async validateUser(payload: any) {
//     return await this.prisma.user.findUnique({ where: { id: payload.sub } });
//   }
// }


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

    // check duplicate
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
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

    // issue JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  // 🔑 Login → returns token only
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  async validateUser(payload: any) {
    return await this.prisma.user.findUnique({ where: { id: payload.sub } });
  }
}
