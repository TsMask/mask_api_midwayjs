/**
 * Treeselect树结构实体类
 *
 * @author TsMask <340112800@qq.com>
 */
export class TreeSelect {
  /**节点ID */
  id: string;

  /**节点名称 */
  label: string;

  /**子节点 */
  children: TreeSelect[];
}
