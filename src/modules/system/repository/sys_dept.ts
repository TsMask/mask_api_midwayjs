import { Inject, Provide, Singleton } from '@midwayjs/core';
import { EntityManager, SelectQueryBuilder, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { ResultSetHeader } from '../../../typings/commont';
import { SysDept } from '../model/sys_dept';
import { SysDeptClosure } from '../model/sys_dept_closure';
import { SysUser } from '../model/sys_user';

interface ClosureRow {
  ancestor_id: number | string;
  descendant_id: number | string;
  depth: number | string;
}

/** Department data access with closure-table parentage. */
@Provide()
@Singleton()
export class SysDeptRepository {
  @Inject()
  private db: DynamicDataSource;

  public async select(
    sysDept: SysDept,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    const tx = this.selectWithParent();
    if (sysDept.id) {
      tx.andWhere('s.id = :id', { id: sysDept.id });
    }
    if (sysDept.parentId) {
      tx.andWhere('parent.ancestor_id = :parentId', {
        parentId: sysDept.parentId,
      });
    }
    if (sysDept.deptName) {
      tx.andWhere('s.dept_name like :deptName', {
        deptName: sysDept.deptName + '%',
      });
    }
    if (sysDept.deptStatus) {
      tx.andWhere('s.dept_status = :deptStatus', {
        deptStatus: sysDept.deptStatus,
      });
    }
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
    }
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectExcludeChildren(
    deptId: number,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    if (deptId <= 0) {
      return [];
    }
    const tx = this.selectWithParent()
      .andWhere('s.id <> :excludeId', { excludeId: deptId })
      .andWhere(
        `not exists (
          select 1 from sys_dept_closure exclude_rel
          where exclude_rel.ancestor_id = :excludeAncestorId
            and exclude_rel.descendant_id = s.id
        )`,
        { excludeAncestorId: deptId }
      );
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
    }
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectById(deptId: number): Promise<SysDept> {
    if (deptId <= 0) {
      return new SysDept();
    }
    const tx = this.selectWithParent().andWhere('s.id = :id', { id: deptId });
    const rows = await this.getManyWithParent(tx);
    return rows[0] ?? new SysDept();
  }

  public async selectByIds(deptIds: number[]): Promise<SysDept[]> {
    if (deptIds.length <= 0) {
      return [];
    }
    const tx = this.selectWithParent().andWhere('s.id in (:ids)', {
      ids: deptIds,
    });
    return await this.getManyWithParent(tx);
  }

  public async insert(sysDept: SysDept): Promise<number> {
    if (sysDept.createBy) {
      const ms = Date.now();
      sysDept.updateBy = sysDept.createBy;
      sysDept.updateTime = ms;
      sysDept.createTime = ms;
    }

    return await this.db.transaction('', async manager => {
      const {
        id: _id,
        parentId: _parentId,
        children: _children,
        ...data
      } = sysDept;
      const tx = await manager.insert(SysDept, data);
      const raw = tx.raw as ResultSetHeader;
      const deptId = raw.insertId;
      if (deptId <= 0) {
        throw new Error('dept insert failed');
      }

      const parentRows =
        sysDept.parentId > 0
          ? await this.selectClosureRowsForUpdate(manager, sysDept.parentId)
          : [];
      if (sysDept.parentId > 0 && parentRows.length === 0) {
        throw new Error(`parent dept closure not found: ${sysDept.parentId}`);
      }

      const relations = [
        { ancestorId: deptId, descendantId: deptId, depth: 0 },
        ...parentRows.map(row => ({
          ancestorId: Number(row.ancestor_id),
          descendantId: deptId,
          depth: Number(row.depth) + 1,
        })),
      ];
      await manager.insert(SysDeptClosure, relations);
      return deptId;
    });
  }

  public async update(
    sysDept: SysDept,
    entityManager?: EntityManager
  ): Promise<number> {
    const run = async (manager: EntityManager) => {
      if (sysDept.id <= 0) {
        return 0;
      }
      if (sysDept.updateBy) {
        sysDept.updateTime = Date.now();
      }
      const data: Partial<SysDept> = Object.assign({}, sysDept);
      delete data.id;
      delete data.parentId;
      delete data.children;
      const tx: UpdateResult = await manager.update(SysDept, sysDept.id, data);
      return tx.affected ?? 0;
    };
    if (entityManager) {
      return await run(entityManager);
    }
    return await this.db.transaction('', run);
  }

  public async moveDeptSubtree(
    manager: EntityManager,
    deptId: number,
    newParentId: number
  ): Promise<string> {
    if (deptId <= 0) {
      return 'dept id is empty';
    }

    const currentParentRows = await manager.query(
      `SELECT ancestor_id FROM sys_dept_closure
       WHERE descendant_id = ? AND depth = 1 AND ancestor_id <> descendant_id
       FOR UPDATE`,
      [deptId]
    );
    const currentParentId =
      currentParentRows.length > 0
        ? Number(currentParentRows[0].ancestor_id)
        : 0;
    if (currentParentId === newParentId) {
      return '';
    }

    if (newParentId > 0) {
      const descendantRows = await manager.query(
        `SELECT COUNT(*) AS count FROM sys_dept_closure
         WHERE ancestor_id = ? AND descendant_id = ? AND depth > 0`,
        [deptId, newParentId]
      );
      if (Number(descendantRows[0]?.count ?? 0) > 0) {
        return 'new parent dept is a descendant of the moving dept';
      }
    }

    const subtree = await this.selectClosureRowsForUpdate(
      manager,
      deptId,
      true
    );
    if (subtree.length === 0) {
      return `dept closure not found: ${deptId}`;
    }
    const subtreeIds = Array.from(
      new Set(subtree.map(row => Number(row.descendant_id)))
    );
    const placeholders = subtreeIds.map(() => '?').join(',');
    await manager.query(
      `DELETE FROM sys_dept_closure
       WHERE descendant_id IN (${placeholders})
         AND ancestor_id NOT IN (${placeholders})`,
      [...subtreeIds, ...subtreeIds]
    );

    if (newParentId <= 0) {
      return '';
    }
    const parentRelations = await this.selectClosureRowsForUpdate(
      manager,
      newParentId
    );
    if (parentRelations.length === 0) {
      return `parent dept closure not found: ${newParentId}`;
    }

    const relations: SysDeptClosure[] = [];
    for (const parent of parentRelations) {
      for (const descendant of subtree) {
        relations.push({
          ancestorId: Number(parent.ancestor_id),
          descendantId: Number(descendant.descendant_id),
          depth: Number(parent.depth) + Number(descendant.depth) + 1,
        });
      }
    }
    await manager.insert(SysDeptClosure, relations);
    return '';
  }

  private async selectClosureRowsForUpdate(
    manager: EntityManager,
    deptId: number,
    byAncestor = false
  ): Promise<ClosureRow[]> {
    const where = byAncestor ? 'ancestor_id' : 'descendant_id';
    const rows = await manager.query(
      `SELECT ancestor_id, descendant_id, depth
       FROM sys_dept_closure WHERE ${where} = ? FOR UPDATE`,
      [deptId]
    );
    return rows as ClosureRow[];
  }

  public async deleteById(
    deptId: number,
    entityManager?: EntityManager
  ): Promise<number> {
    const run = async (manager: EntityManager) => {
      if (deptId <= 0) return 0;
      const childRows = await manager.query(
        `SELECT COUNT(*) AS count FROM sys_dept_closure
         WHERE ancestor_id = ? AND depth = 1 AND ancestor_id <> descendant_id`,
        [deptId]
      );
      if (Number(childRows[0]?.count ?? 0) > 0) {
        return 0;
      }
      await manager.delete(SysDeptClosure, { descendantId: deptId });
      await manager.delete(SysDeptClosure, { ancestorId: deptId });
      const tx = await manager.delete(SysDept, deptId);
      return tx.affected ?? 0;
    };
    if (entityManager) {
      return await run(entityManager);
    }
    return await this.db.transaction('', run);
  }

  public async checkUnique(sysDept: SysDept): Promise<number> {
    const tx = this.selectWithParent().select('s.id', 'id');
    if (sysDept.deptName) {
      tx.andWhere('s.dept_name = :deptName', { deptName: sysDept.deptName });
    }
    if (sysDept.parentId) {
      tx.andWhere('parent.ancestor_id = :parentId', {
        parentId: sysDept.parentId,
      });
    } else {
      tx.andWhere('parent.ancestor_id is null');
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async existChildrenByDeptId(deptId: number): Promise<number> {
    if (deptId <= 0) {
      return 0;
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysDept, 's')
      .innerJoin(SysDeptClosure, 'c', 'c.descendant_id = s.id and c.depth = 1')
      .andWhere('c.ancestor_id = :id', { id: deptId })
      .getCount();
  }

  public async existUserByDeptId(deptId: number): Promise<number> {
    if (deptId <= 0) {
      return 0;
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysUser, 's')
      .andWhere("s.user_del = '0' and s.dept_id = :id", { id: deptId })
      .getCount();
  }

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
      .select('distinct s.id', 'id')
      .from(SysDept, 's')
      .andWhere(
        's.id in (SELECT DISTINCT dept_id FROM sys_role_dept WHERE role_id = :roleId)',
        { roleId }
      );
    if (deptCheckStrictly) {
      tx.andWhere(
        `s.id not in (
          SELECT c.ancestor_id
          FROM sys_dept_closure c
          INNER JOIN sys_role_dept rd ON rd.dept_id = c.descendant_id
          WHERE rd.role_id = :roleId AND c.depth = 1
        )`,
        { roleId }
      );
    }
    const rows = await tx.getRawMany();
    return rows.map(row => Number(row.id));
  }

  public async selectChildrenDeptById(deptId: number): Promise<SysDept[]> {
    if (deptId <= 0) {
      return [];
    }
    const tx = this.selectWithParent().innerJoin(
      SysDeptClosure,
      'child',
      'child.descendant_id = s.id and child.ancestor_id = :id and child.depth > 0',
      { id: deptId }
    );
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectDescendantIds(deptId: number): Promise<number[]> {
    if (deptId <= 0) {
      return [];
    }
    const rows = await this.db.execute(
      '',
      'SELECT descendant_id FROM sys_dept_closure WHERE ancestor_id = ?',
      [deptId]
    );
    return rows.map((row: any) => Number(row.descendant_id));
  }

  public async updateDeptStatusNormal(
    deptId: number,
    entityManager?: EntityManager
  ): Promise<number> {
    if (deptId <= 0) {
      return 0;
    }
    const sql = `UPDATE sys_dept d
      INNER JOIN sys_dept_closure c ON c.descendant_id = d.id
      SET d.dept_status = '1'
      WHERE c.ancestor_id <> c.descendant_id AND c.ancestor_id = ?`;
    if (entityManager) {
      const rows = await entityManager.query(sql, [deptId]);
      return Number(rows.affectedRows ?? 0);
    }
    const rows = await this.db.execute('', sql, [deptId]);
    return Number(rows.affectedRows ?? 0);
  }

  private selectWithParent(): SelectQueryBuilder<SysDept> {
    return this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDept, 's')
      .leftJoin(
        SysDeptClosure,
        'parent',
        'parent.descendant_id = s.id and parent.depth = 1'
      )
      .addSelect('COALESCE(parent.ancestor_id, 0)', 'parent_id');
  }

  private async getManyWithParent(
    tx: SelectQueryBuilder<SysDept>
  ): Promise<SysDept[]> {
    const result = await tx.getRawAndEntities();
    result.entities.forEach((entity, index) => {
      const raw = result.raw[index] as Record<string, unknown> | undefined;
      entity.parentId = Number(raw?.parent_id ?? raw?.parentId ?? 0);
    });
    return result.entities;
  }
}
