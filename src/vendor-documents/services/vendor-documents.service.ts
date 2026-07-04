import { Injectable, NotFoundException } from '@nestjs/common';
import { VendorDocumentsRepository } from '../repositories/vendor-documents.repository';
import { VendorDocument } from '../entities/vendor-document.entity';
import { CreateVendorDocumentDto } from '../dto/create-vendor-document.dto';
import { UpdateVendorDocumentDto } from '../dto/update-vendor-document.dto';

@Injectable()
export class VendorDocumentsService {
  constructor(
    private readonly vendorDocumentsRepository: VendorDocumentsRepository,
  ) {}

  async create(
    createVendorDocumentDto: CreateVendorDocumentDto,
  ): Promise<VendorDocument> {
    return this.vendorDocumentsRepository.createDocument(
      createVendorDocumentDto,
    );
  }

  async findAll(): Promise<VendorDocument[]> {
    return this.vendorDocumentsRepository.findAllDocuments();
  }

  async findByVendor(vendorId: number): Promise<VendorDocument[]> {
    return this.vendorDocumentsRepository.findDocumentsByVendor(vendorId);
  }

  async findOne(id: number): Promise<VendorDocument> {
    const document = await this.vendorDocumentsRepository.findDocumentById(id);
    if (!document) {
      throw new NotFoundException(`Vendor document with id ${id} not found`);
    }
    return document;
  }

  async update(
    id: number,
    updateVendorDocumentDto: UpdateVendorDocumentDto,
  ): Promise<VendorDocument> {
    await this.findOne(id);
    const updated = await this.vendorDocumentsRepository.updateDocument(
      id,
      updateVendorDocumentDto,
    );
    if (!updated) {
      throw new NotFoundException(`Vendor document with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await this.vendorDocumentsRepository.removeDocument(document);
  }

  async findExpiredDocuments(): Promise<VendorDocument[]> {
    return this.vendorDocumentsRepository.findExpired(new Date());
  }

  async findExpiringDocuments(days: number): Promise<VendorDocument[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    return this.vendorDocumentsRepository.findExpiringBetween(now, future);
  }
}
