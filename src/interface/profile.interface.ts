import { Document } from 'mongoose'
export interface IProfile extends Document {
    readonly id_user: string;
    readonly nik: string;
    nama: string;
    readonly notelpon: string;
    readonly email: string;
    readonly gender: string;
    readonly tanggal_lahir: string;
    readonly alamat: string;
    readonly foto: string;
    readonly role: string;

}