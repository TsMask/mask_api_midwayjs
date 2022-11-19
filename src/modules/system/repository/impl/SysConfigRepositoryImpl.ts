import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../common/utils/ParseUtils';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { SysConfig } from '../../model/SysConfig';
import { ISysConfigRepository } from '../ISysConfigRepository';

/**查询视图对象SQL */
const SELECT_CONFIG_VO =
  'select config_id, config_name, config_key, config_value, config_type, create_by, create_time, update_by, update_time, remark from sys_config';

/**系统配置表信息实体映射 */
const SYS_CONFIG_RESULT = new Map<string, string>();
SYS_CONFIG_RESULT.set('config_id', 'configId');
SYS_CONFIG_RESULT.set('config_name', 'configName');
SYS_CONFIG_RESULT.set('config_key', 'configKey');
SYS_CONFIG_RESULT.set('config_value', 'configValue');
SYS_CONFIG_RESULT.set('config_type', 'configType');
SYS_CONFIG_RESULT.set('create_by', 'createBy');
SYS_CONFIG_RESULT.set('create_time', 'createTime');
SYS_CONFIG_RESULT.set('update_by', 'updateBy');
SYS_CONFIG_RESULT.set('update_time', 'updateTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysConfigResult(rows: any[]): SysConfig[] {
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
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysConfigRepositoryImpl implements ISysConfigRepository {
  @Inject()
  public db: MysqlManager;

  async selectConfigPage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.configName) {
      sqlStr += " and config_name like concat('%', ?, '%') ";
      paramArr.push(query.configName);
    }
    if (query.configType) {
      sqlStr += ' and config_type = ? ';
      paramArr.push(query.configType);
    }
    if (query.configKey) {
      sqlStr += " and config_key like concat('%', ?, '%') ";
      paramArr.push(query.configKey);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      sqlStr +=
        " and unix_timestamp(from_unixtime(create_time/1000,'%Y-%m-%d')) >= unix_timestamp(date_format(?,'%Y-%m-%d')) ";
      paramArr.push(beginTime);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      sqlStr +=
        " and unix_timestamp(from_unixtime(create_time/1000,'%Y-%m-%d')) <= unix_timestamp(date_format(?,'%Y-%m-%d')) ";
      paramArr.push(endTime);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: { total: number }[] = await this.db.execute(
      `select count(1) as 'total' from sys_config where 1 = 1 ${sqlStr}`,
      paramArr
    );
    if (countRow[0].total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    let pageSize = parseNumber(query.pageSize);
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_CONFIG_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysConfigResult(results);
    return { total: countRow[0].total, rows };
  }

  async selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]> {
    let sqlStr = `${SELECT_CONFIG_VO} where 1 = 1 `;
    const paramArr = [];
    if (sysConfig.configName) {
      sqlStr += " and config_name like concat('%', ?, '%') ";
      paramArr.push(sysConfig.configName);
    }
    if (sysConfig.configType) {
      sqlStr += ' and config_type = ? ';
      paramArr.push(sysConfig.configType);
    }
    if (sysConfig.configKey) {
      sqlStr += " and config_key like concat('%', ?, '%') ";
      paramArr.push(sysConfig.configKey);
    }
    if (sysConfig.createTime) {
      sqlStr += ' and create_time >= ? ';
      paramArr.push(sysConfig.createTime);
    }

    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysConfigResult(rows);
  }

  async selectConfig(sysConfig: SysConfig): Promise<SysConfig> {
    let sqlStr = `${SELECT_CONFIG_VO} where 1 = 1 `;
    const paramArr = [];
    if (sysConfig.configId) {
      sqlStr += ' and config_id = ? ';
      paramArr.push(sysConfig.configId);
    }
    if (sysConfig.configKey) {
      sqlStr += ' and config_key = ? ';
      paramArr.push(sysConfig.configKey);
    }

    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysConfigResult(rows)[0] || null;
  }

  async checkUniqueConfigKey(configKey: string): Promise<SysConfig> {
    const sqlStr = `${SELECT_CONFIG_VO} where config_key = ? limit 1`;
    const rows = await this.db.execute(sqlStr, [configKey]);
    return parseSysConfigResult(rows)[0] || null;
  }

  async insertConfig(sysConfig: SysConfig): Promise<number> {
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
    if (sysConfig.createBy) {
      paramMap.set('create_by', sysConfig.createBy);
      paramMap.set('create_time', new Date().getTime());
    }
    if (sysConfig.remark) {
      paramMap.set('remark', sysConfig.remark);
    }

    const sqlStr = `insert into sys_config (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return result.insertId;
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
    if (sysConfig.updateBy) {
      paramMap.set('update_by', sysConfig.updateBy);
      paramMap.set('update_time', new Date().getTime());
    }
    if (sysConfig.remark) {
      paramMap.set('remark', sysConfig.remark);
    }

    const sqlStr = `update sys_config set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where config_id = ${sysConfig.configId}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return result.affectedRows;
  }

  async deleteConfigById(configId: number): Promise<number> {
    const sqlStr = 'delete from sys_config where config_id = ?';
    const result = await this.db.execute(sqlStr, [configId]);
    return result.affectedRows;
  }
}
