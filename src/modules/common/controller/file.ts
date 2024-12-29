import {
  Body,
  Controller,
  Fields,
  Files,
  Get,
  Inject,
  Param,
  Post,
} from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';
import { Resp } from '../../../framework/resp/api';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { UploadSubPathEnum } from '../../../framework/enums/UploadSubPathEnum';

/**
 * 文件操作处理
 */
@Controller('/file')
export class FileController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  /**
   * 下载文件
   */
  @Get('/download/:filePath')
  @PreAuthorize()
  async download(@Param('filePath') filePath: string) {
    if (!filePath) return Resp.errMsg('未知文件资源路径');
    filePath = Buffer.from(filePath, 'base64').toString('utf-8');
    const ctx = this.contextService.getContext();

    // 断点续传
    const headerRange = ctx.headers.range;
    const res = await this.fileService.readUploadFileStream(
      filePath,
      headerRange
    );
    if (!res.data) return Resp.errMsg('找不到文件资源');

    // 设置资源文件名称
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    ctx.set(
      'Content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    ctx.set('Accept-Ranges', 'bytes');
    ctx.set('Content-Type', 'application/octet-stream');

    if (headerRange) {
      ctx.set('Content-Range', res.range);
      ctx.set('Content-Length', `${res.chunkSize}`);
      ctx.status = 206;
    } else {
      ctx.set('Content-Length', `${res.fileSize}`);
      ctx.status = 200;
    }

    ctx.body = res.data;
  }

  /**
   * 上传文件
   */
  @Post('/upload')
  @PreAuthorize()
  async upload(
    @Files('file') files: UploadFileInfo<string>[],
    @Fields('subPath') subPath: UploadSubPathEnum
  ) {
    if (files.length <= 0) {
      return Resp.err();
    }

    // 子路径需要在指定范围内
    if (subPath && !Object.values(UploadSubPathEnum).includes(subPath)) {
      return Resp.errMsg('subPath不在指定范围内');
    }
    if (!subPath) {
      subPath = UploadSubPathEnum.COMMON;
    }

    const { origin, cleanupRequestFiles } = this.contextService.getContext();
    const upFilePath = await this.fileService.transferUploadFile(
      files[0],
      subPath,
      []
    );
    const upFileName = upFilePath.substring(upFilePath.lastIndexOf('/') + 1);
    await cleanupRequestFiles();
    return Resp.okData({
      url: `${origin}${upFilePath}`,
      fileName: upFilePath,
      newFileName: upFileName,
      originalFileName: files[0].filename,
    });
  }

  /**
   * 切片文件检查
   */
  @Post('/chunkCheck')
  @PreAuthorize()
  async chunkCheck(
    @Body('identifier') identifier: string,
    @Body('fileName') fileName: string
  ) {
    if (!identifier || !fileName) return Resp.err();

    const uploadedChunks = await this.fileService.chunkCheckFile(
      identifier,
      fileName
    );
    return Resp.okData(uploadedChunks);
  }

  /**
   * 切片文件合并
   */
  @Post('/chunkMerge')
  @PreAuthorize()
  async chunkMerge(
    @Body('identifier') identifier: string,
    @Body('fileName') fileName: string,
    @Body('subPath') subPath: UploadSubPathEnum
  ) {
    if (!identifier || !fileName) {
      return Resp.err();
    }

    // 子路径需要在指定范围内
    if (subPath && !Object.values(UploadSubPathEnum).includes(subPath)) {
      return Resp.errMsg('subPath不在指定范围内');
    }
    if (!subPath) {
      subPath = UploadSubPathEnum.COMMON;
    }

    const upFilePath = await this.fileService.chunkMergeFile(
      identifier,
      fileName,
      subPath
    );
    const { origin } = this.contextService.getContext();
    const upFileName = upFilePath.substring(upFilePath.lastIndexOf('/') + 1);
    return Resp.okData({
      url: `${origin}${upFilePath}`,
      fileName: upFilePath,
      newFileName: upFileName,
      originalFileName: fileName,
    });
  }

  /**
   * 切片文件上传
   */
  @Post('/chunkUpload')
  @PreAuthorize()
  async chunkUpload(
    @Files('file') files: UploadFileInfo<string>[],
    @Fields('index') index: string,
    @Fields('identifier') identifier: string
  ) {
    if (files.length <= 0 || !identifier) return Resp.err();

    const upFilePath = await this.fileService.transferChunkUploadFile(
      files[0],
      index,
      identifier
    );
    const ctx = this.contextService.getContext();
    await ctx.cleanupRequestFiles();
    ctx.status = 206;
    return Resp.okData(upFilePath);
  }
}
