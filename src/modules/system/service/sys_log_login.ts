import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../framework/utils/file/file';
import { parseDateToStr } from '../../../framework/utils/date/data';
import { SysLogLoginRepository } from '../repository/sys_log_login';
import { SysLogLogin } from '../model/sys_log_login';

/**系统登录日志 服务层处理 */
@Provide()
@Singleton()
export class SysLogLoginService {
  /**系统登录日志信息 */
  @Inject()
  private sysLogLoginRepository: SysLogLoginRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns [rows, total]
   */
  public async findByPage(
    query: Record<string, string>,
    dataScopeSQL: string
  ): Promise<[SysLogLogin[], number]> {
    return await this.sysLogLoginRepository.selectByPage(query, dataScopeSQL);
  }

  /**
   * 新增信息
   * @param userName 用户名
   * @param status 状态
   * @param ilobArr 数组 [loginIp,loginLocation,os,browser]
   * @returns ID
   */
  public async insert(
    userName: string,
    status: string,
    msg: string,
    ilobArr: string[]
  ): Promise<number> {
    const sysLogLogin = new SysLogLogin();
    sysLogLogin.loginIp = ilobArr[0];
    sysLogLogin.loginLocation = ilobArr[1];
    sysLogLogin.os = ilobArr[2];
    sysLogLogin.browser = ilobArr[3];
    sysLogLogin.userName = userName;
    sysLogLogin.statusFlag = status;
    sysLogLogin.msg = msg;
    const insertId = await this.sysLogLoginRepository.insert(sysLogLogin);
    if (insertId > 0) {
      return insertId;
    }
    return 0;
  }

  /**
   * 清空系统登录日志
   * @returns 数量
   */
  public async clean(): Promise<number> {
    return await this.sysLogLoginRepository.clean();
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysLogLogin[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      let statusValue = '停用';
      if (row.statusFlag === '1') {
        statusValue = '正常';
      }
      const data = {
        序号: row.id,
        用户账号: row.userName,
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
