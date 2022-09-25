/**
 * 列表响应数据对象
 *
 * @author TsMask <340112800@qq.com>
 */
export class PageData<T> {
  /**总记录数 */
  total: number = 0;

  /**列表数据 */
  rows: T[] = [];

  /**消息状态码 */
  code: number = 200;

  /**消息内容 */
  msg: string = '成功';

  constructor(total: number, rows: T[]) {
    this.total = total;
    this.rows = rows;
  }
}
