import { Injectable, NotFoundException } from '@nestjs/common';
import { VendorsRepository } from '../repositories/vendors.repository';
import { Vendor } from '../entities/vendor.entity';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { UpdateVendorStatusDto } from '../dto/update-vendor-status.dto';
import { FilterVendorDto } from '../dto/filter-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    return this.vendorsRepository.createVendor(createVendorDto);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorsRepository.findAllVendors();
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findVendorById(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor with id ${id} not found`);
    }
    return vendor;
  }

  async update(id: number, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    await this.findOne(id);
    const updated = await this.vendorsRepository.updateVendor(
      id,
      updateVendorDto,
    );
    if (!updated) {
      throw new NotFoundException(`Vendor with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorsRepository.removeVendor(vendor);
  }

  async updateStatus(
    id: number,
    updateVendorStatusDto: UpdateVendorStatusDto,
  ): Promise<Vendor> {
    await this.findOne(id);
    const updated = await this.vendorsRepository.updateVendor(id, {
      status: updateVendorStatusDto.status,
      updatedBy: updateVendorStatusDto.updatedBy,
    });
    if (!updated) {
      throw new NotFoundException(`Vendor with id ${id} not found`);
    }
    return updated;
  }

  async search(filters: FilterVendorDto): Promise<Vendor[]> {
    return this.vendorsRepository.searchVendors(filters);
  }
}
