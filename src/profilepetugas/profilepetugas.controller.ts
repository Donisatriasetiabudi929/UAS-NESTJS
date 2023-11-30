import { Body, Controller, Post, UploadedFile, Headers, UseInterceptors, Get, Res, HttpStatus, Param, Put } from '@nestjs/common';
import { ProfilepetugasService } from './profilepetugas.service';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProfilepetugasDto } from 'src/dto/create-profilepetugas.dto';
import { randomBytes } from 'crypto';

@Controller('profilepetugas')
export class ProfilepetugasController {
    constructor(
        private readonly profilepetugasService: ProfilepetugasService,
        private readonly authService: AuthService
    ) { }

    @Post('/petugas/add')
    @UseInterceptors(FileInterceptor('foto'))
    async uploadFile(
        @UploadedFile() uploadedFile: Express.Multer.File,
        @Body() createProfilepetugasDto: CreateProfilepetugasDto,
        @Headers() headers: Record<string, string>,
    ): Promise<any> {
        try {
            if (!uploadedFile) {
                return { message: 'Tidak ada file yang diunggah' };
            }

            const stream = require('stream');
            const readableStream = new stream.PassThrough();
            readableStream.end(uploadedFile.buffer);

            const authHeader = headers['authorization'];

            if (!authHeader) {
                return { message: 'Tidak ada token yang diberikan' };
            }

            const token = authHeader.split(' ')[1];


            const { id_user, role } = await this.authService.getUserFromToken(token);

            if (!id_user) {
                return { message: 'id_auth tidak valid' };
            }

            // const existingProfile = await this.profileService.getProfileByEmail(email);

            // if (existingProfile) {
            //     return { message: `Profil dengan email ${email} sudah ada` };
            // }

            console.log(`id_auth: ${id_user}`);

            const uniqueCode = randomBytes(5).toString('hex');
            const objectName = `${uniqueCode}-${uploadedFile.originalname}`;
            const {
                namabadan,
                nama,
                notelpon,
                email,
                alamat
            } = createProfilepetugasDto;

            await this.profilepetugasService.uploadFile('pengaduan.profile', objectName, readableStream, uploadedFile.mimetype);


            await this.profilepetugasService.createUploud(
                id_user,
                namabadan.replace(/\b\w/g, (char) => char.toUpperCase()),
                nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                notelpon,
                email,
                alamat,
                objectName,
                role
            );
            return { message: 'Data berhasil dikirim' };
        } catch (error) {
            console.error(`Error saat mengunggah file: ${error}`);
            throw new Error('Terjadi kesalahan saat mengunggah file');
        }
    }

    @Get('/all')
    async getUplouds(@Res() Response) {
        try {
            const profileData = await this.profilepetugasService.getAllProfile();
            return Response.status(HttpStatus.OK).json({
                message: 'Semua data profile petugas berhasil di temukan', profileData
            });
        } catch (err) {
            return Response.status(err.status).json(err.Response);
        }
    }

    @Get('/profile/:id')
    async getProfileById(@Param('id') id: string, @Res() Response) {
        try {
            const profile = await this.profilepetugasService.getProfileById(id);

            if (!profile) {
                return Response.status(HttpStatus.NOT_FOUND).json({
                    message: 'Data profile petugas tidak ditemukan'
                });
            }

            return Response.status(HttpStatus.OK).json({
                message: 'Data profile petugas berhasil ditemukan',
                profile
            });
        } catch (err) {
            return Response.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Terjadi kesalahan saat mengambil data profile petugas'
            });
        }
    }

    @Put('/edit')
@UseInterceptors(FileInterceptor('foto'))
async updateUploud(
    @Res() Response,
    @Param('id') uploudId: string,
    @Body() createProfilepetugasDto: CreateProfilepetugasDto,
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Headers() headers: Record<string, string>,
) {
    try {
        const { id_user } = await this.authService.getUserFromToken(headers['authorization'].split(' ')[1]);
        if (!id_user) {
            return Response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Token tidak valid',
            });
        }
        const uploudData = await this.profilepetugasService.getProfileByIdAuth(id_user);

        if (uploadedFile) {
            await this.profilepetugasService.deleteFile('pengaduan.profile', uploudData.foto);

            const {
                namabadan,
                nama,
                notelpon,
                email,
                alamat
            } = createProfilepetugasDto;

            const uniqueCode = randomBytes(5).toString('hex');
            const namefilee = `${uniqueCode}-${uploadedFile.originalname}`;

            const updatedUploud = await this.profilepetugasService.updateUploud(
                uploudData._id,
                namabadan,
                nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                notelpon,
                email,
                alamat,
                namefilee
            );

            const stream = require('stream');
            const readableStream = new stream.PassThrough();
            readableStream.end(uploadedFile.buffer);
            const objectName = namefilee;

            await this.profilepetugasService.uploadFile('pengaduan.profile', objectName, readableStream, uploadedFile.mimetype);

            return Response.status(HttpStatus.OK).json({
                message: 'Profil berhasil diperbarui',
                updatedUploud
            });

        } else {
            const {
                namabadan,
                nama,
                notelpon,
                email,
                alamat
            } = createProfilepetugasDto;

            const updatedUploud = await this.profilepetugasService.updateUploud(
                uploudData._id,
                namabadan,
                nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                notelpon,
                email,
                alamat,
                uploudData.foto
            );

            return Response.status(HttpStatus.OK).json({
                message: 'Profil berhasil diperbarui (tanpa perubahan gambar)',
                updatedUploud
            });
        }
    } catch (err) {
        console.error(`Error saat memperbarui profil: ${err}`);
        return Response.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Terjadi kesalahan saat memperbarui profil'
        });
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

            const profile = await this.profilepetugasService.getProfileByIdAuth(id_user);

            if (!profile) {
                return { message: 'Profil tidak ditemukan' };
            }

            return profile;
        } catch (error) {
            console.error(`Error saat mengambil profil: ${error}`);
            throw new Error('Terjadi kesalahan saat mengambil profil');
        }
    }
}
