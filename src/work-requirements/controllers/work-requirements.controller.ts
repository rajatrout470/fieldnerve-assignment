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
import { WorkRequirementsService } from '../services/work-requirements.service';
import { CreateWorkRequirementDto } from '../dto/create-work-requirement.dto';
import { UpdateWorkRequirementDto } from '../dto/update-work-requirement.dto';
import { UpdateWorkRequirementStatusDto } from '../dto/update-work-requirement-status.dto';
import { AssignVendorDto } from '../dto/assign-vendor.dto';
import { FilterWorkRequirementDto } from '../dto/filter-work-requirement.dto';
import { WorkRequirement } from '../entities/work-requirement.entity';

@Controller('work-requirements')
export class WorkRequirementsController {
  constructor(
    private readonly workRequirementsService: WorkRequirementsService,
  ) {}

  @Post()
  create(
    @Body() createWorkRequirementDto: CreateWorkRequirementDto,
  ): Promise<WorkRequirement> {
    return this.workRequirementsService.create(createWorkRequirementDto);
  }

  @Get()
  findAll(
    @Query() filters: FilterWorkRequirementDto,
  ): Promise<WorkRequirement[]> {
    const hasFilters = Object.values(filters).some(
      (value) => value !== undefined,
    );
    return hasFilters
      ? this.workRequirementsService.search(filters)
      : this.workRequirementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkRequirement> {
    return this.workRequirementsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkRequirementDto: UpdateWorkRequirementDto,
  ): Promise<WorkRequirement> {
    return this.workRequirementsService.update(id, updateWorkRequirementDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkRequirementStatusDto: UpdateWorkRequirementStatusDto,
  ): Promise<WorkRequirement> {
    return this.workRequirementsService.updateStatus(
      id,
      updateWorkRequirementStatusDto,
    );
  }

  @Patch(':id/assign-vendor')
  assignVendor(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignVendorDto: AssignVendorDto,
  ): Promise<WorkRequirement> {
    return this.workRequirementsService.assignVendor(id, assignVendorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.workRequirementsService.remove(id);
  }
}
