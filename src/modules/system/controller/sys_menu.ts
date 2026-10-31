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
import { STATUS_NO, STATUS_YES } from '../../../internal/shared/constants/common';
import { validHttp } from '../../../internal/shared/regular/regular';
import { GlobalConfig } from '../../../internal/config/config';
import { Resp } from '../../../internal/web/resp/api';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { SysMenuService } from '../service/sys_menu';
import { SysMenu } from '../model/sys_menu';
import { serializeSysMenu } from '../model/vo/response';

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
    if (query.menu_name) sysMenu.menuName = query.menu_name;
    if (query.menu_status) sysMenu.menuStatus = query.menu_status;

    let userId = loginUserToUserID(this.c);
    if (this.config.isSystemUser(userId)) {
      userId = 0;
    }
    const data = await this.sysMenuService.find(sysMenu, userId);
    return Resp.okData(data.map(serializeSysMenu));
  }

  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') menuId: number
  ): Promise<Resp> {
    if (menuId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    const data = await this.sysMenuService.findById(menuId);
    if (data.id === menuId) {
      return Resp.okData(serializeSysMenu(data));
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
  public async add(@Body() rawBody: Record<string, any>): Promise<Resp> {
    const body = this.parseBody(rawBody);
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: menuId not is empty');
    }

    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menuType)) {
      if (
        !validHttp(body.menuPath) &&
        (body.menuPath === '' || !body.menuPath.startsWith('/'))
      ) {
        return Resp.errMsg(
          `菜单新增【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
      const uniqueMenuPath = await this.sysMenuService.checkUniqueMenuPath(
        body.menuPath,
        0
      );
      if (!uniqueMenuPath) {
        return Resp.errMsg(
          `菜单新增【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
    }

    const uniqueMenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parentId,
        body.menuName,
        0
      );
    if (!uniqueMenuName) {
      return Resp.errMsg(`菜单新增【${body.menuName}】失败，菜单名称已存在`);
    }

    if (body.menuExternal === STATUS_YES && !validHttp(body.menuPath)) {
      return Resp.errMsg(
        `菜单新增【${body.menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }

    body.createBy = loginUserToUserName(this.c);
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
  public async edit(@Body() rawBody: Record<string, any>): Promise<Resp> {
    const body = this.parseBody(rawBody);
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: menuId is empty');
    }
    if (body.id === body.parentId) {
      return Resp.errMsg(
        `菜单修改【${body.menuName}】失败，上级菜单不能选择自己`
      );
    }

    const menuInfo = await this.sysMenuService.findById(body.id);
    if (menuInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问菜单数据');
    }
    if (body.parentId > 0) {
      const menuParent = await this.sysMenuService.findById(body.parentId);
      if (menuParent.id !== body.parentId) {
        return Resp.errMsg('没有权限访问菜单数据');
      }
      if (
        body.menuStatus === STATUS_YES &&
        menuParent.menuStatus === STATUS_NO
      ) {
        return Resp.errMsg('上级菜单未启用！');
      }
    }

    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menuType)) {
      if (
        !validHttp(body.menuPath) &&
        (body.menuPath === '' || !body.menuPath.startsWith('/'))
      ) {
        return Resp.errMsg(
          `菜单修改【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
      const uniqueMenuPath = await this.sysMenuService.checkUniqueMenuPath(
        body.menuPath,
        body.id
      );
      if (!uniqueMenuPath) {
        return Resp.errMsg(
          `菜单修改【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
    }

    const uniqueMenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parentId,
        body.menuName,
        body.id
      );
    if (!uniqueMenuName) {
      return Resp.errMsg(`菜单修改【${body.menuName}】失败，菜单名称已存在`);
    }

    if (body.menuExternal === STATUS_YES && !validHttp(body.menuPath)) {
      return Resp.errMsg(
        `菜单修改【${body.menuName}】失败，上级菜单不能选择自己`
      );
    }

    if (body.menuStatus === STATUS_NO) {
      const hasStatus =
        await this.sysMenuService.existChildrenByMenuIdAndStatus(
          body.id,
          STATUS_YES
        );
      if (hasStatus > 0) {
        return Resp.errMsg(`不允许禁用，存在使用子菜单数：${hasStatus}`);
      }
    }

    menuInfo.parentId = body.parentId;
    menuInfo.menuName = body.menuName;
    menuInfo.menuType = body.menuType;
    menuInfo.menuSort = body.menuSort;
    menuInfo.menuPath = body.menuPath;
    menuInfo.menuComponent = body.menuComponent;
    menuInfo.menuExternal = body.menuExternal;
    menuInfo.menuCache = body.menuCache;
    menuInfo.menuVisible = body.menuVisible;
    menuInfo.menuStatus = body.menuStatus;
    menuInfo.menuPerms = body.menuPerms;
    menuInfo.menuIcon = body.menuIcon;
    menuInfo.remark = body.remark;
    menuInfo.updateBy = loginUserToUserName(this.c);
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
    @Valid(Joi.number()) @Param('id') menuId: number
  ): Promise<Resp> {
    if (menuId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }

    const menu = await this.sysMenuService.findById(menuId);
    if (menu.id !== menuId) {
      return Resp.errMsg('没有权限访问菜单数据');
    }
    const hasChild = await this.sysMenuService.existChildrenByMenuIdAndStatus(
      menuId,
      ''
    );
    if (hasChild > 0) {
      return Resp.errMsg(`不允许删除，存在子菜单数：${hasChild}`);
    }
    const existRole = await this.sysMenuService.existRoleByMenuId(menuId);
    if (existRole > 0) {
      return Resp.errMsg(`不允许删除，菜单已分配给角色数：${existRole}`);
    }
    const rows = await this.sysMenuService.deleteById(menuId);
    if (rows > 0) {
      return Resp.okMsg(`删除成功�{rows}`);
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
    if (query.menu_name) sysMenu.menuName = query.menu_name;
    if (query.menu_status) sysMenu.menuStatus = query.menu_status;

    let userId = loginUserToUserID(this.c);
    if (this.config.isSystemUser(userId)) {
      userId = 0;
    }
    const trees = await this.sysMenuService.buildTreeSelectByUserId(
      sysMenu,
      userId
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
    @Param('role_id') roleId: number,
    @Query() query: Record<string, string>
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }
    const sysMenu = new SysMenu();
    if (query.menu_name) sysMenu.menuName = query.menu_name;
    if (query.menu_status) sysMenu.menuStatus = query.menu_status;

    let userId = loginUserToUserID(this.c);
    if (this.config.isSystemUser(userId)) {
      userId = 0;
    }
    const menus = await this.sysMenuService.buildTreeSelectByUserId(
      sysMenu,
      userId
    );
    const checkedKeys = await this.sysMenuService.findByRoleId(roleId);
    return Resp.okData({
      menus,
      checked_keys: checkedKeys,
    });
  }

  private parseBody(body: Record<string, any>): SysMenu {
    const menu = new SysMenu();
    menu.id = Number(body?.id ?? 0) || 0;
    menu.parentId = Number(body?.parent_id ?? 0) || 0;
    menu.menuName = String(body?.menu_name ?? '');
    menu.menuSort = Number(body?.menu_sort ?? 0) || 0;
    menu.menuPath = String(body?.menu_path ?? '');
    menu.menuComponent = String(body?.menu_component ?? '');
    menu.menuPerms = String(body?.menu_perms ?? '');
    menu.menuIcon = String(body?.menu_icon ?? '');
    menu.menuExternal = String(body?.menu_external ?? '0');
    menu.menuCache = String(body?.menu_cache ?? '1');
    menu.menuType = String(body?.menu_type ?? '');
    menu.menuVisible = String(body?.menu_visible ?? '1');
    menu.menuStatus = String(body?.menu_status ?? '1');
    menu.remark = String(body?.remark ?? '');
    return menu;
  }
}