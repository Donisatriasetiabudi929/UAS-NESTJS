import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePengaduanDto {

    @IsString()
    readonly id_user: string;

    @IsString()
    readonly id_profile: string;

    @IsString()
    readonly nik: string;

    @IsString()
    readonly nama: string;

    @IsString()
    readonly notelpon: string;

    @IsString()
    readonly alamat: string;

    @IsString()
    readonly tanggal_pengaduan: string;

    @IsString()
    @IsNotEmpty()
    readonly jenis_pengaduan: string;

    @IsString()
    @IsNotEmpty()
    readonly isi_laporan: string;

    readonly files: Express.Multer.File;

    @IsString()
    readonly status: string;

}