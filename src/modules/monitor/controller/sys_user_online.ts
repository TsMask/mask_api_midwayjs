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
import { SysUserOnlineService } from '../service/sys_user_online';
import { SysUserOnline } from '../model/sys_user_online';

/**在线用户信息 控制层处理 */
@Controller('/api/v1/monitor/online-users')
export class SysUserOnlineController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private token: UserTokenService;

  @Inject()
  private sysUserOnlineService: SysUserOnlineService;

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
    if (keys.length === 0) {
      return Resp.okData({ total: 0, rows: [] });
    }

    const values = await this.redisCache.getBatch('', keys);
    let list: SysUserOnline[] = [];
    for (const value of values) {
      if (!value) continue;
      try {
        const info = JSON.parse(value) as UserInfo;
        const onlineUser =
          await this.sysUserOnlineService.userInfoToUserOnline(info);
        if (onlineUser.sessionId !== '') {
          list.push(onlineUser);
        }
      } catch {
        continue;
      }
    }

    const sessionFilter = query.session_id || query.sessionId || query.tokenId;
    const userNameFilter = query.user_name || query.userName;
    const loginIpFilter = query.login_ip || query.loginIp;
    const deptNameFilter = query.dept_name || query.deptName;
    if (sessionFilter) {
      list = list.filter(item => item.sessionId.includes(sessionFilter));
    }
    if (userNameFilter) {
      list = list.filter(item => item.userName.includes(userNameFilter));
    }
    if (loginIpFilter) {
      list = list.filter(item => item.loginIp.includes(loginIpFilter));
    }
    if (deptNameFilter) {
      list = list.filter(item =>
        (item.deptName ?? '').includes(deptNameFilter)
      );
    }
    if (query.browser) {
      list = list.filter(item => item.browser.includes(query.browser));
    }
    if (query.os) {
      list = list.filter(item => item.os.includes(query.os));
    }

    const sortFns: Record<
      string,
      (a: SysUserOnline, b: SysUserOnline) => number
    > = {
      session_id: (a, b) => a.sessionId.localeCompare(b.sessionId),
      sessionId: (a, b) => a.sessionId.localeCompare(b.sessionId),
      user_name: (a, b) => a.userName.localeCompare(b.userName),
      userName: (a, b) => a.userName.localeCompare(b.userName),
      login_ip: (a, b) => a.loginIp.localeCompare(b.loginIp),
      loginIp: (a, b) => a.loginIp.localeCompare(b.loginIp),
      dept_name: (a, b) => (a.deptName ?? '').localeCompare(b.deptName ?? ''),
      deptName: (a, b) => (a.deptName ?? '').localeCompare(b.deptName ?? ''),
      browser: (a, b) => a.browser.localeCompare(b.browser),
      os: (a, b) => a.os.localeCompare(b.os),
      login_time: (a, b) => a.loginTime - b.loginTime,
      loginTime: (a, b) => a.loginTime - b.loginTime,
    };
    if (query.sort) {
      const items = query.sort.split(',');
      list.sort((a, b) => {
        for (const item of items) {
          const [field, direction] = item.split(':');
          const compared = sortFns[field]?.(a, b) ?? 0;
          if (compared !== 0) {
            return direction === 'asc' ? compared : -compared;
          }
        }
        return 0;
      });
    } else {
      list.sort((a, b) => b.loginTime - a.loginTime);
    }

    const pageNum = Math.max(
      parseNumber(query.pageNum || query.page_num || '1'),
      1
    );
    const pageSize = Math.min(
      Math.max(parseNumber(query.pageSize || query.page_size || '10'), 1),
      500
    );
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
}