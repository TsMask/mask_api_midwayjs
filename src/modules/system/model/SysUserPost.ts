/**
 * 用户和岗位关联 sys_user_post
 *
 * @author TsMask
 */
export class SysUserPost {
  /**用户ID */
  userId: string;

  /**岗位ID */
  postId: string;

  constructor(userId: string, postId: string) {
    this.userId = userId;
    this.postId = postId;
    return this;
  }
}
