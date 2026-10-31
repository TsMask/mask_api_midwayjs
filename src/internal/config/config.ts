import { Provide, Singleton, App } from '@midwayjs/core';
import type { Application } from '@midwayjs/koa';

/**Config全局配置 */
@Provide()
@Singleton()
export class GlobalConfig {
  @App('koa')
  private app: Application;

  /**
   * 获取配置信息
   * @param key 配置项的key值
   * @returns 配置项的值
   */
  public get<T>(key: string): T {
    try {
      return this.app.getConfig(key) as T;
    } catch (e) {
      throw new Error(`获取配置信息异常, ${(e as Error).message}.`, {
        cause: e,
      });
    }
  }

  /**
   * 获取运行服务环境
   * local prod
   **/
  public getEnv(): string {
    return this.app.getEnv();
  }

  /**
   * 程序开始运行的时间
   * local prod
   **/
  public getRunTime(): Date {
    const runTime = this.app.getAttr<number>('runTime');
    return new Date(runTime);
  }

  /**
   * 用户是否为系统管理员
   * @param userId 用户ID
   * @returns boolen
   */
  public isSystemUser(userId: number): boolean {
    if (userId <= 0) return false;
    const configUser = this.get('systemUser');
    if (Array.isArray(configUser)) {
      return configUser.map(Number).includes(userId);
    }
    return false;
  }
}
