/**列表信息查询分页 */
type ListQueryPageOptions = {
  /**当前记录起始索引,默认1 */
  pageNum?: number;

  /**每页显示记录数，默认10 */
  pageSize?: number;

  /**其余自定义属性 */
  [key: string]: any;
};

/**
 * ResultSetHeader 对象包含了一些额外的信息，例如影响的行数、警告状态等。
 * 来自：import { ResultSetHeader } from 'mysql2';
 */
type ResultSetHeader = {
  affectedRows: number;
  fieldCount: number;
  info: string;
  insertId: number;
  serverStatus: number;
  warningStatus: number;
};
