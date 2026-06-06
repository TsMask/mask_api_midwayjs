import { Controller, Del, Get, Inject, Param, Query } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { CACHE_TOKEN_DEVICE } from '../../../framework/constants/cache_key';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { UserInfo } from '../../../framework/token/user_info';
import { CODE_PARAM_CHEACK } from '../../../framework/resp/code';
import { Resp } from '../../../framework/resp/api';
import { SysUserOnlineService } from '../service/sys_user_online';
import { SysUserOnline } from '../model/sys_user_online';

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
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:online:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    // SCAN 获取所有 key（仅名称，10万级也很快）
    const keys = await this.redisCache.getKeys('', `${CACHE_TOKEN_DEVICE}:*`);
    keys.sort(); // 排序保证顺序确定性

    const total = keys.length;
    if (total <= 0) {
      return Resp.okData({ total: 0, rows: [] });
    }

    // 分页：只取当前页的 key，避免 10 万级全量 mget
    const pn = Math.max(parseNumber(query.pageNum || '1'), 1);
    const ps = Math.max(parseNumber(query.pageSize || '10'), 1);
    const pageKeys = keys.slice((pn - 1) * ps, pn * ps);
    const values = await this.redisCache.getBatch('', pageKeys);

    // 解析当前页数据
    let list: SysUserOnline[] = [];
    for (const str of values) {
      if (!str) continue;
      try {
        const info: UserInfo = JSON.parse(str);
        const onlineUser =
          await this.sysUserOnlineService.userInfoToUserOnline(info);
        if (onlineUser.tokenId !== '') {
          list.push(onlineUser);
        }
      } catch {
        // ignore invalid JSON
      }
    }

    // 过滤
    if (query.tokenId)
      list = list.filter(o => o.tokenId.includes(query.tokenId));
    if (query.userName)
      list = list.filter(o => o.userName.includes(query.userName));
    if (query.loginIp)
      list = list.filter(o => o.loginIp.includes(query.loginIp));
    if (query.deptName)
      list = list.filter(o => o.deptName?.includes(query.deptName));
    if (query.browser)
      list = list.filter(o => o.browser.includes(query.browser));
    if (query.os) list = list.filter(o => o.os.includes(query.os));

    // 排序，格式: sort=loginTime,userName:asc（不加方向默认 DESC）
    const sortFns: Record<
      string,
      (a: SysUserOnline, b: SysUserOnline) => number
    > = {
      tokenId: (a, b) => a.tokenId.localeCompare(b.tokenId),
      userName: (a, b) => a.userName.localeCompare(b.userName),
      loginIp: (a, b) => a.loginIp.localeCompare(b.loginIp),
      deptName: (a, b) => (a.deptName ?? '').localeCompare(b.deptName ?? ''),
      browser: (a, b) => a.browser.localeCompare(b.browser),
      os: (a, b) => a.os.localeCompare(b.os),
      loginTime: (a, b) => a.loginTime - b.loginTime,
    };
    if (query.sort) {
      const items = query.sort.split(',');
      list.sort((a, b) => {
        for (const item of items) {
          const [field, dir] = item.split(':');
          const cmp = sortFns[field]?.(a, b) ?? 0;
          if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    } else {
      list.sort((a, b) => b.loginTime - a.loginTime);
    }

    return Resp.okData({
      total,
      rows: list,
    });
  }

  /**
   * 在线用户强制退出
   */
  @Del('/logout/:tokenId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:online:logout'] }),
      OperateLogMiddleware({
        title: '在线用户监控',
        businessType: BUSINESS_TYPE.FORCE,
      }),
    ],
  })
  public async logout(
    @Valid(Joi.string().allow('')) @Param('tokenId') tokenId: string
  ): Promise<Resp> {
    if (tokenId === '' || tokenId.indexOf('*') >= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: tokenId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(tokenId, ',');
    for (const v of uniqueIDs) {
      const key = `${CACHE_TOKEN_DEVICE}:${v}`;
      await this.redisCache.del('', key);
    }
    return Resp.ok();
  }
}
