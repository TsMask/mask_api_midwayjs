import { basename } from 'node:path';

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
import { UploadFileInfo, UploadMiddleware } from '@midwayjs/busboy';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  UPLOAD_COMMON,
  UPLOAD_SUB_PATH,
} from '../../../internal/shared/constants/upload_sub_path';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { FileUtil } from '../../../internal/shared/file/file';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';

/**文件操作 控制层处理 */
@Controller('/api/v1/files')
export class FileController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**下载文件 */
  @Get('/download/:file_path', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async download(
    @Valid(Joi.string().required()) @Param('file_path') filePath: string
  ) {
    if (filePath.length < 8) {
      this.c.status = 422;
      return Resp.codeMsg(
        CODE_PARAM_CHEACK,
        'bind err: filePath not is base64 string'
      );
    }
    // base64解析出地址
    const [routerPath, decodeErr] = this.decodeFilePath(filePath);
    if (decodeErr) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, decodeErr);
    }

    // 断点续传
    const headerRange = this.c.headers.range;
    let start = 0;
    let end = 0;
    let rangeErr = '';
    if (headerRange) {
      [start, end, rangeErr] = this.fileUtil.parseByteRange(headerRange);
      if (rangeErr) {
        this.c.status = 416;
        return Resp.codeMsg(CODE_PARAM_CHEACK, rangeErr);
      }
    }

    const [resultMap, errMsg] = await this.fileUtil.readUploadFileStream(
      routerPath,
      start,
      end
    );
    if (errMsg) {
      return Resp.errMsg(errMsg);
    }

    // 设置资源文件名称
    this.c.set('Accept-Ranges', 'bytes');
    this.c.set('Content-Type', 'application/octet-stream');
    this.c.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(basename(routerPath))}"`
    );

    if (headerRange) {
      this.c.set('Content-Range', resultMap.range);
      this.c.set('Content-Length', `${resultMap.chunkSize}`);
      this.c.status = 206;
    } else {
      this.c.set('Content-Length', `${resultMap.fileSize}`);
      this.c.status = 200;
    }

    this.c.body = resultMap.data;
  }

  /**上传文件 */
  @Post('/upload', {
    middleware: [AuthorizeUserMiddleware(), UploadMiddleware],
  })
  public async upload(
    @Files('file') files: UploadFileInfo[],
    @Fields('subPath') subPath: string
  ) {
    if (files.length !== 1) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: field file not upload');
    }
    const formFile = files[0];

    // 子路径需要在指定范围内
    const ok = UPLOAD_SUB_PATH[subPath];
    if (subPath && !ok) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: subPath not in range');
    }
    if (!subPath) {
      subPath = UPLOAD_COMMON;
    }

    const [uploadFilePath, err] = await this.fileUtil.transferUploadFile(
      formFile,
      subPath
    );
    if (err) {
      return Resp.errMsg(err);
    }

    await this.c.cleanupRequestFiles?.();
    return Resp.okData({
      url: `//${this.c.host}${uploadFilePath}`,
      file_path: uploadFilePath,
      file_name: basename(uploadFilePath),
      file_name_original: formFile.filename,
    });
  }

  /**切片文件检查 */
  @Post('/chunk-check', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async chunkCheck(
    /**唯一标识 */
    @Valid(Joi.string().required()) @Body('identifier') identifier: string,
    /**文件名 */
    @Valid(Joi.string().required()) @Body('file_name') fileName: string
  ) {
    // 读取标识目录
    const [chunks, err] = await this.fileUtil.chunkCheckFile(
      identifier,
      fileName
    );
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okData(chunks);
  }

  /**切片文件合并 */
  @Post('/chunk-merge', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async chunkMerge(
    /**唯一标识 */
    @Valid(Joi.string().required()) @Body('identifier') identifier: string,
    /**文件名 */
    @Valid(Joi.string().required()) @Body('file_name') fileName: string,
    /**子路径类型 */
    @Valid(Joi.string().allow('')) @Body('sub_path') subPath: string
  ) {
    // 子路径需要在指定范围内
    const ok = UPLOAD_SUB_PATH[subPath];
    if (subPath && !ok) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: subPath not in range');
    }
    if (!subPath) {
      subPath = UPLOAD_COMMON;
    }

    // 切片文件合并
    const [mergeFilePath, err] = await this.fileUtil.chunkMergeFile(
      identifier,
      fileName,
      subPath
    );
    if (err) {
      return Resp.errMsg(err);
    }

    return Resp.okData({
      url: `//${this.c.host}${mergeFilePath}`,
      file_path: mergeFilePath,
      file_name: basename(mergeFilePath),
      file_name_original: fileName,
    });
  }

  /**切片文件上传 */
  @Post('/chunk-upload', {
    middleware: [AuthorizeUserMiddleware(), UploadMiddleware],
  })
  public async chunkUpload(
    /**上传的文件 */
    @Files('file') files: UploadFileInfo[],
    /**切片文件序号 */
    @Fields('index') index: string,
    /**切片文件唯一标识 */
    @Fields('identifier') identifier: string
  ) {
    if (index === '' || identifier === '') {
      this.c.status = 422;
      return Resp.codeMsg(
        CODE_PARAM_CHEACK,
        'bind err: index and identifier must be set'
      );
    }
    // 上传的文件
    if (files.length !== 1) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: field file not upload');
    }
    const formFile = files[0];

    const [chunkFilePath, err] = await this.fileUtil.transferChunkUploadFile(
      formFile,
      index,
      identifier
    );
    if (err) {
      this.c.status = 200;
      return Resp.errMsg(err);
    }
    await this.c.cleanupRequestFiles?.();
    this.c.status = 206;
    return Resp.okData(chunkFilePath);
  }

  private decodeFilePath(value: string): [string, string] {
    const decodedBytes = Buffer.from(value, 'base64');
    const isValidBase64 =
      /^[A-Za-z0-9+/]+={0,2}$/.test(value) &&
      decodedBytes.toString('base64') === value;
    if (!isValidBase64) {
      return ['', 'decode err: filePath not is base64 string'];
    }

    const decodedPath = decodedBytes.toString('utf-8');
    if (decodedPath.length > 500) {
      return ['', 'file path too long'];
    }
    return [decodedPath, ''];
  }
}
