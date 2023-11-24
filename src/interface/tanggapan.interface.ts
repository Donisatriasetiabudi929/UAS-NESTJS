import { Document } from 'mongoose'
export interface ITanggapan extends Document {
    readonly id_user: string;
    readonly id_profile: string;
    readonly id_pengaduan: string;
    readonly namabadan: string;
    readonly nama: string;
    readonly tanggal: string;
    readonly tanggapan: string;
}