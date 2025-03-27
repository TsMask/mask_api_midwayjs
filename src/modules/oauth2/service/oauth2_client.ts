import { Provide, Inject, Singleton } from '@midwayjs/core';

import { Oauth2ClientRepository } from '../repository/oauth2_client';
import { Oauth2Client } from '../model/oauth2_client';
import { generateCode } from '../../../framework/utils/generate/generate';

/**用户授权第三方应用信息 服务层处理 */
@Provide()
@Singleton()
export class Oauth2ClientService {
  /**用户授权第三方应用表 */
  @Inject()
  private oauth2ClientRepository: Oauth2ClientRepository;

  /**
   * 分页查询
   * @param query 查询参数
   * @return 错误结果信息
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[Oauth2Client[], number]> {
    return await this.oauth2ClientRepository.selectByPage(query);
  }

  /**
   * 查询集合
   * @param clientId 客户端ID
   * @return 错误结果信息
   */
  public async findByClientId(clientId: string): Promise<Oauth2Client> {
    return await this.oauth2ClientRepository.selectByClientId(clientId);
  }

  /**
   * 新增
   * @param param 信息
   * @return 新增数据ID
   */
  public async insert(param: Oauth2Client): Promise<number> {
    param.clientId = generateCode(16);
    param.clientSecret = generateCode(32);
    return await this.oauth2ClientRepository.insert(param);
  }

  /**
   * 更新
   * @param param 信息
   * @return 影响记录数
   */
  public async update(param: Oauth2Client): Promise<number> {
    return await this.oauth2ClientRepository.update(param);
  }

  /**
   * 更新
   * @param param 信息
   * @return 影响记录数
   */
  public async deleteByIds(ids: number[]): Promise<[number, string]> {
    // 检查是否存在
    const arr = await this.oauth2ClientRepository.selectByIds(ids);
    if (arr.length <= 0) {
      return [0, '没有权限访问用户授权第三方应用数据！'];
    }
    if (arr.length == ids.length) {
      const rows = await this.oauth2ClientRepository.deleteByIds(ids);
      return [rows, ''];
    }
    return [0, '删除用户授权第三方应用信息失败！'];
  }
}
