import { resolve, normalize, join, extname } from 'node:path';

import { Inject, Provide, Singleton } from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';

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
} from '../../constants/upload_sub_path';
import { replace } from '../regular/regular';
import { parseDatePath } from '../date/data';
import { readSheet, writeSheet } from './execl';
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
    // 替换掉后缀和特殊字符保留文件名
    let newFileName = replace(fileExt, fileName, '');
    newFileName = replace('/[<>:"\\|?*]+/g', newFileName, '');
    newFileName = newFileName.trim();
    return `${newFileName}_${generateCode(6)}${fileExt}`;
  }

  /**
   * 检查文件允许写入本地
   * @param fileName 原始文件名称含后缀，如：file_logo_xxw68.png
   * @param allowExts 允许上传拓展类型，['.png']
   * @returns 错误信息
   */
  private isAllowWrite(fileName: string, allowExts: string[]): string {
    /**最大文件名长度 */
    const DEFAULT_FILE_NAME_LENGTH = 100;
    // 判断上传文件名称长度
    if (fileName.length > DEFAULT_FILE_NAME_LENGTH) {
      return `上传文件名称长度限制最长为 ${DEFAULT_FILE_NAME_LENGTH}`;
    }

    // 判断文件拓展是否为允许的拓展类型
    const fileExt = extname(fileName);
    if (allowExts.length === 0) {
      allowExts = this.config.get<string[]>('upload.whitelist');
    }

    let hasExt = false;
    for (const ext of allowExts) {
      if (ext === fileExt) {
        hasExt = true;
        break;
      }
    }
    if (!hasExt) {
      return `上传文件类型不支持，仅支持以下类型：${allowExts.join('、')}`;
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
    if (filePath.indexOf('..') !== -1) {
      return '禁止目录上跳级别';
    }
    const uploadWhiteList = this.config.get<string[]>('upload.whitelist');
    // 检查允许下载的文件规则
    const fileExt = extname(filePath);
    let hasExt = false;
    for (const str of uploadWhiteList) {
      if (str === fileExt) {
        hasExt = true;
        break;
      }
    }
    if (!hasExt) {
      if (fileExt === '') {
        return '未知异常文件';
      }
      return `限定下载的文件规则：${uploadWhiteList.join('、')}`;
    }
    return '';
  }

  /**
   * 上传资源文件读取
   * @param filePath 文件存放资源路径，URL相对地址 如：/upload/common/2023/06/xxx.png
   * @param headerRange 断点续传范围区间，bytes=0-12131
   * @return 结果 { fileSize, data, range, chunkSize }
   */
  public async readUploadFileStream(
    filePath: string,
    headerRange: string
  ): Promise<[Record<string, any>, string]> {
    // 检查文件允许访问
    const err = this.isAllowRead(filePath);
    if (err) {
      return [undefined, err];
    }
    // 上传资源路径
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    const fileAsbPath = filePath.replace(prefix, dir);

    // 响应结果
    const result = {
      range: '',
      chunkSize: 0,
      fileSize: 0,
      data: null,
    };

    // 文件大小
    const fileSize = await getFileSize(fileAsbPath);
    if (fileSize <= 0) {
      return [undefined, '文件不存在'];
    }
    result.fileSize = fileSize;

    if (headerRange) {
      const parts = headerRange.replace(/bytes=/, '').split('-');
      let start = parseInt(parts[0], 10);
      if (isNaN(start) || start > fileSize) {
        start = 0;
      }
      let end = parseInt(parts[1], 10);
      if (isNaN(end) || start > fileSize) {
        end = fileSize - 1;
      }
      if (start > end) {
        start = end;
      }

      // 分片结果
      result.range = `bytes ${start}-${end}/${fileSize}`;
      result.chunkSize = end - start + 1;
      const [byteArr, errMsg] = await getFileStream(fileAsbPath, start, end);
      if (errMsg) {
        return [undefined, errMsg];
      }
      result.data = byteArr;
      return [result, ''];
    }

    const [byteArr, errMsg] = await getFileStream(fileAsbPath, 0, fileSize);
    if (errMsg) {
      return [undefined, errMsg];
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
    file: UploadFileInfo<string>,
    subPath: string,
    allowExts: string[] = []
  ): Promise<[string, string]> {
    // 上传文件检查
    const err = this.isAllowWrite(file.filename, allowExts);
    if (err) {
      return ['', err];
    }
    // 上传资源路径
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    // 新文件名称并组装文件地址
    const fileName = this.generateFileName(file.filename);
    const fileDir = normalize(join(subPath, parseDatePath()));
    const writeFilePath = normalize(join(dir, fileDir));
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
    const err = this.isAllowWrite(originalFileName, []);
    if (err) {
      return [[], err];
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
    const err = this.isAllowWrite(originalFileName, []);
    if (err) {
      return ['', err];
    }
    // 上传资源路径
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    // 切片存放目录
    const dirPath = normalize(join(UPLOAD_CHUNK, parseDatePath(), identifier));
    const readPath = normalize(join(dir, dirPath));
    // 组合存放文件路径
    const fileName = this.generateFileName(originalFileName);
    const fileDir = normalize(join(subPath, parseDatePath()));
    const writePath = normalize(join(dir, fileDir));
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
    file: UploadFileInfo<string>,
    index: string,
    identifier: string
  ): Promise<[string, string]> {
    // 上传文件检查
    const err = this.isAllowWrite(file.filename, []);
    if (err) {
      return ['', err];
    }
    // 上传资源路径
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    const fileDir = normalize(join(UPLOAD_CHUNK, parseDatePath(), identifier));
    const writePath = normalize(join(dir, fileDir));
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
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    const asbPath = filePath.replace(prefix, dir);
    const ok = await deleteFile(asbPath);
    if (!ok) {
      return `文件 ${filePath} 删除失败。`;
    }
    return '';
  }

  /**
   * 内部文件读取 assets 目录
   * @param asserPath 内部文件相对地址，如：/template/excel/xxx.xlsx
   * @return [文件读取流, 错误信息]
   */
  async readAssetsFileStream(asserPath: string): Promise<[Buffer, string]> {
    // 检查文件允许访问
    const err = this.isAllowRead(asserPath);
    if (err) {
      return [undefined, err];
    }
    const absPath = resolve(__dirname, '../../../assets', asserPath);
    return await getFileStream(absPath);
  }

  /**
   * 上传资源本地绝对资源路径
   * @param filePath 上传文件路径
   * @return 绝对路径
   */
  public parseUploadFileAbsPath(filePath: string): string {
    // 上传资源路径
    const { prefix, dir } = this.config.get<Record<string, string>>(
      'staticFile.dirs.upload'
    );
    return filePath.replace(prefix, dir);
  }

  /**
   * 表格读取数据， 只读第一张工作表
   * @param file 上传文件对象
   * @param sheetName 工作簿名称， 空字符默认Sheet1
   * @return 表格信息对象列表
   */
  async excelReadRecord(
    file: UploadFileInfo<string>,
    sheetName: string
  ): Promise<[Record<string, string>[], string]> {
    const { data, filename } = file;
    let err = this.isAllowWrite(filename, ['.xls', '.xlsx']);
    if (err) {
      return [undefined, err];
    }
    // 保存上传文件
    const uploadDir = this.config.get<string>('staticFile.dirs.upload.dir');
    const fileDir = normalize(join(uploadDir, UPLOAD_IMPORT, parseDatePath()));
    const fileName = this.generateFileName(filename);
    err = await transferToNewFile(file.data, fileDir, fileName);
    if (err) {
      return [undefined, err];
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
}
