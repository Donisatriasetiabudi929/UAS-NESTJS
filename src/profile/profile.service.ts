import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Redis } from 'ioredis';
import * as Minio from 'minio';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { IProfile } from 'src/interface/profile.interface';
import { User } from 'src/schema/user.schema';
import { Readable } from 'stream';
import { IPengaduan } from 'src/interface/pengaduan.interface';

@Injectable()
export class ProfileService {
    private readonly Redisclient: Redis;
    private minioClient: Minio.Client;
    AuthService: any;

    constructor(private configService: ConfigService,
        @InjectModel('Profile') private profileModel: Model<IProfile>,
        @InjectModel('Pengaduan') private pengaduanModel: Model<IPengaduan>,
        @InjectModel('User') private userModel: Model<User>
    ) {
        //Untuk menghubungkan redis server
        this.Redisclient = new Redis({
            port: 6379,
            host: '127.0.0.1',
            password: '',
            username: '',
            //Optional
            db: 2
        });

        //Untuk menghubungkan ke MinIO Server
        this.minioClient = new Minio.Client({
            endPoint: '127.0.0.1',
            port: 9000,
            useSSL: false,
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY')
        });
    }

    async uploadFile(bucketName: string, objectName: string, stream: Readable, contentType: string): Promise<void> {
        const objectExists = await this.checkObjectExists(bucketName, objectName);

        if (objectExists) {
            throw new Error(`File dengan nama ${objectName} sudah ada di storage`);
        }

        await this.minioClient.putObject(bucketName, objectName, stream, null, {
            'Content-Type': contentType,
        });
    }

    async checkObjectExists(bucketName: string, objectName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(bucketName, objectName);
            return true;
        } catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }
    async deleteFile(bucketName: string, objectName: string): Promise<void> {
        try {
            await this.minioClient.removeObject(bucketName, objectName);
            console.log(`File ${objectName} telah dihapus dari Minio`);
        } catch (error) {
            console.error(`Error saat menghapus file dari Minio: ${error}`);
            throw new Error('Terjadi kesalahan saat menghapus file dari Minio');
        }
    }

    async createUploud(
        id_user: string,
        nik: string,
        nama: string,
        notelpon: string,
	    email: string,
        gender: string,
        tanggal_lahir: string,
        alamat: string,
        namaFile: string,
        role: string,
    ): Promise<IProfile> {
        const existingProfile = await this.profileModel.findOne({ id_user });

        if (existingProfile) {
            throw new Error(`Profil dengan id_auth ${id_user} sudah ada`);
        }

        const newUploud = await new this.profileModel({
            id_user,
            nik,
            nama,
            notelpon,
	        email,
            gender,
            tanggal_lahir,
            alamat,
            foto: namaFile,
            role,
        });
        newUploud.nama = nama.replace(/\b\w/g, (char) => char.toUpperCase());
        
        await this.deleteCache(`001`);
        return newUploud.save();
    }

    async getProfileByIdAuth(id_user: string): Promise<IProfile> {

        const tampil = await this.profileModel.findOne({ id_user }).exec();
        return tampil;
    }

    async updateCache(): Promise<void> {
        try {
            const uploudData = await this.profileModel.find();
            if (!uploudData || uploudData.length === 0) {
                throw new NotFoundException('Data uploud tidak ada!');
            }
            await this.Redisclient.setex('001', 3600, JSON.stringify(uploudData));
            console.log('Cache Redis (key 001) telah diperbarui dengan data terbaru dari MongoDB');
        } catch (error) {
            console.error(`Error saat memperbarui cache Redis (key 001): ${error}`);
            throw new Error('Terjadi kesalahan saat memperbarui cache Redis');
        }
    }
    async deleteCache(key: string): Promise<void> {
        try {
            await this.Redisclient.del(key);
            console.log(`Cache dengan key ${key} telah dihapus dari Redis`);
        } catch (error) {
            console.error(`Error saat menghapus cache dari Redis: ${error}`);
            throw new Error('Terjadi kesalahan saat menghapus cache dari Redis');
        }
    }

    async getAllProfile(): Promise<IProfile[]> {
        const cachedData = await this.Redisclient.get('001');

        if (cachedData) {
            return JSON.parse(cachedData);
        } else {
            const profileDataa = await this.profileModel.find();
            if (!profileDataa || profileDataa.length === 0) {
                throw new NotFoundException('Data profile tidak ada!');
            }

            await this.Redisclient.setex('001', 3600, JSON.stringify(profileDataa));
            return profileDataa;
        }
    }

    async getProfileById(profileId: string): Promise<IProfile> {
        const existingProfile = await this.profileModel.findById(profileId)
        if (!existingProfile) {
            throw new NotFoundException(`Profile dengan #${profileId} tidak tersedia`);
        }
        return existingProfile;
    }

    async updateUploud(
        uploudId: string,
	    nik: string,
        nama: string,
	    notelpon: string,
        email: string,
        gender: string,
        tanggal_lahir: string,
        alamat: string,
        namefile: string
    ): Promise<IProfile> {
        const updatedUploud = await this.profileModel.findByIdAndUpdate(
            uploudId,
            {
		        nik,
                nama,
		        notelpon,
                email,
                gender,
                tanggal_lahir,
                alamat,
                foto: namefile
            },
            { new: true }
        );
        updatedUploud.nama = updatedUploud.nama.replace(/\b\w/g, (char) => char.toUpperCase());
        await this.updateRelatedDataByprofileId(uploudId, updatedUploud);

        if (!updatedUploud) {
            throw new NotFoundException(`Profil dengan ID ${uploudId} tidak ditemukan`);
        }
        await this.updateCache();
        await this.deleteCache(`001:${updatedUploud.id_user}`);

        return updatedUploud;
    }

    async updateRelatedDataByprofileId(profileId: string, updateProfile: IProfile): Promise<void> {
        try {
            const pengaduanData = await this.pengaduanModel.updateMany(
                { id_profile: profileId },
                {
                    $set: {
                        nik: updateProfile.nik,
                        nama: updateProfile.nama,
                        notelpon: updateProfile.notelpon,
                        alamat: updateProfile.alamat
                    }
                }
            );

            console.log(`Updated related data in 'pengaduanData, progres' and 'taskData, progresTask' tables for produk with ID ${profileId}`);
        } catch (error) {
            console.error(`Error updating related data: ${error}`);
            throw new Error('Terjadi kesalahan saat memperbarui data terkait');
        }
    }
}
