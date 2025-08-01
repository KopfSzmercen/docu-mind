import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
export class User {
  @PrimaryKey()
  id!: string;

  @Property()
  fullName!: string;

  @Property()
  @Unique()
  email!: string;

  @Property()
  password!: string;
}
