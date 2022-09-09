import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 通知公告表 sys_notice
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_notice')
export class SysNotice {
  /**公告ID */
  @PrimaryGeneratedColumn({ type: 'int', name: 'notice_id', comment: '公告ID' })
  notice_id: number;

  /**公告标题 */
  @Column('varchar', { name: 'notice_title', comment: '公告标题', length: 50 })
  notice_title: string;

  /**公告类型（1通知 2公告） */
  @Column('char', {
    name: 'notice_type',
    comment: '公告类型（1通知 2公告）',
    length: 1,
  })
  notice_type: string;

  /**公告内容 */
  @Column('longblob', {
    name: 'notice_content',
    nullable: true,
    comment: '公告内容',
  })
  notice_content: Buffer | null;

  /**公告状态（0正常 1关闭） */
  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '公告状态（0正常 1关闭）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

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
    length: 255,
  })
  remark: string | null;
}
