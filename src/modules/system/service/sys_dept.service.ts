import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { DEPT_NORMAL } from '../../../common/constant/param';
import { SysDept } from '../../../framework/core/model/sys_dept';
import { PageBody } from '../../../framework/core/page_body';
import { PageData } from '../../../framework/core/page_data';
import { TreeSelect } from '../../../framework/core/tree_select';
import { SysDeptRepo } from '../repository/sys_dept.repo';
import { SysDeptServiceInterface } from './interfaces/sys_dept_service.interface';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDeptService implements SysDeptServiceInterface {
  @Inject()
  private sys_dept_repo: SysDeptRepo;

  async select_dept_page(
    page_body: PageBody<SysDept>
  ): Promise<PageData<SysDept>> {
    return await this.sys_dept_repo.select_dept_page(page_body);
  }

  async select_dept_list(sys_dept: SysDept): Promise<SysDept[]> {
    return await this.sys_dept_repo.select_dept_list(sys_dept);
  }

  async select_dept_tree_list(sys_dept: SysDept): Promise<TreeSelect[]> {
    const depts: SysDept[] = await this.sys_dept_repo.select_dept_list(
      sys_dept
    );
    return this.build_dept_tree_select(depts);
  }

  /**
   * 递归得到部门列表
   * @param sys_depts 部门列表
   * @param dept_id 当前部门ID
   * @return 递归得到部门列表
   */
  private fn_children(sys_depts: SysDept[], dept_id: string): SysDept[] {
    // 得到子节点列表
    const childrens: SysDept[] = this.get_childrens(sys_depts, dept_id);
    for (const child of childrens) {
      // 判断是否有子节点
      const has_children = this.get_childrens(sys_depts, child.dept_id);
      if (has_children.length > 0) {
        child.children = this.fn_children(sys_depts, child.dept_id);
      }
    }
    return childrens;
  }

  /**
   * 得到部门子节点列表
   * @param sys_depts 部门列表
   * @param dept_id 当前部门ID
   * @return 递归得到部门子节点列表
   */
  private get_childrens(sys_depts: SysDept[], dept_id: string): SysDept[] {
    let childrens: SysDept[] = [];
    for (const dept of sys_depts) {
      if (dept.parent_id && dept.parent_id === dept_id) {
        childrens.push(dept);
      }
    }
    return childrens;
  }

  /**
   * 构建前端所需要树结构
   *
   * @param sys_depts 部门列表
   * @return 树结构列表
   */
  private build_dept_tree(sys_depts: SysDept[]): SysDept[] {
    let result_arr: SysDept[] = [];
    const dept_ids: string[] = sys_depts.map(dept => dept.dept_id);
    for (const dept of sys_depts) {
      // 如果是顶级节点, 遍历该父节点的所有子节点
      if (!dept_ids.includes(dept.parent_id)) {
        dept.children = this.fn_children(sys_depts, dept.dept_id);
        result_arr.push(dept);
      }
    }
    if (result_arr.length) {
      result_arr = sys_depts;
    }
    return result_arr;
  }

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sys_depts 部门列表
   * @return 下拉树结构列表
   */
  private build_dept_tree_select(sys_depts: SysDept[]): TreeSelect[] {
    const dept_trees: SysDept[] = this.build_dept_tree(sys_depts);
    return dept_trees.map(dept => new TreeSelect().to_sys_dept(dept));
  }

  select_dept_list_by_role_id(roleId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  select_dept_by_id(dept_id: string): Promise<SysDept> {
    throw new Error('Method not implemented.');
  }
  select_normal_children_dept_by_id(dept_id: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  has_child_by_dept_id(dept_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  check_dept_exist_user(dept_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  check_dept_name_unique(sys_dept: SysDept): Promise<SysDept> {
    throw new Error('Method not implemented.');
  }
  check_scope_dept_data(dept_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  insert_dept(sys_dept: SysDept): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async update_dept(sys_dept: SysDept): Promise<number> {
    const new_parent_dept = await this.sys_dept_repo.select_dept_by_id(
      sys_dept.parent_id
    );
    const old_dept = await this.sys_dept_repo.select_dept_by_id(
      sys_dept.dept_id
    );
    if (new_parent_dept && old_dept) {
      const new_ancestors = `${new_parent_dept.ancestors},${new_parent_dept.dept_id}`;
      const old_ancestors = old_dept.ancestors;
      sys_dept.ancestors = new_ancestors;
      await this.update_dept_children(
        sys_dept.dept_id,
        new_ancestors,
        old_ancestors
      );
    }
    const result = this.sys_dept_repo.update_dept(sys_dept);
    if (
      DEPT_NORMAL === sys_dept.status &&
      sys_dept.ancestors &&
      sys_dept.ancestors != '0'
    ) {
      // 如果该部门是启用状态，则启用该部门的所有上级部门
      await this.update_parent_dept_status_normal(sys_dept);
    }
    return result;
  }

  /**
   * 修改子元素关系
   * @param dept_id 被修改的部门ID
   * @param new_ancestors 新的父ID集合
   * @param old_ancestors 旧的父ID集合
   */
  private async update_dept_children(
    dept_id: string,
    new_ancestors: string,
    old_ancestors: string
  ) {
    let childrens: SysDept[] =
      await this.sys_dept_repo.select_children_dept_by_id(dept_id);
    childrens = childrens.map(child => {
      child.ancestors = child.ancestors.replace(old_ancestors, new_ancestors);
      return child;
    });
    if (childrens.length) {
      this.sys_dept_repo.update_dept_children(childrens);
    }
  }

  /**
   * 修改该部门的父级部门状态
   * @param sys_dept 当前部门
   * @return 修改数
   */
  private async update_parent_dept_status_normal(sys_dept: SysDept) {
    const dept_ids: string[] = sys_dept.ancestors.split(',');
    return await this.sys_dept_repo.update_dept_status_normal(dept_ids);
  }

  async delete_dept_by_id(dept_id: string): Promise<number> {
    return await this.sys_dept_repo.delete_dept_by_id(dept_id);
  }
}
