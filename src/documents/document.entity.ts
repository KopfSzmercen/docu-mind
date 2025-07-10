import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { Workspace } from 'src/documents/workspace.entity';
import { User } from 'src/users/user.entity';

@Entity()
export class Document {
  @Property({ primary: true })
  id!: string;

  @Property()
  userId!: string;

  @Property({ type: 'text' })
  text!: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @ManyToOne(() => User, { fieldName: 'userId' })
  user!: User;

  @OneToMany(() => DocumentNote, (note) => note.document)
  notes = new Collection<DocumentNote>(this);

  @Property({ nullable: true })
  workspaceId?: string | null;

  @ManyToOne(() => Workspace, { fieldName: 'workspaceId', nullable: true })
  workspace?: Workspace | null;
}
