import { MetaVo } from './MetaVo';

/**
 * 路由配置信息
 *
 * @author TsMask
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
   * 路由参数：如 {"id": 1, "key": "value"}
   */
  query: string;

  /**
   * 其他元素
   */
  meta: MetaVo;

  /**
   * 组件地址
   */
  component: string;

  /**
   * 重定向地址
   */
  redirect: string;

  /**
   * 子路由
   */
  children: RouterVo[];

  /**
   * 是否隐藏路由，当设置 true 的时候该路由不会再侧边栏出现
   */
  hidden: boolean;

  /**
   * 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
   */
  alwaysShow: boolean;
}
