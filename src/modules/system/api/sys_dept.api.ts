import { Body, Controller, Get, Inject, Param } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { SysDept } from '../../../framework/core/model/sys_dept';
import { Result } from '../../../framework/core/result';
import { SysDeptService } from '../service/sys_dept.service';

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
  private sys_dept_service: SysDeptService;

  /**
   * 获取部门列表
   */
  @Get('/list')
  async list(@Body() dept: SysDept): Promise<Result> {
    const list = await this.sys_dept_service.select_dept_list(dept);
    return Result.ok_data(list);
  }

  /**
   * 查询部门列表（排除节点）
   */
  @Get('/list/exclude/:deptId')
  async export(@Param('deptId') dept_id: string): Promise<Result> {
    let list = await this.sys_dept_service.select_dept_list(new SysDept());
    list = list.filter(dept => {
      return (
        dept.dept_id === dept_id || dept.ancestors.split(',').includes(dept_id)
      );
    });
    return Result.ok_data(list);
  }

  /**
   * 根据部门编号获取详细信息
   */
  @Get('/:deptId')
  async get_info(@Param('deptId') dept_id: string): Promise<Result> {
    // if (parse_number(config_id)) {
    //   const data = await this.sys_dept_service.select_config_by_id(config_id);
    //   return Result.ok_data(data);
    // }
    this.ctx.username;
    return Result.err();
  }
}
