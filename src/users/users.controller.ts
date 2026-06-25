import { All, Body, Controller, Delete, Get, Param, Patch, Req, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiParam, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
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
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiOkResponse({ description: 'OK' })
    getMe(
        @CurrentUser() user: any
    ) {
        return this.usersService.findById(user.id);
    }

    @Get(':id')
    @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' } })
    @ApiOkResponse({ description: 'OK' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    @ApiNotFoundResponse({ description: 'Not Found' })
    getUser(@Param('id', new ParseUUIDPipe()) userId: string) {
        return this.usersService.findById(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @ApiOkResponse({ description: 'OK' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad Request' })
    updateUser(
        @CurrentUser() user: any,
        @Body() updateUserDto: UpdateUserDTO
    ) {
        return this.usersService.updateUser(user.id, updateUserDto)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiOkResponse({ description: 'OK' })
    deleteUser(
        @CurrentUser() user: any
    ) {
        return this.usersService.deleteUser(user.id);
    }
}
