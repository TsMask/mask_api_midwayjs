import { Body, Controller, Get, Inject, Param } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { SysDept } from '../../../framework/core/model/SysDept';
import { Result } from '../../../framework/core/Result';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';

/**
 * 部门信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dept')
export class SysDeptApi {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  /**
   * 获取部门列表
   */
  @Get('/list')
  async list(@Body() sysDept: SysDept): Promise<Result> {
    const list = await this.sysDeptService.selectDeptList(sysDept);
    return Result.okData(list);
  }

  /**
   * 查询部门列表（排除节点）
   */
  @Get('/list/exclude/:deptId')
  async export(@Param('deptId') deptId: string): Promise<Result> {
    let list = await this.sysDeptService.selectDeptList(new SysDept());
    list = list.filter(dept => {
      return (
        dept.deptId === deptId || dept.ancestors.split(',').includes(deptId)
      );
    });
    return Result.okData(list);
  }

  /**
   * 根据部门编号获取详细信息
   */
  @Get('/:deptId')
  async get_info(@Param('deptId') deptId: string): Promise<Result> {
    // if (parse_number(config_id)) {
    //   const data = await this.sys_dept_service.select_config_by_id(config_id);
    //   return Result.ok_data(data);
    // }
    this.ctx.logger.info(deptId);
    return Result.err();
  }
}
