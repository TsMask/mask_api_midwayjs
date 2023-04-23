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
  cache?: boolean;

  /**
   * 内链地址（http(s)://开头）
   * 打开目标位置 '_blank' | '_self' | null | undefined
   */
  target?: string;

  /**
   * 在菜单中隐藏自己和子节点
   */
  hide?: boolean;

  /**
   * 菜单选项禁用
   */
  disabled?: boolean;
}
