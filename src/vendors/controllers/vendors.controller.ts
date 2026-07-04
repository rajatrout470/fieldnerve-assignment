import {
  Body,
  Controller,
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
import { VendorsService } from '../services/vendors.service';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { UpdateVendorStatusDto } from '../dto/update-vendor-status.dto';
import { FilterVendorDto } from '../dto/filter-vendor.dto';
import { Vendor } from '../entities/vendor.entity';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() createVendorDto: CreateVendorDto): Promise<Vendor> {
    return this.vendorsService.create(createVendorDto);
  }

  @Get()
  findAll(@Query() filters: FilterVendorDto): Promise<Vendor[]> {
    const hasFilters = Object.values(filters).some(
      (value) => value !== undefined,
    );
    return hasFilters
      ? this.vendorsService.search(filters)
      : this.vendorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Vendor> {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<Vendor> {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorStatusDto: UpdateVendorStatusDto,
  ): Promise<Vendor> {
    return this.vendorsService.updateStatus(id, updateVendorStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vendorsService.remove(id);
  }
}
