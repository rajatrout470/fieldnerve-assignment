import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecommendations1783153000000 implements MigrationInterface {
    name = 'AddRecommendations1783153000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "recommendations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "work_requirement_id" integer NOT NULL, "total_vendors_evaluated" integer NOT NULL, "generated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_recommendations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_recommendations_work_requirement_id" ON "recommendations" ("work_requirement_id")`);

        await queryRunner.query(`CREATE TABLE "recommendation_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recommendation_id" uuid NOT NULL, "vendor_id" integer NOT NULL, "total_score" numeric(5,2), "rank" integer, "score_breakdown" jsonb, "excluded" boolean NOT NULL DEFAULT false, "excluded_reason" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_recommendation_results_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_recommendation_results_recommendation_id" ON "recommendation_results" ("recommendation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_recommendation_results_vendor_id" ON "recommendation_results" ("vendor_id")`);

        await queryRunner.query(`CREATE TYPE "public"."ai_summaries_source_enum" AS ENUM('llm', 'fallback')`);
        await queryRunner.query(`CREATE TABLE "ai_summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recommendation_id" uuid NOT NULL, "summary_text" text NOT NULL, "source" "public"."ai_summaries_source_enum" NOT NULL, "model" character varying(100), "input_tokens" integer, "output_tokens" integer, "generation_time_ms" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ai_summaries_recommendation_id" UNIQUE ("recommendation_id"), CONSTRAINT "PK_ai_summaries_id" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendations_work_requirement_id" FOREIGN KEY ("work_requirement_id") REFERENCES "work_requirements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recommendation_results" ADD CONSTRAINT "FK_recommendation_results_recommendation_id" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recommendation_results" ADD CONSTRAINT "FK_recommendation_results_vendor_id" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_summaries" ADD CONSTRAINT "FK_ai_summaries_recommendation_id" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_summaries" DROP CONSTRAINT "FK_ai_summaries_recommendation_id"`);
        await queryRunner.query(`ALTER TABLE "recommendation_results" DROP CONSTRAINT "FK_recommendation_results_vendor_id"`);
        await queryRunner.query(`ALTER TABLE "recommendation_results" DROP CONSTRAINT "FK_recommendation_results_recommendation_id"`);
        await queryRunner.query(`ALTER TABLE "recommendations" DROP CONSTRAINT "FK_recommendations_work_requirement_id"`);

        await queryRunner.query(`DROP TABLE "ai_summaries"`);
        await queryRunner.query(`DROP TYPE "public"."ai_summaries_source_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_recommendation_results_vendor_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recommendation_results_recommendation_id"`);
        await queryRunner.query(`DROP TABLE "recommendation_results"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_recommendations_work_requirement_id"`);
        await queryRunner.query(`DROP TABLE "recommendations"`);
    }

}
