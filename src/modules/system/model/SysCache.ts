/**
 * 缓存信息
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysCache {
  /**缓存名称 */
  cacheName = '';

  /**缓存键名 */
  cacheKey = '';

  /**缓存内容 */
  cacheValue = '';

  /**备注 */
  remark = '';

  /**
   * 实例new函数
   * @param cacheName 缓存名称
   * @param remark 备注
   */
  public newCacheNR(cacheName: string, remark: string) {
    this.cacheName = cacheName;
    this.remark = remark;
    return this;
  }

  /**
   * 实例new函数
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   * @param cacheValue 缓存内容
   */
  public newCacheNKV(cacheName: string, cacheKey: string, cacheValue: string) {
    this.cacheName = cacheName.replace(':', '');
    this.cacheKey = cacheKey.replace(cacheName, '');
    this.cacheValue = cacheValue;
    return this;
  }
}
