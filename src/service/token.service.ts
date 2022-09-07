import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { Provide, App } from '@midwayjs/decorator';
import { Application } from '@midwayjs/koa';
import { crypto_hmac } from '../utils/crypto.utils';
import { random_id } from '../utils/uid.utils';

// 身份授权签名
export interface TokenDTO {
  jti?: string; // 身份标识（用户ID）
  aud?: string; // 接收者（用户昵称）
  exp: number; // 过期时间
  nbf?: number; // 生效时间
  iss?: string; // 签发人
  token?: string; // 授权令牌
  roles?: string[]; // 角色列表
  permission?: string[]; // 权限列表
}

@Provide()
export class TokenService {
  @App()
  private app: Application;

  /**
   * 签名生成身份授权签名
   * @param jti 身份标识（用户ID）
   * @param aud 接收者（用户昵称）
   * @returns 签名信息 { token, exp, nbf }
   */
  public async sign(jti: string, aud: string): Promise<TokenDTO> {
    // 获取 token 配置
    const { algorithm, secret, exp, iss } = this.app.getConfig('token');
    // 签发时间（时间戳）
    const iat = new Date().getTime();

    // 签名头编码
    const header_base64 = Buffer.from(
      JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      }),
      'utf8'
    ).toString('base64');

    // 负荷编码
    const payload: TokenDTO = {
      exp: iat + parseInt(exp), // 过期时间
      nbf: iat, // 生效时间
      jti, // 登录用户ID
      aud, // 登录用户昵称
      iss, // 签发人
    };
    const payload_base64 = Buffer.from(
      JSON.stringify(payload),
      'utf8'
    ).toString('base64');

    // 负荷签名加密
    const signature = crypto_hmac(payload_base64, secret, algorithm);

    return {
      token: `${header_base64}.${payload_base64}.${random_id(6)}${signature}`, // JWT格式字符串
      exp: payload.exp, // 过期时间
      nbf: payload.nbf, // 生效时间
    };
  }

  /**
   * 验证身份授权签名
   * @param token 授权令牌
   * @returns 负荷信息 { exp, nbf, jti, aud, iss }
   */
  public async verify(token: string): Promise<TokenDTO> {
    if (token.length < 200) {
      this.app.getLogger().error('token verify len => %s', token);
      throw new UnauthorizedError('身份授权签名格式错误');
    }
    // 拆分
    const tokenArr = token.split('.');
    if (tokenArr.length !== 3) {
      this.app.getLogger().error('token verify split => %s', token);
      throw new UnauthorizedError('身份授权签名格式错误');
    }

    // 负荷内时间对比
    const now = new Date().getTime();
    const payload = JSON.parse(
      Buffer.from(tokenArr[1], 'base64').toString('utf8')
    );
    if (payload.nbf > now || payload.exp < now) {
      this.app.getLogger().error('token verify exp => %s', tokenArr[1]);
      throw new UnauthorizedError('身份授权签名已过期');
    }

    // 获取 token 配置
    const { algorithm, secret, iss } = this.app.getConfig('token');
    if (payload.iss !== iss) {
      this.app.getLogger().error('token verify error => %s', tokenArr[1]);
      throw new UnauthorizedError('身份授权签名存在异常');
    }

    // 负荷签名对比
    const signature = crypto_hmac(tokenArr[1], secret, algorithm);
    const signature_org = tokenArr[2].substring(6);
    if (signature !== signature_org) {
      this.app.getLogger().error('token verify error => %s', tokenArr[1]);
      throw new UnauthorizedError('身份授权签名存在异常');
    }
    return payload;
  }
}
