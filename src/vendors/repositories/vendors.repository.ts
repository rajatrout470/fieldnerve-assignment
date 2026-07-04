import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Vendor } from '../entities/vendor.entity';
import { FilterVendorDto } from '../dto/filter-vendor.dto';

@Injectable()
export class VendorsRepository extends Repository<Vendor> {
  constructor(private readonly dataSource: DataSource) {
    super(Vendor, dataSource.createEntityManager());
  }

  async createVendor(data: Partial<Vendor>): Promise<Vendor> {
    const vendor = this.create(data);
    return this.save(vendor);
  }

  async findAllVendors(): Promise<Vendor[]> {
    return this.find();
  }

  async findVendorById(id: number): Promise<Vendor | null> {
    return this.findOne({ where: { id } });
  }

  async updateVendor(
    id: number,
    data: Partial<Vendor>,
  ): Promise<Vendor | null> {
    await this.update(id, data);
    return this.findVendorById(id);
  }

  async removeVendor(vendor: Vendor): Promise<Vendor> {
    return this.remove(vendor);
  }

  async searchVendors(filters: FilterVendorDto): Promise<Vendor[]> {
    const query = this.createQueryBuilder('vendor');

    if (filters.name) {
      query.andWhere('vendor.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.category) {
      query.andWhere('vendor.category = :category', {
        category: filters.category,
      });
    }

    if (filters.operatingLocation) {
      query.andWhere('vendor.operatingLocation ILIKE :operatingLocation', {
        operatingLocation: `%${filters.operatingLocation}%`,
      });
    }

    if (filters.status) {
      query.andWhere('vendor.status = :status', { status: filters.status });
    }

    if (filters.minRating !== undefined) {
      query.andWhere('vendor.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    return query.getMany();
  }
}
