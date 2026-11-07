import { Inject, Provide, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../internal/shared/file/file';
import { parseDateToRFC3339 } from '../../../internal/shared/date/date';
import { SysLoginLogRepository } from '../repository/sys_login_log';
import { SysLoginLog } from '../model/sys_login_log';

/**系统登录日志 服务层处理 */
@Provide()
@Singleton()
export class SysLoginLogService {
  @Inject()
  private sysLoginLogRepository: SysLoginLogRepository;

  @Inject()
  private fileUtil: FileUtil;

  public async findByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysLoginLog[], number]> {
    return await this.sysLoginLogRepository.selectByPage(query, filter);
  }

  public async insert(
    user_name: string,
    status: string,
    msg: string,
    ilobArr: string[]
  ): Promise<number> {
    const loginLog = new SysLoginLog();
    loginLog.login_ip = ilobArr[0] ?? '';
    loginLog.login_location = ilobArr[1] ?? '';
    loginLog.login_os = ilobArr[2] ?? '';
    loginLog.login_browser = ilobArr[3] ?? '';
    loginLog.login_user_name = user_name;
    loginLog.login_status = status;
    loginLog.login_msg = msg;
    loginLog.create_time = Date.now();
    return await this.sysLoginLogRepository.insert(loginLog);
  }

  public async clean(): Promise<number> {
    return await this.sysLoginLogRepository.clean();
  }

  public async exportData(rows: SysLoginLog[], fileName: string) {
    // 第一行表头标题
    const data: string[][] = [
      [
        '序号',
        '用户账号',
        '登录状态',
        '登录地址',
        '登录地点',
        '浏览器',
        '操作系统',
        '提示消息',
        '访问时间',
      ],
    ];
    for (const row of rows) {
      const statusValue = row.login_status === '1' ? '成功' : '失败';
      data.push([
        `${row.id ?? 0}`,
        row.login_user_name ?? '',
        statusValue,
        row.login_ip ?? '',
        row.login_location ?? '',
        row.login_browser ?? '',
        row.login_os ?? '',
        row.login_msg ?? '',
        parseDateToRFC3339(row.create_time ?? 0),
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
