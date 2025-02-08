import {
  Controller,
  Body,
  Get,
  Del,
  Put,
  Inject,
  Param,
  Post,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SysDeptService } from '../service/sys_dept';
import { SysDept } from '../model/sys_dept';

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
  private sysDeptService: SysDeptService;

  /**
   * 部门列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  public async list(@Query() sysDept: SysDept): Promise<Resp> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('sys_dept');
    const data = await this.sysDeptService.find(sysDept, dataScopeSQL);
    return Resp.okData(data);
  }

  /**
   * 部门信息
   */
  @Get('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('deptId') deptId: number
  ): Promise<Resp> {
    if (deptId <= 0) {
      return Resp.codeMsg(40010, 'bind err: deptId is empty');
    }

    const data = await this.sysDeptService.findById(deptId);
    if (data.deptId === deptId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**
   * 部门新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dept:add'] })
  @OperateLog({
    title: '部门信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysDept): Promise<Resp> {
    if (body.deptId > 0) {
      return Resp.codeMsg(40010, 'bind err: deptId not is empty');
    }

    // 父级ID不为0是要检查
    if (body.parentId > 0) {
      const deptParent = await this.sysDeptService.findById(body.parentId);
      if (deptParent.deptId !== body.parentId) {
        return Resp.errMsg('没有权限访问部门数据！');
      }
      if (deptParent.statusFlag === STATUS_NO) {
        return Resp.errMsg(
          `上级部门【${deptParent.deptName}】停用，不允许新增`
        );
      }
      if (deptParent.delFlag === STATUS_YES) {
        return Resp.errMsg(
          `上级部门【${deptParent.deptName}】已删除，不允许新增`
        );
      }
      body.ancestors = `${deptParent.ancestors},${body.parentId}`;
    } else {
      body.ancestors = '0';
    }

    // 检查同级下名称唯一
    const uniqueDeptName =
      await this.sysDeptService.checkUniqueParentIdByDeptName(
        body.parentId,
        body.deptName,
        0
      );
    if (!uniqueDeptName) {
      return Resp.errMsg(`部门新增【${body.deptName}】失败，部门名称已存在`);
    }

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysDeptService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 部门修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dept:edit'] })
  @OperateLog({
    title: '部门信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysDept): Promise<Resp> {
    if (body.deptId <= 0) {
      return Resp.codeMsg(40010, 'bind err: deptId is empty');
    }

    // 上级部门不能选自己
    if (body.deptId === body.parentId) {
      return Resp.errMsg(
        `部门修改【${body.deptName}】失败，上级部门不能是自己`
      );
    }

    // 检查数据是否存在
    const deptInfo = await this.sysDeptService.findById(body.deptId);
    if (deptInfo.deptId != body.deptId) {
      return Resp.errMsg('没有权限访问部门数据！');
    }

    // 父级ID不为0是要检查
    if (body.parentId > 0) {
      const deptParent = await this.sysDeptService.findById(body.parentId);
      if (deptParent.deptId != body.parentId) {
        return Resp.errMsg('没有权限访问部门数据！');
      }
    }

    // 检查同级下名称唯一
    const uniqueName = await this.sysDeptService.checkUniqueParentIdByDeptName(
      body.parentId,
      body.deptName,
      body.deptId
    );
    if (!uniqueName) {
      return Resp.errMsg(`部门修改【${body.deptName}】失败，部门名称已存在`);
    }

    // 上级停用需要检查下级是否有在使用
    if (body.statusFlag == STATUS_NO) {
      const hasChild = await this.sysDeptService.existChildrenByDeptId(
        body.deptId
      );
      if (hasChild > 0) {
        return Resp.errMsg(`该部门包含未停用的子部门数量：${hasChild}`);
      }
    }

    deptInfo.deptName = body.deptName;
    deptInfo.parentId = body.parentId;
    deptInfo.deptSort = body.deptSort;
    deptInfo.leader = body.leader;
    deptInfo.phone = body.phone;
    deptInfo.email = body.email;
    deptInfo.statusFlag = body.statusFlag;
    deptInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysDeptService.update(deptInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 部门删除
   */
  @Del('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperateLog({
    title: '部门信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.number().required()) @Param('deptId') deptId: number
  ): Promise<Resp> {
    if (deptId <= 0) {
      return Resp.codeMsg(40010, 'bind err: deptId is empty');
    }

    // 检查数据是否存在
    const dept = await this.sysDeptService.findById(deptId);
    if (dept.deptId === deptId) {
      return Resp.errMsg('没有权限访问部门数据！');
    }

    // 检查是否存在子部门
    const hasChild = await this.sysDeptService.existChildrenByDeptId(deptId);
    if (hasChild > 0) {
      return Resp.errMsg(`不允许删除，存在子部门数：${hasChild}`);
    }

    // 检查是否分配给用户
    const existUser = await this.sysDeptService.existUserByDeptId(deptId);
    if (existUser > 0) {
      return Resp.errMsg(`不允许删除，部门已分配给用户数：${hasChild}`);
    }

    const rows = await this.sysDeptService.deleteById(deptId);
    if (rows > 0) {
      return Resp.okData(`删除成功：${rows}`);
    }
    return Resp.err();
  }

  /**
   * 部门列表（排除节点）
   */
  @Get('/list/exclude/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  public async excludeChild(
    @Valid(RuleType.number().required()) @Param('deptId') deptId: number
  ): Promise<Resp> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('sys_dept');
    let data = await this.sysDeptService.find(new SysDept(), dataScopeSQL);

    // 过滤排除节点
    const filtered: SysDept[] = [];
    for (const dept of data) {
      if (dept.deptId == deptId) {
        continue;
      }
      // 如果当前部门的ancestors不包含要排除的deptId，则添加到filtered中
      if (dept.ancestors.indexOf(`${deptId}`) !== -1) {
        filtered.push(dept);
      }
    }
    return Resp.okData(filtered);
  }

  /**
   * 部门树结构列表
   */
  @Get('/tree')
  @PreAuthorize({ hasPermissions: ['system:dept:list', 'system:user:list'] })
  public async tree(@Query() sysDept: SysDept): Promise<Resp> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('sys_dept', '');
    const data = await this.sysDeptService.buildTreeSelect(
      sysDept,
      dataScopeSQL
    );
    return Resp.okData(data);
  }

  /**
   *  部门树结构列表（指定角色）
   */
  @Get('/tree/role/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  public async treeRole(
    @Valid(RuleType.number().required()) @Param('roleId') roleId: number
  ): Promise<Resp> {
    if (roleId <= 0) {
      return Resp.codeMsg(40010, 'bind err: roleId is empty');
    }

    const dataScopeSQL = this.contextService.getDataScopeSQL('sys_dept', '');
    const deptTreeSelect = await this.sysDeptService.buildTreeSelect(
      new SysDept(),
      dataScopeSQL
    );
    const checkedKeys = await this.sysDeptService.findDeptIdsByRoleId(roleId);
    return Resp.okData({
      depts: deptTreeSelect,
      checkedKeys: checkedKeys,
    });
  }
}
