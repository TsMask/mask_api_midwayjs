import fs = require('fs');
import path = require('path');

/**
 * 读取文件大小
 * @param filePath 文件路径
 * @return 文件大小，单位B
 */
export async function fileSize(filePath: string): Promise<number> {
  return new Promise(resolve => {
    fs.stat(filePath, (err, stats) => resolve(!err ? stats.size : 0));
  });
}

/**
 * 判断文件是否存在
 * @param filePath 文件路径
 * @return 布尔结果 true/false
 */
export async function checkExists(filePath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.stat(filePath, err => resolve(!err));
  });
}

/**
 * 判断路径是否存在并创建文件目录
 * @param filePath 文件路径不含具体文件
 * @return 路径
 */
export async function checkExistsAndMkdir(filePath: string): Promise<string> {
  const exist = await checkExists(filePath);
  if (!exist) {
    return fs.mkdirSync(filePath, { recursive: true });
  }
  return undefined;
}

/**
 * 删除文件或文件夹
 * @param absPath 文件绝对路径
 * @return 布尔结果 true/false
 */
export async function deleteFile(absPath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.stat(absPath, (err, stats) => {
      if (err) return resolve(false);
      if (stats && stats.isFile()) {
        fs.unlinkSync(absPath);
        return resolve(true);
      }
      if (stats && stats.isDirectory()) {
        fs.rmdirSync(absPath);
        return resolve(true);
      }
      return resolve(false);
    });
  });
}

/**
 * 获取文件拓展类型，例 文件.pdf -> pdf
 * @param fileName 文件名
 * @return 文件后缀（不含“.”）
 */
export function getFileExt(fileName: string) {
  const ext = path.extname(fileName);
  if (!ext) return '';
  return ext.substring(1).toLowerCase();
}

/**
 * 读取文件流用于返回下载
 * @param fileName 文件名
 * @return 文件流
 */
export async function getFileStream(filePath: string) {
  return new Promise(resolve => {
    fs.stat(filePath, (err, stats) => {
      if (err) return resolve(null);
      if (stats && stats.isFile()) {
        return resolve(fs.createReadStream(filePath));
      }
      return resolve(null);
    });
  });
}

/**
 * 获取元类型拓展名称
 * @param mimeType 元类型 image/png
 * @returns 返回类型拓展 png
 */
export function getMimeTypeExt(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpg':
      return 'jpg';
    case 'image/jpeg':
      return 'jpeg';
    case 'image/bmp':
      return 'bmp';
    case 'image/gif':
      return 'gif';
    default:
      return '';
  }
}

/**
 * 获取文件类型
 *
 * @param buf 二进制文件流
 * @return 文件类型后缀（不含“.”）
 */
export function getBufferFileExtendName(buf: Buffer): string {
  let strFileExtendName = 'jpg';
  if (
    buf[0] === 71 &&
    buf[1] === 73 &&
    buf[2] === 70 &&
    buf[3] === 56 &&
    (buf[4] === 55 || buf[4] === 57) &&
    buf[5] === 97
  ) {
    strFileExtendName = 'gif';
  } else if (buf[6] === 74 && buf[7] === 70 && buf[8] === 73 && buf[9] === 70) {
    strFileExtendName = 'jpg';
  } else if (buf[0] === 66 && buf[1] === 77) {
    strFileExtendName = 'bmp';
  } else if (buf[1] === 80 && buf[2] === 78 && buf[3] === 71) {
    strFileExtendName = 'png';
  }
  return strFileExtendName;
}

/**
 * 二进制数据写入并生成文件
 * @param buf 二进制文件流
 * @param writeDirPath 写入目录路径
 * @return 文件名
 */
export async function writeBufferFile(
  buf: Buffer,
  writeDirPath: string
): Promise<string> {
  const extension = getBufferFileExtendName(buf);
  const fileName = `${Date.now()}.${extension}`;
  const writeFilePath = path.join(writeDirPath, fileName);
  try {
    const exist = await checkExists(writeDirPath);
    if (!exist) {
      fs.mkdirSync(writeDirPath, { recursive: true });
    }
    fs.openSync(writeFilePath, 'w+');
    fs.writeFileSync(writeFilePath, buf);
  } catch (err) {
    console.error('fileWriteBuffer => %s', err);
    return null;
  }
  return fileName;
}

/**
 * 读取临时文件转移到新路径文件
 *
 * @param readFile 读取文件
 * @param writePath 写入路径
 * @param fileName 文件名称
 * @return 是否写入成功 true/false
 */
export async function transferToNewFile(
  readFile: string,
  writePath: string,
  fileName: string
): Promise<void> {
  const readFileExist = await checkExists(readFile);
  if (!readFileExist) {
    throw new Error('读取临时文件失败');
  }
  const absPath = path.join(writePath, fileName);
  // 检查保存文件是否存在
  const exist = await checkExists(absPath);
  if (!exist) {
    fs.mkdirSync(writePath, { recursive: true });
  }
  fs.openSync(absPath, 'w+');
  fs.writeFileSync(absPath, fs.readFileSync(readFile));
}
