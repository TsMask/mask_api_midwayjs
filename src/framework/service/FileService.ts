import { Config, Provide } from '@midwayjs/decorator';
import { UploadFileInfo } from '@midwayjs/upload';
import { UploadSubPathEnum } from '../../common/enums/UploadSubPathEnum';
import { parseDatePath } from '../../common/utils/DateFnsUtils';
import { deleteFile, fileSize, getFileExt, getFileStream, getMimeTypeExt, transferToNewFile } from '../../common/utils/FileUtils';
import { generateID } from '../../common/utils/GenIdUtils';

/**默认大小 50M */
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

/**默认的文件名最大长度 100 */
const DEFAULT_FILE_NAME_LENGTH = 127;

/**默认允许上传的文件拓展类型 */
const DEFAULT_ALLOW_EXT = [
  // 图片
  "bmp", "gif", "jpg", "jpeg", "png",
  // word excel powerpoint
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "html", "htm", "txt",
  // 压缩文件
  "rar", "zip", "gz", "bz2",
  // 视频格式
  "mp4", "avi", "rmvb",
  // pdf
  "pdf"
]

/**
 * 文件服务
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class FileService {
  @Config('staticFile.dirs.upload')
  private resourceUpload: { prefix: string, dir: string };

  /**
   * 上传文件
   * @param file 上传文件对象
   * @param subPath 子路径 UploadSubPathEnum.DEFAULT
   * @param allowExts 允许上传拓展类型（不含“.”) DEFAULT_ALLOW_EXT
   * @returns 文件存放资源路径，URL相对地址
   */
  async upload(file: UploadFileInfo<string>, subPath: string = UploadSubPathEnum.DEFAULT, allowExts: string[] = DEFAULT_ALLOW_EXT): Promise<string> {
    await this.isAllowUpload(file, allowExts);
    const fileName = this.generateFileName(file);
    const filePath = `${subPath}/${parseDatePath()}`;
    await transferToNewFile(file.data, `${this.resourceUpload.dir}/${filePath}`, fileName);
    return `${this.resourceUpload.prefix}/${filePath}/${fileName}`;
  }

  /**
   * 判断是否可以满足上传要求
   * @param file 上传文件对象
   * @param allowExts 允许上传拓展类型
   */
  private async isAllowUpload(file: UploadFileInfo<string>, allowExts: string[]): Promise<void> {
    // 判断上传文件名称长度
    const fileName: string = file.filename || "";
    if (fileName.length > DEFAULT_FILE_NAME_LENGTH) {
      throw new Error(`上传文件名称长度限制最长为 ${DEFAULT_FILE_NAME_LENGTH}`);
    }

    // 判断上传文件大小
    const size: number = await fileSize(file.data);
    if (size > DEFAULT_MAX_SIZE) {
      throw new Error(`上传文件大小限制为 ${DEFAULT_MAX_SIZE / 1024 / 1024}MB`)
    }

    // 判断文件拓展是否为允许的拓展类型
    let fileExt = getFileExt(file.filename);
    if (!fileExt) {
      fileExt = getMimeTypeExt(file.mimeType)
    }
    if (!allowExts.includes(fileExt)) {
      throw new Error(`上传文件类型不支持，支持以下类型：${allowExts.join(',')}`)
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
      ext = getMimeTypeExt(file.mimeType)
    }
    // 替换掉后缀和特殊字符保留文件名
    let fileName = file.filename.replace(`.${ext}`, '');
    fileName = fileName.replace(/[<>:"\/\\|?*]+/g, '');
    return `${fileName}_${generateID(8)}.${ext}`;
  }

  /**
   * 检查文件允许访问
   * @param filePath 文件存放资源路径，URL相对地址
   * @returns true 正常 false 非法
   */
  private isAllowRead(filePath: string): boolean {
    // 禁止目录上跳级别
    if (filePath.includes("..")) return false

    // 检查允许下载的文件规则
    const fileExt = getFileExt(filePath);
    if (DEFAULT_ALLOW_EXT.includes(fileExt)) {
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
      throw new Error(`文件 ${filePath} 非法，不允许下载。`)
    }
    const asbPath = filePath.replace(this.resourceUpload.prefix, this.resourceUpload.dir);
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
      throw new Error(`文件 ${filePath} 非法，不允许删除。`)
    }
    const asbPath = filePath.replace(this.resourceUpload.prefix, this.resourceUpload.dir);
    return await deleteFile(asbPath);
  }
}
