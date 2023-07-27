import { SysDept } from '../model/SysDept';
import { TreeSelect } from '../../../framework/vo/TreeSelect';

/**
 * 部门管理 服务层接口
 *
 * @author TsMask
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
  selectDeptTreeSelect(
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
   * 是否存在部门子节点
   *
   * @param deptId 部门ID
   * @return 结果
   */
  hasChildByDeptId(deptId: string): Promise<number>;

  /**
   * 查询部门是否存在用户
   *
   * @param deptId 部门ID
   * @return 结果
   */
  checkDeptExistUser(deptId: string): Promise<number>;

  /**
   * 校验部门名称是否唯一
   *
   * @param deptName 部门名称
   * @param parentId 上级部门ID
   * @param deptId 部门ID，更新时传入
   * @return 结果
   */
  checkUniqueDeptName(
    deptName: string,
    parentId: string,
    deptId: string
  ): Promise<boolean>;

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
