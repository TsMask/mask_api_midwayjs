import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

/** Department table; parentage is derived from sys_dept_closure. */
@Entity('sys_dept')
export class SysDept {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Derived from a closure relation with depth = 1. */
  @Rule(Joi.number().allow(0))
  parent_id: number;

  @Rule(Joi.string().required())
  @Column({ name: 'dept_name' })
  dept_name: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_leader' })
  dept_leader: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_phone' })
  dept_phone: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_email' })
  dept_email: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'dept_sort' })
  dept_sort: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'dept_status' })
  dept_status: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark' })
  remark: string;

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

  toJSON(): Record<string, unknown> {
    const json = { ...this } as Partial<SysDept>;
    delete json.children;
    return {
      ...json,
      ...(this.children?.length ? { children: this.children } : {}),
    };
  }

  children: SysDept[];
}

/** Department closure table. */
@Entity('sys_dept_closure')
export class SysDeptClosure {
  @PrimaryColumn({ name: 'ancestor_id' })
  ancestor_id: number;

  @PrimaryColumn({ name: 'descendant_id' })
  descendant_id: number;

  /** 0 is self, 1 is a direct child. */
  @Column({ name: 'depth' })
  depth: number;
}
