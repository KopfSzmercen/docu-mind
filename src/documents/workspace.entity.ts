import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { Document } from './document.entity';

@Entity()
export class Workspace {
  @Property({ primary: true })
  id!: string;

  @Property()
  userId!: string;

  @Property()
  name!: string;

  @OneToMany(() => Document, (document) => document.workspace)
  documents = new Collection<Document>(this);
}
