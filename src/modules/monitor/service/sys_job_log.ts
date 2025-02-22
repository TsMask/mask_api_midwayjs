import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../framework/utils/file/file';
import { parseDateToStr } from '../../../framework/utils/date/data';
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
    const dictSysJobGroup = await this.sysDictDataService.findByType(
      'sys_job_group'
    );
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const item of rows) {
      // 任务组名
      let sysJobGroup = '';
      for (const v of dictSysJobGroup) {
        if (item.jobGroup === v.dataValue) {
          sysJobGroup = v.dataLabel;
          break;
        }
      }
      // 状态
      let statusValue = '失败';
      if (item.statusFlag === '1') {
        statusValue = '成功';
      }
      const data = {
        日志序号: item.logId,
        任务名称: item.jobName,
        任务组名: sysJobGroup,
        调用目标: item.invokeTarget,
        传入参数: item.targetParams,
        日志信息: item.jobMsg,
        执行状态: statusValue,
        记录时间: parseDateToStr(+item.createTime),
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
