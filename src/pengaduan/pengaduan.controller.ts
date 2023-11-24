import { Controller, Post, Headers, UseInterceptors, UploadedFiles, Body, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { PengaduanService } from './pengaduan.service';
import { AuthService } from 'src/auth/auth.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePengaduanDto } from 'src/dto/create-pengaduan.dto';
import { randomBytes } from 'crypto';

@Controller('pengaduan')
export class PengaduanController {
    constructor(
        private readonly pengaduanService: PengaduanService,
        private readonly authService: AuthService,
    ) { }

    @Post()
    @UseInterceptors(FilesInterceptor('files'))
    async uploadFiles(
        @Headers() headers: Record<string, string>,
        @UploadedFiles() uploadedFiles: Express.Multer.File[],
        @Body() createPengaduanDto: CreatePengaduanDto,
    ): Promise<any> {
        try {
            const token = headers['authorization']?.split(' ')[1];
            if (!token) {
                return { message: 'Tidak ada token yang diberikan' };
            }

            const uniqueCode = randomBytes(5).toString('hex');

            let namaFiles = ["#"];

            if (uploadedFiles && uploadedFiles.length > 0) {
                const filesData = uploadedFiles.map((file, index) => {
                    const stream = require('stream');
                    const readableStream = new stream.PassThrough();
                    readableStream.end(file.buffer);

                    const objectName = `${uniqueCode}-${index}-${file.originalname}`;
                    return { objectName, readableStream, mimeType: file.mimetype };
                });

                namaFiles = filesData.map(fileData => fileData.objectName);

                await Promise.all(filesData.map(async (fileData) => {
                    try {
                        await this.pengaduanService.uploadFile('pengaduan.laporan', fileData.objectName, fileData.readableStream, fileData.mimeType);
                    } catch (error) {
                        console.error(`Error saat mengunggah file: ${error}`);
                        throw new Error('Terjadi kesalahan saat mengunggah file');
                    }
                }));
            }

            const { id_user } = await this.authService.getUserFromToken(token);

            if (!id_user) {
                return { message: 'id_user tidak valid' };
            }
            const profile = await this.pengaduanService.getProfileByIdAuth(id_user);

            if (!profile) {
                throw new Error(`Profile dengan ID ${id_user} tidak ditemukan!`);
            }

            const dataprofile = await this.pengaduanService.getProfileById(profile.id);

            if (!dataprofile) {
                throw new Error(`Profile dengan ID ${profile.id} tidak ditemukan!`);
            }



            await this.pengaduanService.createUploud(
                dataprofile.id_user,
                profile.id,
                dataprofile.nik,
                dataprofile.nama,
                dataprofile.notelpon,
                dataprofile.alamat,
                createPengaduanDto.tanggal_pengaduan,
                createPengaduanDto.jenis_pengaduan,
                createPengaduanDto.isi_laporan,
                namaFiles,
                createPengaduanDto.status
            );

            return { message: 'Data berhasil dikirim' };
        } catch (error) {
            console.error(`Error saat mengunggah file: ${error}`);
            throw new Error('Terjadi kesalahan saat mengunggah file');
        }
    }

    @Get('/get')
    async getProfileByIdAuth(@Headers() headers: Record<string, string>, @Param('id_user') id_user: string) {
        try {
            const token = headers['authorization']?.split(' ')[1];
            if (!token) {
                return { message: 'Tidak ada token yang diberikan' };
            }

            const { id_user } = await this.authService.getUserFromToken(token);

            if (!id_user) {
                return { message: 'id_auth tidak valid' };
            }

            const profile = await this.pengaduanService.getPengaduanByIdAuth(id_user);

            if (!profile) {
                return { message: 'Profil tidak ditemukan' };
            }

            return profile;
        } catch (error) {
            console.error(`Error saat mengambil profil: ${error}`);
            throw new Error('Terjadi kesalahan saat mengambil profil');
        }
    }

    @Get('/petugas/get')
    async getProfileByIdAuthByRole(@Headers() headers: Record<string, string>) {
        try {
            const token = headers['authorization']?.split(' ')[1];
            if (!token) {
                return { message: 'Tidak ada token yang diberikan' };
            }

            const { id_user, role } = await this.authService.getUserFromToken(token);

            if (!id_user) {
                return { message: 'id_auth tidak valid' };
            }

            const pengaduans = await this.pengaduanService.getPengaduanByRole(role);

            if (!pengaduans || pengaduans.length === 0) {
                return { message: 'Pengaduan tidak ditemukan' };
            }

            return pengaduans;
        } catch (error) {
            console.error(`Error saat mengambil profil: ${error}`);
            throw new Error('Terjadi kesalahan saat mengambil profil');
        }
    }

    @Get('/all')
    async getUplouds(@Res() Response) {
        try {
            const pengaduanData = await this.pengaduanService.getAllPengaduan();
            return Response.status(HttpStatus.OK).json({
                message: 'Semua data pengaduan berhasil di temukan', pengaduanData
            });
        } catch (err) {
            return Response.status(err.status).json(err.Response);
        }
    }

}
