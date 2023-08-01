import { Inject, MidwayInformationService, Singleton } from '@midwayjs/core';
import { Config, Provide } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { posix } from 'path';
import { UploadSubPathEnum } from '../enums/UploadSubPathEnum';
import { parseDatePath } from '../utils/DateUtils';
import { readSheet, writeSheet } from '../utils/ExeclUtils';
import {
  getDirFileNameList,
  checkDirPathExists,
  deleteFile,
  getFileExt,
  getFileStream,
  getMimeTypeExt,
  transferToNewFile,
  mergeToNewFile,
  getFileSize,
} from '../utils/FileUtils';
import { generateHash } from '../utils/GenIdUtils';

/**最大文件名长度 */
const DEFAULT_FILE_NAME_LENGTH = 100;

/**
 * 文件服务
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class FileService {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  // 文件上传路径
  @Config('staticFile.dirs.upload')
  private resourceUpload: { prefix: string; dir: string };

  // 文件上传扩展名白名单
  @Config('upload.whitelist')
  private uploadWhiteList: string[];

  /**
   * 生成文件名称
   * @param fileName 原始文件名称含后缀，如：logo.png
   * @param mimeType 原始文件类型，如：image/png
   * @returns fileName_随机值.extName
   */
  private generateFileName(fileName: string, mimeType?: string): string {
    // 截取拓展
    let ext = getFileExt(fileName);
    if (!ext && mimeType) {
      ext = getMimeTypeExt(mimeType);
    }
    // 替换掉后缀和特殊字符保留文件名
    let newFileName = fileName.replace(ext, '');
    newFileName = newFileName.replace(/[<>:"\\|?*]+/g, '');
    return `${newFileName.trim()}_${generateHash(6)}${ext}`;
  }

  /**
   * 检查文件允许写入本地
   * @param fileName 原始文件名称含后缀，如：midway1_logo_iipc68.png
   * @param allowExts 允许上传拓展类型，['.png']
   * @param mimeType 原始文件类型，如：image/png
   * @returns 抛出异常
   */
  private isAllowWrite(
    fileName: string,
    allowExts: string[],
    mimeType?: string
  ) {
    // 判断上传文件名称长度
    if (fileName.length > DEFAULT_FILE_NAME_LENGTH) {
      throw new Error(`上传文件名称长度限制最长为 ${DEFAULT_FILE_NAME_LENGTH}`);
    }

    // 判断文件拓展是否为允许的拓展类型
    let fileExt = getFileExt(fileName);
    if (!fileExt && mimeType) {
      fileExt = getMimeTypeExt(mimeType);
    }
    if (Array.isArray(allowExts) && allowExts.length == 0) {
      allowExts = this.uploadWhiteList;
    }
    if (!allowExts.includes(fileExt)) {
      throw new Error(
        `上传文件类型不支持，仅支持以下类型：${allowExts.join('、')}`
      );
    }
  }

  /**
   * 检查文件允许本地读取
   * @param filePath 文件存放资源路径，URL相对地址
   * @returns true 正常 false 非法
   */
  private isAllowRead(filePath: string): boolean {
    // 禁止目录上跳级别
    if (filePath.includes('..')) return false;

    // 检查允许下载的文件规则
    const fileExt = getFileExt(filePath);
    if (this.uploadWhiteList.includes(fileExt)) {
      return true;
    }

    return false;
  }

  /**
   * 上传资源切片文件检查
   * @param identifier 切片文件目录标识符
   * @param originalFileName 原始文件名称，如logo.png
   * @returns 文件存放资源路径
   */
  async chunkCheckFile(
    identifier: string,
    originalFileName: string
  ): Promise<string[]> {
    this.isAllowWrite(originalFileName, []);
    const dirPath = posix.join(
      UploadSubPathEnum.CHUNK,
      parseDatePath(),
      identifier
    );
    const readPath = posix.join(this.resourceUpload.dir, dirPath);
    return await getDirFileNameList(readPath);
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
    subPath: string = UploadSubPathEnum.DEFAULT
  ): Promise<string> {
    this.isAllowWrite(originalFileName, []);
    // 切片存放目录
    const dirPath = posix.join(
      UploadSubPathEnum.CHUNK,
      parseDatePath(),
      identifier
    );
    const readPath = posix.join(this.resourceUpload.dir, dirPath);
    // 组合存放文件路径
    const fileName = this.generateFileName(originalFileName);
    const filePath = posix.join(subPath, parseDatePath());
    const writePath = posix.join(this.resourceUpload.dir, filePath);
    await mergeToNewFile(readPath, writePath, fileName);
    return posix.join(this.resourceUpload.prefix, filePath, fileName);
  }

  /**
   * 上传资源切片文件转存
   * @param file 上传文件对象
   * @param index 切片文件序号
   * @param identifier 切片文件目录标识符
   * @returns 文件存放资源路径，URL相对地址
   */
  async transferChunkUploadFile(
    file: UploadFileInfo<string>,
    index: string,
    identifier: string
  ): Promise<string> {
    const { filename, mimeType, data } = file;
    this.isAllowWrite(filename, [], mimeType);
    const filePath = posix.join(
      UploadSubPathEnum.CHUNK,
      parseDatePath(),
      identifier
    );
    const writePath = posix.join(this.resourceUpload.dir, filePath);
    await transferToNewFile(data, writePath, index);
    return posix.join(this.resourceUpload.prefix, filePath, index);
  }

  /**
   * 上传资源文件转存
   * @param file 上传文件对象
   * @param subPath 子路径，默认 UploadSubPathEnum.DEFAULT
   * @param allowExts 允许上传拓展类型（含“.”)，如 ['.png','.jpg']
   * @returns 文件存放资源路径，URL相对地址
   */
  async transferUploadFile(
    file: UploadFileInfo<string>,
    subPath: string = UploadSubPathEnum.DEFAULT,
    allowExts: string[] = []
  ): Promise<string> {
    const { filename, mimeType, data } = file;
    this.isAllowWrite(filename, allowExts, mimeType);
    const fileName = this.generateFileName(filename, mimeType);
    const filePath = posix.join(subPath, parseDatePath());
    const writePath = posix.join(this.resourceUpload.dir, filePath);
    await transferToNewFile(data, writePath, fileName);
    return posix.join(this.resourceUpload.prefix, filePath, fileName);
  }

  /**
   * 上传资源文件删除
   * @param filePath 文件存放资源路径，URL相对地址
   * @return true 删除正常 false 删除失败
   */
  async deleteUploadFile(filePath: string): Promise<boolean> {
    // 检查文件允许访问
    if (!this.isAllowRead(filePath)) {
      throw new Error(`文件 ${filePath} 非法，不允许删除。`);
    }
    const asbPath = filePath.replace(
      this.resourceUpload.prefix,
      this.resourceUpload.dir
    );
    return await deleteFile(asbPath);
  }

  /**
   * 上传资源文件读取
   * @param filePath 文件存放资源路径，URL相对地址 如：/upload/common/2023/06/xxx.png
   * @param headerRange 断点续传范围区间，bytes=0-12131
   * @return object { fileSize, data }
   */
  async readUploadFileStream(filePath: string, headerRange?: string) {
    // 检查文件允许访问
    if (!this.isAllowRead(filePath)) {
      throw new Error(`文件 ${filePath} 非法，不允许下载。`);
    }
    const fileAsbPath = filePath.replace(
      this.resourceUpload.prefix,
      this.resourceUpload.dir
    );

    // 响应结果
    let result = {
      range: '',
      chunkSize: 0,
      fileSize: 0,
      data: null,
    };

    // 文件大小
    const fileSize = await getFileSize(fileAsbPath);
    if (fileSize <= 0) {
      return result;
    }
    result.fileSize = fileSize;

    if (headerRange) {
      const parts = headerRange.replace(/bytes=/, '').split('-');
      let start = parseInt(parts[0], 10) || 0;
      start = Math.min(start, fileSize);
      let end = parseInt(parts[1], 10) || fileSize - 1;
      end = Math.min(end, fileSize - 1);
      if (start > end) {
        start = end;
      }
      // 分片结果
      result.range = `bytes ${start}-${end}/${fileSize}`;
      result.chunkSize = end - start + 1;
      result.data = await getFileStream(fileAsbPath, [start, end]);
      return result;
    }

    result.data = await getFileStream(fileAsbPath);
    return result;
  }

  /**
   * 内部文件读取
   * @param asserPath 内部文件相对地址，如：/template/excel/xxx.xlsx
   * @return 文件读取流
   */
  async readAssetsFileStream(asserPath: string) {
    // 检查文件允许访问
    if (!this.isAllowRead(asserPath)) {
      throw new Error(`内部文件 ${asserPath} 非法，不允许读取。`);
    }
    const absPath = posix.join(
      this.midwayInformationService.getBaseDir(),
      'assets',
      asserPath
    );
    return await getFileStream(absPath);
  }

  /**
   * 表格读取数据， 只读第一张工作表
   * @param file 上传文件对象
   * @param indexOrName 工作表，默认值：1，读取第一张工作表
   * @return 表格信息对象列表
   */
  async excelReadRecord(
    file: UploadFileInfo<string>,
    indexOrName: string | number = 1
  ): Promise<Record<string, string>[]> {
    const { data, filename, mimeType } = file;
    this.isAllowWrite(filename, ['.xls', '.xlsx'], mimeType);
    const savePath = posix.join(
      this.resourceUpload.dir,
      UploadSubPathEnum.IMPORT,
      parseDatePath()
    );
    await checkDirPathExists(savePath);
    return await readSheet(data, indexOrName, posix.join(savePath, filename));
  }

  /**
   * 表格写入数据并导出
   * @param filePath — 文件路径
   * @param sheetName 工作表名称
   * @param fileName 文件名 不含后缀
   * @return xlsx文件流
   */
  async excelWriteRecord(
    data: any[],
    sheetName: string = 'Sheet1',
    fileName?: string
  ) {
    if (fileName) {
      const savePath = posix.join(
        this.resourceUpload.dir,
        UploadSubPathEnum.EXPORT,
        parseDatePath()
      );
      await checkDirPathExists(savePath);
      const saveFilePath = posix.join(savePath, `${fileName}.xlsx`);
      return await writeSheet(data, sheetName, saveFilePath);
    }
    return await writeSheet(data, sheetName);
  }
}
