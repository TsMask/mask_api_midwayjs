import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../framework/utils/file/file';
import { parseDateToStr } from '../../../framework/utils/date/data';
import { Oauth2LogLoginRepository } from '../repository/oauth2_log_login';
import { Oauth2LogLogin } from '../model/oauth2_log_login';

/**用户授权第三方应用登录日志 服务层处理 */
@Provide()
@Singleton()
export class Oauth2LogLoginService {
  /**用户授权第三方应用登录日志信息 */
  @Inject()
  private oauth2LogLoginRepository: Oauth2LogLoginRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns [rows, total]
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[Oauth2LogLogin[], number]> {
    return await this.oauth2LogLoginRepository.selectByPage(query);
  }

  /**
   * 新增信息
   * @param clientId 用户名
   * @param status 状态
   * @param ilobArr 数组 [loginIp,loginLocation,os,browser]
   * @returns ID
   */
  public async insert(
    clientId: string,
    status: string,
    msg: string,
    ilobArr: string[]
  ): Promise<number> {
    const item = new Oauth2LogLogin();
    item.loginIp = ilobArr[0];
    item.loginLocation = ilobArr[1];
    item.os = ilobArr[2];
    item.browser = ilobArr[3];
    item.clientId = clientId;
    item.statusFlag = status;
    item.msg = msg;
    const insertId = await this.oauth2LogLoginRepository.insert(item);
    if (insertId > 0) {
      return insertId;
    }
    return 0;
  }

  /**
   * 清空用户授权第三方应用登录日志
   * @returns 数量
   */
  public async clean(): Promise<number> {
    return await this.oauth2LogLoginRepository.clean();
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: Oauth2LogLogin[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      let statusValue = '失败';
      if (row.statusFlag === '1') {
        statusValue = '成功';
      }
      const data = {
        序号: row.id,
        应用的唯一标识: row.clientId,
        登录状态: statusValue,
        登录地址: row.loginIp,
        登录地点: row.loginLocation,
        浏览器: row.browser,
        操作系统: row.os,
        提示消息: row.msg,
        访问时间: parseDateToStr(row.loginTime),
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
