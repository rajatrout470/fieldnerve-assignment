import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VendorsModule } from './vendors/vendors.module';
import { VendorDocumentsModule } from './vendor-documents/vendor-documents.module';
import { WorkRequirementsModule } from './work-requirements/work-requirements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    VendorsModule,
    VendorDocumentsModule,
    WorkRequirementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
