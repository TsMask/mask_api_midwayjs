import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileService } from '../../../framework/service/FileService';
import { SysUserPostRepository } from '../repository/sys_user_post';
import { SysPostRepository } from '../repository/sys_post';
import { SysPost } from '../model/sys_post';

/**岗位表 服务层处理 */
@Provide()
@Singleton()
export class SysPostService {
  @Inject()
  private sysPostRepository: SysPostRepository;

  @Inject()
  private sysUserPostRepository: SysUserPostRepository;

  @Inject()
  private fileService: FileService;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns [rows, total]
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysPost[], number]> {
    return await this.sysPostRepository.selectByPage(query);
  }
  /**
   * 查询数据
   * @param sysPost 信息
   * @returns []
   */
  public async find(sysPost: SysPost): Promise<SysPost[]> {
    return await this.sysPostRepository.select(sysPost);
  }

  /**
   * 根据ID查询信息
   * @param postId ID
   * @returns 结果
   */
  public async findById(postId: number): Promise<SysPost> {
    if (postId <= 0) {
      return new SysPost();
    }
    const posts = await this.sysPostRepository.selectByIds([postId]);
    if (posts.length > 0) {
      return posts[0];
    }
    return new SysPost();
  }

  /**
   * 新增信息
   * @param sysPost 信息
   * @returns ID
   */
  public async insert(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.insert(sysPost);
  }

  /**
   * 修改信息
   * @param sysPost 信息
   * @returns 影响记录数
   */
  public async update(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.update(sysPost);
  }

  /**
   * 批量删除信息
   * @param postIds ID数组
   * @returns 影响记录数
   */
  public async deleteByIds(postIds: number[]): Promise<number> {
    // 检查是否存在
    const posts = await this.sysPostRepository.selectByIds(postIds);
    if (posts.length < 0) {
      throw new Error('没有权限访问岗位数据！');
    }
    for (const post of posts) {
      const useCount = await this.sysUserPostRepository.existUserByPostId(
        post.postId
      );
      if (useCount > 0) {
        throw new Error(`【${post.postName}】已分配给用户,不能删除`);
      }
    }
    if (posts.length == postIds.length) {
      return await this.sysPostRepository.deleteByIds(postIds);
    }
    return 0;
  }

  /**
   * 检查岗位名称是否唯一
   * @param postName 岗位名称
   * @param postId 岗位ID
   * @returns 数量
   */
  public async checkUniqueByName(
    postName: string,
    postId: number
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.postName = postName;
    const uniqueId = await this.sysPostRepository.checkUnique(sysPost);
    if (uniqueId == postId) {
      return true;
    }
    return uniqueId == 0;
  }

  /**
   * 检查岗位编码是否唯一
   * @param postCode 岗位名称
   * @param postId 岗位ID
   * @returns 数量
   */
  public async checkUniqueByCode(
    postCode: string,
    postId: number
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.postCode = postCode;
    const uniqueId = await this.sysPostRepository.checkUnique(sysPost);
    if (uniqueId == postId) {
      return true;
    }
    return uniqueId == 0;
  }

  /**
   * 根据用户ID获取岗位选择框列表
   * @param userId 用户ID
   * @returns 数量
   */
  public async findByUserId(userId: number): Promise<SysPost[]> {
    return await this.sysPostRepository.selectByUserId(userId);
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysPost[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      // 状态
      let statusValue = '停用';
      if (row.statusFlag == '1') {
        statusValue = '正常';
      }
      const data = {
        岗位编号: row.postId,
        岗位编码: row.postCode,
        岗位名称: row.postName,
        岗位排序: row.postSort,
        岗位状态: statusValue,
      };
      arr.push(data);
    }
    return await this.fileService.excelWriteRecord(arr, fileName);
  }
}
