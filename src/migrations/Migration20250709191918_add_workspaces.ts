import { Migration } from '@mikro-orm/migrations';

export class Migration20250709191918_add_workspaces extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "workspace" ("id" varchar(255) not null, "user_id" varchar(255) not null, "name" varchar(255) not null, constraint "workspace_pkey" primary key ("id"));`);

    this.addSql(`alter table "document" add column "workspace_id" varchar(255) null, add column "workspaceId" varchar(255) null;`);
    this.addSql(`alter table "document" add constraint "document_workspaceId_foreign" foreign key ("workspaceId") references "workspace" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "document" drop constraint "document_workspaceId_foreign";`);

    this.addSql(`drop table if exists "workspace" cascade;`);

    this.addSql(`alter table "document" drop column "workspace_id", drop column "workspaceId";`);
  }

}
