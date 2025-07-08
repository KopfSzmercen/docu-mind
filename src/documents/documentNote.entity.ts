import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Document } from 'src/documents/document.entity';

@Entity()
export class DocumentNote {
  @Property({ primary: true })
  id!: string;

  @Property({ type: 'text' })
  text!: string;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property()
  documentId!: string;

  @ManyToOne(() => Document, { fieldName: 'documentId' })
  document!: Document;
}
