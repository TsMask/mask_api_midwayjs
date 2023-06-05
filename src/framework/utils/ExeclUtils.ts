import { readFile, utils, writeFile, write } from 'xlsx';

/**
 * 读取表格数据， 只读第一张工作表
 * @param filePath 文件路径
 * @param savePath 文件保存路径
 * @return 表格对象列表
 */
export async function readSheet(
  filePath: string,
  savePath: string
): Promise<Record<string, string>[]> {
  const workBook = readFile(filePath);
  const workSheet = workBook.Sheets[workBook.SheetNames[0]];
  // 保存文件到本地
  if (savePath) {
    writeFile(workBook, savePath, { compression: true });
  }
  return utils.sheet_to_json<Record<string, string>>(workSheet);
}

/**
 * 写入表格数据，一般用于导出
 * @param filePath 文件路径
 * @param sheetName 工作表名称
 * @param savePath 文件保存绝对路径
 * @return xlsx文件流
 */
export async function writeSheet(
  data: any[],
  sheetName: string,
  savePath?: string
): Promise<unknown> {
  const workSheet = utils.json_to_sheet(data);
  // 设置列宽度，单位厘米
  workSheet['!cols'] = Object.keys(data[0]).map(() => {
    return { wch: 20 };
  });
  const workBook = utils.book_new();
  utils.book_append_sheet(workBook, workSheet, sheetName);
  // 保存文件到本地
  if (savePath) {
    writeFile(workBook, savePath, { compression: true });
  }
  return write(workBook, { type: 'buffer', bookType: 'xlsx' });
}
