import {
  Body,
  Controller,
  Get,
  Del,
  Put,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../framework/constants/CommonConstants';
import { Result } from '../../../framework/vo/Result';
import { OperateLog } from '../../../framework/decorator/OperateLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysDept } from '../model/SysDept';

/**
 * 部门信息
 *
 * @author TsMask
 */
@Controller('/system/dept')
export class SysDeptController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  /**
   * 部门列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  async list(@Query() sysDept: SysDept): Promise<Result> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const list = await this.sysDeptService.selectDeptList(
      sysDept,
      dataScopeSQL
    );
    return Result.okData(list);
  }

  /**
   * 部门信息
   */
  @Get('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:query'] })
  async getInfo(@Param('deptId') deptId: string): Promise<Result> {
    const data = await this.sysDeptService.selectDeptById(deptId);
    return Result.okData(data);
  }

  /**
   * 部门新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dept:add'] })
  @OperateLog({
    title: '部门信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysDept: SysDept): Promise<Result> {
    const { parentId, deptName } = sysDept;
    if (!parentId || !deptName) return Result.err();

    // 父级ID不为0是要检查
    if (parentId !== '0') {
      const deptParent = await this.sysDeptService.selectDeptById(parentId);
      if (!deptParent) {
        return Result.errMsg('没有权限访问部门数据！');
      }
      if (deptParent.status === STATUS_NO) {
        return Result.errMsg(
          `上级部门【${deptParent.deptName}】停用，不允许新增`
        );
      }
      if (deptParent.delFlag === STATUS_YES) {
        return Result.errMsg(
          `上级部门【${deptParent.deptName}】已删除，不允许新增`
        );
      }
      sysDept.ancestors = `${deptParent.ancestors},${parentId}`;
    } else {
      sysDept.ancestors = '0';
    }

    // 检查同级下名称唯一
    const uniqueDeptName = await this.sysDeptService.checkUniqueDeptName(
      deptName,
      parentId
    );
    if (!uniqueDeptName) {
      return Result.errMsg(`部门新增【${deptName}】失败，部门名称已存在`);
    }

    sysDept.createBy = this.contextService.getUseName();
    const insertId = await this.sysDeptService.insertDept(sysDept);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 部门修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dept:edit'] })
  @OperateLog({
    title: '部门信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysDept: SysDept): Promise<Result> {
    const { deptId, parentId, deptName } = sysDept;
    if (!deptId || !parentId || !deptName) return Result.err();

    // 上级部门不能选自己
    if (deptId === parentId) {
      return Result.errMsg(
        `部门修改【${sysDept.deptName}】失败，上级部门不能是自己`
      );
    }

    // 检查数据是否存在
    const dept = await this.sysDeptService.selectDeptById(deptId);
    if (!dept) {
      return Result.errMsg('没有权限访问部门数据！');
    }

    // 父级ID不为0是要检查
    if (parentId !== '0') {
      const deptParent = await this.sysDeptService.selectDeptById(parentId);
      if (!deptParent) {
        return Result.errMsg('没有权限访问部门数据！');
      }
    }

    // 检查同级下名称唯一
    const uniqueDeptName = await this.sysDeptService.checkUniqueDeptName(
      deptName,
      parentId,
      deptId
    );
    if (!uniqueDeptName) {
      return Result.errMsg(
        `部门修改【${sysDept.deptName}】失败，部门名称已存在`
      );
    }

    // 上级停用需要检查下级是否有在使用
    if (sysDept.status === STATUS_NO) {
      const hasChild = await this.sysDeptService.hasChildByDeptId(deptId);
      if (hasChild > 0) {
        return Result.errMsg(`该部门包含未停用的子部门数量：${hasChild}`);
      }
    }

    sysDept.updateBy = this.contextService.getUseName();
    const rows = await this.sysDeptService.updateDept(sysDept);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 部门删除
   */
  @Del('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperateLog({
    title: '部门信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('deptId') deptId: string): Promise<Result> {
    if (!deptId) return Result.err();
    const dept = await this.sysDeptService.selectDeptById(deptId);
    if (!dept) {
      return Result.errMsg('没有权限访问部门数据！');
    }
    // 检查数据是否存在
    const hasChild = await this.sysDeptService.hasChildByDeptId(deptId);
    if (hasChild > 0) {
      return Result.errMsg(`不允许删除，存在子部门数：${hasChild}`);
    }
    // 检查是否存在子部门
    const existUser = await this.sysDeptService.checkDeptExistUser(deptId);
    if (existUser > 0) {
      return Result.errMsg(`不允许删除，存在子部门数：${hasChild}`);
    }
    const rows = await this.sysDeptService.deleteDeptById(deptId);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 部门列表（排除节点）
   */
  @Get('/list/exclude/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  async excludeChild(@Param('deptId') deptId: string): Promise<Result> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    let data = await this.sysDeptService.selectDeptList(
      new SysDept(),
      dataScopeSQL
    );
    data = data.filter(
      dept =>
        !(dept.deptId === deptId || dept.ancestors.split(',').includes(deptId))
    );
    return Result.okData(data || []);
  }

  /**
   * 部门树结构列表
   */
  @Get('/treeSelect')
  @PreAuthorize({ hasPermissions: ['system:dept:list', 'system:user:list'] })
  async treeSelect(@Query() sysDept: SysDept): Promise<Result> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const data = await this.sysDeptService.selectDeptTreeSelect(
      sysDept,
      dataScopeSQL
    );
    return Result.okData(data || []);
  }

  /**
   * 部门树结构列表（指定角色）
   */
  @Get('/roleDeptTreeSelect/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  async roleDeptTreeSelect(@Param('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const deptTreeSelect = await this.sysDeptService.selectDeptTreeSelect(
      new SysDept(),
      dataScopeSQL
    );
    const checkedKeys = await this.sysDeptService.selectDeptListByRoleId(
      roleId
    );
    return Result.okData({
      depts: deptTreeSelect,
      checkedKeys,
    });
  }
}
