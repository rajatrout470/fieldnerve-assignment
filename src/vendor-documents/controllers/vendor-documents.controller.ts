import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VendorDocumentsService } from '../services/vendor-documents.service';
import { CreateVendorDocumentDto } from '../dto/create-vendor-document.dto';
import { UpdateVendorDocumentDto } from '../dto/update-vendor-document.dto';
import { VendorDocument } from '../entities/vendor-document.entity';

@Controller('vendor-documents')
export class VendorDocumentsController {
  constructor(
    private readonly vendorDocumentsService: VendorDocumentsService,
  ) {}

  @Post()
  create(
    @Body() createVendorDocumentDto: CreateVendorDocumentDto,
  ): Promise<VendorDocument> {
    return this.vendorDocumentsService.create(createVendorDocumentDto);
  }

  @Get()
  findAll(): Promise<VendorDocument[]> {
    return this.vendorDocumentsService.findAll();
  }

  @Get('expired')
  findExpired(): Promise<VendorDocument[]> {
    return this.vendorDocumentsService.findExpiredDocuments();
  }

  @Get('expiring')
  findExpiring(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<VendorDocument[]> {
    return this.vendorDocumentsService.findExpiringDocuments(days);
  }

  @Get('vendor/:vendorId')
  findByVendor(
    @Param('vendorId', ParseIntPipe) vendorId: number,
  ): Promise<VendorDocument[]> {
    return this.vendorDocumentsService.findByVendor(vendorId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<VendorDocument> {
    return this.vendorDocumentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorDocumentDto: UpdateVendorDocumentDto,
  ): Promise<VendorDocument> {
    return this.vendorDocumentsService.update(id, updateVendorDocumentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vendorDocumentsService.remove(id);
  }
}
