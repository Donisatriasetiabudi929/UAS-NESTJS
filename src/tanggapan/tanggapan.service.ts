import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPengaduan } from 'src/interface/pengaduan.interface';
import { ITanggapan } from 'src/interface/tanggapan.interface';
import * as Minio from 'minio';
import { Redis } from 'ioredis';
import { CreateTanggapanDto } from 'src/dto/create-tanggapan.dto';
import { IProfilepetugas } from 'src/interface/profilepetugas.interface';

@Injectable()
export class TanggapanService {
    private readonly Redisclient: Redis;
    private minioClient: Minio.Client;

    constructor(
        private configService: ConfigService,
        @InjectModel('Pengaduan') private readonly pengaduanModel: Model<IPengaduan>,
        @InjectModel('Tanggapan') private readonly tanggapanModel: Model<ITanggapan>,
        @InjectModel('Profilepetugas') private readonly profilepetugasModel: Model<IProfilepetugas>,
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
    async deleteCache(key: string): Promise<void> {
        try {
            await this.Redisclient.del(key);
            console.log(`Cache dengan key ${key} telah dihapus dari Redis`);
        } catch (error) {
            console.error(`Error saat menghapus cache dari Redis: ${error}`);
            throw new Error('Terjadi kesalahan saat menghapus cache dari Redis');
        }
    }

    async createTanggapan(createTanggapanDto: CreateTanggapanDto): Promise<ITanggapan> {
        const { 
            id_user, 
            id_profile, 
            id_pengaduan, 
            namabadan, 
            nama, 
            tanggapan
        } = createTanggapanDto;
        const pengaduan = await this.pengaduanModel.findById(id_pengaduan);
    
        if (!pengaduan) {
            throw new NotFoundException(`Objektif dengan ID ${id_pengaduan} tidak ditemukan`);
        }
    
        if (pengaduan.status === "Belum Ditanggapi") {
            pengaduan.status = "Sudah Ditanggapi";
            await pengaduan.save();
        }
    
        const approveTime = new Date(Date.now());
        const localTimeString = approveTime.toLocaleString();
        const waktu = localTimeString.toString();
    
        const tanggapanpengaduan = new this.tanggapanModel({
            id_user,
            id_profile,
            id_pengaduan,
            namabadan,
            nama,
            tanggal: waktu,
            tanggapan
        });
        await this.deleteCache(`003`);
        return tanggapanpengaduan.save();
    }
    

    async getProfileByIdAuth(id_user: string): Promise<IProfilepetugas> {
        return this.profilepetugasModel.findOne({ id_user }).exec();
    }

    async getpengaduanById(id_pengaduan: string): Promise<IPengaduan | null> {
        return this.pengaduanModel.findById(id_pengaduan).exec();
    }

    async getAllTanggapan(): Promise<ITanggapan[]> {
        const cachedData = await this.Redisclient.get('004');

        if (cachedData) {
            return JSON.parse(cachedData);
        } else {
            const tanggapan = await this.tanggapanModel.find();
            if (!tanggapan || tanggapan.length === 0) {
                throw new NotFoundException('Data tanggapan tidak ada!');
            }

            await this.Redisclient.setex('004', 3600, JSON.stringify(tanggapan));
            return tanggapan;
        }
    }

    async getTanggapanByIdPengaduan(id_pengaduan: string): Promise<ITanggapan[]> {
        const cacheKey = `004:${id_pengaduan}`;
        const cachedData = await this.Redisclient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        } else {
            const tanggapans = await this.tanggapanModel.find({ id_pengaduan: id_pengaduan });
            if (!tanggapans || tanggapans.length === 0) {
                throw new NotFoundException(`Data tanggapan dengan id_pengaduan #${id_pengaduan} tidak ditemukan`);
            }
            await this.Redisclient.setex(cacheKey, 3600, JSON.stringify(tanggapans));
            return tanggapans;
        }

    }
}
