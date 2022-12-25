import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../common/utils/DateFnsUtils';
import { parseNumber } from '../../../../common/utils/ValueParseUtils';
import { SysDictType } from '../../../../framework/core/model/SysDictType';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysDictTypeRepository } from '../ISysDictTypeRepository';

/**查询视图对象SQL */
const SELECT_DICT_TYPE_VO = `select 
dict_id, dict_name, dict_type, status, create_by, create_time, remark 
from sys_dict_type
`;

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
function parseSysDictTypeResult(rows: any[]): SysDictType[] {
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDictTypeRepositoryImpl implements ISysDictTypeRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectDictTypePage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.dictName) {
      sqlStr += " and dict_name like concat('%', ?, '%') ";
      paramArr.push(query.dictName);
    }
    if (query.dictType) {
      sqlStr += " and dict_type like concat('%', ?, '%') ";
      paramArr.push(query.dictType);
    }
    if (query.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(query.status);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      sqlStr += ' and create_time >= ? ';
      paramArr.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      sqlStr += ' and create_time <= ? ';
      paramArr.push(endDate);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: rowTotal[] = await this.db.execute(
      `select count(1) as 'total' from sys_dict_type where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
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
      `${SELECT_DICT_TYPE_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysDictTypeResult(results);
    return { total, rows };
  }

  async selectDictTypeList(sysDictType: SysDictType): Promise<SysDictType[]> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (sysDictType?.dictName) {
      sqlStr += " and dict_name like concat('%', ?, '%') ";
      paramArr.push(sysDictType.dictName);
    }
    if (sysDictType?.dictType) {
      sqlStr += " and dict_type like concat('%', ?, '%') ";
      paramArr.push(sysDictType.dictType);
    }
    if (sysDictType?.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysDictType.status);
    }

    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_DICT_TYPE_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysDictTypeResult(results);
  }

  async selectDictTypeById(dictId: string): Promise<SysDictType> {
    const sql = `${SELECT_DICT_TYPE_VO} where dict_id = ?`;
    const rows = await this.db.execute(sql, [dictId]);

    return parseSysDictTypeResult(rows)[0] || null;
  }

  async selectDictTypeByType(dictType: string): Promise<SysDictType> {
    const sql = `${SELECT_DICT_TYPE_VO} where dict_type = ?`;
    const rows = await this.db.execute(sql, [dictType]);
    return parseSysDictTypeResult(rows)[0] || null;
  }

  async checkUniqueDictName(dictName: string): Promise<string> {
    const sqlStr =
      "select dict_id as 'str' from sys_dict_type where dict_name = ? limit 1";
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, [dictName]);
    return rows.length > 0 ? rows[0].str : null;
  }

  async checkUniqueDictType(dictType: string): Promise<string> {
    const sqlStr =
      "select dict_id as 'str' from sys_dict_type where dict_type = ? limit 1";
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, [dictType]);
    return rows.length > 0 ? rows[0].str : null;
  }

  async insertDictType(sysDictType: SysDictType): Promise<string> {
    const paramMap = new Map();
    if (sysDictType.dictName) {
      paramMap.set('dict_name', sysDictType.dictName.trim());
    }
    if (sysDictType.dictType) {
      paramMap.set('dict_type', sysDictType.dictType.trim());
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
      paramMap.set('dict_name', sysDictType.dictName.trim());
    }
    if (sysDictType.dictType) {
      paramMap.set('dict_type', sysDictType.dictType.trim());
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
