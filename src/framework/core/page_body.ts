/**
 * 列表请求参数对象
 *
 * @author TsMask <340112800@qq.com>
 */
export class PageBody<T> {
  /**当前记录起始索引 */
  page_num: number = 1;

  /**每页显示记录数 */
  page_size: number = 10;

  /**排序列 */
  order_by_column: string = '';

  /**排序的方向 "desc" 或者 "asc" */
  order_by_is: string = 'asc';

  /**请求搜索参数对象 */
  search: T | any = {};
}
