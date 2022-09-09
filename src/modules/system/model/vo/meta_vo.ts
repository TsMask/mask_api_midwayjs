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
}
