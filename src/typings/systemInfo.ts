/**项目信息 */
type ProjectInfoType = {
    /**项目路径 */
    appDir: string;
    /**项目环境 */
    env: string;
    /**项目名称 */
    name: string;
    /**项目版本 */
    version: string;
    /**项目依赖 */
    dependencies: any;
};

/**系统信息 */
type SystemInfoType = {
    /**运行平台 */
    platform: string;
    /**Node版本 */
    node: string;
    /**V8版本 */
    v8: string;
    /**进程PID号 */
    processId: number;
    /**系统架构 */
    arch: string;
    /**系统平台 */
    uname: string;
    /**系统发行版本 */
    release: string;
    /**主机名称 */
    hostname: string;
    /**主机用户目录 */
    homeDir: string;
    /**项目路径 */
    cmd: string;
    /**执行命令 */
    execCommand: string;
};

/**时间信息 */
type TimeInfoType = {
    /**当期时间 */
    current: string;
    /**系统启动时间 */
    uptime: string;
    /**时区 */
    timezone: string;
    /**时区名称 */
    timezoneName: string;
};

/**内存信息 */
type MemoryInfoType = {
    /**内存使用率 */
    usage: string;
    /**系统剩余内存 */
    freemem: string;
    /**系统总内存 */
    totalmem: string;
    /**分配给进程总内存 */
    rss: string;
    /**堆总内存 */
    heapTotal: string;
    /**已分配堆内存 */
    heapUsed: string;
    /**系统链接库占用内存 */
    external: string;
};

/**CPU信息 */
type CPUInfoType = {
    /**型号 */
    model: string;
    /**速率MHz */
    speed: string;
    /**核心 */
    core: number;
    /**核心使用率% */
    coreUsed: string[];
};

/**磁盘信息 */
type DiskInfoType = {
    /**总大小 */
    size: string;
    /**已使用大小 */
    used: string;
    /**剩余大小 */
    avail: string;
    /**空间使用率% */
    pcent: string;
    /**路径盘符 */
    target: string;
};
