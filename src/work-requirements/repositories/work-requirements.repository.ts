import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkRequirement } from '../entities/work-requirement.entity';
import { FilterWorkRequirementDto } from '../dto/filter-work-requirement.dto';

@Injectable()
export class WorkRequirementsRepository extends Repository<WorkRequirement> {
  constructor(private readonly dataSource: DataSource) {
    super(WorkRequirement, dataSource.createEntityManager());
  }

  async createWorkRequirement(
    data: Partial<WorkRequirement>,
  ): Promise<WorkRequirement> {
    const workRequirement = this.create(data);
    return this.save(workRequirement);
  }

  async findAllWorkRequirements(): Promise<WorkRequirement[]> {
    return this.find();
  }

  async findWorkRequirementById(id: number): Promise<WorkRequirement | null> {
    return this.findOne({ where: { id } });
  }

  async updateWorkRequirement(
    id: number,
    data: Partial<WorkRequirement>,
  ): Promise<WorkRequirement | null> {
    await this.update(id, data);
    return this.findWorkRequirementById(id);
  }

  async removeWorkRequirement(
    workRequirement: WorkRequirement,
  ): Promise<WorkRequirement> {
    return this.remove(workRequirement);
  }

  async searchWorkRequirements(
    filters: FilterWorkRequirementDto,
  ): Promise<WorkRequirement[]> {
    const query = this.createQueryBuilder('workRequirement');

    if (filters.title) {
      query.andWhere('workRequirement.title ILIKE :title', {
        title: `%${filters.title}%`,
      });
    }

    if (filters.category) {
      query.andWhere('workRequirement.category = :category', {
        category: filters.category,
      });
    }

    if (filters.location) {
      query.andWhere('workRequirement.location ILIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    if (filters.priority) {
      query.andWhere('workRequirement.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.status) {
      query.andWhere('workRequirement.status = :status', {
        status: filters.status,
      });
    }

    return query.getMany();
  }
}
