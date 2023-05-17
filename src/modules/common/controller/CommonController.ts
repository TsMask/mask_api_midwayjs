import { Body, Controller, Files, Inject, Post } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../../framework/enums/UploadSubPathEnum';
import { Result } from '../../../framework/model/Result';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';

/**
 * 通用请求
 *
 * @author TsMask
 */
@Controller('/common')
export class CommonController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  /**
   * 通用下载
   */
  @Post('/download')
  @PreAuthorize()
  async downloadFile(@Body('filePath') filePath: string) {
    const ctx = this.contextService.getContext();
    if (!filePath) {
      return Result.errMsg('未知文件资源路径');
    }
    const fileStream = await this.fileService.download(filePath);
    if (!fileStream) {
      return Result.errMsg('找不到文件资源');
    }
    // 返回 stream
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set(
      'Content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return fileStream;
  }

  /**
   * 通用上传
   */
  @Post('/upload')
  @PreAuthorize()
  async uploadFile(@Files('file') files: UploadFileInfo<string>[]) {
    if (files.length <= 0) return Result.err();
    const domain = this.contextService.getContext().origin;
    const upFilePath = await this.fileService.upload(
      files[0],
      UploadSubPathEnum.COMMON
    );
    const upFileName = upFilePath.substring(upFilePath.lastIndexOf('/') + 1);
    await this.contextService.getContext().cleanupRequestFiles();
    return Result.okData({
      url: `${domain}${upFilePath}`,
      fileName: upFilePath,
      newFileName: upFileName,
      originalFileName: files[0].filename,
    });
  }
}
