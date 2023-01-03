import { validHttp } from '../../../../framework/utils/RegularUtils';

/**
 * 路由显示信息
 *
 * @author TsMask <340112800@qq.com>
 */
export class MetaVo {
  /**
   * 设置该路由在侧边栏和面包屑中展示的名字
   */
  title: string;

  /**
   * 设置该路由的图标，对应路径src/assets/icons/svg
   */
  icon: string;

  /**
   * 设置为true，则不会被 <keep-alive>缓存
   */
  noCache: boolean;

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
