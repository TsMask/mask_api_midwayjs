import {
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Query,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { LOGIN_TOKEN_KEY } from '../../../framework/constants/CacheKeysConstants';
import { SysUserOnline } from '../model/SysUserOnline';
import { LoginUser } from '../../../framework/model/LoginUser';
import { SysUserOnlineServiceImpl } from '../service/impl/SysUserOnlineServiceImpl';

/**
 * 在线用户监控
 *
 * @author TsMask
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
    let userOnlines: SysUserOnline[] = [];
    // 去除所有在线用户
    const keys = await this.redisCache.getKeys(`${LOGIN_TOKEN_KEY}*`);
    for (const key of keys) {
      const loginUserStr = await this.redisCache.get(key);
      const loginUser: LoginUser = JSON.parse(loginUserStr);
      const onlineUser = await this.sysUserOnlineService.loginUserToUserOnline(
        loginUser
      );
      userOnlines.push(onlineUser);
    }

    // 根据查询条件过滤
    if (ipaddr && userName) {
      userOnlines = userOnlines.filter(
        o => ipaddr === o.ipaddr && userName === o.userName
      );
    } else if (ipaddr) {
      userOnlines = userOnlines.filter(o => ipaddr === o.ipaddr);
    } else if (userName) {
      userOnlines = userOnlines.filter(o => userName === o.userName);
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
