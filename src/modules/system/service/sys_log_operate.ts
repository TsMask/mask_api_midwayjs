import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../framework/utils/file/file';
import { parseDateToStr } from '../../../framework/utils/date/data';
import { SysLogOperateRepository } from '../repository/sys_log_operate';
import { SysLogOperate } from '../model/sys_log_operate';

/**操作日志表 服务层处理 */
@Provide()
@Singleton()
export class SysLogOperateService {
  /**操作日志信息 */
  @Inject()
  private sysLogOperateRepository: SysLogOperateRepository;

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
  ): Promise<[SysLogOperate[], number]> {
    return await this.sysLogOperateRepository.selectByPage(query, dataScopeSQL);
  }

  /**
   * 新增信息
   * @param sysLogOperate 信息
   * @returns ID
   */
  public async insert(sysLogOperate: SysLogOperate): Promise<number> {
    return await this.sysLogOperateRepository.insert(sysLogOperate);
  }

  /**
   * 清空操作日志
   * @returns 数量
   */
  public async clean(): Promise<number> {
    return await this.sysLogOperateRepository.clean();
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysLogOperate[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      // 业务类型
      const businessType = '';
      // 状态
      let statusValue = '停用';
      if (row.statusFlag === '1') {
        statusValue = '正常';
      }
      const data = {
        操作序号: row.id,
        模块标题: row.title,
        业务类型: businessType,
        请求URL: row.operaUrl,
        请求方式: row.operaUrlMethod,
        主机地址: row.operaIp,
        操作地点: row.operaLocation,
        请求参数: row.operaParam,
        操作消息: row.operaMsg,
        方法名称: row.operaMethod,
        操作人员: row.operaBy,
        操作时间: parseDateToStr(row.operaTime),
        操作状态: statusValue,
        消耗时间: row.costTime,
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
