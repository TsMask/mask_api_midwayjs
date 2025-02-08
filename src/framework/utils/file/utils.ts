import { UploadFileInfo } from '@midwayjs/upload';
import { type Stats } from 'node:fs';
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
import { posix } from 'node:path';

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
 * @return 布尔结果 true/false
 */
export async function checkExists(filePath: string): Promise<string> {
  try {
    await access(filePath, constants.F_OK);
    return '';
  } catch (error) {
    console.error(`Failed access "${filePath}": ${error.message}`);
    return error.message;
  }
}

/**
 * 判断文件夹是否存在，不存在则创建
 * @param dirPath 文件路径目录
 */
export async function checkDirPathExists(dirPath: string): Promise<string> {
  try {
    await access(dirPath, constants.F_OK);
    return '';
  } catch (error) {
    console.error(`Failed access to mkdir "${dirPath}": ${error.message}`);
    await mkdir(dirPath, { recursive: true });
    return error.message;
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
 * 读取文件流用于返回下载
 * @param filePath 文件路径
 * @param startOffset 分片块读取开始区间，根据文件切片的块范围
 * @param endOffset 分片块读取结束区间，根据文件切片的块范围
 * @return [文件流数据，错误信息]
 */
export async function getFileStream(
  filePath: string,
  startOffset: number = 0,
  endOffset: number = -1
): Promise<[Buffer, string]> {
  let fd: FileHandle = null;
  try {
    // 打开文件
    fd = await open(filePath, 'r');
    // 获取文件的大小
    const fileInfo = await fd.stat();
    const fileSize = fileInfo.size;

    // 确保起始和结束偏移量在文件范围内
    if (startOffset > fileSize || startOffset === 0) {
      startOffset = 0;
    }
    if (endOffset >= fileSize || endOffset <= 0) {
      endOffset = fileSize - 1;
    }

    // 计算切片的大小
    const chunkSize = endOffset - startOffset + 1;

    // 创建一个缓冲区来存储读取的数据
    const buffer = Buffer.alloc(chunkSize);
    const uint8Array = new Uint8Array(buffer);
    await fd.read(uint8Array, 0, chunkSize, startOffset);
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
  await checkDirPathExists(writeDirPath);
  const filePath = posix.join(writeDirPath, fileName);
  // 写入到新路径文件
  try {
    await writeFile(filePath, buf.toString());
  } catch (error) {
    console.error(`Failed write file "${filePath}": ${error.message}`);
  }
  return filePath;
}

/**
 * 读取目标文件转移到新路径下
 *
 * @param readFilePath 读取目标文件
 * @param dst 输出路径
 * @return 错误信息
 */
export async function transferToNewFile(
  file: UploadFileInfo<string>,
  dst: string
): Promise<string> {
  let err = await checkExists(file.data);
  if (err) {
    return err;
  }

  err = await checkDirPathExists(dst);
  if (err) {
    return err;
  }

  try {
    // 读取文件转移到新路径文件
    const data = await readFile(file.data);
    await writeFile(dst, data.toString());
    return '';
  } catch (error) {
    console.error(`Failed transfer file "${dst}": ${error.message}`);
    return error.message;
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
    await writeFile(newFilePath, Buffer.concat(fileBuffers).toString());
  } catch (error) {
    console.error(`Failed merge file "${newFilePath}": ${error.message}`);
  } finally {
    await deleteFile(dirPath);
  }
}
