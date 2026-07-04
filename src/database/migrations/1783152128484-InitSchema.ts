import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1783152128484 implements MigrationInterface {
    name = 'InitSchema1783152128484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vendors_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_VERIFICATION', 'UNAVAILABLE', 'AVAILABLE')`);
        await queryRunner.query(`CREATE TABLE "vendors" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "category" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50) NOT NULL, "operating_location" character varying(255) NOT NULL, "rating" numeric(3,2) NOT NULL DEFAULT '0', "status" "public"."vendors_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_by" uuid, CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_06e56fe0ca221ef324f2227772" ON "vendors"  ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."vendor_documents_document_type_enum" AS ENUM('TAX_REGISTRATION', 'INSURANCE', 'TRADE_LICENSE', 'SAFETY_CERTIFICATE', 'AGREEMENT')`);
        await queryRunner.query(`CREATE TABLE "vendor_documents" ("id" SERIAL NOT NULL, "vendor_id" integer NOT NULL, "document_type" "public"."vendor_documents_document_type_enum" NOT NULL, "document_number" character varying(255) NOT NULL, "issuing_authority" character varying(255) NOT NULL, "issue_date" date NOT NULL, "expiry_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_by" uuid, CONSTRAINT "PK_b6aa864f4d6f4a283445266a4dc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_218ad2aece37d1c3bf7cfe6c72" ON "vendor_documents"  ("vendor_id") `);
        await queryRunner.query(`CREATE TYPE "public"."work_requirements_priority_enum" AS ENUM('URGENT', 'HIGH', 'MEDIUM', 'LOW')`);
        await queryRunner.query(`CREATE TYPE "public"."work_requirements_status_enum" AS ENUM('OPEN', 'ASSIGNED', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "work_requirements" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "category" character varying(255) NOT NULL, "location" character varying(255) NOT NULL, "estimated_value" character varying(255) NOT NULL, "priority" "public"."work_requirements_priority_enum" NOT NULL, "expected_start_date" date NOT NULL, "status" "public"."work_requirements_status_enum" NOT NULL DEFAULT 'OPEN', "assigned_vendor_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_by" uuid, CONSTRAINT "PK_c4d14a92ff5b1f74662342dd04a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c45d8455a15cf940deddac806f" ON "work_requirements"  ("priority") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c542553768260345f710f9776" ON "work_requirements"  ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ae01b7ee386c850bf3f400877" ON "work_requirements"  ("assigned_vendor_id") `);
        await queryRunner.query(`ALTER TABLE "vendor_documents" ADD CONSTRAINT "FK_218ad2aece37d1c3bf7cfe6c72f" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendor_documents" DROP CONSTRAINT "FK_218ad2aece37d1c3bf7cfe6c72f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ae01b7ee386c850bf3f400877"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c542553768260345f710f9776"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c45d8455a15cf940deddac806f"`);
        await queryRunner.query(`DROP TABLE "work_requirements"`);
        await queryRunner.query(`DROP TYPE "public"."work_requirements_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."work_requirements_priority_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_218ad2aece37d1c3bf7cfe6c72"`);
        await queryRunner.query(`DROP TABLE "vendor_documents"`);
        await queryRunner.query(`DROP TYPE "public"."vendor_documents_document_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06e56fe0ca221ef324f2227772"`);
        await queryRunner.query(`DROP TABLE "vendors"`);
        await queryRunner.query(`DROP TYPE "public"."vendors_status_enum"`);
    }

}
