import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260309111635 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "digital_asset" ("id" text not null, "title" text not null, "file_url" text not null, "file_name" text null, "mime_type" text null, "storage_provider" text not null default 'external', "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "digital_asset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_digital_asset_deleted_at" ON "digital_asset" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "variant_digital_asset_link" ("id" text not null, "variant_id" text not null, "digital_asset_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "variant_digital_asset_link_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_variant_digital_asset_link_deleted_at" ON "variant_digital_asset_link" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "digital_asset" cascade;`);

    this.addSql(`drop table if exists "variant_digital_asset_link" cascade;`);
  }

}
