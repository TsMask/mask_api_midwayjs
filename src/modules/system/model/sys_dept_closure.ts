import { Column, Entity, PrimaryColumn } from 'typeorm';

/**部门闭包表 */
@Entity('sys_dept_closure')
export class SysDeptClosure {
  /**祖先部门ID */
  @PrimaryColumn({ name: 'ancestor_id' })
  ancestorId: number;

  /**后代部门ID */
  @PrimaryColumn({ name: 'descendant_id' })
  descendantId: number;

  /**层级距离，0为自身，1为直接子级 */
  @Column({ name: 'depth' })
  depth: number;
}
