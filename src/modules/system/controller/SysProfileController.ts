import {
  Body,
  Controller,
  Files,
  Get,
  Inject,
  Post,
  Put,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/vo/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { TokenService } from '../../../framework/service/TokenService';
import { bcryptCompare } from '../../../framework/utils/CryptoUtils';
import { FileService } from '../../../framework/service/FileService';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../../framework/enums/UploadSubPathEnum';
import { SysUser } from '../model/SysUser';
import { validEmail, validMobile } from '../../../framework/utils/RegularUtils';

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
      sysUser.userId
    );
    return Result.okData({
      user: sysUser,
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
    if (!sysUser.nickName || !sysUser.sex) return Result.err();
    const loginUser = this.contextService.getLoginUser();
    const userName = loginUser.user.userName;
    const userId = loginUser.userId;
    sysUser.userId = userId;
    sysUser.userName = userName;

    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(
          sysUser.phonenumber,
          userId
        );
        if (!uniquePhone) {
          return Result.errMsg(
            `修改用户【${sysUser.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Result.errMsg(
          `修改用户【${sysUser.userName}】失败，手机号码格式错误`
        );
      }
    }
    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(
          sysUser.email,
          userId
        );
        if (!uniqueEmail) {
          return Result.errMsg(
            `修改用户【${sysUser.userName}】失败，邮箱已存在`
          );
        }
      } else {
        return Result.errMsg(
          `修改用户【${sysUser.userName}】失败，邮箱格式错误`
        );
      }
    }

    // 用户基本资料
    const newSysUser = new SysUser();
    newSysUser.userId = userId;
    newSysUser.updateBy = userName;
    newSysUser.nickName = sysUser.nickName;
    newSysUser.phonenumber = sysUser.phonenumber;
    newSysUser.email = sysUser.email;
    newSysUser.sex = sysUser.sex;
    const rows = await this.sysUserService.updateUser(newSysUser);
    if (rows > 0) {
      const isAdmin = this.contextService.isAdmin(loginUser.userId);
      // 更新缓存用户信息
      const user = await this.sysUserService.selectUserByUserName(
        loginUser.user.userName
      );
      loginUser.user = user;
      await this.tokenService.setLoginUser(loginUser, isAdmin);
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
    // 更新用户头像
    const loginUser = this.contextService.getLoginUser();
    const newSysUser = new SysUser();
    newSysUser.userId = loginUser.userId;
    newSysUser.updateBy = loginUser.user.userName;
    newSysUser.avatar = filePath;
    const rows = await this.sysUserService.updateUser(newSysUser);
    if (rows > 0) {
      const isAdmin = this.contextService.isAdmin(loginUser.userId);
      // 更新缓存用户信息
      const user = await this.sysUserService.selectUserByUserName(
        loginUser.user.userName
      );
      loginUser.user = user;
      await this.tokenService.setLoginUser(loginUser, isAdmin);
      return Result.okData(filePath);
    }
    return Result.errMsg('上传图片异常，请联系管理员');
  }
}
