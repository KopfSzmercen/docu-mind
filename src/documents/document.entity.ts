import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from 'src/users/user.entity';

@Entity()
export class Document {
  @Property({ primary: true })
  id!: string;

  @Property()
  userId!: string;

  @Property({ type: 'text' })
  text!: string;

  @Property()
  createdAt!: Date;

  @ManyToOne(() => User, { fieldName: 'userId' })
  user!: User;
}
