import { validHttp } from '../../../../framework/utils/RegularUtils';

/**
 * 路由显示信息
 *
 * @author TsMask
 */
export class MetaVo {
  /**
   * 设置该菜单在侧边栏和面包屑中展示的名字
   */
  title: string;

  /**
   * 设置该菜单的图标
   */
  icon: string;

  /**
   * 设置为true，则不会被 <keep-alive>缓存
   */
  noCache?: boolean;

  /**
   * 内链地址（http(s)://开头）
   * 打开目标位置 '_blank' | '_self' | null | undefined
   */
  target?: string;

  /**
   * 在菜单中隐藏自己和子节点
   */
  hideInMenu?: boolean;

  /**
   * 在菜单中隐藏子节点
   */
  hideChildInMenu?: boolean;

  /**
   * 菜单选项禁用
   */
  disabled?: boolean;

  /**
   * 内链地址（http(s)://开头）
   */
  link: string;

  // ====== 函数 ======

  newTitleIcon(title: string, icon: string) {
    this.title = title;
    this.icon = icon;
    this.noCache = false;
    this.link = null;
    return this;
  }

  newTitleIconCache(title: string, icon: string, noCache: boolean) {
    this.title = title;
    this.icon = icon;
    this.noCache = noCache;
    this.link = null;
    return this;
  }

  newTitleIconLink(title: string, icon: string, link: string) {
    this.title = title;
    this.icon = icon;
    this.noCache = false;
    this.link = validHttp(link) ? link : null;
    return this;
  }

  newTitleIconCacheLike(
    title: string,
    icon: string,
    noCache: boolean,
    link: string
  ) {
    this.title = title;
    this.icon = icon;
    this.noCache = noCache;
    this.link = validHttp(link) ? link : null;
    return this;
  }
}
