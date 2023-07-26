/**
 * 服务器系统相关信息 服务层接口
 *
 * @author TsMask
 */
export interface ISystemInfoService {
  /**
   * 获取程序项目信息
   * @returns 程序项目信息对象
   */
  getProjectInfo(): ProjectInfoType;

  /**
   * 获取系统信息
   * @returns 系统信息对象
   */
  getSystemInfo(): SystemInfoType;

  /**
   * 获取系统时间信息
   * @returns 系统时间信息对象
   */
  getTimeInfo(): TimeInfoType;

  /**
   * 获取内存信息
   * @returns 内存信息对象
   */
  getMemoryInfo(): MemoryInfoType;

  /**
   * 获取CPU信息
   * @returns CPU信息对象
   */
  getCPUInfo(): CPUInfoType;

  /**
   * 获取网络信息
   * @returns 网络信息对象
   */
  getNetworkInfo(): Record<string, any>;

  /**
   * 获取磁盘信息
   * @returns 磁盘信息列表
   */
  getDiskInfo(): Promise<DiskInfoType[]>;
}
