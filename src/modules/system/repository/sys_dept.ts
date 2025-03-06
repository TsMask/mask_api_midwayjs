import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysDept } from '../model/sys_dept';
import { SysUser } from '../model/sys_user';

/**部门表 数据层处理 */
@Provide()
@Singleton()
export class SysDeptRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 查询集合
   *
   * @param sysDept 信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @return 列表
   */
  public async select(
    sysDept: SysDept,
    dataScopeSQL: string
  ): Promise<SysDept[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysDept.deptId) {
      tx.andWhere('s.dept_id = :deptId', {
        deptId: sysDept.deptId,
      });
    }
    if (sysDept.parentId) {
      tx.andWhere('s.parent_id = :parentId', {
        parentId: sysDept.parentId,
      });
    }
    if (sysDept.deptName) {
      tx.andWhere('s.dept_name like :deptName', {
        deptName: sysDept.deptName + '%',
      });
    }
    if (sysDept.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysDept.statusFlag,
      });
    }
    if (dataScopeSQL) {
      tx.andWhere(dataScopeSQL);
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param deptId ID
   * @return 信息
   */
  public async selectById(deptId: number): Promise<SysDept> {
    if (deptId <= 0) {
      return new SysDept();
    }
    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.dept_id = :deptId and s.del_flag = '0'", { deptId })
      .getOne();
    if (!item) {
      return new SysDept();
    }
    return item;
  }

  /**
   * 新增
   *
   * @param sysDept 信息
   * @return ID
   */
  public async insert(sysDept: SysDept): Promise<number> {
    sysDept.delFlag = '0';
    if (sysDept.createBy) {
      const ms = Date.now().valueOf();
      sysDept.updateBy = sysDept.createBy;
      sysDept.updateTime = ms;
      sysDept.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysDept)
      .values(sysDept)
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
   * @param sysDept 信息
   * @return 影响记录数
   */
  public async update(sysDept: SysDept): Promise<number> {
    if (sysDept.deptId <= 0) {
      return 0;
    }
    if (sysDept.updateBy) {
      sysDept.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysDept);
    delete data.deptId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDept)
      .set(data)
      .andWhere('dept_id = :deptId', { deptId: sysDept.deptId })
      .execute();
    return tx.affected;
  }

  /**
   * 删除信息
   *
   * @param deptId ID
   * @return 影响记录数
   */
  public async deleteById(deptId: number): Promise<number> {
    if (deptId <= 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysDept)
      .set({ delFlag: '1' })
      .andWhere('dept_id = :deptId', { deptId })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysDept 信息
   * @returns
   */
  public async checkUnique(sysDept: SysDept): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysDept.deptName) {
      tx.andWhere('s.dept_name = :deptName', {
        deptName: sysDept.deptName,
      });
    }
    if (sysDept.parentId) {
      tx.andWhere('s.parent_id = :parentId', {
        parentId: sysDept.parentId,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.deptId;
  }

  /**
   * 存在子节点数量
   *
   * @param deptId ID
   * @return 数量
   */
  public async existChildrenByDeptId(deptId: number): Promise<number> {
    if (deptId <= 0) {
      return 0;
    }
    // 查询数据
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.del_flag = '0' and s.status_flag = '1'")
      .andWhere('s.parent_id = :deptId', { deptId })
      .getCount();
    return count;
  }

  /**
   * 存在用户使用数量
   *
   * @param deptId ID
   * @return 数量
   */
  public async existUserByDeptId(deptId: number): Promise<number> {
    if (deptId <= 0) {
      return 0;
    }
    // 查询数据
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.del_flag = '0'")
      .andWhere('s.dept_id = :deptId', { deptId })
      .getCount();
    return count;
  }

  /**
   * 通过角色ID查询包含的部门ID
   *
   * @param roleId 角色ID
   * @param deptCheckStrictly 是否关联显示
   * @return 数量
   */
  public async selectDeptIdsByRoleId(
    roleId: number,
    deptCheckStrictly: boolean
  ): Promise<number[]> {
    if (roleId <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .distinctOn(['s.dept_id'])
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.del_flag = '0'")
      .andWhere(
        's.dept_id in (SELECT DISTINCT dept_id FROM sys_role_dept WHERE role_id = :roleId)',
        { roleId }
      );
    // 父子互相关联显示，取所有子节点
    if (deptCheckStrictly) {
      tx.andWhere(
        `s.dept_id not in (
        SELECT d.parent_id FROM sys_dept d 
        INNER JOIN sys_role_dept rd ON rd.dept_id = d.dept_id 
        AND rd.role_id = :roleId 
        )`,
        { roleId }
      );
    }
    // 查询数据
    const rows = await tx.getMany();
    return rows.map(v => v.deptId);
  }

  /**
   * 根据ID查询所有子部门
   *
   * @param deptId ID
   * @return 数量
   */
  public async selectChildrenDeptById(deptId: number): Promise<SysDept[]> {
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .andWhere("s.del_flag = '0'")
      .andWhere('find_in_set(:deptId, s.ancestors)', { deptId })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 修改所在部门正常状态
   *
   * @param deptIds ID数组
   * @return 影响记录数
   */
  public async updateDeptStatusNormal(deptIds: number[]): Promise<number> {
    if (deptIds.length <= 0) {
      return 0;
    }
    // 执行更新状态标记
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDept)
      .set("status_flag = '1'")
      .andWhere('dept_id in (:deptIds)', { deptIds })
      .execute();
    return tx.affected;
  }

  /**
   * 修改子元素关系
   *
   * @param arr 信息数组
   * @return 影响记录数
   */
  public async updateDeptChildren(arr: SysDept[]): Promise<number> {
    if (arr.length <= 0) {
      return 0;
    }
    // 构建查询条件
    const conditions: string[] = [];
    const deptIds: number[] = [];
    for (const v of arr) {
      conditions.push(`WHEN dept_id = ${v.deptId} THEN '${v.ancestors}'`);
      deptIds.push(v.deptId);
    }
    const casesValues = `"CASE ${conditions.join(',')} END"`;

    // 执行更新操作
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDept)
      .set(`ancestors = ${casesValues}`)
      .andWhere('dept_id in (:deptIds)', { deptIds })
      .execute();
    return tx.affected;
  }
}
