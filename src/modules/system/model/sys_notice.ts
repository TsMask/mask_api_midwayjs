import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**通知公告表 */
@Entity('sys_notice')
export class SysNotice {
  /**公告ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'notice_id' })
  noticeId: number;

  /**公告标题 */
  @Rule(RuleType.string().required())
  @Column({ name: 'notice_title' })
  noticeTitle: string;

  /**公告类型（1通知 2公告） */
  @Rule(RuleType.string().required())
  @Column({ name: 'notice_type' })
  noticeType: string;

  /**公告内容 */
  @Rule(RuleType.string().required())
  @Column({ name: 'notice_content' })
  noticeContent: string;

  /**状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**删除标记（0存在 1删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

  /**创建者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(RuleType.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
