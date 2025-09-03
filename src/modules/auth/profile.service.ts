// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
//   ConflictException,
//   BadRequestException,
// } from '@nestjs/common';
// import { PrismaService } from '../../common/prisma/prisma.service'; // Adjust path as needed
// import { UpdateProfileDto } from './dto/update-profile.dto';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class ProfileService {
//   constructor(private prisma: PrismaService) {}

//   async getProfile(userId: string) {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
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

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     return user;
//   }

//   async updateProfile(
//     userId: string,
//     updateData: UpdateProfileDto,
//     currentUserId: string,
//   ) {
//     // Authorization: users can only update their own profile
//     if (userId !== currentUserId) {
//       throw new ForbiddenException('You can only update your own profile');
//     }

//     // Check if user exists
//     const existingUser = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       throw new NotFoundException('User not found');
//     }

//     // If email is being updated, check if it's already taken
//     if (updateData.email && updateData.email !== existingUser.email) {
//       const emailExists = await this.prisma.user.findUnique({
//         where: { email: updateData.email },
//         select: { id: true },
//       });

//       if (emailExists) {
//         throw new ConflictException('Email already taken');
//       }
//     }

//     // If phone is being updated, check if it's already taken
//     if (updateData.phone && updateData.phone !== existingUser.phone) {
//       const phoneExists = await this.prisma.user.findUnique({
//         where: { phone: updateData.phone },
//         select: { id: true },
//       });

//       if (phoneExists) {
//         throw new ConflictException('Phone number already taken');
//       }
//     }

//     // Handle password update separately with hashing
//     let updatePayload: any = { ...updateData };

//     if (updateData.password) {
//       if (updateData.password.length < 6) {
//         throw new BadRequestException('Password must be at least 6 characters long');
//       }
//       updatePayload.password = await bcrypt.hash(updateData.password, 10);
//     }

//     const updatedUser = await this.prisma.user.update({
//       where: { id: userId },
//       data: updatePayload,
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

//     return updatedUser;
//   }

//   async deleteProfile(userId: string, currentUserId: string) {
//     // Authorization: users can only delete their own account
//     if (userId !== currentUserId) {
//       throw new ForbiddenException('You can only delete your own account');
//     }

//     // Check if user exists
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Consider soft delete instead of hard delete
//     await this.prisma.user.delete({
//       where: { id: userId },
//     });

//     return { message: 'User account deleted successfully' };
//   }

//   // Optional: Add method for soft delete if needed
//   async softDeleteProfile(userId: string, currentUserId: string) {
//     if (userId !== currentUserId) {
//       throw new ForbiddenException('You can only delete your own account');
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Update user with deleted flag and timestamp
//     await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         deletedAt: new Date(),
//         isActive: false, // Optional: add this field to your User model
//       },
//     });

//     return { message: 'User account deactivated successfully' };
//   }
// }

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
