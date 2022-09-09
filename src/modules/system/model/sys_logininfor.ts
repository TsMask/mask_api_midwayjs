import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 系统访问记录表 sys_logininfor
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_logininfor')
export class SysLogininfor {
  /**访问ID */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'info_id',
    comment: '访问ID',
  })
  info_id: string;

  /**用户账号 */
  @Column('varchar', {
    name: 'user_name',
    nullable: true,
    comment: '用户账号',
    length: 50,
  })
  user_name: string | null;

  /**登录IP地址 */
  @Column('varchar', {
    name: 'ipaddr',
    nullable: true,
    comment: '登录IP地址',
    length: 128,
  })
  ipaddr: string | null;

  /**登录地点 */
  @Column('varchar', {
    name: 'login_location',
    nullable: true,
    comment: '登录地点',
    length: 255,
  })
  login_location: string | null;

  /**浏览器类型 */
  @Column('varchar', {
    name: 'browser',
    nullable: true,
    comment: '浏览器类型',
    length: 50,
  })
  browser: string | null;

  /**操作系统 */
  @Column('varchar', {
    name: 'os',
    nullable: true,
    comment: '操作系统',
    length: 50,
  })
  os: string | null;

  /**登录状态（0成功 1失败） */
  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '登录状态（0成功 1失败）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  /**提示消息 */
  @Column('varchar', {
    name: 'msg',
    nullable: true,
    comment: '提示消息',
    length: 255,
  })
  msg: string | null;

  /**访问时间 */
  @Column('datetime', {
    name: 'login_time',
    nullable: true,
    comment: '访问时间',
  })
  login_time: Date | null;
}
