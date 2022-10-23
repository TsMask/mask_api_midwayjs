import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { AuthToken } from '../../../framework/decorator/AuthTokenDecorator';

/**
 * 个人信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/user/profile')
export class SysProfileController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  /**
   * 获取个人信息
   *
   * @returns 返回结果
   */
  @Get()
  @AuthToken()
  async profile(): Promise<Result> {
    const sysUser = this.contextService.getSysUser();
    const roleGroup = await this.sysUserService.selectUserRoleGroup(
      sysUser.userName
    );
    const postGroup = await this.sysUserService.selectUserPostGroup(
      sysUser.userName
    );
    return Result.ok({
      data: sysUser,
      roleGroup: roleGroup,
      postGroup: postGroup,
    });
  }
}
