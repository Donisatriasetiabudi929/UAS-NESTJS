import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose';
import { User } from './user.schema';

@Schema()
export class Tanggapan {
    @Prop()
    id_user: string;

    @Prop()
    id_profile: string;

    @Prop()
    id_pengaduan: string;

    @Prop()
    namabadan: string;

    @Prop()
    nama: string;

    @Prop()
    tanggal: string;

    @Prop()
    tanggapan: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

}

export const TanggapanSchema = SchemaFactory.createForClass(Tanggapan)