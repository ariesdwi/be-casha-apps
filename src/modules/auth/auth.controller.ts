import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  successResponse,
  errorResponse,
} from '../../common/response/response.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
  ) {}

  // 🔐 Authentication
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const result = await this.authService.signUp(signUpDto);
      return successResponse(
        result,
        'User registered successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return successResponse(result, 'Login successful', HttpStatus.OK);
    } catch (error) {
      throw error;
    }
  }

  // 👤 Profile (protected)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      // ✅ user info comes from JwtStrategy.validate()
      const profile = await this.profileService.getProfile(req.user.id);
      return successResponse(
        profile,
        'Profile retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    try {
      // ✅ always uses the authenticated user ID from JWT
      const updatedProfile = await this.profileService.updateProfile(
        req.user.id,
        dto,
      );
      return successResponse(
        updatedProfile,
        'Profile updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  async deleteProfile(@Request() req) {
    try {
      // req.user.userId comes from JwtStrategy validate()
      const result = await this.profileService.deleteProfile(req.user.userId);
      return successResponse(
        result,
        'Account deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }
}
