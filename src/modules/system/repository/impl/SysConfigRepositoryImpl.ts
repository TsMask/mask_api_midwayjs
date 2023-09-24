import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysConfig } from '../../model/SysConfig';
import { ISysConfigRepository } from '../ISysConfigRepository';
import { ResultSetHeader } from 'mysql2';

/**查询视图对象SQL */
const SELECT_CONFIG_SQL = `select
config_id, config_name, config_key, config_value, config_type, create_by, create_time, update_by, update_time, remark 
from sys_config`;

/**系统配置表信息实体映射 */
const SYS_CONFIG_RESULT = new Map<string, string>();
SYS_CONFIG_RESULT.set('config_id', 'configId');
SYS_CONFIG_RESULT.set('config_name', 'configName');
SYS_CONFIG_RESULT.set('config_key', 'configKey');
SYS_CONFIG_RESULT.set('config_value', 'configValue');
SYS_CONFIG_RESULT.set('config_type', 'configType');
SYS_CONFIG_RESULT.set('remark', 'remark');
SYS_CONFIG_RESULT.set('create_by', 'createBy');
SYS_CONFIG_RESULT.set('create_time', 'createTime');
SYS_CONFIG_RESULT.set('update_by', 'updateBy');
SYS_CONFIG_RESULT.set('update_time', 'updateTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysConfig[] {
  const sysConfigs: SysConfig[] = [];
  for (const row of rows) {
    const sysConfig = new SysConfig();
    for (const key in row) {
      if (SYS_CONFIG_RESULT.has(key)) {
        const keyMapper = SYS_CONFIG_RESULT.get(key);
        sysConfig[keyMapper] = row[key];
      }
    }
    sysConfigs.push(sysConfig);
  }
  return sysConfigs;
}

/**
 * 参数配置 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysConfigRepositoryImpl implements ISysConfigRepository {
  @Inject()
  public db: DynamicDataSource;

  async selectConfigPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.configName) {
      conditions.push("config_name like concat(?, '%')");
      params.push(query.configName);
    }
    if (query.configType) {
      conditions.push('config_type = ?');
      params.push(query.configType);
    }
    if (query.configKey) {
      conditions.push("config_key like concat(?, '%')");
      params.push(query.configKey);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('create_time >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('create_time <= ?');
      params.push(endDate);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_config";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_CONFIG_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysConfig.configName) {
      conditions.push("config_name like concat(?, '%')");
      params.push(sysConfig.configName);
    }
    if (sysConfig.configType) {
      conditions.push('config_type = ?');
      params.push(sysConfig.configType);
    }
    if (sysConfig.configKey) {
      conditions.push("config_key like concat(?, '%')");
      params.push(sysConfig.configKey);
    }
    if (sysConfig.createTime) {
      conditions.push('create_time >= ?');
      params.push(sysConfig.createTime);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_CONFIG_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectconfigValueByKey(configKey: string): Promise<string> {
    const sqlStr =
      "select config_value as 'str' from sys_config where config_key = ?";
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, [configKey]);
    return rows.length > 0 ? rows[0].str : null;
  }

  async selectConfigByIds(configIds: string[]): Promise<SysConfig[]> {
    const sqlStr = `${SELECT_CONFIG_SQL} where config_id in (${configIds
      .map(() => '?')
      .join(',')})`;
    const rows = await this.db.execute(sqlStr, configIds);
    return convertResultRows(rows);
  }

  async checkUniqueConfig(sysConfig: SysConfig): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysConfig.configKey) {
      conditions.push('config_key = ?');
      params.push(sysConfig.configKey);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select config_id as 'str' from sys_config " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }

  async insertConfig(sysConfig: SysConfig): Promise<string> {
    const paramMap = new Map();
    if (sysConfig.configName) {
      paramMap.set('config_name', sysConfig.configName);
    }
    if (sysConfig.configKey) {
      paramMap.set('config_key', sysConfig.configKey);
    }
    if (sysConfig.configValue) {
      paramMap.set('config_value', sysConfig.configValue);
    }
    if (sysConfig.configType) {
      paramMap.set('config_type', sysConfig.configType);
    }
    if (sysConfig.remark) {
      paramMap.set('remark', sysConfig.remark);
    }
    if (sysConfig.createBy) {
      paramMap.set('create_by', sysConfig.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_config (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateConfig(sysConfig: SysConfig): Promise<number> {
    const paramMap = new Map();
    if (sysConfig.configName) {
      paramMap.set('config_name', sysConfig.configName);
    }
    if (sysConfig.configKey) {
      paramMap.set('config_key', sysConfig.configKey);
    }
    if (sysConfig.configValue) {
      paramMap.set('config_value', sysConfig.configValue);
    }
    if (sysConfig.configType) {
      paramMap.set('config_type', sysConfig.configType);
    }
    if (sysConfig.remark) {
      paramMap.set('remark', sysConfig.remark);
    }
    if (sysConfig.updateBy) {
      paramMap.set('update_by', sysConfig.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_config set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where config_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysConfig.configId,
    ]);
    return result.affectedRows;
  }

  async deleteConfigByIds(configIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_config where config_id in (${configIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, configIds);
    return result.affectedRows;
  }
}
