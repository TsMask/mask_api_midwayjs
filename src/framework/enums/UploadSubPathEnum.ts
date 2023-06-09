/**
 * 文件上传-子路径类型枚举
 *
 * @author TsMask
 */
export enum UploadSubPathEnum {
  /**默认 */
  DEFAULT = 'default',

  /**头像 */
  AVATART = 'avatar',

  /**导入 */
  IMPORT = 'import',

  /**导出 */
  EXPORT = 'export',

  /**通用上传 */
  COMMON = 'common',

  /**下载 */
  DOWNLOAD = 'download',

  /**切片 */
  CHUNK = 'chunk',
}
