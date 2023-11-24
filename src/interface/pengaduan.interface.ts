import { Document } from 'mongoose'
export interface IPengaduan extends Document {
    readonly id_user: string;
    readonly id_profile: string;
    readonly nik: string;
    readonly nama: string;
    readonly notelpon: string;
    readonly alamat: string;
    readonly tanggal_pengaduan: string;
    readonly jenis_pengaduan: string;
    readonly isi_laporan: string;
    readonly files: string[];
    status: string;
}