import { Inject, Provide, Singleton } from '@midwayjs/core';
import { EntityManager, SelectQueryBuilder, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { ResultSetHeader } from '../../../typings/commont';
import { SysDept } from '../model/sys_dept';
import { SysDeptClosure } from '../model/sys_dept';
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
    if (sysDept.parent_id) {
      tx.andWhere('parent.ancestor_id = :parent_id', {
        parent_id: sysDept.parent_id,
      });
    }
    if (sysDept.dept_name) {
      tx.andWhere('s.dept_name like :dept_name', {
        dept_name: sysDept.dept_name + '%',
      });
    }
    if (sysDept.dept_status) {
      tx.andWhere('s.dept_status = :dept_status', {
        dept_status: sysDept.dept_status,
      });
    }
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
    }
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectExcludeChildren(
    dept_id: number,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    if (dept_id <= 0) {
      return [];
    }
    const tx = this.selectWithParent()
      .andWhere('s.id <> :excludeId', { excludeId: dept_id })
      .andWhere(
        `not exists (
          select 1 from sys_dept_closure exclude_rel
          where exclude_rel.ancestor_id = :excludeAncestorId
            and exclude_rel.descendant_id = s.id
        )`,
        { excludeAncestorId: dept_id }
      );
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
    }
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectById(dept_id: number): Promise<SysDept> {
    if (dept_id <= 0) {
      return new SysDept();
    }
    const tx = this.selectWithParent().andWhere('s.id = :id', { id: dept_id });
    const rows = await this.getManyWithParent(tx);
    return rows[0] ?? new SysDept();
  }

  public async selectByIds(dept_ids: number[]): Promise<SysDept[]> {
    if (dept_ids.length <= 0) {
      return [];
    }
    const tx = this.selectWithParent().andWhere('s.id in (:ids)', {
      ids: dept_ids,
    });
    return await this.getManyWithParent(tx);
  }

  public async insert(sysDept: SysDept): Promise<number> {
    if (sysDept.create_by) {
      const ms = Date.now();
      sysDept.update_by = sysDept.create_by;
      sysDept.update_time = ms;
      sysDept.create_time = ms;
    }

    return await this.db.transaction('', async manager => {
      const data: Partial<SysDept> = { ...sysDept };
      delete data.id;
      delete data.parent_id;
      delete data.children;
      const tx = await manager.insert(SysDept, data);
      const raw = tx.raw as ResultSetHeader;
      const dept_id = raw.insertId;
      if (dept_id <= 0) {
        throw new Error('dept insert failed');
      }

      const parentRows =
        sysDept.parent_id > 0
          ? await this.selectClosureRowsForUpdate(manager, sysDept.parent_id)
          : [];
      if (sysDept.parent_id > 0 && parentRows.length === 0) {
        throw new Error(`parent dept closure not found: ${sysDept.parent_id}`);
      }

      const relations = [
        { ancestor_id: dept_id, descendant_id: dept_id, depth: 0 },
        ...parentRows.map(row => ({
          ancestor_id: Number(row.ancestor_id),
          descendant_id: dept_id,
          depth: Number(row.depth) + 1,
        })),
      ];
      await manager.insert(SysDeptClosure, relations);
      return dept_id;
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
      if (sysDept.update_by) {
        sysDept.update_time = Date.now();
      }
      const data: Partial<SysDept> = Object.assign({}, sysDept);
      delete data.id;
      delete data.parent_id;
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
    dept_id: number,
    newParentId: number
  ): Promise<string> {
    if (dept_id <= 0) {
      return 'dept id is empty';
    }

    const currentParentRows = await manager.query(
      `SELECT ancestor_id FROM sys_dept_closure
       WHERE descendant_id = ? AND depth = 1 AND ancestor_id <> descendant_id
       FOR UPDATE`,
      [dept_id]
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
        [dept_id, newParentId]
      );
      if (Number(descendantRows[0]?.count ?? 0) > 0) {
        return 'new parent dept is a descendant of the moving dept';
      }
    }

    const subtree = await this.selectClosureRowsForUpdate(
      manager,
      dept_id,
      true
    );
    if (subtree.length === 0) {
      return `dept closure not found: ${dept_id}`;
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
          ancestor_id: Number(parent.ancestor_id),
          descendant_id: Number(descendant.descendant_id),
          depth: Number(parent.depth) + Number(descendant.depth) + 1,
        });
      }
    }
    await manager.insert(SysDeptClosure, relations);
    return '';
  }

  private async selectClosureRowsForUpdate(
    manager: EntityManager,
    dept_id: number,
    byAncestor = false
  ): Promise<ClosureRow[]> {
    const where = byAncestor ? 'ancestor_id' : 'descendant_id';
    const rows = await manager.query(
      `SELECT ancestor_id, descendant_id, depth
       FROM sys_dept_closure WHERE ${where} = ? FOR UPDATE`,
      [dept_id]
    );
    return rows as ClosureRow[];
  }

  public async deleteById(
    dept_id: number,
    entityManager?: EntityManager
  ): Promise<number> {
    const run = async (manager: EntityManager) => {
      if (dept_id <= 0) return 0;
      const childRows = await manager.query(
        `SELECT COUNT(*) AS count FROM sys_dept_closure
         WHERE ancestor_id = ? AND depth = 1 AND ancestor_id <> descendant_id`,
        [dept_id]
      );
      if (Number(childRows[0]?.count ?? 0) > 0) {
        return 0;
      }
      await manager.delete(SysDeptClosure, { descendant_id: dept_id });
      await manager.delete(SysDeptClosure, { ancestor_id: dept_id });
      const tx = await manager.delete(SysDept, dept_id);
      return tx.affected ?? 0;
    };
    if (entityManager) {
      return await run(entityManager);
    }
    return await this.db.transaction('', run);
  }

  public async checkUnique(sysDept: SysDept): Promise<number> {
    const tx = this.selectWithParent().select('s.id', 'id');
    if (sysDept.dept_name) {
      tx.andWhere('s.dept_name = :dept_name', { dept_name: sysDept.dept_name });
    }
    if (sysDept.parent_id) {
      tx.andWhere('parent.ancestor_id = :parent_id', {
        parent_id: sysDept.parent_id,
      });
    } else {
      tx.andWhere('parent.ancestor_id is null');
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async existChildrenByDeptId(dept_id: number): Promise<number> {
    if (dept_id <= 0) {
      return 0;
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysDept, 's')
      .innerJoin(SysDeptClosure, 'c', 'c.descendant_id = s.id and c.depth = 1')
      .andWhere('c.ancestor_id = :id', { id: dept_id })
      .getCount();
  }

  public async existUserByDeptId(dept_id: number): Promise<number> {
    if (dept_id <= 0) {
      return 0;
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysUser, 's')
      .andWhere('s.deleted_at is null and s.dept_id = :id', { id: dept_id })
      .getCount();
  }

  public async selectDeptIdsByRoleId(
    role_id: number,
    deptCheckStrictly: boolean
  ): Promise<number[]> {
    if (role_id <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('distinct s.id', 'id')
      .from(SysDept, 's')
      .andWhere(
        's.id in (SELECT DISTINCT dept_id FROM sys_role_dept WHERE role_id = :role_id)',
        { role_id }
      );
    if (deptCheckStrictly) {
      tx.andWhere(
        `s.id not in (
          SELECT c.ancestor_id
          FROM sys_dept_closure c
          INNER JOIN sys_role_dept rd ON rd.dept_id = c.descendant_id
          WHERE rd.role_id = :role_id AND c.depth = 1
        )`,
        { role_id }
      );
    }
    const rows = await tx.getRawMany();
    return rows.map(row => Number(row.id));
  }

  public async selectChildrenDeptById(dept_id: number): Promise<SysDept[]> {
    if (dept_id <= 0) {
      return [];
    }
    const tx = this.selectWithParent().innerJoin(
      SysDeptClosure,
      'child',
      'child.descendant_id = s.id and child.ancestor_id = :id and child.depth > 0',
      { id: dept_id }
    );
    tx.addOrderBy('s.dept_sort', 'ASC').addOrderBy('s.id', 'ASC');
    return await this.getManyWithParent(tx);
  }

  public async selectDescendantIds(dept_id: number): Promise<number[]> {
    if (dept_id <= 0) {
      return [];
    }
    const rows = await this.db.execute(
      '',
      'SELECT descendant_id FROM sys_dept_closure WHERE ancestor_id = ?',
      [dept_id]
    );
    return rows.map((row: any) => Number(row.descendant_id));
  }

  public async updateDeptStatusNormal(
    dept_id: number,
    entityManager?: EntityManager
  ): Promise<number> {
    if (dept_id <= 0) {
      return 0;
    }
    const sql = `UPDATE sys_dept d
      INNER JOIN sys_dept_closure c ON c.descendant_id = d.id
      SET d.dept_status = '1'
      WHERE c.ancestor_id <> c.descendant_id AND c.ancestor_id = ?`;
    if (entityManager) {
      const rows = await entityManager.query(sql, [dept_id]);
      return Number(rows.affectedRows ?? 0);
    }
    const rows = await this.db.execute('', sql, [dept_id]);
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
      entity.parent_id = Number(raw?.parent_id ?? 0);
    });
    return result.entities;
  }
}
