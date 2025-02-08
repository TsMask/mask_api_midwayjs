import { Body, Controller, Get, Inject, Put } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { validEmail, validMobile } from '../../../framework/utils/RegularUtils';
import { ContextService } from '../../../framework/reqctx/context';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { TokenService } from '../../../framework/utils/token/token';
import { bcryptCompare } from '../../../framework/utils/crypto/crypto';
import { SysPostService } from '../service/sys_post';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';
import { SysUser } from '../model/sys_user';

/**个人信息 控制层处理 */
@Controller('/system/user/profile')
export class SysProfileController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserService;

  @Inject()
  private sysRoleService: SysRoleService;

  @Inject()
  private sysPostService: SysPostService;

  @Inject()
  private tokenService: TokenService;

  /**
   * 个人信息
   */
  @Get()
  @PreAuthorize()
  public async info(): Promise<Resp> {
    const loginUser = this.contextService.getSysUser();
    delete loginUser.password;

    // 查询用户所属角色组
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.findByUserId(loginUser.userId);
    for (const role of roles) {
      roleGroup.push(role.roleName);
    }

    // 查询用户所属岗位组
    const postGroup: string[] = [];
    const posts = await this.sysPostService.findByUserId(loginUser.userId);
    for (const post of posts) {
      postGroup.push(post.postName);
    }

    return Resp.okData({
      user: loginUser,
      roleGroup: [...new Set(roleGroup)],
      postGroup: [...new Set(postGroup)],
    });
  }

  /**
   * 个人信息修改
   */
  @Put()
  @PreAuthorize()
  @OperateLog({
    title: '个人信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  async updateProfile(@Body() body: SysUser): Promise<Resp> {
    if (!body.nickName || !body.sex) {
      return Resp.codeMsg(40010, 'bind err: nickName or sex not is empty');
    }

    // 登录用户信息
    const loginUser = this.contextService.getLoginUser();
    const userId = loginUser.userId;

    // 检查手机号码格式并判断是否唯一
    if (body.phone) {
      if (validMobile(body.phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.phone,
          userId
        );
        if (!uniquePhone) {
          return Resp.codeMsg(40018, '抱歉，手机号码已存在');
        }
      } else {
        return Resp.codeMsg(40018, '抱歉，手机号码格式错误');
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (body.email) {
      if (validEmail(body.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.email,
          userId
        );
        if (!uniqueEmail) {
          return Resp.codeMsg(40019, '抱歉，邮箱已存在');
        }
      } else {
        return Resp.codeMsg(40019, '抱歉，邮箱格式错误');
      }
    }

    // 查询当前登录用户信息
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 用户基本资料
    userInfo.nickName = body.nickName;
    userInfo.phone = body.phone;
    userInfo.email = body.email;
    userInfo.sex = body.sex;
    userInfo.avatar = body.avatar;
    userInfo.password = ''; // 密码不更新
    userInfo.updateBy = userInfo.userName;
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      // 更新缓存用户信息
      loginUser.user = userInfo;
      // 刷新令牌信息
      await this.tokenService.cache(loginUser);
      return Resp.ok();
    }
    return Resp.errMsg('修改个人信息异常');
  }

  /**
   * 个人重置密码
   */
  @Put('/password')
  @PreAuthorize()
  @OperateLog({
    title: '个人信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async updatePassword(
    @Valid(RuleType.number().required())
    @Body('oldPassword')
    oldPassword: string,
    @Valid(RuleType.number().required())
    @Body('newPassword')
    newPassword: string
  ): Promise<Resp> {
    if (!oldPassword || !newPassword) return Resp.err();

    // 登录用户信息
    const loginUser = this.contextService.getLoginUser();
    const userId = loginUser.userId;

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
    userInfo.updateBy = userInfo.userName;
    userInfo.password = newPassword;
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }
}
