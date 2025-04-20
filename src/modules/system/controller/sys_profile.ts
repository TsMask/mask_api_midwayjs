import { Body, Controller, Get, Inject, Put } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  validEmail,
  validMobile,
} from '../../../framework/utils/regular/regular';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { bcryptCompare } from '../../../framework/utils/crypto/bcrypt';
import { UserTokenService } from '../../../framework/token/user_token';
import { loginUser } from '../../../framework/reqctx/auth';
import { Resp } from '../../../framework/resp/api';
import { SysPostService } from '../service/sys_post';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';

/**个人信息 控制层处理 */
@Controller('/system/user/profile')
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
      return Resp.codeMsg(401002, err);
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
      user: info.user,
      roleGroup: [...new Set(roleGroup)],
      postGroup: [...new Set(postGroup)],
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
    @Valid(RuleType.string().required()) @Body('nickName') nickName: string,
    @Valid(RuleType.string().pattern(/^[012]$/)) @Body('sex') sex: string,
    @Valid(RuleType.string().allow('')) @Body('phone') phone: string,
    @Valid(RuleType.string().allow('')) @Body('email') email: string,
    @Valid(RuleType.string().allow('')) @Body('avatar') avatar: string
  ): Promise<Resp> {
    if (nickName === '' || sex === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: nickName or sex not is empty');
    }

    // 登录用户信息
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(401002, err);
    }
    const userId = info.userId;

    // 检查手机号码格式并判断是否唯一
    if (phone !== '') {
      if (validMobile(phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          phone,
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
    if (email) {
      if (validEmail(email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          email,
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
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 用户基本资料
    userInfo.nickName = nickName;
    userInfo.phone = phone;
    userInfo.email = email;
    userInfo.sex = sex;
    userInfo.avatar = avatar;
    userInfo.password = ''; // 密码不更新
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
    @Valid(RuleType.string().required())
    @Body('oldPassword')
    oldPassword: string,
    @Valid(RuleType.string().required())
    @Body('newPassword')
    newPassword: string
  ): Promise<Resp> {
    if (!oldPassword || !newPassword) return Resp.err();

    // 登录用户信息
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(401002, err);
    }
    const userId = info.userId;

    // 查询当前登录用户信息得到密码值
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 检查匹配用户密码
    const oldCompare = await bcryptCompare(oldPassword, userInfo.password);
    if (!oldCompare) {
      return Resp.errMsg('修改密码失败，旧密码错误');
    }
    const newCompare = await bcryptCompare(newPassword, userInfo.password);
    if (newCompare) {
      return Resp.errMsg('新密码不能与旧密码相同');
    }

    // 修改新密码
    userInfo.password = newPassword;
    userInfo.updateBy = userInfo.userName;
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }
}
