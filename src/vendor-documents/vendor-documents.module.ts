import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorDocument } from './entities/vendor-document.entity';
import { VendorDocumentsController } from './controllers/vendor-documents.controller';
import { VendorDocumentsService } from './services/vendor-documents.service';
import { VendorDocumentsRepository } from './repositories/vendor-documents.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VendorDocument])],
  controllers: [VendorDocumentsController],
  providers: [VendorDocumentsService, VendorDocumentsRepository],
  exports: [VendorDocumentsService],
})
export class VendorDocumentsModule {}
