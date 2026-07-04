import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkRequirementsRepository } from '../repositories/work-requirements.repository';
import { WorkRequirement } from '../entities/work-requirement.entity';
import { CreateWorkRequirementDto } from '../dto/create-work-requirement.dto';
import { UpdateWorkRequirementDto } from '../dto/update-work-requirement.dto';
import { UpdateWorkRequirementStatusDto } from '../dto/update-work-requirement-status.dto';
import { AssignVendorDto } from '../dto/assign-vendor.dto';
import { FilterWorkRequirementDto } from '../dto/filter-work-requirement.dto';
import { WorkRequirementStatus } from '../enums/work-requirement-status.enum';

@Injectable()
export class WorkRequirementsService {
  constructor(
    private readonly workRequirementsRepository: WorkRequirementsRepository,
  ) {}

  async create(
    createWorkRequirementDto: CreateWorkRequirementDto,
  ): Promise<WorkRequirement> {
    return this.workRequirementsRepository.createWorkRequirement(
      createWorkRequirementDto,
    );
  }

  async findAll(): Promise<WorkRequirement[]> {
    return this.workRequirementsRepository.findAllWorkRequirements();
  }

  async findOne(id: number): Promise<WorkRequirement> {
    const workRequirement =
      await this.workRequirementsRepository.findWorkRequirementById(id);
    if (!workRequirement) {
      throw new NotFoundException(`Work requirement with id ${id} not found`);
    }
    return workRequirement;
  }

  async update(
    id: number,
    updateWorkRequirementDto: UpdateWorkRequirementDto,
  ): Promise<WorkRequirement> {
    await this.findOne(id);
    const updated = await this.workRequirementsRepository.updateWorkRequirement(
      id,
      updateWorkRequirementDto,
    );
    if (!updated) {
      throw new NotFoundException(`Work requirement with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const workRequirement = await this.findOne(id);
    await this.workRequirementsRepository.removeWorkRequirement(
      workRequirement,
    );
  }

  async search(filters: FilterWorkRequirementDto): Promise<WorkRequirement[]> {
    return this.workRequirementsRepository.searchWorkRequirements(filters);
  }

  async assignVendor(
    id: number,
    assignVendorDto: AssignVendorDto,
  ): Promise<WorkRequirement> {
    await this.findOne(id);
    const updated = await this.workRequirementsRepository.updateWorkRequirement(
      id,
      {
        assignedVendorId: assignVendorDto.vendorId,
        status: WorkRequirementStatus.ASSIGNED,
        updatedBy: assignVendorDto.updatedBy,
      },
    );
    if (!updated) {
      throw new NotFoundException(`Work requirement with id ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: number,
    updateWorkRequirementStatusDto: UpdateWorkRequirementStatusDto,
  ): Promise<WorkRequirement> {
    await this.findOne(id);
    const updated = await this.workRequirementsRepository.updateWorkRequirement(
      id,
      {
        status: updateWorkRequirementStatusDto.status,
        updatedBy: updateWorkRequirementStatusDto.updatedBy,
      },
    );
    if (!updated) {
      throw new NotFoundException(`Work requirement with id ${id} not found`);
    }
    return updated;
  }
}
