import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 操作日志记录表 sys_oper_log
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_oper_log')
export class SysOperLog {
  /**日志主键 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'oper_id',
    comment: '日志主键',
  })
  oper_id: string;

  /**模块标题 */
  @Column('varchar', {
    name: 'title',
    nullable: true,
    comment: '模块标题',
    length: 50,
  })
  title: string | null;

  /**业务类型（0其它 1新增 2修改 3删除） */
  @Column('int', {
    name: 'business_type',
    nullable: true,
    comment: '业务类型（0其它 1新增 2修改 3删除）',
    default: () => "'0'",
  })
  business_type: number | null;

  /**方法名称 */
  @Column('varchar', {
    name: 'method',
    nullable: true,
    comment: '方法名称',
    length: 100,
  })
  method: string | null;

  /**请求方式 */
  @Column('varchar', {
    name: 'request_method',
    nullable: true,
    comment: '请求方式',
    length: 10,
  })
  request_method: string | null;

  /**操作类别（0其它 1后台用户 2手机端用户） */
  @Column('int', {
    name: 'operator_type',
    nullable: true,
    comment: '操作类别（0其它 1后台用户 2手机端用户）',
    default: () => "'0'",
  })
  operator_type: number | null;

  /**操作人员 */
  @Column('varchar', {
    name: 'oper_name',
    nullable: true,
    comment: '操作人员',
    length: 50,
  })
  oper_name: string | null;

  /**部门名称 */
  @Column('varchar', {
    name: 'dept_name',
    nullable: true,
    comment: '部门名称',
    length: 50,
  })
  dept_name: string | null;

  /**请求URL */
  @Column('varchar', {
    name: 'oper_url',
    nullable: true,
    comment: '请求URL',
    length: 255,
  })
  oper_url: string | null;

  /**主机地址 */
  @Column('varchar', {
    name: 'oper_ip',
    nullable: true,
    comment: '主机地址',
    length: 128,
  })
  oper_ip: string | null;

  /**操作地点 */
  @Column('varchar', {
    name: 'oper_location',
    nullable: true,
    comment: '操作地点',
    length: 255,
  })
  oper_location: string | null;

  /**请求参数 */
  @Column('varchar', {
    name: 'oper_param',
    nullable: true,
    comment: '请求参数',
    length: 2000,
  })
  oper_param: string | null;

  /**返回参数 */
  @Column('varchar', {
    name: 'json_result',
    nullable: true,
    comment: '返回参数',
    length: 2000,
  })
  json_result: string | null;

  /**操作状态（0正常 1异常） */
  @Column('int', {
    name: 'status',
    nullable: true,
    comment: '操作状态（0正常 1异常）',
    default: () => "'0'",
  })
  status: number | null;

  /**错误消息 */
  @Column('varchar', {
    name: 'error_msg',
    nullable: true,
    comment: '错误消息',
    length: 2000,
  })
  error_msg: string | null;

  /**操作时间 */
  @Column('datetime', {
    name: 'oper_time',
    nullable: true,
    comment: '操作时间',
  })
  oper_time: Date | null;
}
