import { Controller, Del, Get, Inject, Param, Query } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { parseRemoveDuplicatesToArray } from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { TokenInfo } from '../../../framework/utils/token/token_info';
import { CACHE_LOGIN_TOKEN } from '../../../framework/constants/cache_key';
import { SysUserOnline } from '../model/sys_user_online';
import { SysUserOnlineService } from '../service/sys_user_online';

/**在线用户信息 控制层处理 */
@Controller('/monitor/user-online')
export class SysUserOnlineController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**在线用户服务 */
  @Inject()
  private sysUserOnlineService: SysUserOnlineService;

  /**
   * 在线用户列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:online:list'] })
  public async list(
    @Query('loginIp') loginIp: string,
    @Query('userName') userName: string
  ): Promise<Resp> {
    // 获取所有在线用户key
    const keys = await this.redisCache.getKeys('', `${CACHE_LOGIN_TOKEN}:*`);

    // 分批获取
    const arr: string[] = [];
    for (let i = 0; i < keys.length; i += 20) {
      let end = i + 20;
      if (end > keys.length) {
        end = keys.length;
      }
      const chunk = keys.slice(i, end);
      const values = await this.redisCache.getBatch('', chunk);
      if (values.length > 0) {
        arr.push(...values);
      }
    }

    // 遍历字符串信息解析组合可用对象
    const userOnlines: SysUserOnline[] = [];
    for (const str of arr) {
      if (!str) continue;

      let tokenInfo = new TokenInfo();
      try {
        tokenInfo = JSON.parse(str);
      } catch (error) {
        continue;
      }

      const onlineUser = await this.sysUserOnlineService.tokenInfoToUserOnline(
        tokenInfo
      );
      if (onlineUser.tokenId !== '') {
        userOnlines.push(onlineUser);
      }
    }

    // 根据查询条件过滤
    let filteredUserOnline: SysUserOnline[] = [];
    if (loginIp && userName) {
      for (const o of userOnlines) {
        if (o.loginIp.includes(loginIp) && o.userName.includes(userName)) {
          filteredUserOnline.push(o);
        }
      }
    } else if (loginIp) {
      for (const o of userOnlines) {
        if (o.loginIp.includes(loginIp)) {
          filteredUserOnline.push(o);
        }
      }
    } else if (userName) {
      for (const o of userOnlines) {
        if (o.userName.includes(userName)) {
          filteredUserOnline.push(o);
        }
      }
    } else {
      filteredUserOnline = userOnlines;
    }

    // 按登录时间排序
    filteredUserOnline = filteredUserOnline.sort(
      (a, b) => b.loginTime - a.loginTime
    );

    return Resp.okData({
      total: filteredUserOnline.length,
      rows: filteredUserOnline,
    });
  }

  /**
   * 在线用户强制退出
   */
  @Del('/logout/:tokenId')
  @PreAuthorize({ hasPermissions: ['monitor:online:logout'] })
  @OperateLog({
    title: '在线用户监控',
    businessType: BUSINESS_TYPE.FORCE,
  })
  public async fogout(
    @Valid(RuleType.string()) @Param('tokenId') tokenId: string
  ): Promise<Resp> {
    if (tokenId === '' || tokenId.indexOf('*') >= 0) {
      this.c.status = 400;
      return Resp.codeMsg(40010, 'bind err: tokenId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(tokenId, ',');
    for (const v of uniqueIDs) {
      const key = `${CACHE_LOGIN_TOKEN}:${v}`;
      await this.redisCache.del('', key);
    }
    return Resp.ok();
  }
}
