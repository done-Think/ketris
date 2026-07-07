import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'properties' })
export class PropertyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  title!: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;
}
