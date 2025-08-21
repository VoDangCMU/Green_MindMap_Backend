import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1755805117503 implements MigrationInterface {
    name = 'AutoMigration1755805117503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "behaviors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "type" text NOT NULL, "keywords" text array NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "threadHallId" uuid, CONSTRAINT "PK_dc34a2b981fe38b508ba9957255" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "placeholder" text array NOT NULL, "answer_type" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "address" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "big_five" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "openness" double precision NOT NULL, "conscientiousness" double precision NOT NULL, "extraversion" double precision NOT NULL, "agreeableness" double precision NOT NULL, "neuroticism" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2a3478d2ae6405fdf061726b5ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "calories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "energy_kcal" double precision NOT NULL, "protein_g" double precision NOT NULL, "fat_g" double precision NOT NULL, "carbs_g" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fbbaaf701b9370e4a9c2b7e7b07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "food_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "barcode" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "caloriesId" uuid, CONSTRAINT "PK_6b37e62b21c674c714a581c59a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issued_at" TIME WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "scansId" uuid, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scan_time" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "foodItemsId" uuid, "userId" uuid, CONSTRAINT "PK_41156c08314b9e541c1cb18c588" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phoneNumber" character varying(20), "password" character varying(255) NOT NULL, "fullName" character varying(100), "role" character varying(50), "dateOfBirth" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_answers" ("user_id" uuid NOT NULL, "question_id" uuid NOT NULL, "answer" text NOT NULL, "timestamp" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b98aee2579df632ccb8b36ba49" PRIMARY KEY ("user_id", "question_id"))`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "trait" bigint NOT NULL, "placeholders" text NOT NULL, "expected_answer" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "templateId" uuid, "threadHallId" uuid, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "traits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, "label" text NOT NULL, CONSTRAINT "PK_3956071aa0a8eb8210aa1c6a563" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "thread_halls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "traitsId" uuid, CONSTRAINT "PK_09adb0fdf43ef0228e7568631af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(255) NOT NULL, "deviceID" character varying(50), "expiredAt" TIMESTAMP NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6a8ca5961656d13c16c04079dd3" UNIQUE ("token"), CONSTRAINT "UQ_6e88a0a447be3fa009b4051c196" UNIQUE ("deviceID"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "behaviors" ADD CONSTRAINT "FK_5afc686724620f4c13d4cf1a29c" FOREIGN KEY ("threadHallId") REFERENCES "thread_halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_78eda52dc27b7ad20350c4a752d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "food_items" ADD CONSTRAINT "FK_64f0e2dee015dc132a254c0e513" FOREIGN KEY ("caloriesId") REFERENCES "calories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_fcbe490dc37a1abf68f19c5ccb9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_02cd4a1e7eefac58057c27e1454" FOREIGN KEY ("scansId") REFERENCES "scans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scans" ADD CONSTRAINT "FK_57095699a6f103d94285bce1221" FOREIGN KEY ("foodItemsId") REFERENCES "food_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scans" ADD CONSTRAINT "FK_3c9fda05783a207f1bb62777f17" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_answers" ADD CONSTRAINT "FK_d84d10f2e3b97a037d5479bf669" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_answers" ADD CONSTRAINT "FK_adae59e684b873b084be36c5a7a" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_900ccfcf91e174e7e275de127f1" FOREIGN KEY ("threadHallId") REFERENCES "thread_halls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_halls" ADD CONSTRAINT "FK_204ecc176a8ce3f0d835a85840f" FOREIGN KEY ("traitsId") REFERENCES "traits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2"`);
        await queryRunner.query(`ALTER TABLE "thread_halls" DROP CONSTRAINT "FK_204ecc176a8ce3f0d835a85840f"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_900ccfcf91e174e7e275de127f1"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09"`);
        await queryRunner.query(`ALTER TABLE "user_answers" DROP CONSTRAINT "FK_adae59e684b873b084be36c5a7a"`);
        await queryRunner.query(`ALTER TABLE "user_answers" DROP CONSTRAINT "FK_d84d10f2e3b97a037d5479bf669"`);
        await queryRunner.query(`ALTER TABLE "scans" DROP CONSTRAINT "FK_3c9fda05783a207f1bb62777f17"`);
        await queryRunner.query(`ALTER TABLE "scans" DROP CONSTRAINT "FK_57095699a6f103d94285bce1221"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_02cd4a1e7eefac58057c27e1454"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_fcbe490dc37a1abf68f19c5ccb9"`);
        await queryRunner.query(`ALTER TABLE "food_items" DROP CONSTRAINT "FK_64f0e2dee015dc132a254c0e513"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_78eda52dc27b7ad20350c4a752d"`);
        await queryRunner.query(`ALTER TABLE "behaviors" DROP CONSTRAINT "FK_5afc686724620f4c13d4cf1a29c"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP TABLE "thread_halls"`);
        await queryRunner.query(`DROP TABLE "traits"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "user_answers"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "scans"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "food_items"`);
        await queryRunner.query(`DROP TABLE "calories"`);
        await queryRunner.query(`DROP TABLE "big_five"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TABLE "behaviors"`);
    }

}
