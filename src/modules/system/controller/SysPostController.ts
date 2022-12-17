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
