import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../framework/constants/menu';
import {
  loginUserToUserID,
  loginUserToUserName,
} from '../../../framework/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { validHttp } from '../../../framework/utils/regular/regular';
import { GlobalConfig } from '../../../framework/config/config';
import { Resp } from '../../../framework/resp/api';
import { SysMenuService } from '../service/sys_menu';
import { SysMenu } from '../model/sys_menu';

/**菜单信息 控制层处理 */
@Controller('/system/menu')
export class SysMenuController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**菜单服务 */
  @Inject()
  private sysMenuService: SysMenuService;

  /**菜单列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:list'] })],
  })
  public async list(
    @Query('menuName') menuName: string,
    @Query('statusFlag') statusFlag: string
  ): Promise<Resp> {
    const sysMenu = new SysMenu();
    if (menuName) sysMenu.menuName = menuName;
    if (statusFlag) sysMenu.statusFlag = statusFlag;

    let userId = loginUserToUserID(this.c);
    if (this.config.isSystemUser(userId)) {
      userId = 0;
    }
    const data = await this.sysMenuService.find(sysMenu, userId);
    return Resp.okData(data || []);
  }

  /**菜单信息 */
  @Get('/:menuId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:query'] })],
  })
  public async info(
    @Valid(RuleType.number()) @Param('menuId') menuId: number
  ): Promise<Resp> {
    if (menuId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: menuId is empty');
    }
    const data = await this.sysMenuService.findById(menuId);
    if (data.menuId === menuId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**菜单新增 */
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
    if (body.menuId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: menuId not is empty');
    }

    // 目录和菜单检查地址唯一
    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menuType)) {
      const uniqueNenuPath =
        await this.sysMenuService.checkUniqueParentIdByMenuPath(
          body.parentId,
          body.menuPath,
          0
        );
      if (!uniqueNenuPath) {
        return Resp.errMsg(
          `菜单新增【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
    }

    // 检查名称唯一
    const uniqueNenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parentId,
        body.menuName,
        0
      );
    if (!uniqueNenuName) {
      return Resp.errMsg(`菜单新增【${body.menuName}】失败，菜单名称已存在`);
    }

    // 外链菜单需要符合网站http(s)开头
    if (body.frameFlag === STATUS_NO && !validHttp(body.menuPath)) {
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

  /**菜单修改 */
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
    if (body.menuId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: menuId is empty');
    }
    // 上级菜单不能选自己
    if (body.menuId === body.parentId) {
      return Resp.errMsg(
        `菜单修改【${body.menuName}】失败，上级菜单不能选择自己`
      );
    }
    // 检查数据是否存在
    const menuInfo = await this.sysMenuService.findById(body.menuId);
    if (menuInfo.menuId !== body.menuId) {
      return Resp.errMsg('没有权限访问菜单数据');
    }
    // 父级ID不为0是要检查
    if (body.parentId > 0) {
      const menuParent = await this.sysMenuService.findById(body.parentId);
      if (menuParent.menuId !== body.parentId) {
        return Resp.errMsg('没有权限访问菜单数据');
      }
      // 禁用菜单时检查父菜单是否使用
      if (
        body.statusFlag === STATUS_YES &&
        menuParent.statusFlag === STATUS_NO
      ) {
        return Resp.errMsg('上级菜单未启用！');
      }
    }
    // 目录和菜单检查地址唯一
    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(body.menuType)) {
      const uniqueNenuPath =
        await this.sysMenuService.checkUniqueParentIdByMenuPath(
          body.parentId,
          body.menuPath,
          body.menuId
        );
      if (!uniqueNenuPath) {
        return Resp.errMsg(
          `菜单修改【${body.menuName}】失败，菜单路由地址已存在`
        );
      }
    }
    // 检查名称唯一
    const uniqueNenuName =
      await this.sysMenuService.checkUniqueParentIdByMenuName(
        body.parentId,
        body.menuName,
        body.menuId
      );
    if (!uniqueNenuName) {
      return Resp.errMsg(`菜单修改【${body.menuName}】失败，菜单名称已存在`);
    }
    // 外链菜单需要符合网站http(s)开头
    if (body.frameFlag === STATUS_NO && !validHttp(body.menuPath)) {
      return Resp.errMsg(
        `菜单修改【${body.menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }
    // 禁用菜单时检查子菜单是否使用
    if (body.statusFlag === STATUS_NO) {
      const hasStatus =
        await this.sysMenuService.existChildrenByMenuIdAndStatus(
          body.menuId,
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
    menuInfo.component = body.component;
    menuInfo.frameFlag = body.frameFlag;
    menuInfo.cacheFlag = body.cacheFlag;
    menuInfo.visibleFlag = body.visibleFlag;
    menuInfo.statusFlag = body.statusFlag;
    menuInfo.perms = body.perms;
    menuInfo.icon = body.icon;
    menuInfo.remark = body.remark;
    menuInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysMenuService.update(menuInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**菜单删除 */
  @Del('/:menuId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:menu:remove'] }),
      OperateLogMiddleware({
        title: '菜单信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.number()) @Param('menuId') menuId: number
  ): Promise<Resp> {
    if (menuId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: menuId is empty');
    }

    // 检查数据是否存在
    const menu = await this.sysMenuService.findById(menuId);
    if (!menu) {
      return Resp.errMsg('没有权限访问菜单数据！');
    }
    // 检查是否存在子菜单
    const hasChild = await this.sysMenuService.existChildrenByMenuIdAndStatus(
      menuId,
      ''
    );
    if (hasChild > 0) {
      return Resp.errMsg(`不允许删除，存在子菜单数：${hasChild}`);
    }
    // 检查是否分配给角色
    const existRole = await this.sysMenuService.existRoleByMenuId(menuId);
    if (existRole > 0) {
      return Resp.errMsg(`不允许删除，菜单已分配给角色数：${existRole}`);
    }
    const rows = await this.sysMenuService.deleteById(menuId);
    if (rows > 0) {
      return Resp.okData(`删除成功：${rows}`);
    }
    return Resp.err();
  }

  /**菜单树结构列表 */
  @Get('/tree', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:list'] })],
  })
  public async tree(
    @Query('menuName') menuName: string,
    @Query('statusFlag') statusFlag: string
  ): Promise<Resp> {
    const sysMenu = new SysMenu();
    if (menuName) sysMenu.menuName = menuName;
    if (statusFlag) sysMenu.statusFlag = statusFlag;

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

  /**菜单树结构列表（指定角色） */
  @Get('/tree/role/:roleId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:menu:list'] })],
  })
  public async treeRole(
    @Param('roleId') roleId: number,
    @Query('menuName') menuName: string,
    @Query('statusFlag') statusFlag: string
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
    }
    const sysMenu = new SysMenu();
    if (menuName) sysMenu.menuName = menuName;
    if (statusFlag) sysMenu.statusFlag = statusFlag;

    let userId = loginUserToUserID(this.c);
    if (this.config.isSystemUser(userId)) {
      userId = 0;
    }
    const menuTreeSelect = await this.sysMenuService.buildTreeSelectByUserId(
      sysMenu,
      userId
    );
    const checkedKeys = await this.sysMenuService.findByRoleId(roleId);
    return Resp.okData({
      menus: menuTreeSelect,
      checkedKeys: checkedKeys,
    });
  }
}
