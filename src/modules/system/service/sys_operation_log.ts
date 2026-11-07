import { Inject, Provide, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../internal/shared/file/file';
import { parseDateToRFC3339 } from '../../../internal/shared/date/date';
import { SysOperationLogRepository } from '../repository/sys_operation_log';
import { SysOperationLog } from '../model/sys_operation_log';

/**系统操作日志 服务层处理 */
@Provide()
@Singleton()
export class SysOperationLogService {
  @Inject()
  private sysOperationLogRepository: SysOperationLogRepository;

  @Inject()
  private fileUtil: FileUtil;

  public async findByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysOperationLog[], number]> {
    return await this.sysOperationLogRepository.selectByPage(query, filter);
  }

  public async insert(operationLog: SysOperationLog): Promise<number> {
    if (operationLog.create_by) {
      operationLog.create_time = Date.now();
    }
    return await this.sysOperationLogRepository.insert(operationLog);
  }

  public async clean(): Promise<number> {
    return await this.sysOperationLogRepository.clean();
  }

  public async exportData(rows: SysOperationLog[], fileName: string) {
    // 第一行表头标题
    const data: string[][] = [
      [
        '操作序号',
        '模块标题',
        '业务类型',
        '请求URL',
        '请求方式',
        '主机地址',
        '操作地点',
        '请求参数',
        '操作消息',
        '方法名称',
        '操作人员',
        '操作时间',
        '操作状态',
        '消耗时间',
      ],
    ];
    for (const row of rows) {
      const statusValue = row.operation_status === '1' ? '成功' : '失败';
      data.push([
        `${row.id ?? 0}`,
        row.title ?? '',
        '',
        row.operation_url ?? '',
        row.operation_method ?? '',
        row.operation_ip ?? '',
        row.operation_location ?? '',
        row.operation_param ?? '',
        row.operation_msg ?? '',
        row.operation_function ?? '',
        row.create_by ?? '',
        parseDateToRFC3339(row.create_time ?? 0),
        statusValue,
        `${row.operation_cost_time ?? 0}`,
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
