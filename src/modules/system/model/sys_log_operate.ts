import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**系统操作日志表 */
@Entity('sys_log_operate')
export class SysLogOperate {
  /**操作ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**模块标题 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'title' })
  title: string;

  /**业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据） */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'business_type' })
  businessType: string;

  /**请求URL */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_url' })
  operaUrl: string;

  /**请求方式 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_url_method' })
  operaUrlMethod: string;

  /**主机地址 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_ip' })
  operaIp: string;

  /**操作地点 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_location' })
  operaLocation: string;

  /**请求参数 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_param' })
  operaParam: string;

  /**操作消息 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_msg' })
  operaMsg: string;

  /**方法名称 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_method' })
  operaMethod: string;

  /**操作人员 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'opera_by' })
  operaBy: string;

  /**操作时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'opera_time' })
  operaTime: number;

  /**操作状态（0异常 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**消耗时间（毫秒） */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'cost_time' })
  costTime: number;
}
