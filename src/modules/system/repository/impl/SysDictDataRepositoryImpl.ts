import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
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
 * 字典表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDictDataRepositoryImpl implements ISysDictDataRepository {
  @Inject()
  private db: MysqlManager;

  selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    throw new Error('Method not implemented.');
  }
  selectDictDataByType(dictType: string): Promise<SysDictData[]> {
    throw new Error('Method not implemented.');
  }
  selectDictLabel(dictType: string, dictValue: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  async selectDictDataById(dictCode: string): Promise<SysDictData> {
    const sql = `${SELECT_DICT_DATA_VO} where dict_code = ?`;
    const rows = await this.db.execute(sql, [dictCode]);

    return parseSysDictDataResult(rows)[0] || null;
  }
  countDictDataByType(dictType: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteDictDataById(dictCode: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteDictDataByIds(dictCodes: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insertDictData(sysDictData: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
  updateDictData(sysDictData: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
  updateDictDataType(
    oldDictType: string,
    newDictType: string
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
