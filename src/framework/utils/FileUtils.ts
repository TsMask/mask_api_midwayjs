import {
  constants,
  open,
  opendir,
  readFile,
  writeFile,
  stat,
  access,
  unlink,
  mkdir,
  rmdir,
} from 'fs/promises';
import { posix } from 'path';

/**
 * 读取文件大小
 * @param filePath 文件路径
 * @return 文件大小，单位B
 */
export async function getFileSize(filePath: string): Promise<number> {
  if (!filePath) return 0;
  try {
    const { size } = await stat(filePath);
    return size || 0;
  } catch (error) {
    console.error(`Failed stat ${filePath} : ${error.message}`);
  }
  return 0;
}

/**
 * 判断文件是否存在
 * @param filePath 文件路径
 * @return 布尔结果 true/false
 */
export async function checkExists(filePath: string): Promise<boolean> {
  if (!filePath) return false;
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    console.error(`Failed access "${filePath}": ${error.message}`);
    return false;
  }
}

/**
 * 判断文件夹是否存在，不存在则创建
 * @param dirPath 文件路径目录
 */
export async function checkDirPathExists(dirPath: string) {
  if (!dirPath) return;
  try {
    await access(dirPath, constants.F_OK);
  } catch (error) {
    console.error(`Failed access to mkdir "${dirPath}": ${error.message}`);
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * 删除文件或文件夹
 * @param absPath 文件绝对路径
 * @return 布尔结果 true/false
 */
export async function deleteFile(absPath: string): Promise<boolean> {
  if (!absPath) return false;
  try {
    const stats = await stat(absPath);
    if (stats.isFile()) {
      await unlink(absPath);
      return true;
    }
    if (stats.isDirectory()) {
      await rmdir(absPath);
      return true;
    }
  } catch (error) {
    console.error(`Failed delete "${absPath}": ${error.message}`);
  }
  return false;
}

/**
 * 获取文件拓展类型，例 文件.pdf -> .pdf
 * @param fileName 文件名
 * @return 文件后缀（含“.”）
 */
export function getFileExt(fileName: string) {
  const ext = posix.extname(fileName);
  if (ext) {
    return ext.toLowerCase();
  }
  return '';
}

/**
 * 读取文件流用于返回下载
 * @param filePath 文件路径
 * @param range 分片块读取区间，根据文件切片的块范围
 * @return 文件流
 */
export async function getFileStream(
  filePath: string,
  range?: [number, number]
) {
  const readFileExist = await checkExists(filePath);
  if (!readFileExist) {
    throw new Error('读取文件失败');
  }

  const fd = await open(filePath, 'r');
  try {
    const { size } = await fd.stat();
    const start = range ? range[0] : 0;
    const end = range ? range[1] : size - 1;
    const chunkSize = end - start + 1;
    const buffer = Buffer.alloc(chunkSize);

    await fd.read(buffer, 0, chunkSize, start);
    return buffer;
  } catch (error) {
    console.error(`Failed open "${filePath}": ${error.message}`);
  } finally {
    await fd.close();
  }
}

/**
 * 获取元类型拓展名称
 * @param mimeType 元类型 image/png
 * @returns 返回类型拓展 .png
 */
export function getMimeTypeExt(mimeType: string): string {
  const mimeTypeMap: Record<string, string> = {
    'image/png': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpeg',
    'image/bmp': '.bmp',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return mimeTypeMap[mimeType] || '';
}

/**
 * 获取文件目录下所有文件名称，不含目录名称
 * @param filePath 文件路径
 * @return 目录下文件名称
 */
export async function getDirFileNameList(dirPath: string): Promise<string[]> {
  if (!dirPath) return [];
  try {
    const dir = await opendir(dirPath);
    const fileNames: string[] = [];
    for await (const dirent of dir) {
      if (dirent.isFile()) {
        fileNames.push(dirent.name);
      }
    }
    return fileNames;
  } catch (error) {
    console.error(`Failed opendir "${dirPath}": ${error.message}`);
  }
  return [];
}

/**
 * 二进制文件流获取文件类型
 *
 * @param buf 二进制文件流
 * @return 文件类型后缀（含“.”）
 */
export function getBufferFileExtendName(buf: Buffer): string {
  const header = buf.subarray(0, 10);
  const headers = [
    { header: [71, 73, 70, 56, 55, 97], ext: '.gif' },
    { header: [71, 73, 70, 56, 57, 97], ext: '.gif' },
    { header: [255, 216, 255, 224], ext: '.jpg' },
    { header: [255, 216, 255, 225], ext: '.jpg' },
    { header: [66, 77], ext: '.bmp' },
    { header: [137, 80, 78, 71], ext: '.png' },
  ];
  for (const h of headers) {
    if (header.every((value, index) => value === h.header[index])) {
      return h.ext;
    }
  }
  return '.png';
}

/**
 * 二进制数据写入并生成文件
 * @param buf 二进制文件流
 * @param writeDirPath 写入目录路径
 * @param fileName 文件名称
 * @return 文件名
 */
export async function writeBufferFile(
  buf: Buffer,
  writeDirPath: string,
  fileName: string
): Promise<string> {
  const extension = getBufferFileExtendName(buf);
  await checkDirPathExists(writeDirPath);
  const filePath = posix.join(writeDirPath, `${fileName}.${extension}`);
  // 写入到新路径文件
  try {
    await writeFile(filePath, buf);
  } catch (error) {
    console.error(`Failed write file "${filePath}": ${error.message}`);
  }
  return filePath;
}

/**
 * 读取目标文件转移到新路径下
 *
 * @param readFilePath 读取目标文件
 * @param writePath 写入路径
 * @param fileName 文件名称
 */
export async function transferToNewFile(
  readFilePath: string,
  writePath: string,
  fileName: string
): Promise<void> {
  const readFileExist = await checkExists(readFilePath);
  if (!readFileExist) {
    throw new Error('读取转移目标文件失败');
  }

  await checkDirPathExists(writePath);

  const newFilePath = posix.join(writePath, fileName);
  try {
    // 读取文件转移到新路径文件
    const data = await readFile(readFilePath);
    await writeFile(newFilePath, data);
  } catch (error) {
    console.error(`Failed transfer file "${newFilePath}": ${error.message}`);
  }
}

/**
 * 将多个文件合并成一个文件并删除合并前的切片目录文件
 *
 * @param dirPath 读取要合并文件的目录
 * @param writePath 写入路径
 * @param fileName 文件名称
 */
export async function mergeToNewFile(
  dirPath: string,
  writePath: string,
  fileName: string
): Promise<void> {
  // 读取目录下所有文件并排序，注意文件名称是否数值
  const fileNameList = await getDirFileNameList(dirPath);
  if (fileNameList.length <= 0) {
    throw new Error('读取合并目标文件失败');
  }
  fileNameList.sort((a, b) => parseInt(a) - parseInt(b));

  await checkDirPathExists(writePath);

  // 读取文件转移到新路径文件
  const newFilePath = posix.join(writePath, fileName);

  try {
    // 逐个读取文件组合数据块
    const fileBuffers = [];
    for (const fileName of fileNameList) {
      const chunkPath = posix.join(dirPath, fileName);
      const buffer = await readFile(chunkPath);
      fileBuffers.push(buffer);
      await deleteFile(chunkPath);
    }
    // 写入新文件
    await writeFile(newFilePath, Buffer.concat(fileBuffers));
  } catch (error) {
    console.error(`Failed merge file "${newFilePath}": ${error.message}`);
  } finally {
    await deleteFile(dirPath);
  }
}
