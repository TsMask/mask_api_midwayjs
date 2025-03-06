import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysPost } from '../model/sys_post';

/**岗位表 数据层处理 */
@Provide()
@Singleton()
export class SysPostRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询集合
   *
   * @param query 参数
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>
  ): Promise<[SysPost[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysPost, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.postCode) {
      tx.andWhere('s.post_code like :postCode', {
        postCode: query.postCode + '%',
      });
    }
    if (query.postName) {
      tx.andWhere('s.post_name like :postName', {
        postName: query.postName + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }

    // 查询结果
    let total = 0;
    let rows: SysPost[] = [];

    // 查询数量为0直接返回
    total = await tx.getCount();
    if (total <= 0) {
      return [rows, total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    rows = await tx.addOrderBy('s.post_sort', 'ASC').getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysPost 信息
   * @return 列表
   */
  public async select(sysPost: SysPost): Promise<SysPost[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysPost, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysPost.postCode) {
      tx.andWhere('s.post_code like :postCode', {
        postCode: sysPost.postCode + '%',
      });
    }
    if (sysPost.postName) {
      tx.andWhere('s.post_name like :postName', {
        postName: sysPost.postName + '%',
      });
    }
    if (sysPost.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysPost.statusFlag,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param postIds ID数组
   * @return 信息
   */
  public async selectByIds(postIds: number[]): Promise<SysPost[]> {
    if (postIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysPost, 's')
      .andWhere("s.post_id in (:postIds) and s.del_flag = '0'", { postIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysPost 信息
   * @return ID
   */
  public async insert(sysPost: SysPost): Promise<number> {
    sysPost.delFlag = '0';
    if (sysPost.createBy) {
      const ms = Date.now().valueOf();
      sysPost.updateBy = sysPost.createBy;
      sysPost.updateTime = ms;
      sysPost.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysPost)
      .values(sysPost)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 更新
   *
   * @param sysPost 信息
   * @return 影响记录数
   */
  public async update(sysPost: SysPost): Promise<number> {
    if (sysPost.postId <= 0) {
      return 0;
    }
    if (sysPost.updateBy) {
      sysPost.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysPost);
    delete data.postId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysPost)
      .set(data)
      .andWhere('post_id = :postId', { postId: sysPost.postId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param postIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(postIds: number[]): Promise<number> {
    if (postIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysPost)
      .set({ delFlag: '1' })
      .andWhere('post_id in (:postIds)', { postIds })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysPost 信息
   * @returns
   */
  public async checkUnique(sysPost: SysPost): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysPost, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysPost.postName) {
      tx.andWhere('s.post_name = :postName', {
        postName: sysPost.postName,
      });
    }
    if (sysPost.postCode) {
      tx.andWhere('s.post_code = :postCode', {
        postCode: sysPost.postCode,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.postId;
  }

  /**
   * 根据用户ID获取岗位选择框列表
   * @param configKey 数据Key
   * @returns
   */
  public async selectByUserId(userId: number): Promise<SysPost[]> {
    if (userId < 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysPost, 's')
      .andWhere(
        's.post_id in (select post_id from sys_user_post  where user_id = :userId)',
        { userId }
      )
      .addOrderBy('s.post_id', 'ASC')
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }
}
