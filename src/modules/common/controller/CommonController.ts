import { Body, ContentType, Controller, Files, Inject, Post } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../../common/enums/UploadSubPathEnum';
import { parseBoolean } from '../../../common/utils/ValueParseUtils';
import { Result } from '../../../framework/core/Result';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';

/**
 * 通用请求
 *
 * @author TsMask <340112800@qq.com>
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
  @Post("/download")
  @ContentType("application/octet-stream")
  async downloadFile(
    @Body("filePath") filePath: string,
    @Body("isDel") isDel: string
  ) {
    if (!filePath) return null;
    const fileStream = await this.fileService.download(filePath);
    // 是否删除
    const isDelete = parseBoolean(isDel);
    if (isDelete) {
      await this.fileService.delete(filePath);
    }
    // 返回 stream
    return fileStream;
  }

  /**
 * 通用上传
 */
  @Post("/upload")
  async uploadFile(@Files('file') files: UploadFileInfo<string>[]) {
    if (files.length <= 0) return Result.err();
    const domain = this.contextService.getContext().origin;
    const upFilePath = await this.fileService.upload(files[0], UploadSubPathEnum.COMMON);
    const upFileName = upFilePath.substring(upFilePath.lastIndexOf('/') + 1);
    await this.contextService.getContext().cleanupRequestFiles();
    return Result.ok({
      url: `${domain}${upFilePath}`,
      fileName: upFilePath,
      newFileName: upFileName,
      originalFilename: files[0].filename
    });
  }
}
