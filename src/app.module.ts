import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schema/user.schema';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ProfileSchema } from './schema/profile.schema';
import { ProfileService } from './profile/profile.service';
import { ProfileController } from './profile/profile.controller';
import { PengaduanController } from './pengaduan/pengaduan.controller';
import { PengaduanService } from './pengaduan/pengaduan.service';
import { Pengaduanschema } from './schema/pengaduan.schema';
import { ProfilepetugasController } from './profilepetugas/profilepetugas.controller';
import { ProfilepetugasService } from './profilepetugas/profilepetugas.service';
import { ProfilepetugasSchema } from './schema/profilepetugas.schema';
import { TanggapanController } from './tanggapan/tanggapan.controller';
import { TanggapanService } from './tanggapan/tanggapan.service';
import { TanggapanSchema } from './schema/tanggapan.schema';


@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.registerAsync({
          imports: [ConfigModule],
            useFactory: (config: ConfigService) =>{
                return{
                    secret: config.get<string>('JWT_SECRET'),
                    signOptions: {
                        expiresIn :config.get<string | number>('JWT_EXPIRES'),
                    },
                };
            },            
            inject: [ConfigService],
        }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/pengaduan'),
    MongooseModule.forFeature([{name: 'User', schema: UserSchema}]),
    MongooseModule.forFeature([{name: 'Profile', schema: ProfileSchema}]),
    MongooseModule.forFeature([{name: 'Pengaduan', schema: Pengaduanschema}]),
    MongooseModule.forFeature([{name: 'Profilepetugas', schema: ProfilepetugasSchema}]),
    MongooseModule.forFeature([{name: 'Tanggapan', schema: TanggapanSchema}]),
  ],
  controllers: [AppController, AuthController, ProfileController, PengaduanController, ProfilepetugasController, TanggapanController],
  providers: [AppService, AuthService, JwtStrategy, ProfileService, PengaduanService, ProfilepetugasService, TanggapanService],
  exports: [JwtStrategy, PassportModule],
})
export class AppModule {}
