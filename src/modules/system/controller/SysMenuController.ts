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
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { validHttp } from '../../../framework/utils/RegularUtils';
import { Result } from '../../../framework/model/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysMenuServiceImpl } from '../service/impl/SysMenuServiceImpl';
import { SysMenu } from '../model/SysMenu';
import { STATUS_NO } from '../../../framework/constants/CommonConstants';

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
    return Result.okData(data || []);
  }

  /**
   * 菜单信息
   */
  @Get('/:menuId')
  @PreAuthorize({ hasPermissions: ['system:menu:query'] })
  async getInfo(@Param('menuId') menuId: string): Promise<Result> {
    if (!menuId) return Result.err();
    const data = await this.sysMenuService.selectMenuById(menuId);
    return Result.okData(data || {});
  }

  /**
   * 菜单新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:menu:add'] })
  @OperLog({ title: '菜单信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysMenu: SysMenu): Promise<Result> {
    // 检查名称唯一
    const uniqueNenuName = await this.sysMenuService.checkUniqueNenuName(
      sysMenu
    );
    if (!uniqueNenuName) {
      return Result.errMsg(
        `菜单新增【${sysMenu.menuName}】失败，菜单名称已存在`
      );
    }
    // 外链菜单需要符合网站http(s)开头
    if (sysMenu.isFrame === STATUS_NO && !validHttp(sysMenu.path)) {
      return Result.errMsg(
        `菜单新增【${sysMenu.menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }
    sysMenu.createBy = this.contextService.getUseName();
    const insertId = await this.sysMenuService.insertMenu(sysMenu);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 菜单修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:menu:edit'] })
  @OperLog({ title: '菜单信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async edit(@Body() sysMenu: SysMenu): Promise<Result> {
    // 检查名称唯一
    const uniqueNenuName = await this.sysMenuService.checkUniqueNenuName(
      sysMenu
    );
    if (!uniqueNenuName) {
      return Result.errMsg(
        `菜单修改【${sysMenu.menuName}】失败，菜单名称已存在`
      );
    }
    // 外链菜单需要符合网站http(s)开头
    if (sysMenu.isFrame === STATUS_NO && !validHttp(sysMenu.path)) {
      return Result.errMsg(
        `菜单修改【${sysMenu.menuName}】失败，非内部地址必须以http(s)://开头`
      );
    }
    // 上级菜单不能选自己
    if (sysMenu.menuId === sysMenu.parentId) {
      return Result.errMsg(
        `菜单修改【${sysMenu.menuName}】失败，上级菜单不能选择自己`
      );
    }
    sysMenu.updateBy = this.contextService.getUseName();
    const rows = await this.sysMenuService.updateMenu(sysMenu);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 菜单删除
   */
  @Del('/:menuId')
  @PreAuthorize({ hasPermissions: ['system:menu:remove'] })
  @OperLog({ title: '菜单信息', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('menuId') menuId: string): Promise<Result> {
    if (!menuId) return Result.err();
    const hasChild = await this.sysMenuService.hasChildByMenuId(menuId);
    if (hasChild) {
      return Result.errMsg('存在子菜单,不允许删除');
    }
    const existRole = await this.sysMenuService.checkMenuExistRole(menuId);
    if (existRole) {
      return Result.errMsg('菜单已分配给角色,不允许删除');
    }
    const rows = await this.sysMenuService.deleteMenuById(menuId);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 菜单下拉树列表
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
    return Result.okData(trees);
  }

  /**
   * 菜单对应角色加载列表树
   */
  @Get('/roleMenuTreeSelect/:roleId')
  @PreAuthorize({ hasPermissions: ['system:menu:list'] })
  async roleMenuTreeSelect(@Param('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
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
    return Result.ok({
      menus: menuTreeSelect,
      checkedKeys,
    });
  }
}
