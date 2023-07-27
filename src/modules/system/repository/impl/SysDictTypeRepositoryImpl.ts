import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysDictTypeRepository } from '../ISysDictTypeRepository';
import { SysDictType } from '../../model/SysDictType';

/**查询视图对象SQL */
const SELECT_DICT_TYPE_SQL = `select 
dict_id, dict_name, dict_type, status, create_by, create_time, remark 
from sys_dict_type`;

/**字典表信息实体映射 */
const SYS_DICT_TYPE_RESULT = new Map<string, string>();
SYS_DICT_TYPE_RESULT.set('dict_id', 'dictId');
SYS_DICT_TYPE_RESULT.set('dict_name', 'dictName');
SYS_DICT_TYPE_RESULT.set('dict_type', 'dictType');
SYS_DICT_TYPE_RESULT.set('remark', 'remark');
SYS_DICT_TYPE_RESULT.set('status', 'status');
SYS_DICT_TYPE_RESULT.set('create_by', 'createBy');
SYS_DICT_TYPE_RESULT.set('create_time', 'createTime');
SYS_DICT_TYPE_RESULT.set('update_by', 'updateBy');
SYS_DICT_TYPE_RESULT.set('update_time', 'updateTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysDictType[] {
  const sysDictTypes: SysDictType[] = [];
  for (const row of rows) {
    const sysDictType = new SysDictType();
    for (const key in row) {
      if (SYS_DICT_TYPE_RESULT.has(key)) {
        const keyMapper = SYS_DICT_TYPE_RESULT.get(key);
        sysDictType[keyMapper] = row[key];
      }
    }
    sysDictTypes.push(sysDictType);
  }
  return sysDictTypes;
}

/**
 * 字典类型表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysDictTypeRepositoryImpl implements ISysDictTypeRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectDictTypePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.dictName) {
      conditions.push("dict_name like concat(?, '%')");
      params.push(query.dictName);
    }
    if (query.dictType) {
      conditions.push("dict_type like concat(?, '%')");
      params.push(query.dictType);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
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
    const totalSql = "select count(1) as 'total' from sys_dict_type";
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
    const querySql = SELECT_DICT_TYPE_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectDictTypeList(sysDictType: SysDictType): Promise<SysDictType[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDictType.dictName) {
      conditions.push("dict_name like concat(?, '%')");
      params.push(sysDictType.dictName);
    }
    if (sysDictType.dictType) {
      conditions.push("dict_type like concat(?, '%')");
      params.push(sysDictType.dictType);
    }
    if (sysDictType.status) {
      conditions.push('status = ?');
      params.push(sysDictType.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_DICT_TYPE_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectDictTypeByIds(dictIds: string[]): Promise<SysDictType[]> {
    const sqlStr = `${SELECT_DICT_TYPE_SQL} where dict_id in (${dictIds
      .map(() => '?')
      .join(',')})`;
    const rows = await this.db.execute(sqlStr, dictIds);
    return convertResultRows(rows);
  }

  async selectDictTypeByType(dictType: string): Promise<SysDictType> {
    const sql = `${SELECT_DICT_TYPE_SQL} where dict_type = ?`;
    const rows = await this.db.execute(sql, [dictType]);
    return convertResultRows(rows)[0] || null;
  }

  async checkUniqueDictType(sysDictType: SysDictType): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDictType.dictName) {
      conditions.push('dict_name = ?');
      params.push(sysDictType.dictName);
    }
    if (sysDictType.dictType) {
      conditions.push('dict_type = ?');
      params.push(sysDictType.dictType);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select dict_id as 'str' from sys_dict_type " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }

  async insertDictType(sysDictType: SysDictType): Promise<string> {
    const paramMap = new Map();
    if (sysDictType.dictName) {
      paramMap.set('dict_name', sysDictType.dictName);
    }
    if (sysDictType.dictType) {
      paramMap.set('dict_type', sysDictType.dictType);
    }
    if (sysDictType.status) {
      paramMap.set('status', parseNumber(sysDictType.status));
    }
    if (sysDictType.remark) {
      paramMap.set('remark', sysDictType.remark);
    }
    if (sysDictType.createBy) {
      paramMap.set('create_by', sysDictType.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_dict_type (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateDictType(sysDictType: SysDictType): Promise<number> {
    const paramMap = new Map();
    if (sysDictType.dictName) {
      paramMap.set('dict_name', sysDictType.dictName);
    }
    if (sysDictType.dictType) {
      paramMap.set('dict_type', sysDictType.dictType);
    }
    if (sysDictType.status) {
      paramMap.set('status', parseNumber(sysDictType.status));
    }
    if (sysDictType.remark) {
      paramMap.set('remark', sysDictType.remark);
    }
    if (sysDictType.updateBy) {
      paramMap.set('update_by', sysDictType.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_dict_type set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where dict_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysDictType.dictId,
    ]);
    return result.affectedRows;
  }

  async deleteDictTypeByIds(dictIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_dict_type where dict_id in (${dictIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, dictIds);
    return result.affectedRows;
  }
}
