import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { PageBody } from '../../../framework/core/page_body';
import { PageData } from '../../../framework/core/page_data';
import { MysqlManager } from '../../../framework/data_source/mysql_manager';
import { SysConfig } from '../model/sys_config';
import { SysConfigRepoInterface } from './interfaces/sys_config_repo.interface';

const SELECT_CONFIG_VO =
  'select config_id, config_name, config_key, config_value, config_type, create_by, create_time, update_by, update_time, remark from sys_config';

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysConfigRepo implements SysConfigRepoInterface {
  @Inject()
  public db: MysqlManager;

  async select_config_page(
    page_body: PageBody<SysConfig>
  ): Promise<PageData<SysConfig>> {
    // 查询条件拼接
    let sql_str = '';
    let param_arr = [];
    const sys_config: SysConfig = page_body.search;
    if (sys_config.config_name) {
      sql_str += " and config_name like concat('%', ?, '%') ";
      param_arr.push(sys_config.config_name);
    }
    if (sys_config.config_type) {
      sql_str += ' and config_type = ? ';
      param_arr.push(sys_config.config_type);
    }
    if (sys_config.config_key) {
      sql_str += " and config_key like concat('%', ?, '%') ";
      param_arr.push(sys_config.config_key);
    }
    if (sys_config.create_time) {
      sql_str +=
        " and date_format(create_time,'%y%m%d') >= date_format(?,'%y%m%d') ";
      param_arr.push(sys_config.create_time);
    }
    // 查询条件数 长度必为0其值为0
    const count_row: { total: number }[] = await this.db.execute(
      `select count(1) as 'total' from sys_config where 1 = 1 ${sql_str}`,
      param_arr
    );
    // 排序列
    if (page_body.order_by_column && page_body.order_by_is) {
      sql_str += ' order by ? ? ';
      param_arr.push(page_body.order_by_column);
      param_arr.push(page_body.order_by_is);
    }
    // 分页
    if (page_body.page_num && page_body.page_size) {
      sql_str += ' limit ?,? ';
      param_arr.push(page_body.page_num - 1);
      param_arr.push(page_body.page_num * page_body.page_size);
    }
    // 查询数据数
    const rows = await this.db.execute(
      `${SELECT_CONFIG_VO} where 1 = 1 ${sql_str}`,
      param_arr
    );
    // 将数据包装
    return new PageData<SysConfig>(count_row[0].total, rows);
  }

  async select_config_list(sys_config: SysConfig): Promise<SysConfig[]> {
    let sql_str = `${SELECT_CONFIG_VO} where 1 = 1 `;
    let param_arr = [];
    if (sys_config.config_name) {
      sql_str += " and config_name like concat('%', ?, '%') ";
      param_arr.push(sys_config.config_name);
    }
    if (sys_config.config_type) {
      sql_str += ' and config_type = ? ';
      param_arr.push(sys_config.config_type);
    }
    if (sys_config.config_key) {
      sql_str += " and config_key like concat('%', ?, '%') ";
      param_arr.push(sys_config.config_key);
    }
    if (sys_config.create_time) {
      sql_str +=
        " and date_format(create_time,'%y%m%d') >= date_format(?,'%y%m%d') ";
      param_arr.push(sys_config.create_time);
    }
    return await this.db.execute(sql_str, param_arr);
  }

  async select_config(sys_config: SysConfig): Promise<SysConfig> {
    let sql_str = `${SELECT_CONFIG_VO} where 1 = 1 `;
    let param_arr = [];
    if (sys_config.config_id) {
      sql_str += ' and config_id = ? ';
      param_arr.push(sys_config.config_id);
    }
    if (sys_config.config_key) {
      sql_str += ' and config_key = ? ';
      param_arr.push(sys_config.config_key);
    }
    const rows: SysConfig[] = await this.db.execute(sql_str, param_arr);
    return rows.length > 0 ? rows[0] : null;
  }

  async check_unique_config_key(config_key: string): Promise<SysConfig> {
    let sql_str = `${SELECT_CONFIG_VO} where config_key = ? limit 1`;
    let param_arr = [config_key];
    const rows: SysConfig[] = await this.db.execute(sql_str, param_arr);
    return rows.length > 0 ? rows[0] : null;
  }

  async insert_config(sys_config: SysConfig): Promise<number> {
    let param_map = new Map();
    if (sys_config.config_name) {
      param_map.set('config_name', sys_config.config_name);
    }
    if (sys_config.config_key) {
      param_map.set('config_key', sys_config.config_key);
    }
    if (sys_config.config_value) {
      param_map.set('config_value', sys_config.config_value);
    }
    if (sys_config.config_type) {
      param_map.set('config_type', sys_config.config_type);
    }
    if (sys_config.create_by) {
      param_map.set('create_by', sys_config.create_by);
    }
    if (sys_config.remark) {
      param_map.set('remark', sys_config.remark);
    }
    let sql_str = `insert into sys_config (${[...param_map.keys()].join(
      ','
    )},create_time)values(${Array.from(
      { length: param_map.size },
      () => '?'
    ).join(',')},sysdate())`;

    const rows: any[] = await this.db.execute(sql_str, [...param_map.values()]);
    return rows.length;
  }

  async update_config(sys_config: SysConfig): Promise<number> {
    let param_map = new Map();
    if (sys_config.config_name) {
      param_map.set('config_name', sys_config.config_name);
    }
    if (sys_config.config_key) {
      param_map.set('config_key', sys_config.config_key);
    }
    if (sys_config.config_value) {
      param_map.set('config_value', sys_config.config_value);
    }
    if (sys_config.config_type) {
      param_map.set('config_type', sys_config.config_type);
    }
    if (sys_config.update_by) {
      param_map.set('update_by', sys_config.update_by);
    }
    if (sys_config.remark) {
      param_map.set('remark', sys_config.remark);
    }
    let sql_str = `update sys_config set(${[...param_map.keys()]
      .map(k => `${k} = ?`)
      .join(',')},update_time = sysdate()) where config_id = ${
      sys_config.config_id
    }`;

    const rows: any[] = await this.db.execute(sql_str, [...param_map.values()]);
    return rows.length;
  }

  async delete_config_by_id(config_id: number): Promise<boolean> {
    let sql_str = 'delete from sys_config where config_id = ?';
    const rows: any[] = await this.db.execute(sql_str, [config_id]);
    return rows.length > 0;
  }
}
