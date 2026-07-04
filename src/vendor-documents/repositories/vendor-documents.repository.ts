import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { VendorDocument } from '../entities/vendor-document.entity';

@Injectable()
export class VendorDocumentsRepository extends Repository<VendorDocument> {
  constructor(private readonly dataSource: DataSource) {
    super(VendorDocument, dataSource.createEntityManager());
  }

  async createDocument(
    data: Partial<VendorDocument> & { vendorId: number },
  ): Promise<VendorDocument> {
    const document = this.create(data);
    return this.save(document);
  }

  async findAllDocuments(): Promise<VendorDocument[]> {
    return this.find({ relations: { vendor: true } });
  }

  async findDocumentsByVendor(vendorId: number): Promise<VendorDocument[]> {
    return this.find({
      where: { vendorId },
      relations: { vendor: true },
    });
  }

  async findDocumentById(id: number): Promise<VendorDocument | null> {
    return this.findOne({ where: { id }, relations: { vendor: true } });
  }

  async updateDocument(
    id: number,
    data: Partial<VendorDocument>,
  ): Promise<VendorDocument | null> {
    await this.update(id, data);
    return this.findDocumentById(id);
  }

  async removeDocument(document: VendorDocument): Promise<VendorDocument> {
    return this.remove(document);
  }

  async findExpired(referenceDate: Date): Promise<VendorDocument[]> {
    const formatted = referenceDate.toISOString().slice(0, 10);
    return this.find({
      where: { expiryDate: LessThanOrEqual(formatted) },
      relations: { vendor: true },
    });
  }

  async findExpiringBetween(
    fromDate: Date,
    toDate: Date,
  ): Promise<VendorDocument[]> {
    return this.createQueryBuilder('document')
      .leftJoinAndSelect('document.vendor', 'vendor')
      .where('document.expiryDate BETWEEN :fromDate AND :toDate', {
        fromDate: fromDate.toISOString().slice(0, 10),
        toDate: toDate.toISOString().slice(0, 10),
      })
      .getMany();
  }
}
