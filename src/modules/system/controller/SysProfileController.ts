import {
  Body,
  Controller,
  Files,
  Get,
  Inject,
  Post,
  Put,
} from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';
import { Result } from '../../../framework/vo/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { OperateLog } from '../../../framework/decorator/OperateLogMethodDecorator';
import { TokenService } from '../../../framework/service/TokenService';
import { bcryptCompare } from '../../../framework/utils/CryptoUtils';
import { FileService } from '../../../framework/service/FileService';
import { UploadSubPathEnum } from '../../../framework/enums/UploadSubPathEnum';
import { validEmail, validMobile } from '../../../framework/utils/RegularUtils';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysUser } from '../model/SysUser';

/**
 * 个人信息
 *
 * @author TsMask
 */
@Controller('/system/user/profile')
export class SysProfileController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private fileService: FileService;

  /**
   * 个人信息
   */
  @Get()
  @PreAuthorize()
  async profile(): Promise<Result> {
    const sysUser = this.contextService.getSysUser();
    delete sysUser.password;

    // 查询用户所属角色组
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.selectRoleListByUserId(
      sysUser.userId
    );
    for (const role of roles) {
      roleGroup.push(role.roleName);
    }
    const isAdmin = this.contextService.isAdmin(sysUser.userId);
    if (isAdmin) {
      roleGroup.push('管理员');
    }

    // 查询用户所属岗位组
    const postGroup: string[] = [];
    const posts = await this.sysPostService.selectPostListByUserId(
      sysUser.userId
    );
    for (const post of posts) {
      postGroup.push(post.postName);
    }

    return Result.okData({
      user: sysUser,
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
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async updateProfile(@Body() sysUser: SysUser): Promise<Result> {
    if (!sysUser.nickName || !sysUser.sex) {
      return Result.err();
    }

    // 登录用户信息
    const loginUser = this.contextService.getLoginUser();
    const userId = loginUser.userId;
    const userName = loginUser.user.userName;

    // 查询当前登录用户信息
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(
          sysUser.phonenumber,
          userId
        );
        if (!uniquePhone) {
          return Result.errMsg(`修改用户【${userName}】失败，手机号码已存在`);
        }
      } else {
        return Result.errMsg(`修改用户【${userName}】失败，手机号码格式错误`);
      }
    } else {
      sysUser.phonenumber = 'null';
    }

    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(
          sysUser.email,
          userId
        );
        if (!uniqueEmail) {
          return Result.errMsg(`修改用户【${userName}】失败，邮箱已存在`);
        }
      } else {
        return Result.errMsg(`修改用户【${userName}】失败，邮箱格式错误`);
      }
    } else {
      sysUser.email = 'null';
    }

    // 用户基本资料
    user.userId = userId;
    user.updateBy = userName;
    user.nickName = sysUser.nickName;
    user.phonenumber = sysUser.phonenumber;
    user.email = sysUser.email;
    user.sex = sysUser.sex;
    const rows = await this.sysUserService.updateUser(user);
    if (rows > 0) {
      // 更新缓存用户信息
      loginUser.user = await this.sysUserService.selectUserByUserName(userName);
      const isAdmin = this.contextService.isAdmin(userId);
      await this.tokenService.setLoginUser(loginUser, isAdmin);
      return Result.ok();
    }
    return Result.errMsg('修改个人信息异常');
  }

  /**
   * 个人重置密码
   */
  @Put('/updatePwd')
  @PreAuthorize()
  @OperateLog({
    title: '个人信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async updatePwd(
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string
  ): Promise<Result> {
    if (!oldPassword || !newPassword) return Result.err();

    // 登录用户信息
    const loginUser = this.contextService.getLoginUser();
    const userId = loginUser.userId;
    const userName = loginUser.user.userName;

    // 查询当前登录用户信息
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    // 检查匹配用户密码
    const oldCompare = await bcryptCompare(oldPassword, user.password);
    if (!oldCompare) {
      return Result.errMsg('修改密码失败，旧密码错误');
    }
    const newCompare = await bcryptCompare(newPassword, user.password);
    if (newCompare) {
      return Result.errMsg('新密码不能与旧密码相同');
    }

    // 用户修改新密码
    user.updateBy = userName;
    user.password = newPassword;
    const rows = await this.sysUserService.updateUser(user);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 个人头像上传
   */
  @Post('/avatar')
  @PreAuthorize()
  @OperateLog({
    title: '用户头像',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async avatar(
    @Files('file') files: UploadFileInfo<string>[]
  ): Promise<Result> {
    if (!files || files.length <= 0) return Result.err();
    // 上传文件得到资源地址后删除临时文件
    const filePath = await this.fileService.transferUploadFile(
      files[0],
      UploadSubPathEnum.AVATART,
      ['.jpg', '.jpeg', '.png']
    );
    await this.contextService.getContext().cleanupRequestFiles();

    // 登录用户信息
    const loginUser = this.contextService.getLoginUser();
    const userId = loginUser.userId;
    const userName = loginUser.user.userName;

    // 查询当前登录用户信息
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    // 更新用户头像
    user.updateBy = userName;
    user.avatar = filePath;
    const rows = await this.sysUserService.updateUser(user);
    if (rows > 0) {
      // 更新缓存用户信息
      loginUser.user = await this.sysUserService.selectUserByUserName(userName);
      const isAdmin = this.contextService.isAdmin(loginUser.userId);
      await this.tokenService.setLoginUser(loginUser, isAdmin);
      return Result.okData(filePath);
    }
    return Result.errMsg('上传图片异常');
  }
}
