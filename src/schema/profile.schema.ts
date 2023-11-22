import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose';
import { User } from './user.schema';

@Schema()
export class Profile {
    @Prop()
    id_user: string;

    @Prop()
    nik: string;

    @Prop()
    nama: string;

    @Prop()
    notelpon: string;

    @Prop()
    email: string;

    @Prop()
    gender: string;

    @Prop()
    tanggal_lahir: string;

    @Prop()
    alamat: string;

    @Prop()
    foto: string;

    @Prop()
    role: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

}

export const ProfileSchema = SchemaFactory.createForClass(Profile)