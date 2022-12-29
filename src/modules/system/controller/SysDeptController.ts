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
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { STATUS_NO } from '../../../framework/constants/CommonConstants';
import { SysDept } from '../../../framework/core/model/SysDept';
import { Result } from '../../../framework/core/Result';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';

/**
 * 部门信息
 *
 * @author TsMask <340112800@qq.com>
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
   * 部门信息
   */
  @Get('/:deptId')
  @PreAuthorize({ hasPermissions: ['system:dept:query'] })
  async getInfo(@Param('deptId') deptId: string): Promise<Result> {
    const data = await this.sysDeptService.selectDeptById(deptId);
    return Result.okData(data || {});
  }

  /**
   * 部门新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dept:add'] })
  @OperLog({ title: '部门信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysDept: SysDept): Promise<Result> {
    if (!sysDept.parentId) return Result.err();
    // 检查同级下同名唯一
    const uniqueDeptName = await this.sysDeptService.checkUniqueDeptName(
      sysDept
    );
    if (!uniqueDeptName) {
      return Result.errMsg(
        `部门新增【${sysDept.deptName}】失败，部门名称已存在`
      );
    }
    // 如果父节点不为正常状态,则不允许新增子节点
    const deptParent = await this.sysDeptService.selectDeptById(
      sysDept.parentId
    );
    if (deptParent && deptParent.status === STATUS_NO) {
      return Result.errMsg(
        `上级部门【${deptParent.deptName}】停用，不允许新增`
      );
    }
    sysDept.ancestors = `${deptParent.ancestors},${sysDept.parentId}`;
    sysDept.createBy = this.contextService.getUseName();
    const insertId = await this.sysDeptService.insertDept(sysDept);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 部门修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dept:edit'] })
  @OperLog({ title: '部门信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async edit(@Body() sysDept: SysDept): Promise<Result> {
    if (sysDept.parentId === sysDept.deptId) {
      return Result.errMsg(
        `部门修改【${sysDept.deptName}】失败，上级部门不能是自己`
      );
    }
    // 检查同级下同名唯一
    const uniqueDeptName = await this.sysDeptService.checkUniqueDeptName(
      sysDept
    );
    if (!uniqueDeptName) {
      return Result.errMsg(
        `部门修改【${sysDept.deptName}】失败，部门名称已存在`
      );
    }
    // 上级停用
    if (sysDept.status === STATUS_NO) {
      const hasChild = await this.sysDeptService.hasChildByDeptId(
        sysDept.deptId
      );
      if (hasChild) {
        return Result.errMsg('该部门包含未停用的子部门！');
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
  @OperLog({ title: '部门信息', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('deptId') deptId: string): Promise<Result> {
    if (!deptId) return Result.err();
    const hasChild = await this.sysDeptService.hasChildByDeptId(deptId);
    if (hasChild) {
      return Result.errMsg('存在下级部门,不允许删除');
    }
    const existUser = await this.sysDeptService.checkDeptExistUser(deptId);
    if (existUser) {
      return Result.errMsg('部门存在用户,不允许删除');
    }
    const dept = await this.sysDeptService.selectDeptById(deptId);
    if (!dept) {
      return Result.errMsg('没有权限访问部门数据');
    }
    const rows = await this.sysDeptService.deleteDeptById(deptId);
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
