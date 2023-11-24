import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose';
import { User } from './user.schema';

@Schema({
    timestamps: true,
})
export class Profilepetugas {
    @Prop()
    id_user: string;

    @Prop()
    namabadan: string; 

    @Prop()
    nama: string;

    @Prop()
    notelpon: string;

    @Prop()
    email: string;

    @Prop()
    alamat: string;

    @Prop()
    foto: string;

    @Prop()
    role: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

}

export const ProfilepetugasSchema = SchemaFactory.createForClass(Profilepetugas)