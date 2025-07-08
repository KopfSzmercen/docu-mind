import { Migration } from '@mikro-orm/migrations';

export class Migration20250708185517_add_document_notes extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "document_note" ("id" varchar(255) not null, "text" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "document_id" varchar(255) not null, "documentId" varchar(255) not null, constraint "document_note_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "document_note" add constraint "document_note_documentId_foreign" foreign key ("documentId") references "document" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "document" add column "updated_at" timestamptz null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "document_note" cascade;`);

    this.addSql(`alter table "document" drop column "updated_at";`);
  }
}
