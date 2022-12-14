import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../common/utils/ValueParseUtils';
import { SysDictData } from '../../../../framework/core/model/SysDictData';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { ISysDictDataRepository } from '../ISysDictDataRepository';

/**查询视图对象SQL */
const SELECT_DICT_DATA_VO = `select 
dict_code, dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark 
from sys_dict_data
`;

/**字典表信息实体映射 */
const SYS_DICT_DATA_RESULT = new Map<string, string>();
SYS_DICT_DATA_RESULT.set('dict_code', 'dictCode');
SYS_DICT_DATA_RESULT.set('dict_sort', 'dictSort');
SYS_DICT_DATA_RESULT.set('dict_label', 'dictLabel');
SYS_DICT_DATA_RESULT.set('dict_value', 'dictValue');
SYS_DICT_DATA_RESULT.set('dict_type', 'dictType');
SYS_DICT_DATA_RESULT.set('css_class', 'cssClass');
SYS_DICT_DATA_RESULT.set('list_class', 'listClass');
SYS_DICT_DATA_RESULT.set('is_default', 'isDefault');
SYS_DICT_DATA_RESULT.set('status', 'status');
SYS_DICT_DATA_RESULT.set('remark', 'remark');
SYS_DICT_DATA_RESULT.set('create_by', 'createBy');
SYS_DICT_DATA_RESULT.set('create_time', 'createTime');
SYS_DICT_DATA_RESULT.set('update_by', 'updateBy');
SYS_DICT_DATA_RESULT.set('update_time', 'updateTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysDictDataResult(rows: any[]): SysDictData[] {
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDictDataRepositoryImpl implements ISysDictDataRepository {
  @Inject()
  private db: MysqlManager;

  async selectDictDataPage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.dictType) {
      sqlStr += ' and dict_type = ? ';
      paramArr.push(query.dictType);
    }
    if (query.dictLabel) {
      sqlStr += " and dict_label like concat('%', ?, '%') ";
      paramArr.push(query.dictLabel);
    }
    if (query.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(query.status);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: { total: number }[] = await this.db.execute(
      `select count(1) as 'total' from sys_dict_data where 1 = 1 ${sqlStr}`,
      paramArr
    );
    if (countRow[0].total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    sqlStr += ' order by dict_sort asc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    let pageSize = parseNumber(query.pageSize);
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_DICT_DATA_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysDictDataResult(results);
    return { total: countRow[0].total, rows };
  }

  async selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (sysDictData.dictType) {
      sqlStr += ' and dict_type = ? ';
      paramArr.push(sysDictData.dictType);
    }
    if (sysDictData.dictLabel) {
      sqlStr += " and dict_label like concat('%', ?, '%') ";
      paramArr.push(sysDictData.dictLabel);
    }
    if (sysDictData.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysDictData.status);
    }
    sqlStr += ' order by dict_sort asc ';

    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_DICT_DATA_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysDictDataResult(results);
  }

  async selectDictLabel(dictType: string, dictValue: string): Promise<string> {
    const sqlStr =
      "select dict_label as 'str' from sys_dict_data where dict_type = ? and dict_value = ?";
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, [
      dictType,
      dictValue,
    ]);
    return rows[0].str || null;
  }

  async selectDictDataById(dictCode: string): Promise<SysDictData> {
    const sqlStr = `${SELECT_DICT_DATA_VO} where dict_code = ?`;
    const rows = await this.db.execute(sqlStr, [dictCode]);

    return parseSysDictDataResult(rows)[0] || null;
  }

  async countDictDataByType(dictType: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_dict_data where dict_type = ?";
    const countRow: rowTotal[] = await this.db.execute(sqlStr, [dictType]);
    return parseNumber(countRow[0].total);
  }

  async checkUniqueDictLabel(
    dictType: string,
    dictLabel: string
  ): Promise<string> {
    const sqlStr =
      "select dict_code as 'str' from sys_dict_data where dict_type = ? and dict_label = ? limit 1";
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, [
      dictType,
      dictLabel,
    ]);
    return rows.length > 0 ? rows[0].str : null;
  }

  async checkUniqueDictValue(
    dictType: string,
    dictValue: string
  ): Promise<string> {
    const sqlStr =
      "select dict_code as 'str' from sys_dict_data where dict_type = ? and dict_value = ? limit 1";
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, [
      dictType,
      dictValue,
    ]);
    return rows.length > 0 ? rows[0].str : null;
  }

  deleteDictDataById(dictCode: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async deleteDictDataByIds(dictCodes: string[]): Promise<number> {
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
      paramMap.set('dict_label', sysDictData.dictLabel.trim());
    }
    if (sysDictData.dictValue) {
      paramMap.set('dict_value', sysDictData.dictValue.trim());
    }
    if (sysDictData.dictType) {
      paramMap.set('dict_type', sysDictData.dictType.trim());
    }
    if (sysDictData.listClass) {
      paramMap.set('list_class', sysDictData.listClass);
    }
    if (sysDictData.isDefault) {
      paramMap.set('is_default', sysDictData.isDefault);
    }
    if (sysDictData.status) {
      paramMap.set('status', parseNumber(sysDictData.status));
    }
    if (sysDictData.remark) {
      paramMap.set('remark', sysDictData.remark);
    }
    if (sysDictData.createBy) {
      paramMap.set('create_by', sysDictData.createBy);
      paramMap.set('create_time', new Date().getTime());
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
      paramMap.set('dict_label', sysDictData.dictLabel.trim());
    }
    if (sysDictData.dictValue) {
      paramMap.set('dict_value', sysDictData.dictValue.trim());
    }
    if (sysDictData.dictType) {
      paramMap.set('dict_type', sysDictData.dictType.trim());
    }
    if (sysDictData.cssClass) {
      paramMap.set('css_class', sysDictData.cssClass);
    }
    if (sysDictData.listClass) {
      paramMap.set('list_class', sysDictData.listClass);
    }
    if (sysDictData.isDefault) {
      paramMap.set('is_default', sysDictData.isDefault);
    }
    if (sysDictData.status) {
      paramMap.set('status', parseNumber(sysDictData.status));
    }
    if (sysDictData.remark) {
      paramMap.set('remark', sysDictData.remark);
    }
    if (sysDictData.updateBy) {
      paramMap.set('update_by', sysDictData.updateBy);
      paramMap.set('update_time', new Date().getTime());
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
