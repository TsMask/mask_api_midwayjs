import { Config, Init, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import FlakeId = require('flake-idgen');

/**
 * 有序唯一分布式ID
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class FlakeIdgenService {
  @Config('flakeIdgen')
  private flakeIdgenConfig;

  private flakeIdGen;

  @Init()
  async init() {
    this.flakeIdGen = new FlakeId(this.flakeIdgenConfig);
  }

  /**
   * 生产ID
   * @return 字符串
   */
  async getString(): Promise<string> {
    const flakeId = await this.getBigUInt();
    return flakeId.toString();
  }

  /**
   * 生产ID
   * @return JS大整型
   */
  async getBigUInt(): Promise<bigint> {
    return await this.flakeIdGen.next().readBigUInt64BE();
  }
}
