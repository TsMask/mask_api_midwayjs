import { SysLogOperate } from '../model/SysLogOperate';

/**
 * 操作日志 服务层接口
 *
 * @author TsMask
 */
export interface ISysLogOperateService {
  /**
   * 分页查询系统操作日志集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  selectSysLogOperatePage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询系统操作日志集合
   *
   * @param sysLogOperate 操作日志对象
   * @return 操作日志集合
   */
  selectSysLogOperateList(sysLogOperate: SysLogOperate): Promise<SysLogOperate[]>;

  /**
   * 查询操作日志详细
   *
   * @param operId 操作ID
   * @return 操作日志对象
   */
  selectSysLogOperateById(operId: string): Promise<SysLogOperate>;

  /**
   * 新增操作日志
   *
   * @param sysLogOperate 操作日志对象
   */
  insertSysLogOperate(sysLogOperate: SysLogOperate): Promise<string>;

  /**
   * 批量删除系统操作日志
   *
   * @param operIds 需要删除的操作日志ID
   * @return 结果
   */
  deleteSysLogOperateByIds(operIds: string[]): Promise<number>;

  /**
   * 清空操作日志
   */
  cleanSysLogOperate(): Promise<number>;
}
