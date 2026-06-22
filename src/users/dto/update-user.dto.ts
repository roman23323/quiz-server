import { PartialType } from "@nestjs/mapped-types";
import { RegisterDto } from "../../auth/dto/register.dto";

export class UpdateUserDTO extends PartialType(RegisterDto) {}