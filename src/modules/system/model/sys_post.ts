import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 岗位表 sys_post
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_post')
export class SysPost {
  /**岗位ID */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'post_id',
    comment: '岗位ID',
  })
  post_id: string;

  /**岗位编码 */
  @Column('varchar', { name: 'post_code', comment: '岗位编码', length: 64 })
  post_code: string;

  /**岗位名称 */
  @Column('varchar', { name: 'post_name', comment: '岗位名称', length: 50 })
  post_name: string;

  /**显示顺序 */
  @Column('int', { name: 'post_sort', comment: '显示顺序' })
  post_sort: number;

  /**状态（0正常 1停用） */
  @Column('char', { name: 'status', comment: '状态（0正常 1停用）', length: 1 })
  status: string;

  /**创建者 */
  @Column('varchar', {
    name: 'create_by',
    nullable: true,
    comment: '创建者',
    length: 64,
  })
  create_by: string | null;

  /**创建时间 */
  @Column('datetime', {
    name: 'create_time',
    nullable: true,
    comment: '创建时间',
  })
  create_time: Date | null;

  /**更新者 */
  @Column('varchar', {
    name: 'update_by',
    nullable: true,
    comment: '更新者',
    length: 64,
  })
  update_by: string | null;

  /**更新时间 */
  @Column('datetime', {
    name: 'update_time',
    nullable: true,
    comment: '更新时间',
  })
  update_time: Date | null;

  /**备注 */
  @Column('varchar', {
    name: 'remark',
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string | null;
}
