import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 测试ORM表 zz_orm
 *
 * 必须要 .entity.ts 结尾的实体文件名称才能匹配使用typeorm实体扫描
 *
 * @author TsMask
 */
@Entity('zz_orm')
export class ZzOrm {
  /**测试ID */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: string;

  /**测试标题 */
  @Column({
    type: 'varchar',
    name: 'title',
  })
  title: string;

  /**orm类型 */
  @Column({ name: 'orm_type' })
  ormType: string;

  /**状态（0关闭 1正常） */
  @Column({ name: 'status' })
  status: string;

  /**创建者 */
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Column({
    length: 500,
    name: 'remark',
  })
  remark: string;
}
