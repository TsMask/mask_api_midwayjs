import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
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
      .from(SysPost, 's');
    // 查询条件拼接
    if (query.post_code) {
      tx.andWhere('s.post_code like :postCode', {
        postCode: query.post_code + '%',
      });
    }
    if (query.post_name) {
      tx.andWhere('s.post_name like :postName', {
        postName: query.post_name + '%',
      });
    }
    if (query.post_status) {
      tx.andWhere('s.post_status = :postStatus', {
        postStatus: query.post_status,
      });
    }

    // 查询数量为0直接返回
    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.page_num,
      query.page_size
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    // 排序，格式: sort=postSort,postName:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      post_code: 's.post_code',
      post_name: 's.post_name',
      post_sort: 's.post_sort',
      post_status: 's.post_status',
      create_time: 's.create_time',
    };
    if (query.sort) {
      const items = query.sort.split(',');
      for (const item of items) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        const order: 'ASC' | 'DESC' = dir === 'asc' ? 'ASC' : 'DESC';
        tx.addOrderBy(column, order);
      }
    } else {
      tx.addOrderBy('s.post_sort', 'ASC');
    }

    const rows = await tx.getMany();
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
      .from(SysPost, 's');
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
    if (sysPost.postStatus) {
      tx.andWhere('s.post_status = :postStatus', {
        postStatus: sysPost.postStatus,
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
      .andWhere('s.id in (:postIds)', { postIds })
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
    if (sysPost.id <= 0) {
      return 0;
    }
    if (sysPost.updateBy) {
      sysPost.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysPost);
    delete (data as Partial<SysPost>).id;
    delete (data as Partial<SysPost>).createBy;
    delete (data as Partial<SysPost>).createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysPost)
      .set(data)
      .andWhere('id = :id', { id: sysPost.id })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除
   *
   * @param postIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(postIds: number[]): Promise<number> {
    if (postIds.length === 0) return 0;
    // Gin uses physical deletion for posts.
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysPost)
      .andWhere('id in (:postIds)', { postIds })
      .execute();
    return tx.affected ?? 0;
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
    return item.id;
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
        's.id in (select post_id from sys_user_post  where user_id = :userId)',
        { userId }
      )
      .addOrderBy('s.id', 'ASC')
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }
}
