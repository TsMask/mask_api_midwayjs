import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysDictDataRepository } from '../ISysDictDataRepository';
import { SysDictData } from '../../model/SysDictData';

/**查询视图对象SQL */
const SELECT_DICT_DATA_SQL = `select 
dict_code, dict_sort, dict_label, dict_value, dict_type, tag_class, tag_type, status, create_by, create_time, remark 
from sys_dict_data`;

/**字典表信息实体映射 */
const SYS_DICT_DATA_RESULT = new Map<string, string>();
SYS_DICT_DATA_RESULT.set('dict_code', 'dictCode');
SYS_DICT_DATA_RESULT.set('dict_sort', 'dictSort');
SYS_DICT_DATA_RESULT.set('dict_label', 'dictLabel');
SYS_DICT_DATA_RESULT.set('dict_value', 'dictValue');
SYS_DICT_DATA_RESULT.set('dict_type', 'dictType');
SYS_DICT_DATA_RESULT.set('tag_class', 'tagClass');
SYS_DICT_DATA_RESULT.set('tag_type', 'tagType');
SYS_DICT_DATA_RESULT.set('status', 'status');
SYS_DICT_DATA_RESULT.set('remark', 'remark');
SYS_DICT_DATA_RESULT.set('create_by', 'createBy');
SYS_DICT_DATA_RESULT.set('create_time', 'createTime');
SYS_DICT_DATA_RESULT.set('update_by', 'updateBy');
SYS_DICT_DATA_RESULT.set('update_time', 'updateTime');

/**
 * 将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysDictData[] {
  const sysDictDatas: SysDictData[] = [];
  for (const row of rows) {
    const sysDictData = new SysDictData();
    for (const key in row) {
      if (SYS_DICT_DATA_RESULT.has(key)) {
        const keyMapper = SYS_DICT_DATA_RESULT.get(key);
        sysDictData[keyMapper] = row[key];
      }
    }
    sysDictDatas.push(sysDictData);
  }
  return sysDictDatas;
}

/**
 * 字典类型数据表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysDictDataRepositoryImpl implements ISysDictDataRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectDictDataPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.dictType) {
      conditions.push('dict_type = ?');
      params.push(query.dictType);
    }
    if (query.dictLabel) {
      conditions.push("dict_label like concat(?, '%')");
      params.push(query.dictLabel);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_dict_data";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by dict_sort asc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_DICT_DATA_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDictData.dictType) {
      conditions.push('dict_type = ?');
      params.push(sysDictData.dictType);
    }
    if (sysDictData.dictLabel) {
      conditions.push("dict_label like concat(?, '%')");
      params.push(sysDictData.dictLabel);
    }
    if (sysDictData.status) {
      conditions.push('status = ?');
      params.push(sysDictData.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const orderSql = ' order by dict_sort asc';
    const querySql = SELECT_DICT_DATA_SQL + whereSql + orderSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectDictDataByCodes(dictCodes: string[]): Promise<SysDictData[]> {
    const sqlStr = `${SELECT_DICT_DATA_SQL} where dict_code in (${dictCodes
      .map(() => '?')
      .join(',')})`;
    const rows = await this.db.execute(sqlStr, dictCodes);
    return convertResultRows(rows);
  }

  async countDictDataByType(dictType: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_dict_data where dict_type = ?";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [dictType]);
    return parseNumber(countRow[0].total);
  }

  async checkUniqueDictData(sysDictData: SysDictData): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDictData.dictType) {
      conditions.push('dict_type = ?');
      params.push(sysDictData.dictType);
    }
    if (sysDictData.dictLabel) {
      conditions.push('dict_label = ?');
      params.push(sysDictData.dictLabel);
    }
    if (sysDictData.dictValue) {
      conditions.push('dict_value = ?');
      params.push(sysDictData.dictValue);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select dict_code as 'str' from sys_dict_data " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }

  async deleteDictDataByCodes(dictCodes: string[]): Promise<number> {
    const sqlStr = `delete from sys_dict_data where dict_code in (${dictCodes
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, dictCodes);
    return result.affectedRows;
  }

  async insertDictData(sysDictData: SysDictData): Promise<string> {
    const paramMap = new Map();
    if (sysDictData.dictSort >= 0) {
      paramMap.set('dict_sort', parseNumber(sysDictData.dictSort));
    }
    if (sysDictData.dictLabel) {
      paramMap.set('dict_label', sysDictData.dictLabel);
    }
    if (sysDictData.dictValue) {
      paramMap.set('dict_value', sysDictData.dictValue);
    }
    if (sysDictData.dictType) {
      paramMap.set('dict_type', sysDictData.dictType);
    }
    if (sysDictData.tagClass) {
      paramMap.set('tag_class', sysDictData.tagClass);
    }
    if (sysDictData.tagType) {
      paramMap.set('tag_type', sysDictData.tagType);
    }
    if (sysDictData.status) {
      paramMap.set('status', parseNumber(sysDictData.status));
    }
    if (sysDictData.remark) {
      paramMap.set('remark', sysDictData.remark);
    }
    if (sysDictData.createBy) {
      paramMap.set('create_by', sysDictData.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_dict_data (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateDictData(sysDictData: SysDictData): Promise<number> {
    const paramMap = new Map();
    if (sysDictData.dictSort >= 0) {
      paramMap.set('dict_sort', parseNumber(sysDictData.dictSort));
    }
    if (sysDictData.dictLabel) {
      paramMap.set('dict_label', sysDictData.dictLabel);
    }
    if (sysDictData.dictValue) {
      paramMap.set('dict_value', sysDictData.dictValue);
    }
    if (sysDictData.dictType) {
      paramMap.set('dict_type', sysDictData.dictType);
    }
    if (sysDictData.tagClass) {
      paramMap.set('tag_class', sysDictData.tagClass);
    }
    if (sysDictData.tagType) {
      paramMap.set('tag_type', sysDictData.tagType);
    }
    if (sysDictData.status) {
      paramMap.set('status', parseNumber(sysDictData.status));
    }
    if (sysDictData.remark) {
      paramMap.set('remark', sysDictData.remark);
    }
    if (sysDictData.updateBy) {
      paramMap.set('update_by', sysDictData.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_dict_data set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where dict_code = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysDictData.dictCode,
    ]);
    return result.affectedRows;
  }

  async updateDictDataType(
    oldDictType: string,
    newDictType: string
  ): Promise<number> {
    const sqlStr = 'update sys_dict_data set dict_type = ? where dict_type = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      newDictType,
      oldDictType,
    ]);
    return result.affectedRows;
  }
}
