import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorStatus } from '../vendors/enums/vendor-status.enum';
import { VendorDocument } from '../vendor-documents/entities/vendor-document.entity';
import { DocumentType } from '../vendor-documents/enums/document-type.enum';
import { WorkRequirement } from '../work-requirements/entities/work-requirement.entity';
import { Priority } from '../work-requirements/enums/priority.enum';
import { WorkRequirementStatus } from '../work-requirements/enums/work-requirement-status.enum';

const SEED_ACTOR_ID = '00000000-0000-0000-0000-000000000001';

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function seed(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const vendorRepo = dataSource.getRepository(Vendor);
  const documentRepo = dataSource.getRepository(VendorDocument);
  const workRequirementRepo = dataSource.getRepository(WorkRequirement);

  // Scoped to this seed's own data (by email) rather than "any vendor exists",
  // so it can safely run alongside hand-created sample records and stay idempotent.
  const alreadySeeded = await vendorRepo.exists({
    where: { email: 'contact@lonestar-electrical.com' },
  });
  if (alreadySeeded) {
    console.log('Skipping seed: seed data already present.');
    await dataSource.destroy();
    return;
  }

  const [
    lonestar,
    metroplex,
    sunshine,
    retiredCircuits,
    aquaflow,
    capitolTrade,
    hillCountry,
    riverside,
  ] = await vendorRepo.save([
    vendorRepo.create({
      name: 'Lonestar Electrical Co',
      category: 'Electrical',
      email: 'contact@lonestar-electrical.com',
      phone: '+15125550101',
      operatingLocation: 'Austin, TX',
      rating: 4.8,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Metroplex Power Solutions',
      category: 'Electrical',
      email: 'info@metroplexpower.com',
      phone: '+12145550102',
      operatingLocation: 'Dallas, TX',
      rating: 4.2,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Sunshine Electric LLC',
      category: 'Electrical',
      email: 'hello@sunshineelectric.com',
      phone: '+13055550103',
      operatingLocation: 'Miami, FL',
      rating: 3.5,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Retired Circuits Inc',
      category: 'Electrical',
      email: 'ops@retiredcircuits.com',
      phone: '+15125550104',
      operatingLocation: 'Austin, TX',
      rating: 5.0,
      status: VendorStatus.INACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'AquaFlow Plumbing',
      category: 'Plumbing',
      email: 'service@aquaflowplumbing.com',
      phone: '+15125550105',
      operatingLocation: 'Austin, TX',
      rating: 4.9,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Capitol Trade Electric',
      category: 'Electrical',
      email: 'support@capitoltrade.com',
      phone: '+15125550106',
      operatingLocation: 'Austin, TX',
      rating: 4.5,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Hill Country Volt Works',
      category: 'Electrical',
      email: 'contact@hillcountryvolt.com',
      phone: '+15125550107',
      operatingLocation: 'Austin, TX',
      rating: 4.6,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
    vendorRepo.create({
      name: 'Riverside Electrical Group',
      category: 'Electrical',
      email: 'info@riversideelectric.com',
      phone: '+15125550108',
      operatingLocation: 'Austin, TX',
      rating: 4.0,
      status: VendorStatus.ACTIVE,
      createdBy: SEED_ACTOR_ID,
    }),
  ]);

  await documentRepo.save([
    // Lonestar - fully compliant
    documentRepo.create({
      vendorId: lonestar.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1001',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: lonestar.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1001',
      issuingAuthority: 'Texas Dept. of Licensing',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),

    // Metroplex - fully compliant
    documentRepo.create({
      vendorId: metroplex.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1002',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: metroplex.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1002',
      issuingAuthority: 'Texas Dept. of Licensing',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),

    // Sunshine - fully compliant, different region than Austin/Dallas
    documentRepo.create({
      vendorId: sunshine.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1003',
      issuingAuthority: 'Florida DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: sunshine.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1003',
      issuingAuthority: 'Florida Dept. of Business',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),

    // AquaFlow - fully compliant plumbing vendor
    documentRepo.create({
      vendorId: aquaflow.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1005',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: aquaflow.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1005',
      issuingAuthority: 'Texas Dept. of Licensing',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),

    // Capitol Trade Electric - missing the mandatory trade license entirely
    documentRepo.create({
      vendorId: capitolTrade.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1006',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),

    // Hill Country Volt Works - trade license valid, insurance already expired
    documentRepo.create({
      vendorId: hillCountry.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1007',
      issuingAuthority: 'Texas Dept. of Licensing',
      issueDate: isoDate(-400),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: hillCountry.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1007',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-400),
      expiryDate: isoDate(-10),
      createdBy: SEED_ACTOR_ID,
    }),

    // Riverside - compliant but insurance expiring soon, plus an expired non-mandatory safety certificate
    documentRepo.create({
      vendorId: riverside.id,
      documentType: DocumentType.TRADE_LICENSE,
      documentNumber: 'TL-1008',
      issuingAuthority: 'Texas Dept. of Licensing',
      issueDate: isoDate(-300),
      expiryDate: isoDate(300),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: riverside.id,
      documentType: DocumentType.INSURANCE,
      documentNumber: 'INS-1008',
      issuingAuthority: 'Texas DOI',
      issueDate: isoDate(-300),
      expiryDate: isoDate(10),
      createdBy: SEED_ACTOR_ID,
    }),
    documentRepo.create({
      vendorId: riverside.id,
      documentType: DocumentType.SAFETY_CERTIFICATE,
      documentNumber: 'SC-1008',
      issuingAuthority: 'OSHA',
      issueDate: isoDate(-400),
      expiryDate: isoDate(-5),
      createdBy: SEED_ACTOR_ID,
    }),
  ]);

  await workRequirementRepo.save([
    // Exercises: full ranking, region-only location match, priority-fit floor,
    // a close-score trade-off (#1 vs #2 within 5 pts), and an expiring-document risk flag.
    workRequirementRepo.create({
      title: 'Substation Rewiring',
      category: 'Electrical',
      location: 'Austin, TX',
      estimatedValue: '150000',
      priority: Priority.URGENT,
      expectedStartDate: isoDate(15),
      status: WorkRequirementStatus.OPEN,
      createdBy: SEED_ACTOR_ID,
    }),
    // Exercises: single-vendor result, no runner-up, low-priority flat score.
    workRequirementRepo.create({
      title: 'Residential Pipe Replacement',
      category: 'Plumbing',
      location: 'Chicago, IL',
      estimatedValue: '40000',
      priority: Priority.LOW,
      expectedStartDate: isoDate(60),
      status: WorkRequirementStatus.OPEN,
      createdBy: SEED_ACTOR_ID,
    }),
    // Exercises: zero vendors pass the category filter (no Landscaping vendors exist).
    workRequirementRepo.create({
      title: 'Greenhouse Landscaping Overhaul',
      category: 'Landscaping',
      location: 'Austin, TX',
      estimatedValue: '25000',
      priority: Priority.MEDIUM,
      expectedStartDate: isoDate(45),
      status: WorkRequirementStatus.OPEN,
      createdBy: SEED_ACTOR_ID,
    }),
  ]);

  console.log('Seed complete: 8 vendors, 11 documents, 3 work requirements.');
  console.log(
    `Vendors: ${[lonestar, metroplex, sunshine, retiredCircuits, aquaflow, capitolTrade, hillCountry, riverside].map((v) => `${v.id}=${v.name}`).join(', ')}`,
  );

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
