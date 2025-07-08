import { Migration } from '@mikro-orm/migrations';

export class Migration20250707183620_init extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" varchar(255) not null, "full_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "document" ("id" varchar(255) not null, "user_id" varchar(255) not null, "text" text not null, "created_at" timestamptz not null, "userId" varchar(255) not null, constraint "document_pkey" primary key ("id"));`);

    this.addSql(`alter table "document" add constraint "document_userId_foreign" foreign key ("userId") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "document" drop constraint "document_userId_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "document" cascade;`);
  }

}
