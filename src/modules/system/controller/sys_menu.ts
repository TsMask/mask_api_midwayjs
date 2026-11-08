import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../internal/shared/constants/menu';
import {
  loginUserToUserID,
  loginUserToUserName,
} from '../../../internal/web/reqctx/auth';
import {
  BUSINESS_TYPE,
  OperateLogMiddleware,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
import { validHttp } from '../../../internal/shared/regular/regular';
import { GlobalConfig } from '../../../internal/config/config';
import { Resp } from '../../../internal/web/resp/api';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { SysMenuService } from '../service/sys_menu';
import { SysMenu } from '../model/sys_menu';

/** Menu management controller. */
@Controller('/api/v1/system/menus')
export class SysMenuController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private config: GlobalConfig;

  @Inject()
  private sysMenuService: SysMenuService;

  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const sysMenu = new SysMenu();
    if (query.menu_name) sysMenu.menu_name = query.menu_name;
    if (query.menu_status) sysMenu.menu_status = query.menu_status;

    let user_id = loginUserToUserID(this.c);
    if (this.config.isSystemUser(user_id)) {
      user_id = 0;
    }
    const data = await this.sysMenuService.find(sysMenu, user_id);
    return Resp.okData(data);
  }

  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') menu_id: number
  ): Promise<Resp> {
    if (menu_id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    const data = await this.sysMenuService.findById(menu_id);
    if (data.id === menu_id) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:menu:add'] }),
      OperateLogMiddleware({
        title: '菜单信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysMenu): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: menu_id not is empty');
    }
    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menu_type)) {
      if (
        !validHttp(body.menu_path) &&
        (body.menu_path === '' || !body.menu_path.startsWith('/'))
      ) {
        return Resp.errMsg(
          `菜单新增【${body.menu_name}】失败，普通路由地址必须以 / 开头`
        );
      }
      const uniqueMenuPath = await this.sysMenuService.checkUniqueMenuPath(
        body.menu_path,
        0
      );
      if (!uniqueMenuPath) {
        return Resp.errMsg(
          `菜单新增【${body.menu_name}】失败，菜单路由地址已存在`
        );
      }
    }

    const uniqueMenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parent_id,
        body.menu_name,
        0
      );
    if (!uniqueMenuName) {
      return Resp.errMsg(`菜单新增【${body.menu_name}】失败，菜单名称已存在`);
    }

    if (body.menu_external === STATUS_YES && !validHttp(body.menu_path)) {
      return Resp.errMsg(
        `菜单新增【${body.menu_name}】失败，非内部地址必须以http(s)://开头`
      );
    }

    body.create_by = loginUserToUserName(this.c);
    const insertId = await this.sysMenuService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:menu:edit'] }),
      OperateLogMiddleware({
        title: '菜单信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysMenu): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: menu_id is empty');
    }
    if (body.id === body.parent_id) {
      return Resp.errMsg(
        `菜单修改【${body.menu_name}】失败，上级菜单不能选择自己`
      );
    }

    const menuInfo = await this.sysMenuService.findById(body.id);
    if (menuInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问菜单数据');
    }
    if (body.parent_id > 0) {
      const menuParent = await this.sysMenuService.findById(body.parent_id);
      if (menuParent.id !== body.parent_id) {
        return Resp.errMsg('没有权限访问菜单数据');
      }
      if (
        body.menu_status === STATUS_YES &&
        menuParent.menu_status === STATUS_NO
      ) {
        return Resp.errMsg('上级菜单未启用！');
      }
    }

    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menu_type)) {
      if (
        !validHttp(body.menu_path) &&
        (body.menu_path === '' || !body.menu_path.startsWith('/'))
      ) {
        return Resp.errMsg(
          `菜单修改【${body.menu_name}】失败，普通路由地址必须以 / 开头`
        );
      }
      const uniqueMenuPath = await this.sysMenuService.checkUniqueMenuPath(
        body.menu_path,
        body.id
      );
      if (!uniqueMenuPath) {
        return Resp.errMsg(
          `菜单修改【${body.menu_name}】失败，菜单路由地址已存在`
        );
      }
    }

    const uniqueMenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parent_id,
        body.menu_name,
        body.id
      );
    if (!uniqueMenuName) {
      return Resp.errMsg(`菜单修改【${body.menu_name}】失败，菜单名称已存在`);
    }

    if (body.menu_external === STATUS_YES && !validHttp(body.menu_path)) {
      return Resp.errMsg(
        `菜单修改【${body.menu_name}】失败，非内部地址必须以http(s)://开头`
      );
    }

    if (body.menu_status === STATUS_NO) {
      const hasStatus =
        await this.sysMenuService.existChildrenByMenuIdAndStatus(
          body.id,
          STATUS_YES
        );
      if (hasStatus > 0) {
        return Resp.errMsg(`不允许禁用，存在使用子菜单数：${hasStatus}`);
      }
    }

    menuInfo.parent_id = body.parent_id;
    menuInfo.menu_name = body.menu_name;
    menuInfo.menu_type = body.menu_type;
    menuInfo.menu_sort = body.menu_sort;
    menuInfo.menu_path = body.menu_path;
    menuInfo.menu_component = body.menu_component;
    menuInfo.menu_external = body.menu_external;
    menuInfo.menu_cache = body.menu_cache;
    menuInfo.menu_visible = body.menu_visible;
    menuInfo.menu_status = body.menu_status;
    menuInfo.menu_perms = body.menu_perms;
    menuInfo.menu_icon = body.menu_icon;
    menuInfo.remark = body.remark;
    menuInfo.update_by = loginUserToUserName(this.c);
    const rows = await this.sysMenuService.update(menuInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:menu:remove'] }),
      OperateLogMiddleware({
        title: '菜单信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.number()) @Param('id') menu_id: number
  ): Promise<Resp> {
    if (menu_id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }

    const menu = await this.sysMenuService.findById(menu_id);
    if (menu.id !== menu_id) {
      return Resp.errMsg('没有权限访问菜单数据！');
    }
    const hasChild = await this.sysMenuService.existChildrenByMenuIdAndStatus(
      menu_id,
      ''
    );
    if (hasChild > 0) {
      return Resp.errMsg(`不允许删除，存在子菜单数：${hasChild}`);
    }
    const rows = await this.sysMenuService.deleteById(menu_id);
    if (rows > 0) {
      return Resp.okMsg(`删除成功：${rows}`);
    }
    return Resp.err();
  }

  @Get('/tree', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:menu:list', 'system:role:query'],
      }),
    ],
  })
  public async tree(@Query() query: Record<string, string>): Promise<Resp> {
    const sysMenu = new SysMenu();
    if (query.menu_name) sysMenu.menu_name = query.menu_name;
    if (query.menu_status) sysMenu.menu_status = query.menu_status;

    let user_id = loginUserToUserID(this.c);
    if (this.config.isSystemUser(user_id)) {
      user_id = 0;
    }
    const trees = await this.sysMenuService.buildTreeSelectByUserId(
      sysMenu,
      user_id
    );
    return Resp.okData(trees);
  }

  @Get('/tree/role/:role_id', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:menu:list', 'system:role:query'],
      }),
    ],
  })
  public async treeRole(
    @Param('role_id') role_id: number,
    @Query() query: Record<string, string>
  ): Promise<Resp> {
    if (role_id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: role_id is empty');
    }
    const sysMenu = new SysMenu();
    if (query.menu_name) sysMenu.menu_name = query.menu_name;
    if (query.menu_status) sysMenu.menu_status = query.menu_status;

    let user_id = loginUserToUserID(this.c);
    if (this.config.isSystemUser(user_id)) {
      user_id = 0;
    }
    const menus = await this.sysMenuService.buildTreeSelectByUserId(
      sysMenu,
      user_id
    );
    const checkedKeys = await this.sysMenuService.findByRoleId(role_id);
    return Resp.okData({
      menus,
      checked_keys: checkedKeys,
    });
  }
}
