import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**用户授权第三方应用表 */
@Entity('oauth2_client')
export class Oauth2Client {
  /**应用ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**应用的唯一标识 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'client_id' })
  clientId: string;

  /**应用的凭证秘钥 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'client_secret' })
  clientSecret: string;

  /**应用名称 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'title' })
  title: string;

  /**IP白名单 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'ip_white' })
  ipWhite: string;

  /**删除标志（0代表存在 1代表删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

  /**最后登录IP */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'login_ip' })
  loginIp: string;

  /**最后登录时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'login_time' })
  loginTime: number;

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
