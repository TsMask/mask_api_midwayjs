import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_user')
export class SysUser {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'user_id',
    comment: '用户ID',
  })
  user_id: string;

  @Column('bigint', { name: 'dept_id', nullable: true, comment: '部门ID' })
  dept_id: string | null;

  @Column('varchar', { name: 'user_name', comment: '用户账号', length: 30 })
  user_name: string;

  @Column('varchar', { name: 'nick_name', comment: '用户昵称', length: 30 })
  nick_name: string;

  @Column('varchar', {
    name: 'user_type',
    nullable: true,
    comment: '用户类型（00系统用户）',
    length: 2,
    default: () => "'00'",
  })
  user_type: string | null;

  @Column('varchar', {
    name: 'email',
    nullable: true,
    comment: '用户邮箱',
    length: 50,
  })
  email: string | null;

  @Column('varchar', {
    name: 'phonenumber',
    nullable: true,
    comment: '手机号码',
    length: 11,
  })
  phonenumber: string | null;

  @Column('char', {
    name: 'sex',
    nullable: true,
    comment: '用户性别（0男 1女 2未知）',
    length: 1,
    default: () => "'0'",
  })
  sex: string | null;

  @Column('varchar', {
    name: 'avatar',
    nullable: true,
    comment: '头像地址',
    length: 100,
  })
  avatar: string | null;

  @Column('varchar', {
    name: 'password',
    nullable: true,
    comment: '密码',
    length: 100,
  })
  password: string | null;

  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '帐号状态（0正常 1停用）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  @Column('char', {
    name: 'del_flag',
    nullable: true,
    comment: '删除标志（0代表存在 2代表删除）',
    length: 1,
    default: () => "'0'",
  })
  del_flag: string | null;

  @Column('varchar', {
    name: 'login_ip',
    nullable: true,
    comment: '最后登录IP',
    length: 128,
  })
  login_ip: string | null;

  @Column('datetime', {
    name: 'login_date',
    nullable: true,
    comment: '最后登录时间',
  })
  login_date: Date | null;

  @Column('varchar', {
    name: 'create_by',
    nullable: true,
    comment: '创建者',
    length: 64,
  })
  create_by: string | null;

  @Column('datetime', {
    name: 'create_time',
    nullable: true,
    comment: '创建时间',
  })
  create_time: Date | null;

  @Column('varchar', {
    name: 'update_by',
    nullable: true,
    comment: '更新者',
    length: 64,
  })
  update_by: string | null;

  @Column('datetime', {
    name: 'update_time',
    nullable: true,
    comment: '更新时间',
  })
  update_time: Date | null;

  @Column('varchar', {
    name: 'remark',
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string | null;
}
