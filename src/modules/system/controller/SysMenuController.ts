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
import { validHttp } from '../../../framework/utils/RegularUtils';
import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysMenuServiceImpl } from '../service/impl/SysMenuServiceImpl';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import {
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../framework/constants/menu';
import { SysMenu } from '../model/SysMenu';
import result from '../../../framework/result/result';

/**
 * 菜单信息
 *
 * @author TsMask
 */
@Controller('/system/menu')
export class SysMenuController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  /**
   * 菜单列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:menu:list'] })
  async list(@Query() sysMenu: SysMenu): Promise<Result> {
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);
    const data = await this.sysMenuService.selectMenuList(
      sysMenu,
      isAdmin ? null : userId
    );
    return result.okData(data || []);
  }

  /**
   * 菜单信息
   */
  @Get('/:menuId')
  @PreAuthorize({ hasPermissions: ['system:menu:query'] })
  async getInfo(@Param('menuId') menuId: string): Promise<Result> {
    if (!menuId) return result.err();
    const data = await this.sysMenuService.selectMenuById(menuId);
    return result.okData(data);
  }

  /**
   * 菜单新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:menu:add'] })
  @OperateLog({
    title: '菜单信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  async add(@Body() sysMenu: SysMenu): Promise<Result> {
    if (!sysMenu.menuName || !sysMenu.menuType) return result.err();
    // 目录和菜单检查地址唯一
    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(sysMenu.menuType)) {
      const uniqueNenuPath = await this.sysMenuService.checkUniqueNenuPath(
        sysMenu.path,
        sysMenu.parentId
      );
      if (!uniqueNenuPath) {
        return result.errMsg(
          `菜单新增【${sysMenu.menuName}】失败，菜单路由地址已存在`
        );
      }
    }

    // 检查名称唯一
    const uniqueNenuName = await this.sysMenuService.checkUniqueNenuName(
      sysMenu.menuName,
      sysMenu.parentId
    );
    if (!uniqueNenuName) {
      return result.errMsg(
        `菜单新增【${sysMenu.menuName}】失败，菜单名称已存在`
      );
    }

    // 外链菜单需要符合网站http(s)开头
    if (sysMenu.isFrame === STATUS_NO && !validHttp(sysMenu.path)) {
      return result.errMsg(
        `菜单新增【${sysMenu.menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }

    sysMenu.createBy = this.contextService.getUseName();
    const insertId = await this.sysMenuService.insertMenu(sysMenu);
    return result[insertId ? 'ok' : 'err']();
  }

  /**
   * 菜单修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:menu:edit'] })
  @OperateLog({
    title: '菜单信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  async edit(@Body() sysMenu: SysMenu): Promise<Result> {
    const { menuId, parentId, menuName, menuType } = sysMenu;
    if (!menuId || !parentId || !menuName || !menuType) return result.err();
    // 上级菜单不能选自己
    if (menuId === parentId) {
      return result.errMsg(`菜单修改【${menuName}】失败，上级菜单不能选择自己`);
    }
    // 检查数据是否存在
    const menu = await this.sysMenuService.selectMenuById(menuId);
    if (!menu) {
      return result.errMsg('没有权限访问菜单数据');
    }
    // 父级ID不为0是要检查
    if (parentId !== '0') {
      const menuParent = await this.sysMenuService.selectMenuById(parentId);
      if (!menuParent) {
        return result.errMsg('没有权限访问菜单数据');
      }
      // 禁用菜单时检查父菜单是否使用
      if (sysMenu.status === STATUS_YES && menuParent.status === STATUS_NO) {
        return result.errMsg('上级菜单未启用！');
      }
    }
    // 目录和菜单检查地址唯一
    if ([MENU_TYPE_DIR, MENU_TYPE_MENU].includes(menuType)) {
      const uniqueNenuPath = await this.sysMenuService.checkUniqueNenuPath(
        sysMenu.path,
        sysMenu.parentId,
        menuId
      );
      if (!uniqueNenuPath) {
        return result.errMsg(
          `菜单修改【${sysMenu.menuName}】失败，菜单路由地址已存在`
        );
      }
    }
    // 检查名称唯一
    const uniqueNenuName = await this.sysMenuService.checkUniqueNenuName(
      menuName,
      parentId,
      menuId
    );
    if (!uniqueNenuName) {
      return result.errMsg(`菜单修改【${menuName}】失败，菜单名称已存在`);
    }
    // 外链菜单需要符合网站http(s)开头
    if (sysMenu.isFrame === STATUS_NO && !validHttp(sysMenu.path)) {
      return result.errMsg(
        `菜单修改【${menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }
    // 禁用菜单时检查子菜单是否使用
    if (sysMenu.status === STATUS_NO) {
      const hasStatus = await this.sysMenuService.hasChildByMenuIdAndStatus(
        menuId,
        STATUS_YES
      );
      if (hasStatus > 0) {
        return result.errMsg(`不允许禁用，存在使用子菜单数：${hasStatus}`);
      }
    }
    sysMenu.updateBy = this.contextService.getUseName();
    const rows = await this.sysMenuService.updateMenu(sysMenu);
    return result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 菜单删除
   */
  @Del('/:menuId')
  @PreAuthorize({ hasPermissions: ['system:menu:remove'] })
  @OperateLog({
    title: '菜单信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  async remove(@Param('menuId') menuId: string): Promise<Result> {
    if (!menuId) return result.err();
    // 检查数据是否存在
    const menu = await this.sysMenuService.selectMenuById(menuId);
    if (!menu) {
      return result.errMsg('没有权限访问菜单数据！');
    }
    // 检查是否存在子菜单
    const hasChild = await this.sysMenuService.hasChildByMenuIdAndStatus(
      menuId,
      ''
    );
    if (hasChild > 0) {
      return result.errMsg(`不允许删除，存在子菜单数：${hasChild}`);
    }
    // 检查是否分配给角色
    const existRole = await this.sysMenuService.checkMenuExistRole(menuId);
    if (existRole > 0) {
      return result.errMsg(`不允许删除，菜单已分配给角色数：${existRole}`);
    }
    const rows = await this.sysMenuService.deleteMenuById(menuId);
    return result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 菜单树结构列表
   */
  @Get('/treeSelect')
  @PreAuthorize({ hasPermissions: ['system:menu:list'] })
  async treeSelect(@Query() sysMenu: SysMenu): Promise<Result> {
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);
    const trees = await this.sysMenuService.selectMenuTreeSelectByUserId(
      sysMenu,
      isAdmin ? null : userId
    );
    return result.okData(trees);
  }

  /**
   * 菜单树结构列表（指定角色）
   */
  @Get('/roleMenuTreeSelect/:roleId')
  @PreAuthorize({ hasPermissions: ['system:menu:list'] })
  async roleMenuTreeSelect(@Param('roleId') roleId: string): Promise<Result> {
    if (!roleId) return result.err();
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);
    const menuTreeSelect =
      await this.sysMenuService.selectMenuTreeSelectByUserId(
        new SysMenu(),
        isAdmin ? null : userId
      );
    const checkedKeys = await this.sysMenuService.selectMenuListByRoleId(
      roleId
    );
    return result.okData({
      menus: menuTreeSelect,
      checkedKeys,
    });
  }
}
