/**缓存信息对象 */
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
   * 实例缓存名称列表项
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   */
  public newNames(cacheName: string, cacheKey: string) {
    this.cacheName = cacheKey;
    this.cacheKey = '';
    this.cacheValue = '';
    this.remark = cacheName;
    return this;
  }

  /**
   * 实例缓存键名列表项
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   */
  public newKeys(cacheName: string, cacheKey: string) {
    this.cacheName = cacheName;
    this.cacheKey = cacheKey.replace(cacheName + ':', '');
    this.cacheValue = '';
    this.remark = '';
    return this;
  }

  /**
   * 实例缓存键名内容项
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   * @param cacheValue 缓存内容
   */
  public newValue(cacheName: string, cacheKey: string, cacheValue: string) {
    this.cacheName = cacheName;
    this.cacheKey = cacheKey;
    this.cacheValue = cacheValue;
    this.remark = '';
    return this;
  }
}
