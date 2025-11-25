import { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateInvoice1764045206631 implements MigrationInterface {
    name = 'RecreateInvoice1764045206631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "source_id" character varying(100), "currency" character varying(10) NOT NULL DEFAULT 'VND', "payment_method" character varying(50), "notes" text, "vendor_name" character varying(255), "vendor_address" text, "vendor_geo_hint" character varying(255), "invoice_date" character varying(20), "invoice_time" character varying(20), "items" jsonb NOT NULL, "subtotal" numeric(15,2), "discount" numeric(15,2) DEFAULT '0', "tax" numeric(15,2) DEFAULT '0', "grand_total" numeric(15,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP TABLE "invoices"`);
    }

}
