/**列表信息查询分页 */
type ListQueryPageOptions = {
    /**当前记录起始索引,默认1 */
    pageNum?: number;

    /**每页显示记录数，默认10 */
    pageSize?: number;

    /**其余自定义属性 */
    [key: string]: any;
};

