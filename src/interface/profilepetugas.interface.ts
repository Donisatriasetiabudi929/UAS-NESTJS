import { Document } from 'mongoose'
export interface IProfilepetugas extends Document {
    readonly id_user: string;
    namabadan: string;
    nama: string;
    readonly notelpon: string;
    readonly email: string;
    readonly alamat: string;
    readonly foto: string;
    readonly role: string;

}