import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../common/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/core/Result';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysPost } from '../model/SysPost';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';

/**
 * 岗位信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/post')
export class SysPostController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  /**
   * 导出岗位信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:post:export'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.EXPORT })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    ctx.request.body.pageNum = 1;
    ctx.request.body.pageSize = 1000;
    const data = await this.sysPostService.selectPostPage(ctx.request.body);
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysPost) => {
        pre.push({
          岗位序号: cur.postId,
          岗位编码: cur.postCode,
          岗位名称: cur.postName,
          岗位排序: `${cur.postSort}`,
          状态: cur.status === '0' ? '正常' : '停用',
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `post_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.writeExcelFile(rows, '岗位信息', fileName);
  }

  /**
   * 岗位列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:post:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysPostService.selectPostPage(query);
    return Result.ok(data);
  }

  /**
   * 岗位信息
   */
  @Get('/:postId')
  @PreAuthorize({ hasPermissions: ['system:post:query'] })
  async getInfo(@Param('postId') postId: string): Promise<Result> {
    if (!postId) return Result.err();
    const data = await this.sysPostService.selectPostById(postId);
    return Result.okData(data || {});
  }

  /**
   * 岗位新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:post:add'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysPost: SysPost): Promise<Result> {
    if (!sysPost.postName || !sysPost.postCode) {
      return Result.err();
    }
    // 检查属性值唯一
    const uniqueuPostName = await this.sysPostService.checkUniquePostName(
      sysPost
    );
    if (!uniqueuPostName) {
      return Result.errMsg(
        `岗位新增【${sysPost.postName}】失败，岗位名称已存在`
      );
    }
    const uniquePostCode = await this.sysPostService.checkUniquePostCode(
      sysPost
    );
    if (!uniquePostCode) {
      return Result.errMsg(
        `岗位新增【${sysPost.postCode}】失败，岗位编码已存在`
      );
    }

    sysPost.createBy = this.contextService.getUseName();
    const insertId = await this.sysPostService.insertPost(sysPost);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 岗位修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:post:edit'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async edit(@Body() sysPost: SysPost): Promise<Result> {
    if (!sysPost.postName || !sysPost.postCode || !sysPost.postId) {
      return Result.err();
    }
    // 检查属性值唯一
    const uniqueuPostName = await this.sysPostService.checkUniquePostName(
      sysPost
    );
    if (!uniqueuPostName) {
      return Result.errMsg(
        `岗位修改【${sysPost.postName}】失败，岗位名称已存在`
      );
    }
    const uniquePostCode = await this.sysPostService.checkUniquePostCode(
      sysPost
    );
    if (!uniquePostCode) {
      return Result.errMsg(
        `岗位修改【${sysPost.postCode}】失败，岗位编码已存在`
      );
    }

    sysPost.updateBy = this.contextService.getUseName();
    const rows = await this.sysPostService.updatePost(sysPost);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 岗位删除
   */
  @Del('/:postIds')
  @PreAuthorize({ hasPermissions: ['system:post:remove'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('postIds') postIds: string): Promise<Result> {
    if (!postIds) return Result.err();
    // 处理字符转id数组
    const ids = postIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysPostService.deletePostByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
