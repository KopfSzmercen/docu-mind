import { Migration } from '@mikro-orm/migrations';

export class Migration20250710192831_add_category_name extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "category" add column "name" varchar(255) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "category" drop column "name";`);
  }

}
