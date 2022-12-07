import { Context, Del, Put } from '@midwayjs/core';
import { Body, Controller, Get, Inject, Param, Post, Query } from '@midwayjs/decorator';
import { SysDept } from '../../../framework/core/model/SysDept';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';

/**
 * 部门信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dept')
export class SysDeptController {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  /**
   * 获取部门列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  async list(@Query() sysDept: SysDept): Promise<Result> {
    const list = await this.sysDeptService.selectDeptList(sysDept);
    return Result.okData(list);
  }

  /**
   * 查询部门列表（排除节点）
   */
  @Get('/list/exclude/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:list'] })
  async excludeChild(@Param('deptId') deptId: string): Promise<Result> {
    let data = await this.sysDeptService.selectDeptList(new SysDept());
    data = data.filter(dept => !(dept.deptId == deptId || dept.ancestors.split(',').includes(deptId)))
    return Result.okData(data);
  }

  /**
   * 根据部门编号获取详细信息
   */
  @Get('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:query'] })
  async getInfo(@Param('deptId') deptId: string): Promise<Result> {
    const data = await this.sysDeptService.selectDeptById(deptId);
    if (data) {
      return Result.okData(data);
    }
    return Result.err();
  }

  /**
   * 新增部门
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dept:add'] })
  async add(@Body() sysDept: SysDept): Promise<Result> {
    if (sysDept && sysDept.parentId) {
      const dept = await this.sysDeptService.checkUniqueDeptName(sysDept);
      if (dept) {
        return Result.errMsg(`新增部门【${sysDept.deptName}】失败，部门名称已存在`);
      }
      // 如果父节点不为正常状态,则不允许新增子节点
      const deptParent = await this.sysDeptService.selectDeptById(sysDept.parentId);
      if (deptParent && deptParent.status == "1") {
        return Result.errMsg(`上级部门【${deptParent.deptName}】停用，不允许新增`);
      }
      sysDept.ancestors = `${deptParent.ancestors},${sysDept.parentId}`;
      sysDept.createBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysDeptService.insertDept(sysDept);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 修改部门
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dept:edit'] })
  async edit(@Body() sysDept: SysDept): Promise<Result> {
    if (sysDept.parentId == sysDept.deptId) {
      return Result.errMsg(`修改部门【${sysDept.deptName}】失败，上级部门不能是自己`);
    }
    // 检查同级下同名
    const dept = await this.sysDeptService.checkUniqueDeptName(sysDept);
    if (dept) {
      return Result.errMsg(`修改部门【${sysDept.deptName}】失败，部门名称已存在`);
    }
    // 上级停用
    if (sysDept.status == "1") {
      const hasChild = await this.sysDeptService.hasChildByDeptId(sysDept.deptId);
      if (hasChild) {
        return Result.errMsg("该部门包含未停用的子部门！");
      }
    }
    sysDept.updateBy = this.ctx.loginUser?.user?.userName;
    const id = await this.sysDeptService.updateDept(sysDept);
    return Result[id ? 'ok' : 'err']();
  }

  /**
  * 删除部门
  */
  @Del("/:deptId")
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  async remove(@Param('deptId') deptId: string): Promise<Result> {
    if (!deptId) return Result.err();
    const hasChild = await this.sysDeptService.hasChildByDeptId(deptId);
    if (hasChild) {
      return Result.errMsg("存在下级部门,不允许删除");
    }
    const existUser = await this.sysDeptService.checkDeptExistUser(deptId);
    if (existUser) {
      return Result.errMsg("部门存在用户,不允许删除");
    }
    const rowNum = await this.sysDeptService.deleteDeptById(deptId);
    return Result[rowNum ? 'ok' : 'err']();
  }
}
