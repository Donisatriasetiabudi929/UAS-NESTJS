import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateProfilepetugasDto {

    @IsString()
    readonly id_user: string;

    @IsString()
    @IsNotEmpty()
    namabadan: string;

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
    readonly alamat: string;

    readonly foto: Express.Multer.File;

    readonly role: string;


}