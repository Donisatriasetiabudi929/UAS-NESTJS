import { Controller, Post, Headers, UseInterceptors, UploadedFiles, Body } from '@nestjs/common';
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
}
