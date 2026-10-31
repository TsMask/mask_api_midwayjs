import { Body, Controller, Get, Inject, Put } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  validEmail,
  validMobile,
} from '../../../internal/shared/regular/regular';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import {
  CODE_AUTH_INVALID,
  CODE_PARAM_CHEACK,
} from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { passwordVerify } from '../../../internal/shared/crypto/password';
import { UserTokenService } from '../../../internal/web/token/user_token';
import { loginUser } from '../../../internal/web/reqctx/auth';
import { SysPostService } from '../service/sys_post';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';
import { SysUser } from '../model/sys_user';
import { serializeSysUser } from '../model/vo/response';

/**个人信息 控制层处理 */
@Controller('/api/v1/system/users/profile')
export class SysProfileController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**Token工具 */
  @Inject()
  private token: UserTokenService;

  /**用户服务 */
  @Inject()
  private sysUserService: SysUserService;

  /**角色服务 */
  @Inject()
  private sysRoleService: SysRoleService;

  /**岗位服务 */
  @Inject()
  private sysPostService: SysPostService;

  /**个人信息 */
  @Get('', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async info(): Promise<Resp> {
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }

    // 查询用户所属角色组
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.findByUserId(info.userId);
    for (const role of roles) {
      roleGroup.push(role.roleName);
    }

    // 查询用户所属岗位组
    const postGroup: string[] = [];
    const posts = await this.sysPostService.findByUserId(info.userId);
    for (const post of posts) {
      postGroup.push(post.postName);
    }

    return Resp.okData({
      user: serializeSysUser(info.user as SysUser),
      role_group: [...new Set(roleGroup)],
      post_group: [...new Set(postGroup)],
    });
  }

  /**个人信息修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware(),
      OperateLogMiddleware({
        title: '个人信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async updateProfile(
    @Valid(Joi.string().required()) @Body('user_nick') userNick: string,
    @Valid(Joi.string().pattern(/^[012]$/))
    @Body('user_gender')
    userGender: string,
    @Valid(Joi.string().allow('')) @Body('user_phone') userPhone: string,
    @Valid(Joi.string().allow('')) @Body('user_email') userEmail: string,
    @Valid(Joi.string().allow('')) @Body('user_avatar') userAvatar: string
  ): Promise<Resp> {
    if (userNick === '' || userGender === '') {
      this.c.status = 422;
      return Resp.codeMsg(
        CODE_PARAM_CHEACK,
        'bind err: user_nick or user_gender not is empty'
      );
    }

    // 登录用户信息
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }
    const userId = info.userId;

    // 检查手机号码格式并判断是否唯一
    if (userPhone !== '') {
      if (validMobile(userPhone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          userPhone,
          userId
        );
        if (!uniquePhone) {
          return Resp.errMsg('抱歉，手机号码已存在');
        }
      } else {
        return Resp.errMsg('抱歉，手机号码格式错误');
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (userEmail) {
      if (validEmail(userEmail)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          userEmail,
          userId
        );
        if (!uniqueEmail) {
          return Resp.errMsg('抱歉，邮箱已存在');
        }
      } else {
        return Resp.errMsg('抱歉，邮箱格式错误');
      }
    }

    // 查询当前登录用户信息
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.id !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 用户基本资料
    userInfo.userNick = userNick;
    userInfo.userPhone = userPhone;
    userInfo.userEmail = userEmail;
    userInfo.userGender = userGender;
    userInfo.userAvatar = userAvatar;
    userInfo.userPassword = ''; // 密码不更�
    userInfo.updateBy = userInfo.userName;
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      // 更新缓存用户信息
      info.user = userInfo;
      // 更新信息
      await this.token.UserInfoUpdate(info);
      return Resp.ok();
    }
    return Resp.errMsg('修改个人信息异常');
  }

  /**个人重置密码 */
  @Put('/password', {
    middleware: [
      AuthorizeUserMiddleware(),
      OperateLogMiddleware({
        title: '个人信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async updatePassword(
    @Valid(Joi.string().required())
    @Body('old_password')
    oldPassword: string,
    @Valid(Joi.string().required())
    @Body('new_password')
    newPassword: string
  ): Promise<Resp> {
    if (!oldPassword || !newPassword) return Resp.err();

    // 登录用户信息
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }
    const userId = info.userId;

    // 查询当前登录用户信息得到密码值
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.id !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 检查匹配用户密码
    const oldCompare = await passwordVerify(oldPassword, userInfo.userPassword);
    if (!oldCompare) {
      return Resp.errMsg('修改密码失败，旧密码错误');
    }
    const newCompare = await passwordVerify(newPassword, userInfo.userPassword);
    if (newCompare) {
      return Resp.errMsg('新密码不能与旧密码相同');
    }

    // 修改新密码
    userInfo.userPassword = newPassword;
    userInfo.updateBy = userInfo.userName;
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }
}