import { Controller, Del, Get, Inject, Param, Query } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import { CACHE_TOKEN_SESSION } from '../../../internal/shared/constants/cache_key';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { UserTokenService } from '../../../internal/web/token/user_token';
import { UserInfo } from '../../../internal/web/token/user_info';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';

/**在线用户信息 控制层处理 */
@Controller('/api/v1/monitor/online-users')
export class SysUserOnlineController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private token: UserTokenService;

  /**
   * 在线用户列表
   */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:online:user:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const keys = await this.redisCache.getKeys('', `${CACHE_TOKEN_SESSION}:*`);
    keys.sort();
    if (keys.length === 0) {
      return Resp.okData({ total: 0, rows: [] });
    }

    const values = await this.redisCache.getBatch('', keys);
    let list: Record<string, any>[] = [];
    for (const value of values) {
      if (!value) continue;
      try {
        const info = JSON.parse(value) as UserInfo;
        if (info.session_id !== '') {
          list.push(this.userOnlineRow(info));
        }
      } catch {
        continue;
      }
    }

    list = this.filterContains(list, 'device_id', query.device_id);
    list = this.filterContains(list, 'session_id', query.session_id);
    list = this.filterContains(list, 'user_name', query.user_name);
    list = this.filterContains(list, 'login_ip', query.login_ip);
    list = this.filterContains(list, 'login_location', query.login_location);
    list = this.filterContains(list, 'login_browser', query.browser);
    list = this.filterContains(list, 'login_os', query.os);

    if (query.sort) {
      const sort = query.sort;
      list.sort((a, b) => this.compareUserOnline(a, b, sort));
    } else {
      list.sort(
        (a, b) => parseNumber(b.login_time) - parseNumber(a.login_time)
      );
    }

    const pageNum = Math.max(Math.trunc(parseNumber(query.page_num)), 1);
    const parsedPageSize = Math.trunc(parseNumber(query.page_size));
    const pageSize = parsedPageSize < 1 ? 10 : parsedPageSize;
    return Resp.okData({
      total: list.length,
      rows: list.slice((pageNum - 1) * pageSize, pageNum * pageSize),
    });
  }

  /**
   * 在线用户强制退出
   */
  @Del('/logout/:session_id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:online:user:logout'] }),
      OperateLogMiddleware({
        title: '在线用户监控',
        businessType: BUSINESS_TYPE.FORCE,
      }),
    ],
  })
  public async logout(
    @Valid(Joi.string().allow('')) @Param('session_id') sessionId: string
  ): Promise<Resp> {
    if (!sessionId || sessionId.includes('*')) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: sessionId is empty');
    }

    const sessionIds = parseRemoveDuplicatesToArray(sessionId, ',');
    await this.token.removeBySessionIds(sessionIds);
    return Resp.ok();
  }

  /**将令牌信息转换为列表行 */
  private userOnlineRow(info: UserInfo): Record<string, any> {
    return {
      session_id: info.session_id,
      device_id: info.device_id,
      user_id: info.user_id,
      user_name: info.user_name,
      login_ip: info.login_ip,
      login_location: info.login_location,
      login_browser: info.login_browser,
      login_os: info.login_os,
      login_time: info.login_time,
      role_keys: info.role_keys,
    };
  }

  /**按值模糊匹配保留命中的行 */
  private filterContains(
    list: Record<string, any>[],
    key: string,
    value: string
  ): Record<string, any>[] {
    if (!value) {
      return list;
    }
    return list.filter(item => String(item[key]).includes(value));
  }

  /**多字段排序比较 */
  private compareUserOnline(
    a: Record<string, any>,
    b: Record<string, any>,
    sort: string
  ): number {
    const sortFns: Record<
      string,
      (x: Record<string, any>, y: Record<string, any>) => number
    > = {
      session_id: (x, y) => this.compareText(x.session_id, y.session_id),
      device_id: (x, y) => this.compareText(x.device_id, y.device_id),
      user_name: (x, y) => this.compareText(x.user_name, y.user_name),
      login_ip: (x, y) => this.compareText(x.login_ip, y.login_ip),
      login_location: (x, y) =>
        this.compareText(x.login_location, y.login_location),
      login_browser: (x, y) =>
        this.compareText(x.login_browser, y.login_browser),
      login_os: (x, y) => this.compareText(x.login_os, y.login_os),
      login_time: (x, y) =>
        parseNumber(x.login_time) - parseNumber(y.login_time),
    };

    for (const item of sort.split(',')) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const [field, direction] = trimmed.split(':');
      const compared = sortFns[field.trim()]?.(a, b) ?? 0;
      if (compared !== 0) {
        return direction.trim().toLowerCase() === 'asc' ? compared : -compared;
      }
    }
    return 0;
  }

  /**文本比较 */
  private compareText(a: any, b: any): number {
    const left = String(a);
    const right = String(b);
    return left < right ? -1 : left > right ? 1 : 0;
  }
}
