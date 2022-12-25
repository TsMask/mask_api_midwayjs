import {
  Body,
  Controller,
  Files,
  Get,
  Inject,
  Post,
  Put,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { OperatorBusinessTypeEnum } from '../../../common/enums/OperatorBusinessTypeEnum';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { SysUser } from '../../../framework/core/model/SysUser';
import { TokenService } from '../../../framework/service/TokenService';
import { bcryptCompare } from '../../../common/utils/CryptoUtils';
import { FileService } from '../../../framework/service/FileService';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../../common/enums/UploadSubPathEnum';

/**
 * 个人信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/user/profile')
export class SysProfileController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

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
    const roleGroup = await this.sysUserService.selectUserRoleGroup(
      sysUser.userName
    );
    const postGroup = await this.sysUserService.selectUserPostGroup(
      sysUser.userName
    );
    return Result.ok({
      data: sysUser,
      roleGroup: roleGroup,
      postGroup: postGroup,
    });
  }

  /**
   * 个人信息修改
   */
  @Put()
  @PreAuthorize()
  @OperLog({ title: '个人信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async updateProfile(@Body() sysUser: SysUser): Promise<Result> {
    // 判断属性值是否唯一
    const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
    if (!uniquePhone) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，手机号码已存在`
      );
    }
    const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
    if (!uniqueEmail) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，邮箱账号已存在`
      );
    }
    const loginUser = this.contextService.getLoginUser();
    // 用户基本资料
    const newSysUser = new SysUser();
    newSysUser.userId = loginUser.userId;
    newSysUser.updateBy = loginUser.user.userName;
    newSysUser.nickName = sysUser.nickName;
    newSysUser.phonenumber = sysUser.phonenumber;
    newSysUser.email = sysUser.email;
    newSysUser.sex = sysUser.sex;
    const rows = await this.sysUserService.updateUser(newSysUser);
    if (rows > 0) {
      // 更新缓存用户信息
      const user = await this.sysUserService.selectUserByUserName(
        loginUser.user.userName
      );
      loginUser.user = user;
      await this.tokenService.setLoginUser(loginUser);
      return Result.ok();
    }
    return Result.errMsg('修改个人信息异常，请联系管理员');
  }

  /**
   * 个人重置密码
   */
  @Put('/updatePwd')
  @PreAuthorize()
  @OperLog({ title: '个人信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async updatePwd(
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string
  ): Promise<Result> {
    if (!oldPassword || !newPassword) return Result.err();
    const loginUser = this.contextService.getLoginUser();
    const user = await this.sysUserService.selectUserById(loginUser.userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    // 匹配用户密码
    const oldCompare = await bcryptCompare(oldPassword, user.password);
    if (!oldCompare) {
      return Result.errMsg('修改密码失败，旧密码错误');
    }
    const newCompare = await bcryptCompare(newPassword, user.password);
    if (newCompare) {
      return Result.errMsg('新密码不能与旧密码相同');
    }
    const newSysUser = new SysUser();
    newSysUser.userId = loginUser.userId;
    newSysUser.updateBy = loginUser.user.userName;
    newSysUser.password = newPassword;
    const rows = await this.sysUserService.updateUser(newSysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 个人头像上传
   */
  @Post('/avatar')
  @PreAuthorize()
  @OperLog({ title: '用户头像', businessType: OperatorBusinessTypeEnum.UPDATE })
  async avatar(
    @Files('avatarfile') files: UploadFileInfo<string>[]
  ): Promise<Result> {
    if (files.length <= 0) return Result.err();
    // 上传文件得到资源地址后删除临时文件
    const imgUrl = await this.fileService.upload(
      files[0],
      UploadSubPathEnum.AVATART,
      ['jpg', 'jpeg', 'png']
    );
    await this.contextService.getContext().cleanupRequestFiles();
    // 更新用户头像
    const loginUser = this.contextService.getLoginUser();
    const newSysUser = new SysUser();
    newSysUser.userId = loginUser.userId;
    newSysUser.updateBy = loginUser.user.userName;
    newSysUser.avatar = imgUrl;
    const rows = await this.sysUserService.updateUser(newSysUser);
    if (rows > 0) {
      // 更新缓存用户信息
      const user = await this.sysUserService.selectUserByUserName(
        loginUser.user.userName
      );
      loginUser.user = user;
      await this.tokenService.setLoginUser(loginUser);
      return Result.ok({ imgUrl });
    }
    return Result.errMsg('上传图片异常，请联系管理员');
  }
}
