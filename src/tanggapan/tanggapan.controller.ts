import { Controller, Post, Headers, Body, Param, Get, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PengaduanService } from 'src/pengaduan/pengaduan.service';
import { TanggapanService } from './tanggapan.service';
import { CreateTanggapanDto } from 'src/dto/create-tanggapan.dto';

@Controller('tanggapan')
export class TanggapanController {
    constructor(
        private readonly pengaduanService: PengaduanService,
        private readonly authService: AuthService,
        private readonly tanggapanService: TanggapanService,
    ) { }

    @Post('/:id_pengaduan')
    async uploadFile(
        @Headers() headers: Record<string, string>,
        @Body() createTanggapanDto: CreateTanggapanDto,
        @Param('id_pengaduan') id_pengaduan: string,
    ): Promise<any> {
        try {
            const token = headers['authorization']?.split(' ')[1];
            if (!token) {
                return { message: 'Tidak ada token yang diberikan' };
            }

            const { id_user } = await this.authService.getUserFromToken(token);

            if (!id_user) {
                return { message: 'id_user tidak valid' };
            }

            const profile = await this.tanggapanService.getProfileByIdAuth(id_user);

            if (!profile) {
                throw new Error(`Profile dengan ID ${id_user} tidak ditemukan!`);
            }

            const pengaduan = await this.tanggapanService.getpengaduanById(id_pengaduan);
            if (!pengaduan) {
                throw new Error(`pengaduan dengan ID ${id_pengaduan} tidak ditemukan`);
            }

            const { id_profile, namabadan, nama, tanggal, tanggapan } = createTanggapanDto;

            const newProgres = await this.tanggapanService.createTanggapan({
                id_user,
                id_profile: profile.id,
                id_pengaduan: id_pengaduan,
                namabadan: profile.namabadan,
                nama: profile.nama,
                tanggal,
                tanggapan,
            });

            return { message: 'Data berhasil dikirim', newProgres };
        } catch (error) {
            throw new Error('Terjadi kesalahan saat mengunggah file');
        }
    }

    @Get('/all')
    async getUplouds(@Res() Response) {
        try {
            const tanggapanData = await this.tanggapanService.getAllTanggapan();
            return Response.status(HttpStatus.OK).json({
                message: 'Semua data tanggapan berhasil di temukan', tanggapanData
            });
        } catch (err) {
            return Response.status(err.status).json(err.Response);
        }
    }

    @Get('/pengaduan/:id_pengaduan')
    async gettanggapansByProjekId(@Param('id_pengaduan') id_pengaduan: string, @Res() Response) {
        try {
            const tanggapans = await this.tanggapanService.getTanggapanByIdPengaduan(id_pengaduan);

            if (!tanggapans) {
                return Response.status(HttpStatus.NOT_FOUND).json({
                    message: 'Data tanggapan tidak ditemukan'
                });
            }

            return Response.status(HttpStatus.OK).json({
                message: 'Data tanggapan berhasil ditemukan',
                tanggapans
            });
        } catch (err) {
            return Response.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Terjadi kesalahan saat mengambil data tanggapan'
            });
        }
    }


}
