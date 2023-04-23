/**
 * 缓存信息
 *
 * @author TsMask
 */
export class SysCache {
  /**缓存名称 */
  cacheName: string;

  /**缓存键名 */
  cacheKey: string;

  /**缓存内容 */
  cacheValue: string;

  /**备注 */
  remark: string;

  /**
   * 实例new函数
   * @param cacheName 缓存名称
   * @param remark 备注
   */
  public newCacheNR(cacheName: string, remark: string) {
    this.cacheName = cacheName.replace(':', '');
    this.cacheKey = '';
    this.cacheValue = '';
    this.remark = remark;
    return this;
  }

  /**
   * 实例new函数
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   */
  public newCacheNK(cacheName: string, cacheKey: string) {
    this.cacheName = cacheName.replace(':', '');
    this.cacheKey = cacheKey.replace(cacheName, '');
    this.cacheValue = '';
    this.remark = '';
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
    this.remark = '';
    return this;
  }
}
