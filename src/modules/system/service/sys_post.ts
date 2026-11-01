import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../internal/shared/file/file';
import { SysUserPostRepository } from '../repository/sys_user_post';
import { SysPostRepository } from '../repository/sys_post';
import { SysPost } from '../model/sys_post';

/**岗位表 服务层处理 */
@Provide()
@Singleton()
export class SysPostService {
  /**岗位服务 */
  @Inject()
  private sysPostRepository: SysPostRepository;

  /**用户与岗位关联服务 */
  @Inject()
  private sysUserPostRepository: SysUserPostRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

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
   * @param post_id ID
   * @returns 结果
   */
  public async findById(post_id: number): Promise<SysPost> {
    if (post_id <= 0) {
      return new SysPost();
    }
    const posts = await this.sysPostRepository.selectByIds([post_id]);
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
   * @param post_ids ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(post_ids: number[]): Promise<[number, string]> {
    // 检查是否存在
    const posts = await this.sysPostRepository.selectByIds(post_ids);
    if (posts.length <= 0) {
      return [0, '没有权限访问岗位数据！'];
    }
    for (const post of posts) {
      const useCount = await this.sysUserPostRepository.existUserByPostId(
        post.id
      );
      if (useCount > 0) {
        return [0, `【${post.post_name}】已分配给用户,不能删除`];
      }
    }
    if (posts.length === post_ids.length) {
      const rows = await this.sysPostRepository.deleteByIds(post_ids);
      return [rows, ''];
    }
    return [0, '删除岗位信息失败！'];
  }

  /**
   * 检查岗位名称是否唯一
   * @param post_name 岗位名称
   * @param post_id 岗位ID
   * @returns 数量
   */
  public async checkUniqueByName(
    post_name: string,
    post_id: number
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.post_name = post_name;
    const uniqueId = await this.sysPostRepository.checkUnique(sysPost);
    if (uniqueId === post_id) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查岗位编码是否唯一
   * @param post_code 岗位名称
   * @param post_id 岗位ID
   * @returns 数量
   */
  public async checkUniqueByCode(
    post_code: string,
    post_id: number
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.post_code = post_code;
    const uniqueId = await this.sysPostRepository.checkUnique(sysPost);
    if (uniqueId === post_id) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 根据用户ID获取岗位选择框列表
   * @param user_id 用户ID
   * @returns 数量
   */
  public async findByUserId(user_id: number): Promise<SysPost[]> {
    return await this.sysPostRepository.selectByUserId(user_id);
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysPost[], fileName: string) {
    // 第一行表头标题
    const data: string[][] = [
      ['岗位编号', '岗位编码', '岗位名称', '岗位排序', '岗位状态'],
    ];
    for (const row of rows) {
      // 状态
      let statusValue = '停用';
      if (row.post_status === '1') {
        statusValue = '正常';
      }
      data.push([
        `${row.id ?? 0}`,
        row.post_code ?? '',
        row.post_name ?? '',
        `${row.post_sort ?? 0}`,
        statusValue,
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
