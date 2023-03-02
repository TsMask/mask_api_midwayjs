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
}
