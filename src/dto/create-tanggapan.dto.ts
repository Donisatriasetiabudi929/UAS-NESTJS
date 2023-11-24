import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateTanggapanDto {

    @IsString()
    readonly id_user: string;

    @IsString()
    readonly id_profile: string;

    @IsString()
    readonly id_pengaduan: string;

    @IsString()
    readonly namabadan: string;

    @IsString()
    readonly nama: string;

    @IsString()
    readonly tanggal: string;

    @IsString()
    @IsNotEmpty()
    readonly tanggapan: string;

}