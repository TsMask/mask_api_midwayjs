import {
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Query,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { LOGIN_TOKEN_KEY } from '../../../framework/constants/CacheKeysConstants';
import { SysUserOnline } from '../model/SysUserOnline';
import { LoginUser } from '../../../framework/vo/LoginUser';
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
    // 获取所有在线用户
    const keys = await this.redisCache.getKeys(`${LOGIN_TOKEN_KEY}*`);

    // 分批获取
    const result: string[] = [];
    for (let i = 0; i < keys.length; i += 20) {
      const chunk = keys.slice(i, i + 20);
      const values = await this.redisCache.getBatch(chunk);
      result.push(...values);
    }

    // 遍历字符串信息解析组合可用对象
    let userOnlines: SysUserOnline[] = [];
    for (const str of result) {
      if (!str) continue;
      const loginUser: LoginUser = JSON.parse(str);
      const onlineUser = await this.sysUserOnlineService.loginUserToUserOnline(
        loginUser
      );
      userOnlines.push(onlineUser);
    }

    // 根据查询条件过滤
    if (ipaddr && userName) {
      userOnlines = userOnlines.filter(
        o => o.ipaddr.includes(ipaddr) && o.userName.includes(userName)
      );
    } else if (ipaddr) {
      userOnlines = userOnlines.filter(o => o.ipaddr.includes(ipaddr));
    } else if (userName) {
      userOnlines = userOnlines.filter(o => o.userName.includes(userName));
    }

    return Result.ok({
      rows: userOnlines.sort((a, b) => b.loginTime - a.loginTime),
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
    const num = await this.redisCache.del(`${LOGIN_TOKEN_KEY}${tokenId}`);
    return Result[num > 0 ? 'ok' : 'err']();
  }
}
