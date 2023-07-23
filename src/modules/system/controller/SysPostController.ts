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
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/vo/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysPost } from '../model/SysPost';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';

/**
 * 岗位信息
 *
 * @author TsMask
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
    return Result.okData(data);
  }

  /**
   * 岗位新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:post:add'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysPost: SysPost): Promise<Result> {
    const { postId, postName, postCode } = sysPost;
    if (postId || !postName || !postCode) return Result.err();

    // 检查属性值唯一
    const uniqueuPostName = await this.sysPostService.checkUniquePostName(
      postName
    );
    if (!uniqueuPostName) {
      return Result.errMsg(`岗位新增【${postName}】失败，岗位名称已存在`);
    }
    const uniquePostCode = await this.sysPostService.checkUniquePostCode(
      postCode
    );
    if (!uniquePostCode) {
      return Result.errMsg(`岗位新增【${postCode}】失败，岗位编码已存在`);
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
    const { postId, postName, postCode } = sysPost;
    if (!postId || !postName || !postCode) return Result.err();
    // 检查是否存在
    const post = await this.sysPostService.selectPostById(postId);
    if (!post) {
      throw new Error('没有权限访问岗位数据！');
    }

    // 检查名称属性值唯一
    const uniqueuPostName = await this.sysPostService.checkUniquePostName(
      postName,
      postId
    );
    if (!uniqueuPostName) {
      return Result.errMsg(`岗位修改【${postName}】失败，岗位名称已存在`);
    }

    // 检查编码属性值唯一
    const uniquePostCode = await this.sysPostService.checkUniquePostCode(
      postCode,
      postId
    );
    if (!uniquePostCode) {
      return Result.errMsg(`岗位修改【${postCode}】失败，岗位编码已存在`);
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

  /**
   * 导出岗位信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:post:export'] })
  @OperLog({ title: '岗位信息', businessType: OperatorBusinessTypeEnum.EXPORT })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysPostService.selectPostPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysPost) => {
        pre.push({
          岗位编号: cur.postId,
          岗位编码: cur.postCode,
          岗位名称: cur.postName,
          岗位排序: `${cur.postSort}`,
          状态: ['停用', '正常'][+cur.status],
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
    return await this.fileService.excelWriteRecord(rows, '岗位信息', fileName);
  }
}
