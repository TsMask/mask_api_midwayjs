import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Menu table. */
@Entity('sys_menu')
export class SysMenu {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark', length: 255 })
  remark: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'parent_id' })
  parentId: number;

  @Rule(Joi.string().required())
  @Column({ name: 'menu_name' })
  menuName: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'menu_sort' })
  menuSort: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_path' })
  menuPath: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_component' })
  menuComponent: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_perms' })
  menuPerms: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_icon' })
  menuIcon: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_external' })
  menuExternal: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_cache' })
  menuCache: string;

  @Rule(Joi.string().pattern(/^[DMA]$/))
  @Column({ name: 'menu_type' })
  menuType: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_visible' })
  menuVisible: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_status' })
  menuStatus: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_del' })
  menuDel: string;

  children: SysMenu[];
}
