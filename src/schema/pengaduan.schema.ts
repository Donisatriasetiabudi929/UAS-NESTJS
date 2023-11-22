import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose";

@Schema({
    timestamps: true,
})

export class Pengaduan {
    @Prop()
    id_user: string;

    @Prop()
    id_profile: string;

    @Prop()
    nik: string;

    @Prop()
    nama: string;

    @Prop()
    notelpon: string;

    @Prop()
    alamat: string;

    @Prop()
    tanggal_pengaduan: string;

    @Prop()
    isi_laporan: string;

    @Prop([String])
    files: string;

    @Prop()
    status: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: Pengaduan;
}

export const Pengaduanschema = SchemaFactory.createForClass(Pengaduan)