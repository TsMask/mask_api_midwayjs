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
import { Context } from '@midwayjs/koa';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
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
  private ctx: Context;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  /**
   * 获取岗位列表
   * @returns 返回结果
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:post:list'] })
  async list(): Promise<Result> {
    const query = this.ctx.query;
    const data = await this.sysPostService.selectPostPage(query);
    return Result.ok(data);
  }

  /**
   * 根据岗位编号获取详细信息
   * @returns 返回结果
   */
  @Get('/:postId')
  @PreAuthorize({ hasPermissions: ['system:post:query'] })
  async getInfo(@Param('postId') postId: string): Promise<Result> {
    if (!postId) return Result.err();
    const data = await this.sysPostService.selectPostById(postId);
    if (data) {
      return Result.okData(data || {});
    }
    return Result.err();
  }

  /**
   * 新增岗位
   * @returns 返回结果
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:post:add'] })
  async add(@Body() sysPost: SysPost): Promise<Result> {
    if (!sysPost.postName || !sysPost.postCode) {
      return Result.err();
    }
    // 检查岗位名称
    let post = new SysPost();
    post.postName = sysPost.postName;
    let hasPosts = await this.sysPostService.selectPostList(post);
    if (hasPosts && hasPosts.length > 0) {
      return Result.errMsg(
        `新增岗位【${sysPost.postName}】失败，岗位名称已存在`
      );
    }
    // 检查岗位编码
    post = new SysPost();
    post.postCode = sysPost.postCode;
    hasPosts = await this.sysPostService.selectPostList(post);
    if (hasPosts && hasPosts.length > 0) {
      return Result.errMsg(
        `新增岗位【${sysPost.postCode}】失败，岗位编码已存在`
      );
    }
    sysPost.createBy = this.ctx.loginUser?.user?.userName;
    const id = await this.sysPostService.insertPost(sysPost);
    return Result[id ? 'ok' : 'err']();
  }

  /**
   * 修改岗位
   * @returns 返回结果
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:post:edit'] })
  async edit(@Body() sysPost: SysPost): Promise<Result> {
    if (!sysPost.postName || !sysPost.postCode || !sysPost.postId) {
      return Result.err();
    }
    // 检查岗位名称
    let post = new SysPost();
    post.postName = sysPost.postName;
    let hasPosts = await this.sysPostService.selectPostList(post);
    if (hasPosts && hasPosts.length > 0) {
      return Result.errMsg(
        `修改岗位【${sysPost.postName}】失败，岗位名称已存在`
      );
    }
    // 检查岗位编码
    post = new SysPost();
    post.postCode = sysPost.postCode;
    hasPosts = await this.sysPostService.selectPostList(post);
    if (hasPosts && hasPosts.length > 0) {
      return Result.errMsg(
        `修改岗位【${sysPost.postCode}】失败，岗位编码已存在`
      );
    }
    sysPost.updateBy = this.ctx.loginUser?.user?.userName;
    const id = await this.sysPostService.updatePost(sysPost);
    return Result[id ? 'ok' : 'err']();
  }

  /**
   * 删除岗位
   * @returns 返回结果
   */
  @Del('/:postIds')
  @PreAuthorize({ hasPermissions: ['system:post:remove'] })
  async remove(@Param('postIds') postIds: string): Promise<Result> {
    if (!postIds) return Result.err();
    // 处理字符转id数组
    const ids = postIds.split(',');
    const rowNum = await this.sysPostService.deletePostByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }
}
