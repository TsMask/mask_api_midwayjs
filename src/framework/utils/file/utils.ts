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
  type FileHandle,
} from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { normalize, join } from 'node:path';

/**
 * 读取文件大小
 * @param filePath 文件路径
 * @return 文件大小，单位B
 */
export async function getFileSize(filePath: string): Promise<number> {
  // 获取文件信息
  let fileInfo: Stats = null;
  try {
    fileInfo = await stat(filePath);
  } catch (error) {
    console.error(`failed stat ${filePath} : ${error.message}`);
    return -1;
  }
  // 获取文件大小（字节数）
  return fileInfo.size;
}

/**
 * 判断文件是否存在
 * @param filePath 文件路径
 * @return 错误信息，空字符串表示文件存在
 */
export async function checkExists(filePath: string): Promise<string> {
  try {
    await access(filePath, constants.F_OK);
    return '';
  } catch (error) {
    console.error(`failed access error: ${error.message}`);
    return error.message;
  }
}

/**
 * 判断文件夹是否存在，不存在则创建
 * @param dirPath 文件路径目录
 * @return 错误信息，空字符串表示文件夹存在
 */
export async function checkDirPathExists(dirPath: string): Promise<string> {
  try {
    await access(dirPath, constants.F_OK);
    return '';
  } catch (error) {
    try {
      await mkdir(dirPath, { recursive: true });
      console.warn(`failed access to mkdir error: ${error.message}`);
      return '';
    } catch (e) {
      console.error(`failed mkdir error: ${e.message}`);
      return error.message;
    }
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
    console.error(`failed delete "${absPath}": ${error.message}`);
  }
  return false;
}

/**
 * 读取文件流用于返回下载
 * @param filePath 文件路径
 * @param startOffset 分片块读取开始区间，根据文件切片的块范围
 * @param endOffset 分片块读取结束区间，根据文件切片的块范围
 * @return [文件流数据，错误信息]
 */
export async function getFileStream(
  filePath: string,
  startOffset = 0,
  endOffset = -1
): Promise<[Buffer, string]> {
  let fd: FileHandle = null;
  try {
    // 打开文件
    fd = await open(filePath, 'r');
    // 获取文件的大小
    const fileInfo = await fd.stat();
    const fileSize = fileInfo.size;

    // 确保起始和结束偏移量在文件范围内
    startOffset = Math.max(0, Math.min(startOffset, fileSize - 1));
    endOffset = Math.min(
      endOffset < 0 ? fileSize - 1 : endOffset,
      fileSize - 1
    );

    // 计算切片的大小
    const chunkSize = endOffset - startOffset + 1;

    // 创建一个缓冲区来存储读取的数据
    const buffer = Buffer.alloc(chunkSize);
    await fd.read(buffer, 0, chunkSize, startOffset);
    return [buffer, ''];
  } catch (error) {
    console.error(`failed ${filePath} err: ${error.message}`);
    return [null, error.message];
  } finally {
    if (fd) {
      await fd.close();
    }
  }
}

/**
 * 获取文件目录下所有文件名称，不含目录名称
 * @param filePath 文件路径
 * @return 文件名称列表
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
    console.error(`failed opendir "${dirPath}": ${error.message}`);
    return [];
  }
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
  await checkDirPathExists(writeDirPath);
  const filePath = normalize(join(writeDirPath, fileName));
  // 写入到新路径文件
  try {
    await writeFile(filePath, buf);
  } catch (error) {
    console.error(`failed write file "${filePath}": ${error.message}`);
  }
  return filePath;
}

/**
 * 读取目标文件转移到新路径下
 *
 * @param srcPath 读取目标文件
 * @param writePath 输出文件路径
 * @param writefileName 输出文件名称
 * @return 错误信息
 */
export async function transferToNewFile(
  filePath: string,
  writePath: string,
  writefileName: string
): Promise<string> {
  let err = await checkExists(filePath);
  if (err) {
    return err;
  }

  err = await checkDirPathExists(writePath);
  if (err) {
    return err;
  }

  // 写入到新路径文件
  const newFilePath = normalize(join(writePath, writefileName));

  try {
    // 读取文件转移到新路径文件
    const data = await readFile(filePath);
    await writeFile(newFilePath, data);
    return '';
  } catch (error) {
    console.error(`failed transfer file "${newFilePath}": ${error.message}`);
    return error.message;
  }
}

/**
 * 将多个文件合并成一个文件并删除合并前的切片目录文件
 *
 * @param dirPath 读取要合并文件的目录
 * @param writePath 写入路径
 * @param fileName 新文件名称
 * @return 错误信息
 */
export async function mergeToNewFile(
  dirPath: string,
  writePath: string,
  fileName: string
): Promise<string> {
  // 读取目录下所有文件并排序，注意文件名称是否数值
  const fileNameList = await getDirFileNameList(normalize(dirPath));
  if (fileNameList.length <= 0) {
    return '读取合并目标文件失败';
  }

  fileNameList.sort((a, b) => parseInt(a) - parseInt(b));

  const errMsg = await checkDirPathExists(writePath);
  if (errMsg) {
    return errMsg;
  }

  // 读取文件转移到新路径文件
  const newFilePath = normalize(join(writePath, fileName));

  try {
    // 逐个读取文件组合数据块
    const fileBuffers = [];
    for (const fileName of fileNameList) {
      const chunkPath = normalize(join(dirPath, fileName));
      const buffer = await readFile(chunkPath);
      fileBuffers.push(buffer);
      await deleteFile(chunkPath);
    }
    // 写入新文件
    await writeFile(newFilePath, Buffer.concat(fileBuffers));
    return '';
  } catch (error) {
    console.error(`failed merge file "${newFilePath}": ${error.message}`);
    return error.message;
  } finally {
    await deleteFile(dirPath);
  }
}
