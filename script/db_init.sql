
-- ----------------------------
-- 0、测试ORM表
-- ----------------------------
drop table if exists zz_orm;
create table zz_orm (
  id                int             not null auto_increment    comment '测试ID',
  title             varchar(50)     not null                   comment '测试标题',
  orm_type          varchar(50)     not null                   comment 'orm类型',
  status            char(1)         default '0'                comment '状态（0关闭 1正常）',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(500)    default ''                 comment '备注',
  primary key (id)
) engine=innodb auto_increment=10 comment = '测试ORM表';

-- ----------------------------
-- 初始化-测试ORM表数据
-- ----------------------------
insert into zz_orm values('1', 'MySQL', 'mysql', '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '测试ORM');
insert into zz_orm values('2', 'PgSQL', 'pg',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '测试ORM');



-- ----------------------------
-- 测试zz_表，根据模块dome内删除其引用
-- 系统初始17张数据表，前缀sys_开头
-- ----------------------------



-- ----------------------------
-- 1、部门表
-- ----------------------------
drop table if exists sys_dept;
create table sys_dept (
  dept_id           bigint          not null auto_increment    comment '部门id',
  parent_id         bigint          default 0                  comment '父部门id 默认0',
  ancestors         varchar(50)     default ''                 comment '祖级列表',
  dept_name         varchar(30)     default ''                 comment '部门名称',
  order_num         int             default 0                  comment '显示顺序',
  leader            varchar(20)     default null               comment '负责人',
  phone             varchar(11)     default null               comment '联系电话',
  email             varchar(50)     default null               comment '邮箱',
  status            char(1)         default '0'                comment '部门状态（0停用 1正常）',
  del_flag          char(1)         default '0'                comment '删除标志（0代表存在 1代表删除）',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  primary key (dept_id)
) engine=innodb auto_increment=200 comment = '部门表';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------
insert into sys_dept values(100,  0,   '0',          'MASK科技',   0, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(101,  100, '0,100',      '广西总公司', 1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(102,  100, '0,100',      '广东分公司', 2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(103,  101, '0,100,101',  '研发部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(104,  101, '0,100,101',  '市场部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(105,  101, '0,100,101',  '测试部门',   3, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(106,  101, '0,100,101',  '财务部门',   4, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(107,  101, '0,100,101',  '运维部门',   5, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(108,  102, '0,100,102',  '市场部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);
insert into sys_dept values(109,  102, '0,100,102',  '财务部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', null);

-- ----------------------------
-- 2、用户信息表
-- ----------------------------
drop table if exists sys_user;
create table sys_user (
  user_id           bigint          not null auto_increment    comment '用户ID',
  dept_id           bigint          default null               comment '部门ID',
  user_name         varchar(30)     not null                   comment '用户账号',
  nick_name         varchar(30)     not null                   comment '用户昵称',
  user_type         varchar(20)     default 'sys'              comment '用户类型（sys系统用户）',
  email             varchar(50)     default ''                 comment '用户邮箱',
  phonenumber       varchar(11)     default ''                 comment '手机号码',
  sex               char(1)         default '0'                comment '用户性别（0未知 1男 2女）',
  avatar            varchar(255)    default ''                 comment '头像地址',
  password          varchar(100)    default ''                 comment '密码',
  status            char(1)         default '0'                comment '帐号状态（0停用 1正常）',
  del_flag          char(1)         default '0'                comment '删除标志（0代表存在 1代表删除）',
  login_ip          varchar(128)    default ''                 comment '最后登录IP',
  login_date        bigint          default 0                  comment '最后登录时间',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (user_id)
) engine=innodb auto_increment=100 comment = '用户信息表';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
insert into sys_user values(1,  103, 'maskAdmin', '管理员',    'sys', 'maskAdmin@163.com', '15612341234', '1', '', '$2y$10$a6y06cCCB2Dl3wmwN5eRmO5oLuu7eSrEKKl0hwCizJsKcIPFZh0fa', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(now(3)),'.',''), 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');
insert into sys_user values(2,  105, 'maskUser',  '普通用户',  'sys', 'maskUser@qq.com',   '13412341234', '1', '', '$2y$10$MZWv2ptjit8uQA4LjXq6nOBtGsl1NmCo2iuzWiYAs7o7UtnLzckd.', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(now(3)),'.',''), 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '普通人员');


-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
drop table if exists sys_post;
create table sys_post
(
  post_id       bigint          not null auto_increment    comment '岗位ID',
  post_code     varchar(50)     not null                   comment '岗位编码',
  post_name     varchar(50)     not null                   comment '岗位名称',
  post_sort     int             default 0                  comment '显示顺序',
  status        char(1)         default '0'                comment '状态（0停用 1正常）',
  create_by     varchar(50)     default ''                 comment '创建者',
  create_time   bigint          default 0                  comment '创建时间',
  update_by     varchar(50)     default ''                 comment '更新者',
  update_time   bigint          default 0                  comment '更新时间',
  remark        varchar(500)    default null               comment '备注',
  primary key (post_id)
) engine=innodb comment = '岗位信息表';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
insert into sys_post values(1, 'ceo',  '董事长',    1, '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(2, 'se',   '项目经理',  2, '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(3, 'hr',   '人力资源',  3, '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_post values(4, 'user', '普通员工',  4, '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 4、角色信息表
-- ----------------------------
drop table if exists sys_role;
create table sys_role (
  role_id              bigint          not null auto_increment    comment '角色ID',
  role_name            varchar(30)     not null                   comment '角色名称',
  role_key             varchar(50)     not null                   comment '角色键值',
  role_sort            int             default 0                  comment '显示顺序',
  data_scope           char(1)         default '5'                comment '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限）',
  menu_check_strictly  char(1)         default '1'                comment '菜单树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示）',
  dept_check_strictly  char(1)         default '1'                comment '部门树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示 ）',
  status               char(1)         default '0'                comment '角色状态（0停用 1正常）',
  del_flag             char(1)         default '0'                comment '删除标志（0代表存在 1代表删除）',
  create_by            varchar(50)     default ''                 comment '创建者',
  create_time          bigint          default 0                  comment '创建时间',
  update_by            varchar(50)     default ''                 comment '更新者',
  update_time          bigint          default 0                  comment '更新时间',
  remark               varchar(500)    default null               comment '备注',
  primary key (role_id)
) engine=innodb auto_increment=100 comment = '角色信息表';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
insert into sys_role values('1', '管理员',   'admin',      1, '1', '1', '1', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');
insert into sys_role values('2', '普通角色', 'common',     2, '2', '1', '1', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '普通角色');


-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
drop table if exists sys_menu;
create table sys_menu (
  menu_id           bigint          not null auto_increment    comment '菜单ID',
  menu_name         varchar(50)     not null                   comment '菜单名称',
  parent_id         bigint          default 0                  comment '父菜单ID 默认0',
  menu_sort         int             default 0                  comment '显示顺序',
  path              varchar(200)    default ''                 comment '路由地址',
  component         varchar(200)    default ''                 comment '组件路径',
  is_frame          char(1)         default '1'                comment '是否内部跳转（0否 1是）',
  is_cache          char(1)         default '0'                comment '是否缓存（0不缓存 1缓存）',
  menu_type         char(1)         not null                   comment '菜单类型（D目录 M菜单 B按钮）',
  visible           char(1)         default '0'                comment '是否显示（0隐藏 1显示）',
  status            char(1)         default '0'                comment '菜单状态（0停用 1正常）',
  perms             varchar(100)    default null               comment '权限标识',
  icon              varchar(100)    default '#'                comment '菜单图标（#无图标）',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(500)    default ''                 comment '备注',
  primary key (menu_id)
) engine=innodb auto_increment=2000 comment = '菜单权限表';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
insert into sys_menu values('1', '系统管理', '0', '1', 'system',                   '', '1', '1', 'D', '1', '1', '', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统管理目录');
insert into sys_menu values('2', '系统监控', '0', '2', 'monitor',                  '', '1', '1', 'D', '1', '1', '', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统监控目录');
insert into sys_menu values('3', '系统工具', '0', '3', 'tool',                     '', '1', '1', 'D', '1', '1', '', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统工具目录');
insert into sys_menu values('4', '开源仓库', '0', '4', 'https://gitee.com/TsMask', '', '0', '0', 'D', '1', '1', '', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '开源仓库跳转外部链接打开新窗口');
-- 二级菜单
insert into sys_menu values('100',  '用户管理', '1',   '1',   'user',                                 'system/user/index',        '1', '1', 'M', '1', '1', 'system:user:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '用户管理菜单');
insert into sys_menu values('101',  '角色管理', '1',   '2',   'role',                                 'system/role/index',        '1', '1', 'M', '1', '1', 'system:role:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '角色管理菜单');
insert into sys_menu values('102',  '分配角色', '1',   '3',   'role/inline/auth-user/:roleId',        'system/role/auth-user',    '1', '1', 'M', '0', '1', 'system:role:auth',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '分配角色内嵌隐藏菜单');
insert into sys_menu values('103',  '菜单管理', '1',   '4',   'menu',                                 'system/menu/index',        '1', '1', 'M', '1', '1', 'system:menu:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '菜单管理菜单');
insert into sys_menu values('104',  '部门管理', '1',   '5',   'dept',                                 'system/dept/index',        '1', '1', 'M', '1', '1', 'system:dept:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '部门管理菜单');
insert into sys_menu values('105',  '岗位管理', '1',   '6',   'post',                                 'system/post/index',        '1', '1', 'M', '1', '1', 'system:post:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '岗位管理菜单');
insert into sys_menu values('106',  '字典管理', '1',   '7',   'dict',                                 'system/dict/index',        '1', '1', 'M', '1', '1', 'system:dict:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '字典管理菜单');
insert into sys_menu values('107',  '字典数据', '1',   '8',   'dict/inline/data/:dictId',             'system/dict/data',         '1', '1', 'M', '0', '1', 'system:dict:data',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '字典数据内嵌隐藏菜单');
insert into sys_menu values('108',  '参数设置', '1',   '9',   'config',                               'system/config/index',      '1', '1', 'M', '1', '1', 'system:config:list',      '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '参数设置菜单');
insert into sys_menu values('109',  '通知公告', '1',   '10',  'notice',                               'system/notice/index',      '1', '1', 'M', '1', '1', 'system:notice:list',      '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知公告菜单');
insert into sys_menu values('111',  '系统日志', '1',   '11',  'log',                                  '',                         '1', '1', 'D', '1', '1', '',                        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '日志管理菜单');
insert into sys_menu values('112',  '系统信息', '2',   '1',   'system-info',                          'monitor/system/info',      '1', '1', 'M', '1', '1', 'monitor:system:info',     '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统信息菜单');
insert into sys_menu values('113',  '缓存信息', '2',   '2',   'cache-info',                           'monitor/cache/info',       '1', '1', 'M', '1', '1', 'monitor:cache:info',      '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '缓存信息菜单');
insert into sys_menu values('114',  '缓存管理', '2',   '3',   'cache',                                'monitor/cache/index',      '1', '1', 'M', '1', '1', 'monitor:cache:list',      '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '缓存列表菜单');
insert into sys_menu values('115',  '在线用户', '2',   '4',   'online',                               'monitor/online/index',     '1', '1', 'M', '1', '1', 'monitor:online:list',     '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '在线用户菜单');
insert into sys_menu values('116',  '调度任务', '2',   '5',   'job',                                  'monitor/job/index',        '1', '1', 'M', '1', '1', 'monitor:job:list',        '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '调度任务菜单');
insert into sys_menu values('117',  '调度日志', '2',   '6',   'job/inline/log/:jobId',                'monitor/job/log',          '1', '1', 'M', '0', '1', 'monitor:job:log',         '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '调度日志内嵌隐藏菜单');
insert into sys_menu values('118',  '系统接口', '3',   '1',   'swagger',                              'tool/swagger/index',       '1', '1', 'M', '1', '1', 'monitor:swagger:list',    '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统接口菜单');
-- 三级菜单
insert into sys_menu values('500',  '操作日志', '111', '1',   'operate',                              'system/log/operate/index',    '1', '1', 'M', '1', '1', 'system:log:operate:list',    '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '操作日志菜单');
insert into sys_menu values('501',  '登录日志', '111', '2',   'login',                                'system/log/login/index',      '1', '1', 'M', '1', '1', 'system:log:login:list',      '#',    'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '登录日志菜单');
-- 用户管理按钮
insert into sys_menu values('1000', '用户查询', '100', '1',  '', '', '1', '1', 'B', '1', '1', 'system:user:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1001', '用户新增', '100', '2',  '', '', '1', '1', 'B', '1', '1', 'system:user:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1002', '用户修改', '100', '3',  '', '', '1', '1', 'B', '1', '1', 'system:user:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1003', '用户删除', '100', '4',  '', '', '1', '1', 'B', '1', '1', 'system:user:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1004', '用户导出', '100', '5',  '', '', '1', '1', 'B', '1', '1', 'system:user:export',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1005', '用户导入', '100', '6',  '', '', '1', '1', 'B', '1', '1', 'system:user:import',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1006', '重置密码', '100', '7',  '', '', '1', '1', 'B', '1', '1', 'system:user:resetPwd',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 角色管理按钮
insert into sys_menu values('1007', '角色查询', '101', '1',  '', '', '1', '1', 'B', '1', '1', 'system:role:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1008', '角色新增', '101', '2',  '', '', '1', '1', 'B', '1', '1', 'system:role:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1009', '角色修改', '101', '3',  '', '', '1', '1', 'B', '1', '1', 'system:role:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1010', '角色删除', '101', '4',  '', '', '1', '1', 'B', '1', '1', 'system:role:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1011', '角色导出', '101', '5',  '', '', '1', '1', 'B', '1', '1', 'system:role:export',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 菜单管理按钮
insert into sys_menu values('1012', '菜单查询', '103', '1',  '', '', '1', '1', 'B', '1', '1', 'system:menu:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1013', '菜单新增', '103', '2',  '', '', '1', '1', 'B', '1', '1', 'system:menu:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1014', '菜单修改', '103', '3',  '', '', '1', '1', 'B', '1', '1', 'system:menu:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1015', '菜单删除', '103', '4',  '', '', '1', '1', 'B', '1', '1', 'system:menu:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 部门管理按钮
insert into sys_menu values('1016', '部门查询', '104', '1',  '', '', '1', '1', 'B', '1', '1', 'system:dept:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1017', '部门新增', '104', '2',  '', '', '1', '1', 'B', '1', '1', 'system:dept:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1018', '部门修改', '104', '3',  '', '', '1', '1', 'B', '1', '1', 'system:dept:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1019', '部门删除', '104', '4',  '', '', '1', '1', 'B', '1', '1', 'system:dept:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 岗位管理按钮
insert into sys_menu values('1020', '岗位查询', '105', '1',  '', '', '1', '1', 'B', '1', '1', 'system:post:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1021', '岗位新增', '105', '2',  '', '', '1', '1', 'B', '1', '1', 'system:post:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1022', '岗位修改', '105', '3',  '', '', '1', '1', 'B', '1', '1', 'system:post:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1023', '岗位删除', '105', '4',  '', '', '1', '1', 'B', '1', '1', 'system:post:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1024', '岗位导出', '105', '5',  '', '', '1', '1', 'B', '1', '1', 'system:post:export',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 字典管理按钮
insert into sys_menu values('1025', '字典查询', '106', '1', '#', '', '1', '1', 'B', '1', '1', 'system:dict:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1026', '字典新增', '106', '2', '#', '', '1', '1', 'B', '1', '1', 'system:dict:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1027', '字典修改', '106', '3', '#', '', '1', '1', 'B', '1', '1', 'system:dict:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1028', '字典删除', '106', '4', '#', '', '1', '1', 'B', '1', '1', 'system:dict:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1029', '字典导出', '106', '5', '#', '', '1', '1', 'B', '1', '1', 'system:dict:export',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 参数设置按钮
insert into sys_menu values('1030', '参数查询', '108', '1', '#', '', '1', '1', 'B', '1', '1', 'system:config:query',        '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1031', '参数新增', '108', '2', '#', '', '1', '1', 'B', '1', '1', 'system:config:add',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1032', '参数修改', '108', '3', '#', '', '1', '1', 'B', '1', '1', 'system:config:edit',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1033', '参数删除', '108', '4', '#', '', '1', '1', 'B', '1', '1', 'system:config:remove',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1034', '参数导出', '108', '5', '#', '', '1', '1', 'B', '1', '1', 'system:config:export',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 通知公告按钮
insert into sys_menu values('1035', '公告查询', '109', '1', '#', '', '1', '1', 'B', '1', '1', 'system:notice:query',        '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1036', '公告新增', '109', '2', '#', '', '1', '1', 'B', '1', '1', 'system:notice:add',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1037', '公告修改', '109', '3', '#', '', '1', '1', 'B', '1', '1', 'system:notice:edit',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1038', '公告删除', '109', '4', '#', '', '1', '1', 'B', '1', '1', 'system:notice:remove',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 操作日志按钮
insert into sys_menu values('1039', '操作查询', '500', '1', '#', '', '1', '1', 'B', '1', '1', 'system:log:operate:query',   '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1040', '操作删除', '500', '2', '#', '', '1', '1', 'B', '1', '1', 'system:log:operate:remove',  '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1041', '日志导出', '500', '3', '#', '', '1', '1', 'B', '1', '1', 'system:log:operate:export',  '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 登录日志按钮
insert into sys_menu values('1042', '登录查询', '501', '1', '#', '', '1', '1', 'B', '1', '1', 'system:log:login:query',     '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1043', '登录删除', '501', '2', '#', '', '1', '1', 'B', '1', '1', 'system:log:login:remove',    '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1044', '日志导出', '501', '3', '#', '', '1', '1', 'B', '1', '1', 'system:log:login:export',    '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1045', '账户解锁', '501', '4', '#', '', '1', '1', 'B', '1', '1', 'system:log:login:unlock',    '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 缓存列表按钮
insert into sys_menu values('1046', '缓存查询', '114', '1', '#', '', '1', '1', 'B', '1', '1', 'monitor:cache:query',        '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1047', '缓存删除', '114', '2', '#', '', '1', '1', 'B', '1', '1', 'monitor:cache:remove',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 在线用户按钮
insert into sys_menu values('1048', '在线查询', '115', '1', '#', '', '1', '1', 'B', '1', '1', 'monitor:online:query',       '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1049', '批量强退', '115', '2', '#', '', '1', '1', 'B', '1', '1', 'monitor:online:batchLogout', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1050', '单条强退', '115', '3', '#', '', '1', '1', 'B', '1', '1', 'monitor:online:forceLogout', '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
-- 调度任务按钮
insert into sys_menu values('1051', '任务查询', '116', '1', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:query',          '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1052', '任务新增', '116', '2', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:add',            '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1053', '任务修改', '116', '3', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:edit',           '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1054', '任务删除', '116', '4', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:remove',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1055', '状态修改', '116', '5', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:changeStatus',   '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_menu values('1056', '任务导出', '116', '6', '#', '', '1', '1', 'B', '1', '1', 'monitor:job:export',         '#', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
drop table if exists sys_user_role;
create table sys_user_role (
  user_id   bigint not null comment '用户ID',
  role_id   bigint not null comment '角色ID',
  primary key(user_id, role_id)
) engine=innodb comment = '用户和角色关联表';

-- ----------------------------
-- 初始化-用户和角色关联表数据
-- ----------------------------
insert into sys_user_role values ('1', '1');
insert into sys_user_role values ('2', '2');


-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
drop table if exists sys_role_menu;
create table sys_role_menu (
  role_id   bigint not null comment '角色ID',
  menu_id   bigint not null comment '菜单ID',
  primary key(role_id, menu_id)
) engine=innodb comment = '角色和菜单关联表';

-- ----------------------------
-- 初始化-角色和菜单关联表数据
-- ----------------------------
insert into sys_role_menu values ('2', '1');
insert into sys_role_menu values ('2', '4');
insert into sys_role_menu values ('2', '100');
insert into sys_role_menu values ('2', '104');
insert into sys_role_menu values ('2', '105');
insert into sys_role_menu values ('2', '106');
insert into sys_role_menu values ('2', '109');
insert into sys_role_menu values ('2', '1000');
insert into sys_role_menu values ('2', '1016');
insert into sys_role_menu values ('2', '1020');
insert into sys_role_menu values ('2', '1025');
insert into sys_role_menu values ('2', '1035');


-- ----------------------------
-- 8、角色和部门关联表  角色1-N部门
-- ----------------------------
drop table if exists sys_role_dept;
create table sys_role_dept (
  role_id   bigint not null comment '角色ID',
  dept_id   bigint not null comment '部门ID',
  primary key(role_id, dept_id)
) engine=innodb comment = '角色和部门关联表';

-- ----------------------------
-- 初始化-角色和部门关联表数据
-- ----------------------------
insert into sys_role_dept values ('2', '100');
insert into sys_role_dept values ('2', '101');
insert into sys_role_dept values ('2', '105');


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
insert into sys_user_post values ('1', '1');
insert into sys_user_post values ('2', '2');


-- ----------------------------
-- 10、字典类型表
-- ----------------------------
drop table if exists sys_dict_type;
create table sys_dict_type
(
  dict_id          bigint          not null auto_increment    comment '字典主键',
  dict_name        varchar(50)     default ''                 comment '字典名称',
  dict_type        varchar(50)     default ''                 comment '字典类型',
  status           char(1)         default '0'                comment '状态（0停用 1正常）',
  create_by        varchar(50)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(50)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_id),
  unique (dict_type)
) engine=innodb auto_increment=100 comment = '字典类型表';

insert into sys_dict_type values(1,  '用户性别',     'sys_user_sex',        '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '用户性别列表');
insert into sys_dict_type values(2,  '菜单状态',     'sys_show_hide',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '菜单状态列表');
insert into sys_dict_type values(3,  '系统开关',     'sys_normal_disable',  '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统开关列表');
insert into sys_dict_type values(4,  '任务状态',     'sys_job_status',      '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务状态列表');
insert into sys_dict_type values(5,  '任务分组',     'sys_job_group',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务分组列表');
insert into sys_dict_type values(6,  '系统是否',     'sys_yes_no',          '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统是否列表');
insert into sys_dict_type values(7,  '通知类型',     'sys_notice_type',     '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知类型列表');
insert into sys_dict_type values(8,  '通知状态',     'sys_notice_status',   '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知状态列表');
insert into sys_dict_type values(9,  '操作类型',     'sys_oper_type',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '操作类型列表');
insert into sys_dict_type values(10, '系统状态',     'sys_common_status',   '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '登录状态列表');
insert into sys_dict_type values(11, '任务日志记录', 'sys_job_save_log',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '任务日志记录列表');


-- ----------------------------
-- 11、字典数据表
-- ----------------------------
drop table if exists sys_dict_data;
create table sys_dict_data
(
  dict_code        bigint          not null auto_increment    comment '字典编码',
  dict_sort        int             default 0                  comment '字典排序',
  dict_label       varchar(50)     default ''                 comment '字典标签',
  dict_value       varchar(50)     default ''                 comment '字典键值',
  dict_type        varchar(50)     default ''                 comment '字典类型',
  tag_class        varchar(50)     default null               comment '样式属性（样式扩展）',
  tag_type         varchar(50)     default null               comment '标签类型（预设颜色）',
  status           char(1)         default '0'                comment '状态（0停用 1正常）',
  create_by        varchar(50)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(50)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_code)
) engine=innodb auto_increment=100 comment = '字典数据表';

insert into sys_dict_data values(1,  1,  '未知',         '0',         'sys_user_sex',        '',   '',              '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别未知');
insert into sys_dict_data values(2,  2,  '男',           '1',         'sys_user_sex',        '',   '',              '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别男');
insert into sys_dict_data values(3,  3,  '女',           '2',         'sys_user_sex',        '',   '',              '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '性别女');
insert into sys_dict_data values(4,  1,  '显示',         '1',         'sys_show_hide',       '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '显示菜单');
insert into sys_dict_data values(5,  2,  '隐藏',         '0',         'sys_show_hide',       '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '隐藏菜单');
insert into sys_dict_data values(6,  1,  '正常',         '1',         'sys_normal_disable',  '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(7,  2,  '停用',         '0',         'sys_normal_disable',  '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(8,  1,  '正常',         '1',         'sys_job_status',      '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(9,  2,  '暂停',         '0',         'sys_job_status',      '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(10, 1,  '默认',         'DEFAULT',   'sys_job_group',       '',   '',              '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '默认分组');
insert into sys_dict_data values(11, 2,  '系统',         'SYSTEM',    'sys_job_group',       '',   '',              '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统分组');
insert into sys_dict_data values(12, 1,  '是',           'Y',         'sys_yes_no',          '',   'processing',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统默认是');
insert into sys_dict_data values(13, 2,  '否',           'N',         'sys_yes_no',          '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '系统默认否');
insert into sys_dict_data values(14, 1,  '通知',         '1',         'sys_notice_type',     '',   'warning',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '通知');
insert into sys_dict_data values(15, 2,  '公告',         '2',         'sys_notice_type',     '',   'processing',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '公告');
insert into sys_dict_data values(16, 1,  '正常',         '1',         'sys_notice_status',   '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(17, 2,  '关闭',         '0',         'sys_notice_status',   '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '关闭状态');
insert into sys_dict_data values(18, 99, '其他',         '0',         'sys_oper_type',       '',   'processing',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '其他操作');
insert into sys_dict_data values(19, 1,  '新增',         '1',         'sys_oper_type',       '',   'processing',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '新增操作');
insert into sys_dict_data values(20, 2,  '修改',         '2',         'sys_oper_type',       '',   'processing',    '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '修改操作');
insert into sys_dict_data values(21, 3,  '删除',         '3',         'sys_oper_type',       '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '删除操作');
insert into sys_dict_data values(22, 4,  '授权',         '4',         'sys_oper_type',       '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '授权操作');
insert into sys_dict_data values(23, 5,  '导出',         '5',         'sys_oper_type',       '',   'warning',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导出操作');
insert into sys_dict_data values(24, 6,  '导入',         '6',         'sys_oper_type',       '',   'warning',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导入操作');
insert into sys_dict_data values(25, 7,  '强退',         '7',         'sys_oper_type',       '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '强退操作');
insert into sys_dict_data values(26, 8,  '清空',         '8',         'sys_oper_type',       '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '清空操作');
insert into sys_dict_data values(27, 1,  '成功',         '1',         'sys_common_status',   '',   'success',       '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '正常状态');
insert into sys_dict_data values(28, 2,  '失败',         '0',         'sys_common_status',   '',   'error',         '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '停用状态');
insert into sys_dict_data values(29, 1,  '不记录',        '0',         'sys_job_save_log',   '',   'warning',               '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '不记录日志');
insert into sys_dict_data values(30, 2,  '记录',          '1',         'sys_job_save_log',   '',   'processing',               '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '记录日志');


-- ----------------------------
-- 12、参数配置表
-- ----------------------------
drop table if exists sys_config;
create table sys_config (
  config_id         int             not null auto_increment    comment '参数主键',
  config_name       varchar(50)     default ''                 comment '参数名称',
  config_key        varchar(50)     default ''                 comment '参数键名',
  config_value      varchar(50)     default ''                 comment '参数键值',
  config_type       char(1)         default 'N'                comment '系统内置（Y是 N否）',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (config_id)
) engine=innodb auto_increment=100 comment = '参数配置表';

-- ----------------------------
-- 初始化-参数配置表数据
-- ----------------------------
insert into sys_config values(1, '用户管理-账号初始密码',         'sys.user.initPassword',         'Abcd@1234..',   'Y', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '导入用户初始化密码 123456' );
insert into sys_config values(2, '账号自助-验证码开关',           'sys.account.captchaEnabled',    'true',          'Y', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '是否开启验证码功能（true开启，false关闭）');
insert into sys_config values(3, '账号自助-验证码类型',           'sys.account.captchaType',       'math',          'Y', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '使用验证码类型（math数值计算，char字符验证）');
insert into sys_config values(4, '账号自助-是否开启用户注册功能',  'sys.account.registerUser',      'false',         'Y', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '是否开启注册用户功能（true开启，false关闭）');


-- ----------------------------
-- 13、系统操作日志表
-- ----------------------------
drop table if exists sys_log_operate;
create table sys_log_operate (
  oper_id           bigint          not null auto_increment    comment '日志主键',
  title             varchar(50)     default ''                 comment '模块标题',
  business_type     char(1)         default '0'                comment '业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据）',
  method            varchar(100)    default ''                 comment '方法名称',
  request_method    varchar(10)     default ''                 comment '请求方式',
  operator_type     char(1)         default '0'                comment '操作人员类别（0其它 1后台用户 2手机端用户）',
  oper_name         varchar(50)     default ''                 comment '操作人员',
  dept_name         varchar(50)     default ''                 comment '部门名称',
  oper_url          varchar(255)    default ''                 comment '请求URL',
  oper_ip           varchar(128)    default ''                 comment '主机地址',
  oper_location     varchar(255)    default ''                 comment '操作地点',
  oper_param        varchar(2000)   default ''                 comment '请求参数',
  oper_msg          varchar(2000)   default ''                 comment '操作消息',
  status            char(1)         default '0'                comment '操作状态（0异常 1正常）',
  oper_time         bigint          default 0                  comment '操作时间',
  cost_time         bigint          default 0                  comment '消耗时间（毫秒）',
  primary key (oper_id)
) engine=innodb auto_increment=100 comment = '系统操作日志表';


-- ----------------------------
-- 14、系统登录日志表
-- ----------------------------
drop table if exists sys_log_login;
create table sys_log_login (
  login_id        bigint        not null auto_increment   comment '登录ID',
  user_name      varchar(50)    default ''                comment '用户账号',
  ipaddr         varchar(128)   default ''                comment '登录IP地址',
  login_location varchar(50)    default ''                comment '登录地点',
  browser        varchar(50)    default ''                comment '浏览器类型',
  os             varchar(50)    default ''                comment '操作系统',
  status         char(1)        default '0'               comment '登录状态（0失败 1成功）',
  msg            varchar(255)   default ''                comment '提示消息',
  login_time     bigint         default 0                 comment '登录时间',
  primary key (login_id)
) engine=innodb auto_increment=100 comment = '系统登录日志表';


-- ----------------------------
-- 15、调度任务调度表
-- ----------------------------
drop table if exists sys_job;
create table sys_job (
  job_id              bigint        not null auto_increment    comment '任务ID',
  job_name            varchar(50)   default ''                 comment '任务名称',
  job_group           varchar(50)   default 'DEFAULT'          comment '任务组名',
  invoke_target       varchar(50)   not null                   comment '调用目标字符串',
  target_params       varchar(500)  default ''                 comment '调用目标传入参数',
  cron_expression     varchar(50)   default ''                 comment 'cron执行表达式',
  misfire_policy      char(1)       default '3'                comment '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  concurrent          char(1)       default '0'                comment '是否并发执行（0禁止 1允许）',
  status              char(1)       default '0'                comment '任务状态（0暂停 1正常）',
  save_log            char(1)       default '0'                comment '是否记录任务日志（0不记录 1记录）',
  create_by           varchar(50)   default ''                 comment '创建者',
  create_time         bigint        default 0                  comment '创建时间',
  update_by           varchar(50)   default ''                 comment '更新者',
  update_time         bigint        default 0                  comment '更新时间',
  remark              varchar(500)  default ''                 comment '备注',
  primary key (job_id, job_name, job_group)
) engine=innodb auto_increment=100 comment = '调度任务调度表';

-- ----------------------------
-- 初始化-调度任务调度表数据
-- ----------------------------
insert into sys_job values(1, '触发执行', 'SYSTEM', 'simple', '{"t":10}', '0/10 * * * * ?', '3', '0', '0', '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_job values(2, '缓慢执行', 'SYSTEM', 'foo',    '{"t":15}', '0/15 * * * * ?', '3', '0', '0', '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');
insert into sys_job values(3, '异常执行', 'SYSTEM', 'bar',    '{"t":20}', '0/20 * * * * ?', '3', '0', '0', '1', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '');


-- ----------------------------
-- 16、调度任务调度日志表
-- ----------------------------
drop table if exists sys_job_log;
create table sys_job_log (
  job_log_id          bigint         not null auto_increment    comment '任务日志ID',
  job_name            varchar(64)    not null                   comment '任务名称',
  job_group           varchar(64)    not null                   comment '任务组名',
  invoke_target       varchar(64)    not null                   comment '调用目标字符串',
  target_params       varchar(500)   default ''                 comment '调用目标传入参数',
  job_msg             varchar(500)   default ''                 comment '日志信息',
  status              char(1)        default '0'                comment '执行状态（0失败 1正常）',
  create_time         bigint         default 0                  comment '创建时间',
  cost_time           bigint         default 0                  comment '消耗时间（毫秒）',
  primary key (job_log_id)
) engine=innodb comment = '调度任务调度日志表';


-- ----------------------------
-- 17、通知公告表
-- ----------------------------
drop table if exists sys_notice;
create table sys_notice (
  notice_id         int             not null auto_increment    comment '公告ID',
  notice_title      varchar(50)     not null                   comment '公告标题',
  notice_type       char(1)         not null                   comment '公告类型（1通知 2公告）',
  notice_content    text            default null               comment '公告内容',
  status            char(1)         default '0'                comment '公告状态（0关闭 1正常）',
  del_flag          char(1)         default '0'                comment '删除标志（0代表存在 1代表删除）',
  create_by         varchar(50)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(50)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(500)    default ''                 comment '备注',
  primary key (notice_id)
) engine=innodb auto_increment=10 comment = '通知公告表';

-- ----------------------------
-- 初始化-公告信息表数据
-- ----------------------------
insert into sys_notice values('1', '温馨提醒：2022-11-05 MASK新版本发布啦', '2', '新版本内容', '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');
insert into sys_notice values('2', '维护通知：2022-11-10 MASK系统凌晨维护', '1', '维护内容',   '1', '0', 'maskAdmin', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '管理员');

 