import { Controller, Inject, Get, Param, Del, Post } from '@midwayjs/decorator';
import {
  OperatorBusinessTypeEnum,
  OPERATOR_BUSINESS_TYPE,
} from '../../../framework/enums/OperatorBusinessTypeEnum';
import { OPERATOR_TYPE } from '../../../framework/enums/OperatorTypeEnum';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { Result } from '../../../framework/vo/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysOperLog } from '../model/SysOperLog';
import { SysOperLogServiceImpl } from '../service/impl/SysOperLogServiceImpl';

/**
 * 操作日志记录信息
 *
 * @author TsMask
 */
@Controller('/monitor/operlog')
export class SysOperLogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysOperLogService: SysOperLogServiceImpl;

  /**
   * 操作日志列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysOperLogService.selectOperLogPage(query);
    return Result.ok(data);
  }

  /**
   * 操作日志删除
   */
  @Del('/:operIds')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:remove'] })
  @OperLog({ title: '操作日志', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('operIds') operIds: string): Promise<Result> {
    if (!operIds) return Result.err();
    // 处理字符转id数组
    const ids = operIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysOperLogService.deleteOperLogByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 操作日志清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:remove'] })
  @OperLog({ title: '操作日志', businessType: OperatorBusinessTypeEnum.CLEAN })
  async clean(): Promise<Result> {
    const rows = await this.sysOperLogService.cleanOperLog();
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 导出操作日志
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:operlog:export'] })
  @OperLog({ title: '操作日志', businessType: OperatorBusinessTypeEnum.EXPORT })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysOperLogService.selectOperLogPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysOperLog) => {
        pre.push({
          操作序号: cur.operId,
          操作模块: cur.title,
          业务类型: OPERATOR_BUSINESS_TYPE[cur.businessType],
          请求方法: cur.method,
          请求方式: cur.requestMethod,
          操作类别: OPERATOR_TYPE[cur.operatorType],
          操作人员: cur.operName,
          部门名称: cur.deptName,
          请求地址: cur.operUrl,
          操作地址: cur.operIp,
          操作地点: cur.operLocation,
          请求参数: cur.operParam,
          操作消息: cur.operMsg,
          状态: ['失败', '成功'][+cur.status],
          消耗时间: cur.costTime + 'ms',
          操作时间: parseDateToStr(+cur.operTime),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `operlog_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(rows, '操作日志', fileName);
  }
}
