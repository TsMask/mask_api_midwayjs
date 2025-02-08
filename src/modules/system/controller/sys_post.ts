import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SysPostService } from '../service/sys_post';
import { SysPost } from '../model/sys_post';

/**岗位信息 控制层处理*/
@Controller('/system/post')
export class SysPostController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysPostService: SysPostService;

  /**
   * 岗位列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:post:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysPostService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 岗位信息
   */
  @Get('/:postId')
  @PreAuthorize({ hasPermissions: ['system:post:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('postId') postId: number
  ): Promise<Resp> {
    if (postId <= 0) {
      return Resp.codeMsg(40010, 'bind err: postId is empty');
    }
    const data = await this.sysPostService.findById(postId);
    if (data.postId === postId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**
   * 岗位新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:post:add'] })
  @OperateLog({
    title: '岗位信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysPost): Promise<Resp> {
    if (body.postId > 0) {
      return Resp.codeMsg(40010, 'bind err: postId not is empty');
    }
    // 检查名称唯一
    const uniqueuName = await this.sysPostService.checkUniqueByName(
      body.postName,
      0
    );
    if (!uniqueuName) {
      return Resp.errMsg(`岗位新增【${body.postName}】失败，岗位名称已存在`);
    }
    // 检查编码属性值唯一
    const uniqueCode = await this.sysPostService.checkUniqueByCode(
      body.postCode,
      0
    );
    if (!uniqueCode) {
      return Resp.errMsg(`岗位新增【${body.postName}】失败，岗位编码已存在`);
    }

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysPostService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 岗位修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:post:edit'] })
  @OperateLog({
    title: '岗位信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysPost): Promise<Resp> {
    if (body.postId <= 0) {
      return Resp.codeMsg(40010, 'bind err: postId is empty');
    }

    // 检查是否存在
    const postInfo = await this.sysPostService.findById(body.postId);
    if (postInfo.postId !== body.postId) {
      return Resp.errMsg('没有权限访问岗位数据！');
    }

    // 检查名称属性值唯一
    const uniqueuName = await this.sysPostService.checkUniqueByName(
      body.postName,
      body.postId
    );
    if (!uniqueuName) {
      return Resp.errMsg(`岗位修改【${body.postName}】失败，岗位名称已存在`);
    }

    // 检查编码属性值唯一
    const uniqueCode = await this.sysPostService.checkUniqueByCode(
      body.postCode,
      body.postId
    );
    if (!uniqueCode) {
      return Resp.errMsg(`岗位修改【${body.postName}】失败，岗位编码已存在`);
    }

    postInfo.postCode = body.postCode;
    postInfo.postName = body.postName;
    postInfo.postSort = body.postSort;
    postInfo.statusFlag = body.statusFlag;
    postInfo.remark = body.remark;
    postInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysPostService.update(postInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 岗位删除
   */
  @Del('/:postId')
  @PreAuthorize({ hasPermissions: ['system:post:remove'] })
  @OperateLog({
    title: '岗位信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.string().required()) @Param('postId') postId: string
  ): Promise<Resp> {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(postId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysPostService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 导出岗位信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:post:export'] })
  @OperateLog({
    title: '岗位信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysPostService.findByPage(query);
    if (total === 0) {
      return Resp.codeMsg(40016, 'export data record as empty');
    }

    // 导出文件名称
    const fileName = `post_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysPostService.exportData(rows, fileName);
  }
}
