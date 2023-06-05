import { Inject, MidwayInformationService, Singleton } from '@midwayjs/core';
import { Config, Provide } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { posix } from 'path';
import { UploadSubPathEnum } from '../enums/UploadSubPathEnum';
import { parseDatePath } from '../utils/DateUtils';
import { readSheet, writeSheet } from '../utils/ExeclUtils';
import {
  checkDirPathExists,
  deleteFile,
  getFileExt,
  getFileStream,
  getMimeTypeExt,
  transferToNewFile,
} from '../utils/FileUtils';
import { generateID } from '../utils/GenIdUtils';

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
   * 上传文件
   * @param file 上传文件对象
   * @param subPath 子路径 UploadSubPathEnum.DEFAULT
   * @param allowExts 允许上传拓展类型（不含“.”) DEFAULT_ALLOW_EXT
   * @returns 文件存放资源路径，URL相对地址
   */
  async upload(
    file: UploadFileInfo<string>,
    subPath: string = UploadSubPathEnum.DEFAULT,
    allowExts: string[] = this.uploadWhiteList
  ): Promise<string> {
    await this.isAllowUpload(file, allowExts);
    const fileName = this.generateFileName(file);
    const filePath = posix.join(subPath, parseDatePath());
    await transferToNewFile(
      file.data,
      posix.join(this.resourceUpload.dir, filePath),
      fileName
    );
    return posix.join(this.resourceUpload.prefix, filePath, fileName);
  }

  /**
   * 判断是否可以满足上传要求
   * @param file 上传文件对象
   * @param allowExts 允许上传拓展类型
   */
  private async isAllowUpload(
    file: UploadFileInfo<string>,
    allowExts: string[]
  ): Promise<void> {
    // 判断上传文件名称长度
    const fileName: string = file.filename || '';
    if (fileName.length > DEFAULT_FILE_NAME_LENGTH) {
      throw new Error(`上传文件名称长度限制最长为 ${DEFAULT_FILE_NAME_LENGTH}`);
    }

    // 判断文件拓展是否为允许的拓展类型
    let fileExt = getFileExt(file.filename);
    if (!fileExt) {
      fileExt = getMimeTypeExt(file.mimeType);
    }
    if (!allowExts.includes(fileExt)) {
      throw new Error(
        `上传文件类型不支持，仅支持以下类型：${allowExts.join('、')}`
      );
    }
  }

  /**
   * 生成文件名称
   * @param file 上传文件对象
   * @returns filename_xxxx.extName
   */
  private generateFileName(file: UploadFileInfo<string>): string {
    let ext = getFileExt(file.filename);
    if (!ext) {
      ext = getMimeTypeExt(file.mimeType);
    }
    // 替换掉后缀和特殊字符保留文件名
    let fileName = file.filename.replace(ext, '');
    fileName = fileName.replace(/[<>:"\\|?*]+/g, '');
    return `${fileName}_${generateID(6)}${ext}`;
  }

  /**
   * 检查文件允许访问
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
   * 资源文件下载
   * @param filePath 文件存放资源路径，URL相对地址
   * @return 文件读取流
   */
  async download(filePath: string) {
    // 检查文件允许访问
    if (!this.isAllowRead(filePath)) {
      throw new Error(`文件 ${filePath} 非法，不允许下载。`);
    }
    const asbPath = filePath.replace(
      this.resourceUpload.prefix,
      this.resourceUpload.dir
    );
    return await getFileStream(asbPath);
  }

  /**
   * 资源文件删除
   * @param filePath 文件存放资源路径，URL相对地址
   * @return true 删除正常 false 删除失败
   */
  async delete(filePath: string): Promise<boolean> {
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
   * 内部文件读取
   * @param asserPath 内部文件相对地址
   * @return 文件读取流
   */
  async readAssetsFile(asserPath: string) {
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
   * 读取表格数据， 只读第一张工作表
   * @param file 上传文件对象
   * @return 表格信息对象列表
   */
  async readExcelFile(
    file: UploadFileInfo<string>
  ): Promise<Record<string, string>[]> {
    await this.isAllowUpload(file, ['.xls', '.xlsx']);
    const { data, filename } = file;
    const savePath = posix.join(
      this.resourceUpload.dir,
      UploadSubPathEnum.IMPORT,
      parseDatePath()
    );
    await checkDirPathExists(savePath);
    return await readSheet(data, posix.join(savePath, filename));
  }

  /**
   * 写入表格数据，一般用于导出
   * @param filePath — 文件路径
   * @param sheetName 工作表名称
   * @param fileName 文件名 含文件后缀.xlsx
   * @return xlsx文件流
   */
  async writeExcelFile(data: any[], sheetName: string, fileName: string) {
    const savePath = posix.join(
      this.resourceUpload.dir,
      UploadSubPathEnum.EXPORT,
      parseDatePath()
    );
    await checkDirPathExists(savePath);
    return await writeSheet(data, sheetName, posix.join(savePath, fileName));
  }
}
