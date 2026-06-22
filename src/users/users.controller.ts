import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDTO } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(
        @CurrentUser() user: any
    ) {
        return this.usersService.findById(user.id);
    }

    @Get(':id')
    getUser(@Param('id') userId: string) {
        return this.usersService.findById(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateUser(
        @CurrentUser() user: any,
        @Body() updateUserDto: UpdateUserDTO
    ) {
        return this.usersService.updateUser(user.id, updateUserDto)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    deleteUser(
        @CurrentUser() user: any
    ) {
        return this.usersService.deleteUser(user.id);
    }
}
