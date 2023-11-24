import { Injectable, NotFoundException } from '@nestjs/common';
import * as Minio from 'minio';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProfile } from 'src/interface/profile.interface';
import { Readable } from 'stream';
import { IPengaduan } from 'src/interface/pengaduan.interface';

@Injectable()
export class PengaduanService {
    private readonly Redisclient: Redis;
    private minioClient: Minio.Client;

    constructor(
        private configService: ConfigService,
        @InjectModel('Profile') private readonly profileModel: Model<IProfile>,
        @InjectModel('Pengaduan') private readonly pengaduanModel: Model<IPengaduan>,
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
    async deleteCache(key: string): Promise<void> {
        try {
            await this.Redisclient.del(key);
            console.log(`Cache dengan key ${key} telah dihapus dari Redis`);
        } catch (error) {
            console.error(`Error saat menghapus cache dari Redis: ${error}`);
            throw new Error('Terjadi kesalahan saat menghapus cache dari Redis');
        }
    }

    generateRandomCode(length: number = 10): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomIndex);
        }
        return code;
    }

    async getProfileById(id: string): Promise<IProfile | null> {
        return this.profileModel.findById(id).exec();
    }

    async getProfileByIdAuth(id_user: string): Promise<IProfile> {
        return this.profileModel.findOne({ id_user }).exec();
    }

    async getPengaduanByIdAuth(id_user: string): Promise<IPengaduan> {

        const tampil = await this.pengaduanModel.findOne({ id_user }).exec();
        return tampil;
    }

    async getPengaduanByRole(jenis_pengaduan: string): Promise<IPengaduan[]> {
        const pengaduans = await this.pengaduanModel.find({ jenis_pengaduan }).exec();
        return pengaduans;
    }
    


    async createUploud(
        id_user: string,
        id_profile: string,
        nik: string,
        nama: string,
        notelpon: string,
        alamat: string,
        tanggal_pengaduan: string,
        jenis_pengaduan: string,
        isi_laporan: string,
        namaFiles: string[],
        status: string
    ): Promise<IPengaduan> {
        const kode = this.generateRandomCode();
        const approveTime = new Date(Date.now());
        const localTimeString = approveTime.toLocaleString();
        const waktu = localTimeString.toString();
        const newUploud = await new this.pengaduanModel({
            id_user,
            id_profile,
            nik,
            nama,
            notelpon,
            alamat,
            tanggal_pengaduan: waktu,
            jenis_pengaduan,
            isi_laporan,
            files: namaFiles,
            status: "Belum Ditanggapi"
        });

        await this.deleteCache(`003`);
        return newUploud.save();
    }

    async getAllPengaduan(): Promise<IPengaduan[]> {
        const cachedData = await this.Redisclient.get('003');

        if (cachedData) {
            return JSON.parse(cachedData);
        } else {
            const pengaduan = await this.pengaduanModel.find();
            if (!pengaduan || pengaduan.length === 0) {
                throw new NotFoundException('Data pengaduan tidak ada!');
            }

            await this.Redisclient.setex('003', 3600, JSON.stringify(pengaduan));
            return pengaduan;
        }
    }
}
