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
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  loginUserToDataScopeSQL,
  loginUserToUserName,
} from '../../../internal/web/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { STATUS_NO } from '../../../internal/shared/constants/common';
import { Resp } from '../../../internal/web/resp/api';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { SysDeptService } from '../service/sys_dept';
import { SysDept } from '../model/sys_dept';

/** Department controller. */
@Controller('/api/v1/system/depts')
export class SysDeptController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private sysDeptService: SysDeptService;

  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dept:list'] })],
  })
  public async list(
    @Valid(Joi.number()) @Query('id') id: number,
    @Valid(Joi.number()) @Query('parent_id') parentId: number,
    @Valid(Joi.string()) @Query('dept_name') deptName: string,
    @Valid(Joi.string().pattern(/^[01]$/))
    @Query('dept_status')
    deptStatus: string
  ): Promise<Resp> {
    const sysDept = new SysDept();
    sysDept.id = id;
    sysDept.parentId = parentId;
    sysDept.deptName = deptName;
    sysDept.deptStatus = deptStatus;
    const filter = loginUserToDataScopeSQL(this.c, 'sys_dept', '');
    return Resp.okData(await this.sysDeptService.find(sysDept, filter));
  }

  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dept:query'] })],
  })
  public async info(
    @Valid(Joi.number().required()) @Param('id') id: number
  ): Promise<Resp> {
    if (id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    const data = await this.sysDeptService.findById(id);
    return data.id === id ? Resp.okData(data) : Resp.err();
  }

  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dept:add'] }),
      OperateLogMiddleware({
        title: '部门信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: Record<string, any>): Promise<Resp> {
    const dept = this.parseBody(body);
    if (dept.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: deptId not is empty');
    }
    if (!dept.deptName) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: dept_name is required');
    }

    if (dept.parentId > 0) {
      const parent = await this.sysDeptService.findById(dept.parentId);
      if (parent.id !== dept.parentId) {
        return Resp.errMsg('没有权限访问部门数据！');
      }
      if (parent.deptStatus === STATUS_NO) {
        return Resp.errMsg(`上级部门�{parent.deptName}】停用，不允许新增`);
      }
    }
    if (
      !(await this.sysDeptService.checkUniqueParentIdByDeptName(
        dept.parentId,
        dept.deptName,
        0
      ))
    ) {
      return Resp.errMsg(`部门新增【${body.deptName}】失败，部门名称已存在`);
    }

    dept.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysDeptService.insert(dept);
    return insertId > 0 ? Resp.okData(insertId) : Resp.err();
  }

  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dept:edit'] }),
      OperateLogMiddleware({
        title: '部门信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: Record<string, any>): Promise<Resp> {
    const dept = this.parseBody(body);
    if (dept.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: deptId is empty');
    }
    if (dept.id === dept.parentId) {
      return Resp.errMsg(
        `部门修改【${body.deptName}】失败，上级部门不能是自己`
      );
    }

    const oldDept = await this.sysDeptService.findById(dept.id);
    if (oldDept.id !== dept.id) {
      return Resp.errMsg('没有权限访问部门数据！');
    }
    if (dept.parentId > 0) {
      const parent = await this.sysDeptService.findById(dept.parentId);
      if (parent.id !== dept.parentId) {
        return Resp.errMsg('没有权限访问部门数据！');
      }
    }
    if (
      !(await this.sysDeptService.checkUniqueParentIdByDeptName(
        dept.parentId,
        dept.deptName,
        dept.id
      ))
    ) {
      return Resp.errMsg(`部门修改【${body.deptName}】失败，部门名称已存在`);
    }
    if (dept.deptStatus === STATUS_NO) {
      const hasChild = await this.sysDeptService.existChildrenByDeptId(
        dept.id
      );
      if (hasChild > 0) {
        return Resp.errMsg(`该部门包含未停用的子部门数量：${hasChild}`);
      }
    }

    dept.createBy = '';
    dept.createTime = 0;
    dept.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysDeptService.update(dept);
    return rows > 0 ? Resp.ok() : Resp.err();
  }

  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dept:remove'] }),
      OperateLogMiddleware({
        title: '部门信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.number()) @Param('id') id: number
  ): Promise<Resp> {
    if (id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    const dept = await this.sysDeptService.findById(id);
    if (dept.id !== id) {
      return Resp.errMsg('没有权限访问部门数据！');
    }
    const hasChild = await this.sysDeptService.existChildrenByDeptId(id);
    if (hasChild > 0) {
      return Resp.errMsg(`不允许删除，存在子部门数：${hasChild}`);
    }
    const userCount = await this.sysDeptService.existUserByDeptId(id);
    if (userCount > 0) {
      return Resp.errMsg(`不允许删除，部门已分配给用户数：${userCount}`);
    }
    const rows = await this.sysDeptService.deleteById(id);
    return rows > 0 ? Resp.okMsg(`删除成功�{rows}`) : Resp.err();
  }

  @Get('/list/exclude/:dept_id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dept:list'] })],
  })
  public async excludeChild(
    @Valid(Joi.number()) @Param('dept_id') deptId: number
  ): Promise<Resp> {
    if (deptId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: deptId is empty');
    }
    const filter = loginUserToDataScopeSQL(this.c, 'sys_dept', '');
    return Resp.okData(
      await this.sysDeptService.findExcludeChildren(deptId, filter)
    );
  }

  @Get('/tree', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:dept:list', 'system:user:list'],
      }),
    ],
  })
  public async tree(
    @Valid(Joi.number().allow(0)) @Query('dept_id') id: number,
    @Valid(Joi.number().allow(0)) @Query('parent_id') parentId: number,
    @Valid(Joi.string().allow('')) @Query('dept_name') deptName: string,
    @Valid(Joi.string().pattern(/^[01]$/))
    @Query('dept_status')
    deptStatus: string
  ): Promise<Resp> {
    const sysDept = new SysDept();
    sysDept.id = id;
    sysDept.parentId = parentId;
    sysDept.deptName = deptName;
    sysDept.deptStatus = deptStatus;
    const filter = loginUserToDataScopeSQL(this.c, 'sys_dept', '');
    return Resp.okData(
      await this.sysDeptService.buildTreeSelect(sysDept, filter)
    );
  }

  @Get('/tree/role/:role_id', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:dept:query', 'system:user:edit'],
      }),
    ],
  })
  public async treeRole(
    @Valid(Joi.number().required()) @Param('role_id') roleId: number
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }
    const filter = loginUserToDataScopeSQL(this.c, 'sys_dept', '');
    const depts = await this.sysDeptService.buildTreeSelect(
      new SysDept(),
      filter
    );
    const checkedKeys = await this.sysDeptService.findDeptIdsByRoleId(roleId);
    return Resp.okData({ depts, checked_keys: checkedKeys });
  }

  private parseBody(body: Record<string, any>): SysDept {
    const dept = new SysDept();
    dept.id = Number(body?.id ?? body?.ID ?? 0) || 0;
    dept.parentId =
      Number(body?.parent_id ?? body?.parentId ?? body?.ParentId ?? 0) || 0;
    dept.deptName = String(body?.dept_name ?? body?.deptName ?? '');
    dept.deptLeader = String(body?.dept_leader ?? body?.leader ?? '');
    dept.deptPhone = String(body?.dept_phone ?? body?.phone ?? '');
    dept.deptEmail = String(body?.dept_email ?? body?.email ?? '');
    dept.deptSort = Number(body?.dept_sort ?? body?.deptSort ?? 0) || 0;
    dept.deptStatus = String(body?.dept_status ?? body?.statusFlag ?? '0');
    dept.remark = String(body?.remark ?? '');
    return dept;
  }
}