import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 参数配置表 sys_config
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_config')
export class SysConfig {
  /**参数主键 */
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'config_id',
    comment: '参数主键',
  })
  config_id: number;

  /**参数名称 */
  @Column('varchar', {
    name: 'config_name',
    nullable: true,
    comment: '参数名称',
    length: 100,
  })
  config_name: string | null;

  /**参数键名 */
  @Column('varchar', {
    name: 'config_key',
    nullable: true,
    comment: '参数键名',
    length: 100,
  })
  config_key: string | null;

  /**参数键值 */
  @Column('varchar', {
    name: 'config_value',
    nullable: true,
    comment: '参数键值',
    length: 500,
  })
  config_value: string | null;

  /**系统内置（Y是 N否） */
  @Column('char', {
    name: 'config_type',
    nullable: true,
    comment: '系统内置（Y是 N否）',
    length: 1,
    default: () => "'N'",
  })
  config_type: string | null;

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
