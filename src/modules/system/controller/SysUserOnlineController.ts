import {
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Query,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { AuthToken } from '../../../framework/decorator/AuthTokenDecorator';
import { RedisCache } from '../../../framework/redis/RedisCache';
import { LOGIN_TOKEN_KEY } from '../../../common/constants/CacheKeysConstants';
import { SysUserOnline } from '../model/SysUserOnline';
import { LoginUser } from '../../../framework/core/vo/LoginUser';
import { SysUserOnlineServiceImpl } from '../service/impl/SysUserOnlineServiceImpl';

/**
 * 在线用户监控
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/online')
export class SysUserOnlineController {
  @Inject()
  private sysUserOnlineService: SysUserOnlineServiceImpl;

  @Inject()
  private redisCache: RedisCache;

  /**
   * 个人信息
   *
   * @returns 返回结果
   */
  @Get('/list')
  @AuthToken({ hasPermissions: ['monitor:online:list'] })
  async list(
    @Query('ipaddr') ipaddr: string,
    @Query('userName') userName: string
  ): Promise<Result> {
    let userOnlines: SysUserOnline[] = [];
    const keys = await this.redisCache.getKeys(`${LOGIN_TOKEN_KEY}*`);
    for (const key of keys) {
      const loginUserStr = await this.redisCache.get(key);
      const loginUser: LoginUser = JSON.parse(loginUserStr);
      if (
        ipaddr &&
        ipaddr === loginUser.ipaddr &&
        userName &&
        loginUser.user?.userName
      ) {
        const online = await this.sysUserOnlineService.selectOnlineByInfo(
          ipaddr,
          userName,
          loginUser
        );
        userOnlines.push(online);
      } else if (ipaddr && ipaddr === loginUser.ipaddr) {
        const online = await this.sysUserOnlineService.selectOnlineByIpaddr(
          ipaddr,
          loginUser
        );
        userOnlines.push(online);
      } else if (userName && loginUser.user?.userName) {
        const online = await this.sysUserOnlineService.selectOnlineByUserName(
          userName,
          loginUser
        );
        userOnlines.push(online);
      } else {
        const online = await this.sysUserOnlineService.loginUserToUserOnline(
          loginUser
        );
        userOnlines.push(online);
      }
    }
    userOnlines = userOnlines.reverse();
    return Result.ok({
      rows: userOnlines,
      total: keys.length,
    });
  }

  /**
   * 强退用户
   * @param tokenId 登录用户唯一标识uuid
   * @returns 返回结果
   */
  @Del('/:tokenId')
  @AuthToken({ hasPermissions: ['monitor:online:forceLogout'] })
  async forceLogout(@Param('tokenId') tokenId: string): Promise<Result> {
    this.redisCache.del(`${LOGIN_TOKEN_KEY}${tokenId}`);
    return Result.ok();
  }
}
