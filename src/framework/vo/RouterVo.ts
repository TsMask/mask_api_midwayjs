import { RouterMateVo } from './RouterMateVo';

/**
 * 路由配置信息
 *
 * @author TsMask
 */
export class RouterVo {
  /**
   * 路由名字 英文首字母大写
   */
  name: string;

  /**
   * 路由地址
   */
  path: string;

  /**
   * 其他元素
   */
  meta: RouterMateVo;

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