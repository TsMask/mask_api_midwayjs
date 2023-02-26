import { SysDept } from '../model/SysDept';

/**
 * 部门管理 数据层接口
 *
 * @author TsMask
 */
export interface ISysDeptRepository {
  /**
   * 查询部门管理数据
   *
   * @param sysDept 部门信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 部门信息集合
   */
  selectDeptList(sysDept: SysDept, dataScopeSQL?: string): Promise<SysDept[]>;

  /**
   * 根据角色ID查询部门树信息
   *
   * @param roleId 角色ID
   * @param deptCheckStrictly 部门树选择项是否关联显示
   * @return 选中部门列表
   */
  selectDeptListByRoleId(
    roleId: string,
    deptCheckStrictly: boolean
  ): Promise<string[]>;

  /**
   * 根据部门ID查询信息
   *
   * @param deptId 部门ID
   * @return 部门信息
   */
  selectDeptById(deptId: string): Promise<SysDept>;

  /**
   * 根据ID查询所有子部门
   *
   * @param deptId 部门ID
   * @return 部门列表
   */
  selectChildrenDeptById(deptId: string): Promise<SysDept[]>;

  /**
   * 根据ID查询所有子部门（正常状态）
   *
   * @param deptId 部门ID
   * @return 子部门数
   */
  selectNormalChildrenDeptById(deptId: string): Promise<number>;

  /**
   * 是否存在子节点
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
   * @param parentId 父部门ID
   * @return 结果
   */
  checkUniqueDeptName(deptName: string, parentId: string): Promise<string>;

  /**
   * 新增部门信息
   *
   * @param sysDept 部门信息
   * @return 结果
   */
  insertDept(sysDept: SysDept): Promise<string>;

  /**
   * 修改部门信息
   *
   * @param sysDept 部门信息
   * @return 结果
   */
  updateDept(sysDept: SysDept): Promise<number>;

  /**
   * 修改所在部门正常状态
   *
   * @param deptIds 部门ID组
   */
  updateDeptStatusNormal(deptIds: string[]): Promise<number>;

  /**
   * 修改子元素关系
   *
   * @param sysDepts 子元素
   * @return 结果
   */
  updateDeptChildren(sysDepts: SysDept[]): Promise<number>;

  /**
   * 删除部门管理信息
   *
   * @param deptId 部门ID
   * @return 结果
   */
  deleteDeptById(deptId: string): Promise<number>;
}
