import {
  normalize,
  join,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { readFile } from 'node:fs/promises';

import { Inject, Provide, Singleton } from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/busboy';

import {
  getDirFileNameList,
  deleteFile,
  getFileStream,
  transferToNewFile,
  mergeToNewFile,
  getFileSize,
  writeBufferFile,
} from './utils';
import {
  UPLOAD_CHUNK,
  UPLOAD_DEFAULT,
  UPLOAD_EXPORT,
  UPLOAD_IMPORT,
} from '../constants/upload_sub_path';
import { assetsPath } from './assets_path';
import { parseDatePath } from '../date/date';
import { readSheet, writeSheet } from './execl';
import { csvReadAll, encodeCsv } from './csv';
import { generateCode } from '../generate/generate';
import { GlobalConfig } from '../../config/config';

/**File文件工具验证处理*/
@Provide()
@Singleton()
export class FileUtil {
  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**
   * 生成文件名称
   * @param fileName 原始文件名称含后缀，如：logo.png
   * @returns fileName_随机值.extName
   */
  private generateFileName(fileName: string): string {
    const fileExt = extname(fileName);
    // Keep the generated value a single safe path segment, as Gin does.
    let newFileName = fileName.slice(0, fileName.length - fileExt.length);
    newFileName = newFileName.replace(/[\\/:*?"<>|\s]+/g, '_');
    newFileName = newFileName.replace(/^_+|_+$/g, '');
    if (!newFileName) {
      newFileName = 'file';
    }
    return `${newFileName}_${generateCode(6)}${fileExt}`;
  }

  private getUploadWhiteList(): string[] {
    return (this.config.get<string[]>('busboy.whitelist') ?? []).map(ext =>
      ext.toLowerCase()
    );
  }

  private getUploadFileSizeLimit(): number {
    const sizeBytes = Number(this.config.get<number>('busboy.limits.fileSize'));
    if (Number.isFinite(sizeBytes) && sizeBytes > 0) {
      return sizeBytes;
    }
    return 10 * 1024 * 1024;
  }

  private async isAllowedFileSize(
    filePath: string,
    limit: number
  ): Promise<string> {
    const fileSize = await getFileSize(filePath);
    if (fileSize > limit) {
      return `file size ${fileSize} bytes exceeds limit ${limit} bytes`;
    }
    return '';
  }

  private getUploadResourceDir(): { prefix: string; dir: string } {
    return this.config.get<{ prefix: string; dir: string }>(
      'staticFile.dirs.upload'
    );
  }

  private isPathInside(root: string, target: string): boolean {
    const relativePath = relative(resolve(root), resolve(target));
    return (
      !!relativePath &&
      !isAbsolute(relativePath) &&
      !relativePath.startsWith('..')
    );
  }

  private isSafePathSegment(value: string, label: string): string {
    if (
      !value ||
      value === '.' ||
      value === '..' ||
      value.includes('/') ||
      value.includes('\\')
    ) {
      return `invalid ${label}`;
    }
    return '';
  }

  private parseUploadAbsPath(filePath: string): [string, string] {
    const err = this.isAllowRead(filePath);
    if (err) {
      return ['', err];
    }

    const { prefix, dir } = this.getUploadResourceDir();
    if (!filePath.startsWith(`${prefix}/`)) {
      return ['', 'upload file path must start with the upload prefix'];
    }

    const relativePath = filePath.slice(prefix.length + 1);
    const absPath = resolve(dir, relativePath);
    if (!this.isPathInside(dir, absPath)) {
      return ['', 'upload file path escapes the upload directory'];
    }
    return [absPath, ''];
  }

  /**
   * 检查文件允许写入本地
   * @param fileName 原始文件名称含后缀，如：file_logo_xxw68.png
   * @param allowExts 允许上传拓展类型，['.png']
   * @returns 错误信息
   */
  private isAllowWrite(fileName: string, allowExts?: string[]): string {
    /**最大文件名长度 */
    const DEFAULT_FILE_NAME_LENGTH = 100;
    // 判断上传文件名称长度
    if (fileName.length > DEFAULT_FILE_NAME_LENGTH) {
      return `上传文件名称长度限制最长为 ${DEFAULT_FILE_NAME_LENGTH}`;
    }

    // 判断文件拓展是否为允许的拓展类型
    const fileExt = extname(fileName).toLowerCase();
    const effectiveExts = allowExts ?? this.getUploadWhiteList();
    if (
      effectiveExts.length > 0 &&
      !effectiveExts.some(ext => ext.toLowerCase() === fileExt)
    ) {
      return `unsupported file extension ${fileExt}`;
    }

    return '';
  }

  /**
   * 检查文件允许本地读取
   * @param filePath 文件存放资源路径，URL相对地址
   * @returns 错误信息
   */
  private isAllowRead(filePath: string): string {
    // 禁止目录上跳级别
    if (filePath.includes('..')) {
      return '禁止目录上跳级别';
    }
    const uploadWhiteList = this.getUploadWhiteList();
    // 检查允许下载的文件规则
    const fileExt = extname(filePath).toLowerCase();
    if (!uploadWhiteList.includes(fileExt)) {
      if (fileExt === '') {
        return '未知异常文件';
      }
      return `限定下载的文件规则：${fileExt}`;
    }
    return '';
  }

  public parseByteRange(headerRange: string): [number, number, string] {
    const match = /^bytes=(\d+)-(\d*)$/.exec(headerRange);
    if (!match) {
      return [0, 0, 'invalid range format'];
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : 0;
    if (end !== 0 && end < start) {
      return [0, 0, 'invalid range end'];
    }
    return [start, end, ''];
  }

  /**
   * 上传资源文件读取
   * @param filePath 文件存放资源路径，URL相对地址 如：/upload/common/2023/06/xxx.png
   * @param headerRange 断点续传范围区间，bytes=0-12131
   * @return 结果 { fileSize, data, range, chunkSize }
   */
  public async readUploadFileStream(
    filePath: string,
    startOffset = 0,
    endOffset = 0
  ): Promise<[Record<string, any>, string]> {
    // 检查文件允许访问
    const err = this.isAllowRead(filePath);
    if (err) {
      return [{}, err];
    }
    // 上传资源路径
    const [fileAsbPath, pathErr] = this.parseUploadAbsPath(filePath);
    if (pathErr) {
      return [{}, pathErr];
    }

    // 响应结果
    const result = {
      range: '',
      chunkSize: 0,
      fileSize: 0,
      data: null as Buffer | null,
    };

    // 文件大小
    const fileSize = await getFileSize(fileAsbPath);
    if (fileSize <= 0) {
      return [{}, '文件不存在'];
    }
    result.fileSize = fileSize;

    let start = Math.max(startOffset, 0);
    const end =
      endOffset <= 0 || endOffset >= fileSize ? fileSize - 1 : endOffset;
    if (start > end) {
      start = end;
    }

    result.range = `bytes ${start}-${end}/${fileSize}`;
    result.chunkSize = end - start + 1;
    const [byteArr, errMsg] = await getFileStream(fileAsbPath, start, end);
    if (errMsg) {
      return [{}, errMsg];
    }
    result.data = byteArr;
    return [result, ''];
  }

  /**
   * 上传资源文件转存
   * @param file 上传文件对象
   * @param subPath 子路径
   * @param allowExts 允许上传拓展类型（含“.”)，如 ['.png','.jpg']
   * @returns [文件存放资源路径，URL相对地址, 错误信息]
   */
  public async transferUploadFile(
    file: UploadFileInfo,
    subPath: string,
    allowExts?: string[]
  ): Promise<[string, string]> {
    // 上传文件检查
    const err = this.isAllowWrite(file.filename, allowExts);
    if (err) {
      return ['', err];
    }
    // 上传资源路径
    const subPathErr = this.isSafePathSegment(subPath, 'sub path');
    if (subPathErr) {
      return ['', subPathErr];
    }
    const sizeErr = await this.isAllowedFileSize(
      file.data,
      this.getUploadFileSizeLimit()
    );
    if (sizeErr) {
      return ['', sizeErr];
    }

    const { prefix, dir } = this.getUploadResourceDir();
    // 新文件名称并组装文件地址
    const fileName = this.generateFileName(file.filename);
    const fileDir = normalize(join(subPath, parseDatePath()));
    const writeFilePath = normalize(join(dir, fileDir));
    if (!this.isPathInside(dir, writeFilePath)) {
      return ['', 'upload path escapes the upload directory'];
    }
    // 存入新文件路径
    const errMsg = await transferToNewFile(file.data, writeFilePath, fileName);
    if (errMsg) {
      return ['', errMsg];
    }
    const upPath = normalize(join(prefix, fileDir, fileName));
    return [upPath.replace(/\\/g, '/'), ''];
  }

  /**
   * 上传资源切片文件检查
   * @param identifier 切片文件目录标识符
   * @param originalFileName 原始文件名称，如logo.png
   * @returns [文件列表, 错误信息]
   */
  async chunkCheckFile(
    identifier: string,
    originalFileName: string
  ): Promise<[string[], string]> {
    const err = this.isAllowWrite(originalFileName);
    if (err) {
      return [[], err];
    }
    const identifierErr = this.isSafePathSegment(identifier, 'identifier');
    if (identifierErr) {
      return [[], identifierErr];
    }
    const uploadDir = this.config.get<string>('staticFile.dirs.upload.dir');
    const dirPath = normalize(join(UPLOAD_CHUNK, parseDatePath(), identifier));
    const readPath = normalize(join(uploadDir, dirPath));
    const fileNameList = await getDirFileNameList(readPath);
    return [fileNameList, ''];
  }

  /**
   * 上传资源切片文件合并
   * @param identifier 切片文件目录标识符
   * @param originalFileName 原始文件名称，如logo.png
   * @param subPath 子路径，默认 UploadSubPathEnum.DEFAULT
   * @returns 文件存放资源路径
   */
  async chunkMergeFile(
    identifier: string,
    originalFileName: string,
    subPath: string = UPLOAD_DEFAULT
  ): Promise<[string, string]> {
    const err = this.isAllowWrite(originalFileName);
    if (err) {
      return ['', err];
    }
    const identifierErr = this.isSafePathSegment(identifier, 'identifier');
    if (identifierErr) {
      return ['', identifierErr];
    }
    const subPathErr = this.isSafePathSegment(subPath, 'sub path');
    if (subPathErr) {
      return ['', subPathErr];
    }
    // 上传资源路径
    const { prefix, dir } = this.getUploadResourceDir();
    // 切片存放目录
    const dirPath = normalize(join(UPLOAD_CHUNK, parseDatePath(), identifier));
    const readPath = normalize(join(dir, dirPath));
    // 组合存放文件路径
    const fileName = this.generateFileName(originalFileName);
    const fileDir = normalize(join(subPath, parseDatePath()));
    const writePath = normalize(join(dir, fileDir));
    if (!this.isPathInside(dir, writePath)) {
      return ['', 'upload path escapes the upload directory'];
    }
    const errMsg = await mergeToNewFile(readPath, writePath, fileName);
    if (errMsg) {
      return ['', errMsg];
    }
    const upPath = normalize(join(prefix, fileDir, fileName));
    return [upPath.replace(/\\/g, '/'), ''];
  }

  /**
   * 上传资源切片文件转存
   * @param file 上传文件对象
   * @param index 切片文件序号
   * @param identifier 切片文件目录标识符
   * @returns 文件存放资源路径，URL相对地址
   */
  async transferChunkUploadFile(
    file: UploadFileInfo,
    index: string,
    identifier: string
  ): Promise<[string, string]> {
    const identifierErr = this.isSafePathSegment(identifier, 'identifier');
    if (identifierErr) {
      return ['', identifierErr];
    }
    const indexErr = this.isSafePathSegment(index, 'chunk index');
    if (indexErr) {
      return ['', indexErr];
    }
    if (!/^\d+$/.test(index)) {
      return ['', 'invalid chunk index'];
    }
    // 上传资源路径
    const { prefix, dir } = this.getUploadResourceDir();
    const fileDir = normalize(join(UPLOAD_CHUNK, parseDatePath(), identifier));
    const writePath = normalize(join(dir, fileDir));
    if (!this.isPathInside(dir, writePath)) {
      return ['', 'upload path escapes the upload directory'];
    }
    const errMsg = await transferToNewFile(file.data, writePath, index);
    if (errMsg) {
      return ['', errMsg];
    }
    const upPath = normalize(join(prefix, fileDir, index));
    return [upPath.replace(/\\/g, '/'), ''];
  }

  /**
   * 上传资源文件删除
   * @param filePath 文件存放资源路径，URL相对地址
   * @return 错误信息
   */
  async deleteUploadFile(filePath: string): Promise<string> {
    // 检查文件允许访问
    const err = this.isAllowRead(filePath);
    if (err) {
      return err;
    }
    // 上传资源路径
    const [asbPath, pathErr] = this.parseUploadAbsPath(filePath);
    if (pathErr) {
      return pathErr;
    }
    const ok = await deleteFile(asbPath);
    if (!ok) {
      return `文件 ${filePath} 删除失败。`;
    }
    return '';
  }

  /**
   * 内部文件读取 assets 目录
   * @param filePath 内部文件相对地址，如：/template/excel/xxx.xlsx
   * @return [文件读取流, 错误信息]
   */
  async readAssetsFileStream(filePath: string): Promise<[Buffer, string]> {
    // 检查文件允许访问
    const absPath = assetsPath(filePath);
    if (
      filePath.includes('..') ||
      !this.isPathInside(assetsPath(''), absPath)
    ) {
      return [Buffer.from(''), 'asset file path escapes the assets directory'];
    }
    return await getFileStream(absPath);
  }

  /**
   * 上传资源本地绝对资源路径
   * @param filePath 上传文件路径
   * @return 绝对路径
   */
  public parseUploadFileAbsPath(filePath: string): string {
    // 上传资源路径
    const [absPath, err] = this.parseUploadAbsPath(filePath);
    return err ? '' : absPath;
  }

  /**
   * 表格读取数据， 只读第一张工作表
   * @param file 上传文件对象
   * @param sheetName 工作簿名称， 空字符默认Sheet1
   * @return 表格信息对象列表
   */
  async excelReadRecord(
    file: UploadFileInfo,
    sheetName: string
  ): Promise<[Record<string, string>[], string]> {
    const { data, filename } = file;
    let err = this.isAllowWrite(filename, ['.xls', '.xlsx']);
    if (err) {
      return [[], err];
    }
    // 保存上传文件
    const uploadDir = this.config.get<string>('staticFile.dirs.upload.dir');
    const fileDir = normalize(join(uploadDir, UPLOAD_IMPORT, parseDatePath()));
    const fileName = this.generateFileName(filename);
    err = await transferToNewFile(file.data, fileDir, fileName);
    if (err) {
      return [[], err];
    }
    // 读取数据
    return await readSheet(data, sheetName);
  }

  /**
   * 表格写入数据并导出
   * @param data 写入数据
   * @param fileName 文件名 xxx_export_2424_1690964011598.xlsx
   * @param sheetName 工作表名称 默认Sheet1
   * @return xlsx文件流
   */
  async excelWriteRecord(data: any[], fileName?: string, sheetName = 'Sheet1') {
    const sheetBuffer = await writeSheet(data, sheetName);
    // 上传资源路径
    const uploadDir = this.config.get<string>('staticFile.dirs.upload.dir');
    // 保存文件
    if (fileName) {
      const fileDir = normalize(
        join(uploadDir, UPLOAD_EXPORT, parseDatePath())
      );
      await writeBufferFile(Buffer.from(sheetBuffer), fileDir, fileName);
    }

    return sheetBuffer;
  }

  /**
   * 写入 CSV 数据并导出，兼容 Go encoding/csv 的基础转义行为。
   * @param data CSV 行数据，第一行为表头
   * @param fileName 文件名 xxx_export_2424_1690964011598.csv
   * @return CSV 文件流
   */
  async csvWriteRecord(data: string[][], fileName?: string) {
    const csvBuffer = encodeCsv(data);
    if (fileName) {
      const uploadDir = this.config.get<string>('staticFile.dirs.upload.dir');
      const fileDir = normalize(
        join(uploadDir, UPLOAD_EXPORT, parseDatePath())
      );
      await writeBufferFile(csvBuffer, fileDir, fileName);
    }
    return csvBuffer;
  }

  /**
   * 流式读取项目内允许访问的 CSV 文件。
   * @return [行数据，错误信息]
   */
  async csvReadFile(
    filePath: string
  ): Promise<[Record<string, string>[], string]> {
    try {
      const content = await readFile(filePath, 'utf8');
      return [csvReadAll(content), ''];
    } catch (error: any) {
      return [[], error.message];
    }
  }
}
