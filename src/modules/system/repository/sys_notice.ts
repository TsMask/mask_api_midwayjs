import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { SysNotice } from '../model/sys_notice';

/**通知公告表 数据层处理 */
@Provide()
@Singleton()
export class SysNoticeRepository {
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
  ): Promise<[SysNotice[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's')
      .andWhere("s.notice_del = '0'");
    // 查询条件拼接
    if (query.notice_title) {
      tx.andWhere('s.notice_title like :notice_title', {
        notice_title: query.notice_title + '%',
      });
    }
    if (query.notice_type) {
      tx.andWhere('s.notice_type = :notice_type', {
        notice_type: query.notice_type,
      });
    }
    if (query.create_by) {
      tx.andWhere('s.create_by like :create_by', {
        create_by: query.create_by + '%',
      });
    }
    if (query.notice_status) {
      tx.andWhere('s.notice_status = :notice_status', {
        notice_status: query.notice_status,
      });
    }
    if (query.begin_time) {
      if (`${query.begin_time}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.begin_time}000`),
        });
      } else if (`${query.begin_time}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.begin_time),
        });
      }
    }
    if (query.end_time) {
      if (`${query.end_time}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.end_time}999`),
        });
      } else if (`${query.end_time}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.end_time),
        });
      }
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

    // 排序，格式: sort=create_time,id:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      create_by: 's.create_by',
      create_time: 's.create_time',
      update_time: 's.update_time',
      notice_title: 's.notice_title',
      notice_type: 's.notice_type',
      notice_status: 's.notice_status',
    };
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 's.id DESC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysNotice 信息
   * @return 列表
   */
  public async select(sysNotice: SysNotice): Promise<SysNotice[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's')
      .andWhere("notice_del = '0'");
    // 构建查询条件
    if (sysNotice.notice_title) {
      tx.andWhere('s.notice_title like :notice_title', {
        notice_title: sysNotice.notice_title + '%',
      });
    }
    if (sysNotice.notice_type) {
      tx.andWhere('s.notice_type = :notice_type', {
        notice_type: sysNotice.notice_type,
      });
    }
    if (sysNotice.create_by) {
      tx.andWhere('s.create_by like :create_by', {
        create_by: sysNotice.create_by + '%',
      });
    }
    if (sysNotice.notice_status) {
      tx.andWhere('s.notice_status = :notice_status', {
        notice_status: sysNotice.notice_status,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param noticeIds ID数组
   * @return 信息
   */
  public async selectByIds(noticeIds: number[]): Promise<SysNotice[]> {
    if (noticeIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's')
      .andWhere("s.id in (:noticeIds) and s.notice_del = '0'", {
        noticeIds,
      })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysConfig 信息
   * @return ID
   */
  public async insert(sysNotice: SysNotice): Promise<number> {
    sysNotice.notice_del = '0';
    if (sysNotice.create_by) {
      const ms = Date.now();
      sysNotice.update_by = sysNotice.create_by;
      sysNotice.update_time = ms;
      sysNotice.create_time = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysNotice)
      .values(sysNotice)
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
   * @param sysNotice 信息
   * @return 影响记录数
   */
  public async update(sysNotice: SysNotice): Promise<number> {
    if (sysNotice.id <= 0) {
      return 0;
    }
    if (sysNotice.update_by) {
      sysNotice.update_time = Date.now();
    }
    const data = Object.assign({}, sysNotice);
    delete (data as Partial<SysNotice>).id;
    delete (data as Partial<SysNotice>).notice_del;
    delete (data as Partial<SysNotice>).create_by;
    delete (data as Partial<SysNotice>).create_time;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysNotice)
      .set(data)
      .andWhere('id = :id', { id: sysNotice.id })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除
   *
   * @param configIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(noticeIds: number[]): Promise<number> {
    if (noticeIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysNotice)
      .set({ notice_del: '1' })
      .andWhere('id in (:noticeIds)', { noticeIds })
      .execute();
    return tx.affected ?? 0;
  }
}
