import * as ExcelJS from 'exceljs';

/**
 * 读取表格数据
 * @param filePath 文件路径
 * @param indexOrName 工作表，默认值：1，读取第一张工作表
 * @param savePath 文件保存路径
 * @return 表格对象列表
 */
export async function readSheet(
  filePath: string,
  indexOrName: string | number = 1,
  savePath?: string
): Promise<Record<string, string>[]> {
  // 读取Excel文件
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  // 获取第一个工作表
  const worksheet = workbook.getWorksheet(indexOrName);
  // 保存文件转存到本地
  if (savePath) {
    await workbook.xlsx.writeFile(savePath);
  }

  // 获取表头行
  const headerRow = worksheet.getRow(1);
  // 获取表头列数
  const headerColumnCount = headerRow.cellCount;
  //  定义表内数据数组
  const rowDataArr: Record<string, any>[] = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    // 获取当前数据行
    const dataRow = worksheet.getRow(i);
    // 定义一个空对象来存储当前行的数据
    const rowData: Record<string, any> = {};
    // 遍历当前数据行的每一列
    for (let j = 1; j <= headerColumnCount; j++) {
      // 获取当前列的表头名称
      const headerName = headerRow.getCell(j).value?.toString();
      // 获取当前列的数据值
      const cellValue = dataRow.getCell(j).value;
      // 将当前列的数据值添加到当前数据对象中
      rowData[headerName || `${j}`] = cellValue;
    }
    // 将当前行的数据存储到data数组中
    rowDataArr.push(rowData);
  }

  return rowDataArr;
}

/**
 * 写入表格数据并导出
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
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // header表头名称用数据key, width设置列宽度，单位厘米
  worksheet.columns = Object.keys(data[0]).map(key => {
    return { header: key, key, width: 20 };
  });

  // 写入数据
  worksheet.addRows(data);

  // 保存文件到本地
  if (savePath) {
    await workbook.xlsx.writeFile(savePath);
  }
  return await workbook.xlsx.writeBuffer();
}
