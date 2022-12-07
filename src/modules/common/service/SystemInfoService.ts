import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';

/**
 * 服务器相关信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SystemInfoService {}
