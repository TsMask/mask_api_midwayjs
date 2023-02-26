import { Body, Controller, Files, Inject, Post } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../../framework/enums/UploadSubPathEnum';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
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
  async downloadFile(
    @Body('filePath') filePath: string,
    @Body('isDel') isDel: string
  ) {
    if (!filePath) return null;
    const fileStream = await this.fileService.download(filePath);
    // 是否删除
    const isDelete = parseBoolean(isDel);
    if (isDelete) {
      await this.fileService.delete(filePath);
    }
    // 返回 stream
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const ctx = this.contextService.getContext();
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-disposition', `attachment;filename=${fileName}`);
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
    return Result.ok({
      url: `${domain}${upFilePath}`,
      fileName: upFilePath,
      newFileName: upFileName,
      originalFilename: files[0].filename,
    });
  }
}
