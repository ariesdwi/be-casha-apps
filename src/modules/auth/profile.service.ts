import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) throw new NotFoundException('User not found');

    // If email is being updated, check uniqueness
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: userId }, // exclude current user
        },
      });
      if (emailExists) {
        throw new ConflictException('Email already taken');
      }
    }

    // If phone is being updated, check uniqueness
    if (updateData.phone && updateData.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          id: { not: userId }, // exclude current user
        },
      });
      if (phoneExists) {
        throw new ConflictException('Phone number already taken');
      }
    }

    // Prepare update payload
    const updatePayload: any = { ...updateData };

    // Handle password hashing if provided
    if (updateData.password) {
      if (updateData.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }
      updatePayload.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updatePayload.password; // don’t overwrite password with null/undefined
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteProfile(userId: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }
}
