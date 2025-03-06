import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysConfig } from '../model/sys_config';

/**参数配置表 数据层处理 */
@Provide()
@Singleton()
export class SysConfigRepository {
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
  ): Promise<[SysConfig[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.configName) {
      tx.andWhere('s.config_name like :configName', {
        configName: query.configName + '%',
      });
    }
    if (query.configType) {
      tx.andWhere('s.config_type = :configType', {
        configType: query.configType,
      });
    }
    if (query.configKey) {
      tx.andWhere('s.config_key like :configKey', {
        configKey: query.configKey + '%',
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }

    // 查询结果
    let total = 0;
    let rows: SysConfig[] = [];

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
    rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysConfig 信息
   * @return 列表
   */
  public async select(sysConfig: SysConfig): Promise<SysConfig[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysConfig.configName) {
      tx.andWhere('s.config_name like :configName', {
        configName: sysConfig.configName + '%',
      });
    }
    if (sysConfig.configType) {
      tx.andWhere('s.config_type = :configType', {
        configType: sysConfig.configType,
      });
    }
    if (sysConfig.configKey) {
      tx.andWhere('s.config_key like :configKey', {
        configKey: sysConfig.configKey + '%',
      });
    }
    if (sysConfig.createTime) {
      tx.andWhere('s.create_time = :createTime', {
        createTime: sysConfig.createTime,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param configIds ID数组
   * @return 信息
   */
  public async selectByIds(configIds: number[]): Promise<SysConfig[]> {
    if (configIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere("s.config_id in (:configIds) and s.del_flag = '0'", {
        configIds,
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
  public async insert(sysConfig: SysConfig): Promise<number> {
    if (sysConfig.createBy) {
      const ms = Date.now().valueOf();
      sysConfig.updateBy = sysConfig.createBy;
      sysConfig.updateTime = ms;
      sysConfig.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysConfig)
      .values(sysConfig)
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
   * @param sysConfig 信息
   * @return 影响记录数
   */
  public async update(sysConfig: SysConfig): Promise<number> {
    if (sysConfig.configId <= 0) {
      return 0;
    }
    if (sysConfig.updateBy) {
      sysConfig.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysConfig);
    delete data.configId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysConfig)
      .set(data)
      .andWhere('config_id = :configId', { configId: sysConfig.configId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param configIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(configIds: number[]): Promise<number> {
    if (configIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysConfig)
      .set({ delFlag: '1' })
      .andWhere('config_id in (:configIds)', { configIds })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysConfig 信息
   * @returns
   */
  public async checkUnique(sysConfig: SysConfig): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysConfig.configType) {
      tx.andWhere('s.config_type = :configType', {
        configType: sysConfig.configType,
      });
    }
    if (sysConfig.configKey) {
      tx.andWhere('s.config_key = :configKey', {
        configKey: sysConfig.configKey,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.configId;
  }

  /**
   * 通过Key查询Value
   * @param configKey 数据Key
   * @returns
   */
  public async selectValueByKey(configKey: string): Promise<string> {
    if (!configKey) return '';

    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere("s.config_key = :configKey and s.del_flag = '0'", { configKey })
      .getOne();
    if (!item) {
      return '';
    }
    return item.configValue;
  }
}
