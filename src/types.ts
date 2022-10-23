/**查询记录-单行统计数量 */
type rowTotal = { total: number };

/**查询记录-多行单字段字符串 */
type rowOneColumn = { str: string };

/**查询记录-分页数据 */
type rowPages = { total: number; rows: any };
