import {
  Controller,
  Inject,
  Get,
  Param,
  Del,
  Post,
  Put,
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { Result } from '../../../framework/vo/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysLogininfor } from '../model/SysLogininfor';
import { SysLogininforServiceImpl } from '../service/impl/SysLogininforServiceImpl';
import { AccountService } from '../../common/service/AccountService';

/**
 * 登录访问信息
 *
 * @author TsMask
 */
@Controller('/monitor/logininfor')
export class SysLogininforController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysLogininforService: SysLogininforServiceImpl;

  @Inject()
  private accountService: AccountService;

  /**
   * 登录访问列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysLogininforService.selectLogininforPage(query);
    return Result.ok(data);
  }

  /**
   * 登录访问删除
   */
  @Del('/:infoIds')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:remove'] })
  @OperLog({
    title: '登录访问信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('infoIds') infoIds: string): Promise<Result> {
    if (!infoIds) return Result.err();
    // 处理字符转id数组
    const ids = infoIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysLogininforService.deleteLogininforByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 登录访问清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:remove'] })
  @OperLog({
    title: '登录访问信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async clean(): Promise<Result> {
    const rows = await this.sysLogininforService.cleanLogininfor();
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 登录访问账户解锁
   */
  @Put('/unlock/:userName')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:unlock'] })
  @OperLog({
    title: '登录访问信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async unlock(@Param('userName') userName: string): Promise<Result> {
    if (!userName) return Result.err();
    const ok = await this.accountService.clearLoginRecordCache(userName);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 导出登录访问信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:logininfor:export'] })
  @OperLog({
    title: '登录访问信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysLogininforService.selectLogininforPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysLogininfor) => {
        pre.push({
          序号: cur.infoId,
          用户账号: cur.userName,
          登录状态: ['失败', '成功'][+cur.status],
          登录地址: cur.ipaddr,
          登录地点: cur.loginLocation,
          浏览器: cur.browser,
          操作系统: cur.os,
          提示消息: cur.msg,
          访问时间: parseDateToStr(+cur.loginTime),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `logininfor_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(
      rows,
      '登录访问信息',
      fileName
    );
  }
}
