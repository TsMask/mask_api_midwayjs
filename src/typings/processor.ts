/**调度任务处理接收参数 */
type ProcessorOptions = {
    /**定义的任务ID */
    jobId: string;
    /**定义的任务Cron */
    cron?: string;
    /**运行参数 */
    params?: any;
};

/**调度任务处理结果参数 */
type ProcessorData = {
    /**定义的任务ID */
    jobId: string;
    /**定义的任务Cron */
    cron?: string;

    /**运行参数 */
    params?: any;

    /**其余自定义属性 */
    [key: string]: any;
};