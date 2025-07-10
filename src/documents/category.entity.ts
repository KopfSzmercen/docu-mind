import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { Document } from './document.entity';

@Entity()
export class Category {
  @Property({ primary: true })
  id!: string;

  @Property()
  name!: string;

  @OneToMany(() => Document, (document) => document.category)
  documents = new Collection<Document>(this);

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;
}
