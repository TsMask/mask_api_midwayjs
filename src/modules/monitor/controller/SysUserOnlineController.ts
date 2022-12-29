import {
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Query,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { RedisCache } from '../../../framework/redis/RedisCache';
import { LOGIN_TOKEN_KEY } from '../../../framework/constants/CacheKeysConstants';
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
   * 在线用户列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:online:list'] })
  async list(
    @Query('ipaddr') ipaddr: string,
    @Query('userName') userName: string
  ): Promise<Result> {
    const userOnlines: SysUserOnline[] = [];
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
    return Result.ok({
      rows: userOnlines.reverse(),
      total: keys.length,
    });
  }

  /**
   * 在线用户强制退出
   */
  @Del('/:tokenId')
  @PreAuthorize({ hasPermissions: ['monitor:online:forceLogout'] })
  async forceLogout(@Param('tokenId') tokenId: string): Promise<Result> {
    if (!tokenId || tokenId === '*') return Result.err();
    this.redisCache.del(`${LOGIN_TOKEN_KEY}${tokenId}`);
    return Result.ok();
  }
}
