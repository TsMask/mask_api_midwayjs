-- ----------------------------
-- 系统初始17张数据表，前缀sys_开头
-- demo模块不需要可删除、不导入数据表
-- ----------------------------




-- ----------------------------
-- 1、部门表
-- ----------------------------
drop table if exists sys_dept;
create table sys_dept (
  dept_id           bigint          not null auto_increment    comment '部门ID',
  parent_id         bigint          default 0                  comment '父部门ID 默认0',
  ancestors         varchar(200)    default ''                 comment '祖级列表',
  dept_name         varchar(64)     default ''                 comment '部门名称',
  dept_sort         int             default 0                  comment '显示顺序',
  leader            varchar(32)     default ''                 comment '负责人',
  phone             varchar(32)     default ''                 comment '联系电话',
  email             varchar(64)     default ''                 comment '邮箱',
  status_flag       varchar(1)      default '0'                comment '部门状态（0停用 1正常）',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  primary key (dept_id)
) engine=innodb auto_increment=200 comment='部门表';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------
insert into sys_dept values(100,  0,   '0',          'MASK科技',   0, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(101,  100, '0,100',      'XX总公司',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(102,  100, '0,100',      'XX分公司',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(103,  101, '0,100,101',  '研发部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(104,  101, '0,100,101',  '市场部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(105,  101, '0,100,101',  '测试部门',   3, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(106,  101, '0,100,101',  '财务部门',   4, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(107,  101, '0,100,101',  '运维部门',   5, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(108,  102, '0,100,102',  '市场部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);
insert into sys_dept values(109,  102, '0,100,102',  '财务部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0);

-- ----------------------------
-- 2、用户信息表
-- ----------------------------
drop table if exists sys_user;
create table sys_user (
  user_id           bigint          not null auto_increment    comment '用户ID',
  dept_id           bigint          default 0                  comment '部门ID',
  user_name         varchar(32)     not null                   comment '用户账号',
  email             varchar(64)     default ''                 comment '用户邮箱',
  phone             varchar(32)     default ''                 comment '手机号码',
  nick_name         varchar(32)     not null                   comment '用户昵称',
  sex               varchar(1)      default '0'                comment '用户性别（0未选择 1男 2女）',
  avatar            varchar(255)    default ''                 comment '头像地址',
  password          varchar(128)    default ''                 comment '密码',
  status_flag       varchar(1)      default '0'                comment '账号状态（0停用 1正常）',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  login_ip          varchar(128)    default ''                 comment '最后登录IP',
  login_time        bigint          default 0                  comment '最后登录时间',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (user_id)
) engine=innodb auto_increment=100 comment='用户信息表';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
insert into sys_user values(1,  100, 'system', 'system@163.com', '15612341234', '系统管理员', '0', '', '$2a$10$tXF0pa0BVDPf2r6VgNWk2eCZHBhrTbe15km.0HlTb9JpdAv2bdGc6', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(now(3)),'.',''), 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统管理员');
insert into sys_user values(2,  100, 'admin',  'admin@qq.com',   '13412341234', '管理员',     '0', '', '$2a$10$tXF0pa0BVDPf2r6VgNWk2eCZHBhrTbe15km.0HlTb9JpdAv2bdGc6', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(now(3)),'.',''), 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');
insert into sys_user values(3,  105, 'user',   'user@gmail.com', '13612341234', '普通用户',   '0', '', '$2a$10$tXF0pa0BVDPf2r6VgNWk2eCZHBhrTbe15km.0HlTb9JpdAv2bdGc6', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(now(3)),'.',''), 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '普通人员');


-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
drop table if exists sys_post;
create table sys_post
(
  post_id       bigint          not null auto_increment    comment '岗位ID',
  post_code     varchar(32)     not null                   comment '岗位编码',
  post_name     varchar(64)     not null                   comment '岗位名称',
  post_sort     int             default 0                  comment '显示顺序',
  status_flag   varchar(1)      default '0'                comment '状态（0停用 1正常）',
  del_flag      varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by     varchar(64)     default ''                 comment '创建者',
  create_time   bigint          default 0                  comment '创建时间',
  update_by     varchar(64)     default ''                 comment '更新者',
  update_time   bigint          default 0                  comment '更新时间',
  remark        varchar(200)    default ''                 comment '备注',
  primary key (post_id)
) engine=innodb comment='岗位信息表';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
insert into sys_post values(1, 'ceo',  '董事长',    1, '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(2, 'se',   '项目经理',  2, '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(3, 'hr',   '人力资源',  3, '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(4, 'user', '普通员工',  4, '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 4、角色信息表
-- ----------------------------
drop table if exists sys_role;
create table sys_role (
  role_id              bigint         not null auto_increment    comment '角色ID',
  role_name            varchar(64)    not null                   comment '角色名称',
  role_key             varchar(32)    not null                   comment '角色键值',
  role_sort            int            default 0                  comment '显示顺序',
  data_scope           varchar(1)     default '5'                comment '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限）',
  menu_check_strictly  varchar(1)     default '1'                comment '菜单树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示）',
  dept_check_strictly  varchar(1)     default '1'                comment '部门树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示 ）',
  status_flag          varchar(1)     default '0'                comment '角色状态（0停用 1正常）',
  del_flag             varchar(1)     default '0'                comment '删除标记（0存在 1删除）',
  create_by            varchar(64)    default ''                 comment '创建者',
  create_time          bigint         default 0                  comment '创建时间',
  update_by            varchar(64)    default ''                 comment '更新者',
  update_time          bigint         default 0                  comment '更新时间',
  remark               varchar(200)   default ''                 comment '备注',
  primary key (role_id)
) engine=innodb auto_increment=50 comment='角色信息表';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
insert into sys_role values(1, '系统',      'system',  1, '1', '1', '1', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统内置角色');
insert into sys_role values(2, '管理员',    'admin',   2, '1', '1', '1', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');
insert into sys_role values(3, '普通角色',  'common',  3, '5', '1', '1', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '普通角色');


-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
drop table if exists sys_menu;
create table sys_menu (
  menu_id           bigint          not null auto_increment    comment '菜单ID',
  menu_name         varchar(32)     not null                   comment '菜单名称',
  parent_id         bigint          default 0                  comment '父菜单ID 默认0',
  menu_sort         int             default 0                  comment '显示顺序',
  menu_path         varchar(128)    default ''                 comment '路由地址',
  component         varchar(255)    default ''                 comment '组件路径',
  frame_flag        varchar(1)      default '1'                comment '内部跳转标记（0否 1是）',
  cache_flag        varchar(1)      default '0'                comment '缓存标记（0不缓存 1缓存）',
  menu_type         varchar(1)      not null                   comment '菜单类型（D目录 M菜单 A权限）',
  visible_flag      varchar(1)      default '0'                comment '是否显示（0隐藏 1显示）',
  status_flag       varchar(1)      default '0'                comment '菜单状态（0停用 1正常）',
  perms             varchar(128)    default ''                 comment '权限标识',
  icon              varchar(64)     default '#'                comment '菜单图标（#无图标）',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (menu_id)
) engine=innodb auto_increment=2000 comment='菜单权限表';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
insert into sys_menu values(1, '系统管理', 0, 1, 'system',                   '', '1', '1', 'D', '1', '1', '', '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统管理目录');
insert into sys_menu values(2, '系统监控', 0, 2, 'monitor',                  '', '1', '1', 'D', '1', '1', '', '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统监控目录');
insert into sys_menu values(3, '系统工具', 0, 3, 'tool',                     '', '1', '1', 'D', '1', '1', '', '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统工具目录');
insert into sys_menu values(4, '开源仓库', 0, 4, 'https://gitee.com/TsMask', '', '0', '0', 'D', '1', '1', '', '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '开源仓库跳转外部链接打开新窗口');
-- 二级菜单
insert into sys_menu values(100,  '用户管理', 1,   1,   'user',                                 'system/user/index',        '1', '1', 'M', '1', '1', 'system:user:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '用户管理菜单');
insert into sys_menu values(101,  '角色管理', 1,   2,   'role',                                 'system/role/index',        '1', '1', 'M', '1', '1', 'system:role:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '角色管理菜单');
insert into sys_menu values(102,  '分配角色', 1,   3,   'role/inline/auth-user/:roleId',        'system/role/auth-user',    '1', '1', 'M', '0', '1', 'system:role:auth',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '分配角色内嵌隐藏菜单');
insert into sys_menu values(103,  '菜单管理', 1,   4,   'menu',                                 'system/menu/index',        '1', '1', 'M', '1', '1', 'system:menu:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '菜单管理菜单');
insert into sys_menu values(104,  '部门管理', 1,   5,   'dept',                                 'system/dept/index',        '1', '1', 'M', '1', '1', 'system:dept:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '部门管理菜单');
insert into sys_menu values(105,  '岗位管理', 1,   6,   'post',                                 'system/post/index',        '1', '1', 'M', '1', '1', 'system:post:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '岗位管理菜单');
insert into sys_menu values(106,  '字典管理', 1,   7,   'dict',                                 'system/dict/index',        '1', '1', 'M', '1', '1', 'system:dict:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '字典管理菜单');
insert into sys_menu values(107,  '字典数据', 1,   8,   'dict/inline/data/:dictId',             'system/dict/data',         '1', '1', 'M', '0', '1', 'system:dict:data',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '字典数据内嵌隐藏菜单');
insert into sys_menu values(108,  '参数设置', 1,   9,   'config',                               'system/config/index',      '1', '1', 'M', '1', '1', 'system:config:list',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '参数设置菜单');
insert into sys_menu values(109,  '通知公告', 1,   10,  'notice',                               'system/notice/index',      '1', '1', 'M', '1', '1', 'system:notice:list',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知公告菜单');
insert into sys_menu values(111,  '系统日志', 1,   11,  'log',                                  '',                         '1', '1', 'D', '1', '1', '',                        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '日志管理菜单');
insert into sys_menu values(112,  '系统信息', 2,   1,   'system-info',                          'monitor/system/info',      '1', '1', 'M', '1', '1', 'monitor:system:info',     '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统信息菜单');
insert into sys_menu values(113,  '缓存信息', 2,   2,   'cache-info',                           'monitor/cache/info',       '1', '1', 'M', '1', '1', 'monitor:cache:info',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '缓存信息菜单');
insert into sys_menu values(114,  '缓存管理', 2,   3,   'cache',                                'monitor/cache/index',      '1', '1', 'M', '1', '1', 'monitor:cache:list',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '缓存列表菜单');
insert into sys_menu values(115,  '在线用户', 2,   4,   'online',                               'monitor/online/index',     '1', '1', 'M', '1', '1', 'monitor:online:list',     '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '在线用户菜单');
insert into sys_menu values(116,  '调度任务', 2,   5,   'job',                                  'monitor/job/index',        '1', '1', 'M', '1', '1', 'monitor:job:list',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '调度任务菜单');
insert into sys_menu values(117,  '调度日志', 2,   6,   'job/inline/log/:jobId',                'monitor/job/log',          '1', '0', 'M', '0', '1', 'monitor:job:log',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '调度日志内嵌隐藏菜单');
insert into sys_menu values(118,  '系统接口', 3,   1,   'swagger',                              'tool/swagger/index',       '1', '1', 'M', '1', '1', 'monitor:swagger:list',    '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统接口菜单');
insert into sys_menu values(119,  '文件上传', 3,   2,   'tool',                                 'tool/upload/index',        '1', '1', 'M', '1', '1', 'monitor:upload',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '文件上传菜单');
insert into sys_menu values(120,  '生成构建', 3,   3,   'build',                                'tool/build/index',         '1', '1', 'M', '1', '1', 'monitor:build',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '文件上传菜单');

-- 三级菜单
insert into sys_menu values(500,  '操作日志', 111, 1,   'operate',                              'system/log/operate/index',    '1', '0', 'M', '1', '1', 'system:log:operate:list',    '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '操作日志菜单');
insert into sys_menu values(501,  '登录日志', 111, 2,   'login',                                'system/log/login/index',      '1', '0', 'M', '1', '1', 'system:log:login:list',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '登录日志菜单');
-- 用户管理按钮
insert into sys_menu values(1000, '用户查询', 100, 1,  '#', '', '1', '1', 'A', '1', '1', 'system:user:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1001, '用户新增', 100, 2,  '#', '', '1', '1', 'A', '1', '1', 'system:user:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1002, '用户修改', 100, 3,  '#', '', '1', '1', 'A', '1', '1', 'system:user:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1003, '用户删除', 100, 4,  '#', '', '1', '1', 'A', '1', '1', 'system:user:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1004, '用户导出', 100, 5,  '#', '', '1', '1', 'A', '1', '1', 'system:user:export',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1005, '用户导入', 100, 6,  '#', '', '1', '1', 'A', '1', '1', 'system:user:import',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1006, '重置密码', 100, 7,  '#', '', '1', '1', 'A', '1', '1', 'system:user:resetPwd',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1007, '账户解锁', 100, 8,  '#', '', '1', '1', 'A', '1', '1', 'system:user:unlock',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 角色管理按钮
insert into sys_menu values(1008, '角色查询', 101, 1,  '#', '', '1', '1', 'A', '1', '1', 'system:role:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1009, '角色新增', 101, 2,  '#', '', '1', '1', 'A', '1', '1', 'system:role:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1010, '角色修改', 101, 3,  '#', '', '1', '1', 'A', '1', '1', 'system:role:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1011, '角色删除', 101, 4,  '#', '', '1', '1', 'A', '1', '1', 'system:role:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1012, '角色导出', 101, 5,  '#', '', '1', '1', 'A', '1', '1', 'system:role:export',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 菜单管理按钮
insert into sys_menu values(1013, '菜单查询', 103, 1,  '#', '', '1', '1', 'A', '1', '1', 'system:menu:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1014, '菜单新增', 103, 2,  '#', '', '1', '1', 'A', '1', '1', 'system:menu:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1015, '菜单修改', 103, 3,  '#', '', '1', '1', 'A', '1', '1', 'system:menu:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1016, '菜单删除', 103, 4,  '#', '', '1', '1', 'A', '1', '1', 'system:menu:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 部门管理按钮
insert into sys_menu values(1017, '部门查询', 104, 1,  '#', '', '1', '1', 'A', '1', '1', 'system:dept:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1018, '部门新增', 104, 2,  '#', '', '1', '1', 'A', '1', '1', 'system:dept:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1019, '部门修改', 104, 3,  '#', '', '1', '1', 'A', '1', '1', 'system:dept:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1020, '部门删除', 104, 4,  '#', '', '1', '1', 'A', '1', '1', 'system:dept:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 岗位管理按钮
insert into sys_menu values(1021, '岗位查询', 105, 1,  '#', '', '1', '1', 'A', '1', '1', 'system:post:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1022, '岗位新增', 105, 2,  '#', '', '1', '1', 'A', '1', '1', 'system:post:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1023, '岗位修改', 105, 3,  '#', '', '1', '1', 'A', '1', '1', 'system:post:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1024, '岗位删除', 105, 4,  '#', '', '1', '1', 'A', '1', '1', 'system:post:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1025, '岗位导出', 105, 5,  '#', '', '1', '1', 'A', '1', '1', 'system:post:export',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 字典管理按钮
insert into sys_menu values(1026, '字典查询', 106, 1, '#', '', '1', '1', 'A', '1', '1', 'system:dict:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1027, '字典新增', 106, 2, '#', '', '1', '1', 'A', '1', '1', 'system:dict:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1028, '字典修改', 106, 3, '#', '', '1', '1', 'A', '1', '1', 'system:dict:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1029, '字典删除', 106, 4, '#', '', '1', '1', 'A', '1', '1', 'system:dict:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1030, '字典导出', 106, 5, '#', '', '1', '1', 'A', '1', '1', 'system:dict:export',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 参数设置按钮
insert into sys_menu values(1031, '参数查询', 108, 1, '#', '', '1', '1', 'A', '1', '1', 'system:config:query',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1032, '参数新增', 108, 2, '#', '', '1', '1', 'A', '1', '1', 'system:config:add',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1033, '参数修改', 108, 3, '#', '', '1', '1', 'A', '1', '1', 'system:config:edit',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1034, '参数删除', 108, 4, '#', '', '1', '1', 'A', '1', '1', 'system:config:remove',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1035, '参数导出', 108, 5, '#', '', '1', '1', 'A', '1', '1', 'system:config:export',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 通知公告按钮
insert into sys_menu values(1036, '公告查询', 109, 1, '#', '', '1', '1', 'A', '1', '1', 'system:notice:query',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1037, '公告新增', 109, 2, '#', '', '1', '1', 'A', '1', '1', 'system:notice:add',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1038, '公告修改', 109, 3, '#', '', '1', '1', 'A', '1', '1', 'system:notice:edit',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1039, '公告删除', 109, 4, '#', '', '1', '1', 'A', '1', '1', 'system:notice:remove',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 操作日志按钮
insert into sys_menu values(1040, '操作查询', 500, 1, '#', '', '1', '1', 'A', '1', '1', 'system:log:operate:query',   '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1041, '操作删除', 500, 2, '#', '', '1', '1', 'A', '1', '1', 'system:log:operate:remove',  '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1042, '日志导出', 500, 3, '#', '', '1', '1', 'A', '1', '1', 'system:log:operate:export',  '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 登录日志按钮
insert into sys_menu values(1043, '登录查询', 501, 1, '#', '', '1', '1', 'A', '1', '1', 'system:log:login:query',     '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1044, '登录删除', 501, 2, '#', '', '1', '1', 'A', '1', '1', 'system:log:login:remove',    '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1045, '日志导出', 501, 3, '#', '', '1', '1', 'A', '1', '1', 'system:log:login:export',    '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 缓存列表按钮
insert into sys_menu values(1046, '缓存查询', 114, 1, '#', '', '1', '1', 'A', '1', '1', 'monitor:cache:query',        '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1047, '缓存删除', 114, 2, '#', '', '1', '1', 'A', '1', '1', 'monitor:cache:remove',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 在线用户按钮
insert into sys_menu values(1048, '在线查询', 115, 1, '#', '', '1', '1', 'A', '1', '1', 'monitor:online:query',       '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1049, '强退用户', 115, 2, '#', '', '1', '1', 'A', '1', '1', 'monitor:online:logout',      '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 调度任务按钮
insert into sys_menu values(1050, '任务查询', 116, 1, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:query',          '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1051, '任务新增', 116, 2, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:add',            '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1052, '任务修改', 116, 3, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:edit',           '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1053, '任务删除', 116, 4, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:remove',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1054, '状态修改', 116, 5, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:status',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values(1055, '任务导出', 116, 6, '#', '', '1', '1', 'A', '1', '1', 'monitor:job:export',         '#', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
drop table if exists sys_user_role;
create table sys_user_role (
  user_id   bigint not null comment '用户ID',
  role_id   bigint not null comment '角色ID',
  primary key(user_id, role_id)
) engine=innodb comment='用户和角色关联表';

-- ----------------------------
-- 初始化-用户和角色关联表数据
-- ----------------------------
insert into sys_user_role values (1, 1);
insert into sys_user_role values (2, 2);


-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
drop table if exists sys_role_menu;
create table sys_role_menu (
  role_id   bigint not null comment '角色ID',
  menu_id   bigint not null comment '菜单ID',
  primary key(role_id, menu_id)
) engine=innodb comment='角色和菜单关联表';

-- ----------------------------
-- 初始化-角色和菜单关联表数据
-- ----------------------------
insert into sys_role_menu values (2, 1);
insert into sys_role_menu values (2, 2);
insert into sys_role_menu values (2, 100);
insert into sys_role_menu values (2, 101);
insert into sys_role_menu values (2, 102);
insert into sys_role_menu values (2, 103);
insert into sys_role_menu values (2, 104);
insert into sys_role_menu values (2, 105);
insert into sys_role_menu values (2, 106);
insert into sys_role_menu values (2, 107);
insert into sys_role_menu values (2, 108);
insert into sys_role_menu values (2, 109);
insert into sys_role_menu values (2, 111);
insert into sys_role_menu values (2, 112);
insert into sys_role_menu values (2, 113);
insert into sys_role_menu values (2, 114);
insert into sys_role_menu values (2, 115);
insert into sys_role_menu values (2, 116);
insert into sys_role_menu values (2, 117);
insert into sys_role_menu values (2, 500);
insert into sys_role_menu values (2, 501);
insert into sys_role_menu values (2, 1000);
insert into sys_role_menu values (2, 1001);
insert into sys_role_menu values (2, 1002);
insert into sys_role_menu values (2, 1003);
insert into sys_role_menu values (2, 1004);
insert into sys_role_menu values (2, 1005);
insert into sys_role_menu values (2, 1006);
insert into sys_role_menu values (2, 1007);
insert into sys_role_menu values (2, 1008);
insert into sys_role_menu values (2, 1010);
insert into sys_role_menu values (2, 1012);
insert into sys_role_menu values (2, 1013);
insert into sys_role_menu values (2, 1014);
insert into sys_role_menu values (2, 1015);
insert into sys_role_menu values (2, 1016);
insert into sys_role_menu values (2, 1017);
insert into sys_role_menu values (2, 1018);
insert into sys_role_menu values (2, 1019);
insert into sys_role_menu values (2, 1020);
insert into sys_role_menu values (2, 1021);
insert into sys_role_menu values (2, 1022);
insert into sys_role_menu values (2, 1023);
insert into sys_role_menu values (2, 1024);
insert into sys_role_menu values (2, 1025);
insert into sys_role_menu values (2, 1026);
insert into sys_role_menu values (2, 1027);
insert into sys_role_menu values (2, 1028);
insert into sys_role_menu values (2, 1029);
insert into sys_role_menu values (2, 1030);
insert into sys_role_menu values (2, 1031);
insert into sys_role_menu values (2, 1032);
insert into sys_role_menu values (2, 1033);
insert into sys_role_menu values (2, 1034);
insert into sys_role_menu values (2, 1035);
insert into sys_role_menu values (2, 1036);
insert into sys_role_menu values (2, 1037);
insert into sys_role_menu values (2, 1038);
insert into sys_role_menu values (2, 1039);
insert into sys_role_menu values (2, 1040);
insert into sys_role_menu values (2, 1041);
insert into sys_role_menu values (2, 1042);
insert into sys_role_menu values (2, 1043);
insert into sys_role_menu values (2, 1044);
insert into sys_role_menu values (2, 1045);
insert into sys_role_menu values (2, 1046);
insert into sys_role_menu values (2, 1047);
insert into sys_role_menu values (2, 1048);
insert into sys_role_menu values (2, 1049);
insert into sys_role_menu values (2, 1050);
insert into sys_role_menu values (2, 1051);
insert into sys_role_menu values (2, 1052);
insert into sys_role_menu values (2, 1054);
insert into sys_role_menu values (2, 1055);


-- ----------------------------
-- 8、角色和部门关联表  角色1-N部门
-- ----------------------------
drop table if exists sys_role_dept;
create table sys_role_dept (
  role_id   bigint not null comment '角色ID',
  dept_id   bigint not null comment '部门ID',
  primary key(role_id, dept_id)
) engine=innodb comment='角色和部门关联表';

-- ----------------------------
-- 初始化-角色和部门关联表数据
-- ----------------------------
insert into sys_role_dept values (2, 100);
insert into sys_role_dept values (2, 101);
insert into sys_role_dept values (2, 105);


-- ----------------------------
-- 9、用户与岗位关联表  用户1-N岗位
-- ----------------------------
drop table if exists sys_user_post;
create table sys_user_post
(
  user_id   bigint not null comment '用户ID',
  post_id   bigint not null comment '岗位ID',
  primary key (user_id, post_id)
) engine=innodb comment = '用户与岗位关联表';

-- ----------------------------
-- 初始化-用户与岗位关联表数据
-- ----------------------------
insert into sys_user_post values (1, 1);
insert into sys_user_post values (2, 2);


-- ----------------------------
-- 10、字典类型表
-- ----------------------------
drop table if exists sys_dict_type;
create table sys_dict_type
(
  dict_id          bigint          not null auto_increment    comment '字典ID',
  dict_name        varchar(64)     not null                   comment '字典名称',
  dict_type        varchar(64)     not null                   comment '字典类型',
  status_flag      varchar(1)      default '0'                comment '状态（0停用 1正常）',
  del_flag         varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(200)    default ''                 comment '备注',
  primary key (dict_id)
) engine=innodb auto_increment=50 comment='字典类型表';

insert into sys_dict_type values(1,  '用户性别',     'sys_user_sex',        '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '用户性别列表');
insert into sys_dict_type values(2,  '菜单状态',     'sys_show_hide',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '菜单状态列表');
insert into sys_dict_type values(3,  '系统开关',     'sys_normal_disable',  '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统开关列表');
insert into sys_dict_type values(4,  '任务状态',     'sys_job_status',      '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务状态列表');
insert into sys_dict_type values(5,  '任务分组',     'sys_job_group',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务分组列表');
insert into sys_dict_type values(6,  '系统是否',     'sys_yes_no',          '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统是否列表');
insert into sys_dict_type values(7,  '通知类型',     'sys_notice_type',     '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知类型列表');
insert into sys_dict_type values(8,  '通知状态',     'sys_notice_status',   '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知状态列表');
insert into sys_dict_type values(9,  '操作类型',     'sys_opera_type',      '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '操作类型列表');
insert into sys_dict_type values(10, '系统状态',     'sys_common_status',   '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '登录状态列表');
insert into sys_dict_type values(11, '任务日志记录', 'sys_job_save_log',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务日志记录列表');


-- ----------------------------
-- 11、字典数据表
-- ----------------------------
drop table if exists sys_dict_data;
create table sys_dict_data
(
  data_id          bigint          not null auto_increment    comment '数据ID',
  dict_type        varchar(64)     not null                   comment '字典类型',
  data_label       varchar(64)     not null                   comment '数据标签',
  data_value       varchar(128)    not null                   comment '数据键值',
  data_sort        int             default 0                  comment '数据排序',
  tag_class        varchar(64)     default ''                 comment '样式属性（样式扩展）',
  tag_type         varchar(12)     default ''                 comment '标签类型（预设颜色）',
  status_flag      varchar(1)      default '0'                comment '状态（0停用 1正常）',
  del_flag         varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(200)    default ''                 comment '备注',
  primary key (data_id)
) engine=innodb auto_increment=100 comment='字典数据表';

insert into sys_dict_data values(1,    'sys_user_sex',          '未选择',       '0',          1,   '',   '',              '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别未选择');
insert into sys_dict_data values(2,    'sys_user_sex',          '男',           '1',          2,   '',   '',              '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别男');
insert into sys_dict_data values(3,    'sys_user_sex',          '女',           '2',          3,   '',   '',              '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别女');
insert into sys_dict_data values(4,    'sys_show_hide',         '显示',         '1',          1,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '显示菜单');
insert into sys_dict_data values(5,    'sys_show_hide',         '隐藏',         '0',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '隐藏菜单');
insert into sys_dict_data values(6,    'sys_normal_disable',    '正常',         '1',          1,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(7,    'sys_normal_disable',    '停用',         '0',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(8,    'sys_job_status',        '开启',         '1',          1,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(9,    'sys_job_status',        '关闭',         '0',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(10,   'sys_job_group',         '默认',         'DEFAULT',    1,   '',   '',              '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '默认分组');
insert into sys_dict_data values(11,   'sys_job_group',         '系统',         'SYSTEM',     2,   '',   '',              '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统分组');
insert into sys_dict_data values(12,   'sys_yes_no',            '是',           'Y',          1,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统默认是');
insert into sys_dict_data values(13,   'sys_yes_no',            '否',           'N',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统默认否');
insert into sys_dict_data values(14,   'sys_notice_type',       '通知',         '1',          1,   '',   'warning',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知');
insert into sys_dict_data values(15,   'sys_notice_type',       '公告',         '2',          2,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '公告');
insert into sys_dict_data values(16,   'sys_notice_status',     '正常',         '1',          1,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(17,   'sys_notice_status',     '关闭',         '0',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '关闭状态');
insert into sys_dict_data values(18,   'sys_opera_type',        '其他',         '0',          0,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '其他操作');
insert into sys_dict_data values(19,   'sys_opera_type',        '新增',         '1',          1,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '新增操作');
insert into sys_dict_data values(20,   'sys_opera_type',        '修改',         '2',          2,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '修改操作');
insert into sys_dict_data values(21,   'sys_opera_type',        '删除',         '3',          3,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '删除操作');
insert into sys_dict_data values(22,   'sys_opera_type',        '授权',         '4',          4,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '授权操作');
insert into sys_dict_data values(23,   'sys_opera_type',        '导出',         '5',          5,   '',   'warning',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导出操作');
insert into sys_dict_data values(24,   'sys_opera_type',        '导入',         '6',          6,   '',   'warning',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导入操作');
insert into sys_dict_data values(25,   'sys_opera_type',        '强退',         '7',          7,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '强退操作');
insert into sys_dict_data values(26,   'sys_opera_type',        '清空',         '8',          8,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '清空操作');
insert into sys_dict_data values(27,   'sys_common_status',     '成功',         '1',          1,   '',   'success',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(28,   'sys_common_status',     '失败',         '0',          2,   '',   'error',         '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(29,   'sys_job_save_log',      '不记录',       '0',          1,   '',   'warning',       '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '不记录日志');
insert into sys_dict_data values(30,   'sys_job_save_log',      '记录',         '1',          2,   '',   'processing',    '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '记录日志');


-- ----------------------------
-- 12、参数配置表
-- ----------------------------
drop table if exists sys_config;
create table sys_config (
  config_id         bigint          not null auto_increment    comment '参数ID',
  config_name       varchar(64)     default ''                 comment '参数名称',
  config_key        varchar(64)     default ''                 comment '参数键名',
  config_value      varchar(128)    default ''                 comment '参数键值',
  config_type       varchar(1)      default 'N'                comment '系统内置（Y是 N否）',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (config_id)
) engine=innodb auto_increment=50 comment='参数配置表';

-- ----------------------------
-- 初始化-参数配置表数据
-- ----------------------------
insert into sys_config values(1, '用户管理-账号初始密码',           'sys.user.initPassword',                  'Abcd@1234..',   'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导入用户初始化密码 123456' );
insert into sys_config values(2, '账号认证-验证码开关',             'sys.account.captchaEnabled',             'true',          'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '是否开启验证码功能（true开启，false关闭）');
insert into sys_config values(3, '账号认证-验证码类型',             'sys.account.captchaType',                'math',          'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '使用验证码类型（math数值计算，char字符验证）');
insert into sys_config values(4, '账号认证-是否开启用户注册功能',    'sys.account.registerUser',               'false',         'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '是否开启用户注册功能（true开启，false关闭）');
insert into sys_config values(5, '账号认证-密码尝试错误最大次数',    'sys.account.passwordRetryMaxCount',      '5',             'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '密码尝试错误最大次数，单位（次）');
insert into sys_config values(6, '账号认证-密码尝试错误后锁定时间',  'sys.account.passwordRetryLockTime',      '10',            'Y', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '密码尝试错误后锁定时间，单位（分钟）');


-- ----------------------------
-- 13、系统操作日志表
-- ----------------------------
drop table if exists sys_log_operate;
create table sys_log_operate (
  id                bigint          not null auto_increment    comment '操作ID',
  title             varchar(32)     default ''                 comment '模块标题',
  business_type     varchar(1)      default '0'                comment '业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据）',
  opera_url         varchar(200)    default ''                 comment '请求URL',
  opera_url_method  varchar(10)     default ''                 comment '请求方式',
  opera_ip          varchar(128)    default ''                 comment '主机地址',
  opera_location    varchar(32)     default ''                 comment '操作地点',
  opera_param       varchar(2000)   default ''                 comment '请求参数',
  opera_msg         varchar(2000)   default ''                 comment '操作消息',
  opera_method      varchar(64)     default ''                 comment '方法名称',
  opera_by          varchar(64)     default ''                 comment '操作人员',
  opera_time        bigint          default 0                  comment '操作时间',
  status_flag       varchar(1)      default '0'                comment '操作状态（0异常 1正常）',
  cost_time         bigint          default 0                  comment '消耗时间（毫秒）',
  primary key (id)
) engine=innodb auto_increment=1 comment='系统操作日志表';


-- ----------------------------
-- 14、系统登录日志表
-- ----------------------------
drop table if exists sys_log_login;
create table sys_log_login (
  id             bigint         not null auto_increment   comment '登录ID',
  user_name      varchar(32)    default ''                comment '用户账号',
  login_ip       varchar(128)   default ''                comment '登录IP地址',
  login_location varchar(32)    default ''                comment '登录地点',
  browser        varchar(64)    default ''                comment '浏览器类型',
  os             varchar(64)    default ''                comment '操作系统',
  status_flag    varchar(1)     default '0'               comment '登录状态（0失败 1成功）',
  msg            varchar(255)   default ''                comment '提示消息',
  login_time     bigint         default 0                 comment '登录时间',
  primary key (id)
) engine=innodb auto_increment=1 comment='系统登录日志表';


-- ----------------------------
-- 15、调度任务调度表
-- ----------------------------
drop table if exists sys_job;
create table sys_job (
  job_id              bigint        not null auto_increment    comment '任务ID',
  job_name            varchar(64)   default ''                 comment '任务名称',
  job_group           varchar(32)   default 'DEFAULT'          comment '任务组名',
  invoke_target       varchar(64)   not null                   comment '调用目标字符串',
  target_params       varchar(500)  default ''                 comment '调用目标传入参数',
  cron_expression     varchar(64)   default ''                 comment 'cron执行表达式',
  misfire_policy      varchar(1)    default '3'                comment '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  concurrent          varchar(1)    default '0'                comment '是否并发执行（0禁止 1允许）',
  status_flag         varchar(1)    default '0'                comment '任务状态（0暂停 1正常）',
  save_log            varchar(1)    default '0'                comment '是否记录任务日志（0不记录 1记录）',
  create_by           varchar(64)   default ''                 comment '创建者',
  create_time         bigint        default 0                  comment '创建时间',
  update_by           varchar(64)   default ''                 comment '更新者',
  update_time         bigint        default 0                  comment '更新时间',
  remark              varchar(200)  default ''                 comment '备注',
  primary key (job_id),
  unique key uk_name_group (job_name, job_group)
) engine=innodb auto_increment=10 comment='调度任务调度表';

-- ----------------------------
-- 初始化-调度任务调度表数据
-- ----------------------------
insert into sys_job values(1, '触发执行', 'SYSTEM', 'simple', '{"t":10}', '0/10 * * * * ?', '3', '0', '0', '1', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_job values(2, '缓慢执行', 'SYSTEM', 'foo',    '{"t":15}', '0/15 * * * * ?', '3', '0', '0', '1', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_job values(3, '异常执行', 'SYSTEM', 'bar',    '{"t":20}', '0/20 * * * * ?', '3', '0', '0', '1', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 16、调度任务调度日志表
-- ----------------------------
drop table if exists sys_job_log;
create table sys_job_log (
  log_id              bigint         not null auto_increment    comment '任务日志ID',
  job_name            varchar(64)    not null                   comment '任务名称',
  job_group           varchar(32)    not null                   comment '任务组名',
  invoke_target       varchar(64)    not null                   comment '调用目标字符串',
  target_params       varchar(500)   default ''                 comment '调用目标传入参数',
  job_msg             varchar(500)   default ''                 comment '日志信息',
  status_flag         varchar(1)     default '0'                comment '执行状态（0失败 1正常）',
  create_time         bigint         default 0                  comment '创建时间',
  cost_time           bigint         default 0                  comment '消耗时间（毫秒）',
  primary key (log_id),
  key idx_name_group (job_name, job_group) USING BTREE COMMENT '名称_组名'
) engine=innodb comment = '调度任务调度日志表';


-- ----------------------------
-- 17、通知公告表
-- ----------------------------
drop table if exists sys_notice;
create table sys_notice (
  notice_id         bigint          not null auto_increment    comment '公告ID',
  notice_title      varchar(50)     not null                   comment '公告标题',
  notice_type       varchar(1)      not null                   comment '公告类型（1通知 2公告）',
  notice_content    varchar(3000)   default ''                 comment '公告内容',
  status_flag       varchar(1)      default '0'                comment '公告状态（0关闭 1正常）',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (notice_id)
) engine=innodb auto_increment=10 comment = '通知公告表';

-- ----------------------------
-- 初始化-公告信息表数据
-- ----------------------------
insert into sys_notice values('1', '温馨提醒：2022-11-05 MASK新版本发布啦', '2', '新版本内容', '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '初始数据');
insert into sys_notice values('2', '维护通知：2022-11-10 MASK系统凌晨维护', '1', '维护内容',   '1', '0', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '初始数据');

