import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateProfileDto {

    @IsString()
    readonly id_user: string;

@IsString()
    @IsNotEmpty()
    readonly nik: string;

    @IsString()
    @IsNotEmpty()
    readonly nama: string;

    @IsString()
    @IsNotEmpty()
    readonly notelpon: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail({}, { message: "Please enter correct email" })
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    readonly gender: string;

    @IsString()
    @IsNotEmpty()
    readonly tanggal_lahir: string;

    @IsString()
    @IsNotEmpty()
    readonly alamat: string;

    readonly foto: Express.Multer.File;

    readonly role: string;


}