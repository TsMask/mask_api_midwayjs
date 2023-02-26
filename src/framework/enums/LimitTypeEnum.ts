/**
 * 限流-限流类型枚举
 *
 * @author TsMask
 */
export enum LimitTypeEnum {
  /**默认策略全局限流 */
  GLOBAL = 1,

  /**根据请求者IP进行限流 */
  IP = 2,

  /**根据用户ID进行限流 */
  USER = 3,
}
