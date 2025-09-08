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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
  ) {}

  // 🔐 Authentication
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 👤 Profile (protected)
  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.profileService.getProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    // ✅ always uses the authenticated user ID from JWT
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteProfile(@Request() req) {
    // req.user.userId comes from JwtStrategy validate()
    return this.profileService.deleteProfile(req.user.userId);
  }
}
