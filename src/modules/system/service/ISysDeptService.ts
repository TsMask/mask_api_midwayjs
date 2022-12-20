import { SysDept } from '../../../framework/core/model/SysDept';
import { TreeSelect } from '../../../framework/core/TreeSelect';

/**
 * 部门管理 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysDeptService {
  /**
   * 查询部门管理数据
   *
   * @param sysDept 部门信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 部门信息集合
   */
  selectDeptList(sysDept: SysDept, dataScopeSQL?: string): Promise<SysDept[]>;

  /**
   * 查询部门树结构信息
   *
   * @param sysDept 部门信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 部门树信息集合
   */
  selectDeptTreeList(
    sysDept: SysDept,
    dataScopeSQL?: string
  ): Promise<TreeSelect[]>;

  /**
   * 根据角色ID查询部门树信息
   *
   * @param roleId 角色ID
   * @return 选中部门列表
   */
  selectDeptListByRoleId(roleId: string): Promise<string[]>;

  /**
   * 根据部门ID查询信息
   *
   * @param deptId 部门ID
   * @return 部门信息
   */
  selectDeptById(deptId: string): Promise<SysDept>;

  /**
   * 根据ID查询所有子部门（正常状态）
   *
   * @param deptId 部门ID
   * @return 子部门数
   */
  selectNormalChildrenDeptById(deptId: string): Promise<number>;

  /**
   * 是否存在部门子节点
   *
   * @param deptId 部门ID
   * @return 结果
   */
  hasChildByDeptId(deptId: string): Promise<boolean>;

  /**
   * 查询部门是否存在用户
   *
   * @param deptId 部门ID
   * @return 结果 true 存在 false 不存在
   */
  checkDeptExistUser(deptId: string): Promise<boolean>;

  /**
   * 校验部门名称是否唯一
   *
   * @param sysDept 部门信息
   * @return 结果
   */
  checkUniqueDeptName(sysDept: SysDept): Promise<boolean>;

  /**
   * 校验部门是否有数据权限
   *
   * @param deptId 部门id
   */
  checkScopeDeptData(deptId: string): Promise<boolean>;

  /**
   * 新增保存部门信息
   *
   * @param sysDept 部门信息
   * @return 结果
   */
  insertDept(sysDept: SysDept): Promise<string>;

  /**
   * 修改保存部门信息
   *
   * @param sysDept 部门信息
   * @return 结果
   */
  updateDept(sysDept: SysDept): Promise<number>;

  /**
   * 删除部门管理信息
   *
   * @param deptId 部门ID
   * @return 结果
   */
  deleteDeptById(deptId: string): Promise<number>;
}
