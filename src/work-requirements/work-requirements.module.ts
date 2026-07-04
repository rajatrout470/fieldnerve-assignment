import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkRequirement } from './entities/work-requirement.entity';
import { WorkRequirementsController } from './controllers/work-requirements.controller';
import { WorkRequirementsService } from './services/work-requirements.service';
import { WorkRequirementsRepository } from './repositories/work-requirements.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WorkRequirement])],
  controllers: [WorkRequirementsController],
  providers: [WorkRequirementsService, WorkRequirementsRepository],
  exports: [WorkRequirementsService],
})
export class WorkRequirementsModule {}
