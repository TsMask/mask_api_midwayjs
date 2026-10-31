/**缓存信息对象 */
export class SysCache {
  /**缓存名称 */
  cache_name: string;

  /**缓存键名 */
  cache_key: string;

  /**缓存内容 */
  cache_value: string;

  /**备注 */
  remark: string;

  /**
   * 实例缓存名称列表项
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   */
  public newNames(cacheName: string, cacheKey: string) {
    this.cache_name = cacheKey;
    this.cache_key = '';
    this.cache_value = '';
    this.remark = cacheName;
    return this;
  }

  /**
   * 实例缓存键名列表项
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   */
  public newKeys(cacheName: string, cacheKey: string) {
    this.cache_name = cacheName;
    this.cache_key = cacheKey.replace(cacheName + ':', '');
    this.cache_value = '';
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
    this.cache_name = cacheName;
    this.cache_key = cacheKey;
    this.cache_value = cacheValue;
    this.remark = '';
    return this;
  }
}
