import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../internal/shared/file/file';
import { parseDateToRFC3339 } from '../../../internal/shared/date/date';
import { SysJobLogRepository } from '../repository/sys_job_log';
import { SysDictDataService } from '../../system/service/sys_dict_data';
import { SysJobLog } from '../model/sys_job_log';

/**调度任务日志 服务层处理 */
@Provide()
@Singleton()
export class SysJobLogService {
  /**调度任务日志数据信息 */
  @Inject()
  private sysJobLogRepository: SysJobLogRepository;

  /**字典类型服务 */
  @Inject()
  private sysDictDataService: SysDictDataService;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**
   * 分页查询
   * @param query 查询参数
   * @returns 结果
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysJobLog[], number]> {
    return await this.sysJobLogRepository.selectByPage(query);
  }

  /**
   * 查询
   * @param sysJobLog 信息
   * @returns 列表
   */
  public async find(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    return await this.sysJobLogRepository.select(sysJobLog);
  }

  /**
   * 通过ID查询
   * @param logId 日志ID
   * @returns 结果
   */
  public async findById(logId: number): Promise<SysJobLog> {
    return await this.sysJobLogRepository.selectById(logId);
  }

  /**
   * 批量删除
   * @param logIds 日志ID数组
   * @returns
   */
  async deleteByIds(logIds: number[]): Promise<number> {
    return await this.sysJobLogRepository.deleteByIds(logIds);
  }

  /**
   * 清空调度任务日志
   * @return 删除记录数
   */
  public async clean(): Promise<number> {
    return this.sysJobLogRepository.clean();
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysJobLog[], fileName: string) {
    // 读取任务组名字典数据
    const dictSysJobGroup =
      await this.sysDictDataService.findByType('sys_job_group');
    // 第一行表头标题
    const data: string[][] = [
      [
        '日志序号',
        '任务名称',
        '任务组名',
        '调用目标',
        '传入参数',
        '日志信息',
        '执行状态',
        '记录时间',
      ],
    ];
    for (const item of rows) {
      // 任务组名
      let sysJobGroup = '';
      for (const v of dictSysJobGroup) {
        if (item.jobGroup === v.data_value) {
          sysJobGroup = v.data_label;
          break;
        }
      }
      // 状态
      let statusValue = '失败';
      if (item.logStatus === '1') {
        statusValue = '成功';
      }
      data.push([
        `${item.id ?? 0}`,
        item.jobName ?? '',
        sysJobGroup,
        item.jobInvokeTarget ?? '',
        item.jobTargetParams ?? '',
        item.logMsg ?? '',
        statusValue,
        parseDateToRFC3339(item.createTime ?? 0),
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
