import { Migration } from '@mikro-orm/migrations';

export class Migration20250710192022_add_categories extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "category" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz null, constraint "category_pkey" primary key ("id"));`);

    this.addSql(`alter table "document" add column "category_id" varchar(255) null, add column "categoryId" varchar(255) null;`);
    this.addSql(`alter table "document" add constraint "document_categoryId_foreign" foreign key ("categoryId") references "category" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "document" drop constraint "document_categoryId_foreign";`);

    this.addSql(`drop table if exists "category" cascade;`);

    this.addSql(`alter table "document" drop column "category_id", drop column "categoryId";`);
  }

}
