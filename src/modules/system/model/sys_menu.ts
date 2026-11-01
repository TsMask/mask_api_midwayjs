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
  create_by: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  update_by: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  update_time: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark', length: 255 })
  remark: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'parent_id' })
  parent_id: number;

  @Rule(Joi.string().required())
  @Column({ name: 'menu_name' })
  menu_name: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'menu_sort' })
  menu_sort: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_path' })
  menu_path: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_component' })
  menu_component: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_perms' })
  menu_perms: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'menu_icon' })
  menu_icon: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_external' })
  menu_external: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_cache' })
  menu_cache: string;

  @Rule(Joi.string().pattern(/^[DMA]$/))
  @Column({ name: 'menu_type' })
  menu_type: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_visible' })
  menu_visible: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_status' })
  menu_status: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'menu_del' })
  menu_del: string;

  toJSON(): Record<string, unknown> {
    const json = { ...this } as Partial<SysMenu>;
    delete json.menu_del;
    delete json.children;
    return {
      ...json,
      ...(this.children?.length ? { children: this.children } : {}),
    };
  }

  children: SysMenu[];
}
