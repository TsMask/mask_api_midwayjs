import { MetaVo } from './MetaVo';

/**
 * 路由配置信息
 *
 * @author TsMask <340112800@qq.com>
 */
export class RouterVo {
  /**
   * 路由名字
   */
  name: string;

  /**
   * 路由地址
   */
  path: string;

  /**
   * 是否隐藏路由，当设置 true 的时候该路由不会再侧边栏出现
   */
  hidden: boolean;

  /**
   * 重定向地址，当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
   */
  redirect: string;

  /**
   * 组件地址
   */
  component: string;

  /**
   * 路由参数：如 {"id": 1, "key": "value"}
   */
  query: string;

  /**
   * 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
   */
  alwaysShow: boolean;

  /**
   * 其他元素
   */
  meta: MetaVo;

  /**
   * 子路由
   */
  children: RouterVo[];
}
