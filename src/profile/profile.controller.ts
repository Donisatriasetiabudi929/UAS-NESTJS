import { Body, Controller, Post, Headers, UploadedFile, UseInterceptors, Get, Param, Res, HttpStatus, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProfileDto } from 'src/dto/create-profile.dto';
import { randomBytes } from 'crypto';

@Controller('profile')
export class ProfileController {
    constructor(
        private readonly profileService: ProfileService,
        private readonly authService: AuthService
    ) { }

    @Post('/add')
    @UseInterceptors(FileInterceptor('foto'))
    async uploadFile(
        @UploadedFile() uploadedFile: Express.Multer.File,
        @Body() createProfileDto: CreateProfileDto,
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
                nik,
                nama,
                notelpon,
                email,
                gender,
                tanggal_lahir,
                alamat
            } = createProfileDto;

            await this.profileService.uploadFile('pengaduan.profile', objectName, readableStream, uploadedFile.mimetype);


            await this.profileService.createUploud(
                id_user,
                nik,
                nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                notelpon,
                email,
                gender,
                tanggal_lahir,
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

            const profile = await this.profileService.getProfileByIdAuth(id_user);

            if (!profile) {
                return { message: 'Profil tidak ditemukan' };
            }

            return profile;
        } catch (error) {
            console.error(`Error saat mengambil profil: ${error}`);
            throw new Error('Terjadi kesalahan saat mengambil profil');
        }
    }

    @Get('/all')
    async getUplouds(@Res() Response) {
        try {
            const profileData = await this.profileService.getAllProfile();
            return Response.status(HttpStatus.OK).json({
                message: 'Semua data profile berhasil di temukan', profileData
            });
        } catch (err) {
            return Response.status(err.status).json(err.Response);
        }
    }

    @Get('/profile/:id')
    async getProfileById(@Param('id') id: string, @Res() Response) {
        try {
            const profile = await this.profileService.getProfileById(id);

            if (!profile) {
                return Response.status(HttpStatus.NOT_FOUND).json({
                    message: 'Data profile tidak ditemukan'
                });
            }

            return Response.status(HttpStatus.OK).json({
                message: 'Data profile berhasil ditemukan',
                profile
            });
        } catch (err) {
            return Response.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Terjadi kesalahan saat mengambil data profile'
            });
        }
    }

    @Put('/edit')
    @UseInterceptors(FileInterceptor('foto'))
    async updateUploud(
        @Res() Response,
        @Param('id') uploudId: string,
        @Body() createProfileDto: CreateProfileDto,
        @UploadedFile() uploadeddFile: Express.Multer.File,
        @Headers() headers: Record<string, string>,
    ) {
        try {
            const { id_user } = await this.authService.getUserFromToken(headers['authorization'].split(' ')[1]);
            if (!id_user) {
                return Response.status(HttpStatus.UNAUTHORIZED).json({
                    message: 'Token tidak valid',
                });
            }
            const uploudData = await this.profileService.getProfileByIdAuth(id_user);
            if (uploadeddFile) {
                await this.profileService.deleteFile('pengaduan.profile', uploudData.foto);
                const {
		            nik,
                    nama,
		            notelpon,
                    email,
                    gender,
                    tanggal_lahir,
                    alamat
                } = createProfileDto;
                const file = uploadeddFile.originalname;
                const uniqueCode = randomBytes(5).toString('hex');
                const namefilee = `${uniqueCode}-${uploadeddFile.originalname}`;
                const updatedUploud = await this.profileService.updateUploud(
                    uploudData._id,
		            nik,
                    nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                    notelpon,
                    email,
                    gender,
                    tanggal_lahir,
                    alamat,
                    namefilee
                );
                const stream = require('stream');
                const readableStream = new stream.PassThrough();
                readableStream.end(uploadeddFile.buffer);
                const objectName = namefilee;
                await this.profileService.uploadFile('pengaduan.profile', objectName, readableStream, uploadeddFile.mimetype);
                return Response.status(HttpStatus.OK).json({
                    message: 'Profil berhasil diperbarui',
                    updatedUploud
                });

            } else {
                const {
		            nik,
                    nama,
                    notelpon,
                    email,
                    gender,
                    tanggal_lahir,
                    alamat
                } = createProfileDto;
                const updatedUploud = await this.profileService.updateUploud(
                    uploudData._id,
		            nik,
                    nama.replace(/\b\w/g, (char) => char.toUpperCase()),
                    notelpon,
                    email,
                    gender,
                    tanggal_lahir,
                    alamat,
                    uploudData.foto
                );

                return Response.status(HttpStatus.OK).json({
                    message: 'Profil berhasil diperbarui (tanpa perubahan gambar)',
                    updatedUploud
                });
            }
        } catch (err) {
            return Response.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Terjadi kesalahan saat memperbarui profil'
            });
        }
    }
}
