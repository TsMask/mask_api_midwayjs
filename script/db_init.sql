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
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time 	    bigint                                     comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint                                     comment '更新时间',
  primary key (dept_id)
) engine=innodb auto_increment=200 comment = '部门表';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------
insert into sys_dept values(100,  0,   '0',          'MASK科技',   0, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(101,  100, '0,100',      '广西总公司', 1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(102,  100, '0,100',      '广东分公司', 2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(103,  101, '0,100,101',  '研发部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(104,  101, '0,100,101',  '市场部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(105,  101, '0,100,101',  '测试部门',   3, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(106,  101, '0,100,101',  '财务部门',   4, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(107,  101, '0,100,101',  '运维部门',   5, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(108,  102, '0,100,102',  '市场部门',   1, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);
insert into sys_dept values(109,  102, '0,100,102',  '财务部门',   2, 'MASK', '15888888888', 'mask@qq.com', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null);

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
  login_date        bigint                                     comment '最后登录时间',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint                                     comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint                                     comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (user_id)
) engine=innodb auto_increment=100 comment = '用户信息表';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
insert into sys_user values(1,  103, 'admin', 'admin', 'sys', 'admin@163.com', '15888888888', '1', '', '$2b$10$zJQGpmn7z4tmqWIOJ.mkZOdfBOAOF8P5SmiLs/zEqUsSbLc5lT1gm', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '管理员');
insert into sys_user values(2,  105, 'mask',  'mask',  'sys', 'mask@qq.com',   '15666666666', '1', '', '$2b$10$91jsdthxDfqA12xyAWqq8OFUF8ph62.YuOjHRVp0wNkdzZak73eu6', '1', '0', '127.0.0.1', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '普通人员');


-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
drop table if exists sys_post;
create table sys_post
(
  post_id       bigint          not null auto_increment    comment '岗位ID',
  post_code     varchar(64)     not null                   comment '岗位编码',
  post_name     varchar(50)     not null                   comment '岗位名称',
  post_sort     int             not null                   comment '显示顺序',
  status        char(1)         not null                   comment '状态（0停用 1正常）',
  create_by     varchar(64)     default ''                 comment '创建者',
  create_time   bigint                                     comment '创建时间',
  update_by     varchar(64)     default ''			           comment '更新者',
  update_time   bigint                                     comment '更新时间',
  remark        varchar(500)    default null               comment '备注',
  primary key (post_id)
) engine=innodb comment = '岗位信息表';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
insert into sys_post values(1, 'ceo',  '董事长',    1, '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_post values(2, 'se',   '项目经理',  2, '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_post values(3, 'hr',   '人力资源',  3, '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_post values(4, 'user', '普通员工',  4, '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');


-- ----------------------------
-- 4、角色信息表
-- ----------------------------
drop table if exists sys_role;
create table sys_role (
  role_id              bigint          not null auto_increment    comment '角色ID',
  role_name            varchar(30)     not null                   comment '角色名称',
  role_key             varchar(100)    not null                   comment '角色权限字符串',
  role_sort            int             not null                   comment '显示顺序',
  data_scope           char(1)         default '1'                comment '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限）',
  menu_check_strictly  char(1)         default '1'                comment '菜单树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示）',
  dept_check_strictly  char(1)         default '1'                comment '部门树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示 ）',
  status               char(1)         not null                   comment '角色状态（0停用 1正常）',
  del_flag             char(1)         default '0'                comment '删除标志（0代表存在 1代表删除）',
  create_by            varchar(64)     default ''                 comment '创建者',
  create_time          bigint                                     comment '创建时间',
  update_by            varchar(64)     default ''                 comment '更新者',
  update_time          bigint                                     comment '更新时间',
  remark               varchar(500)    default null               comment '备注',
  primary key (role_id)
) engine=innodb auto_increment=100 comment = '角色信息表';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
insert into sys_role values('1', '管理员',   'admin',  1, 1, '1', '1', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '管理员');
insert into sys_role values('2', '普通角色', 'common', 2, 2, '1', '1', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '普通角色');


-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
drop table if exists sys_menu;
create table sys_menu (
  menu_id           bigint          not null auto_increment    comment '菜单ID',
  menu_name         varchar(50)     not null                   comment '菜单名称',
  parent_id         bigint          default 0                  comment '父菜单ID 默认0',
  order_num         int             default 0                  comment '显示顺序',
  path              varchar(200)    default ''                 comment '路由地址',
  component         varchar(255)    default null               comment '组件路径',
  query             varchar(255)    default null               comment '路由参数',
  is_link           int             default 0                  comment '是否为外链（0否 1是）',
  is_cache          int             default 0                  comment '是否缓存（0不缓存 1缓存）',
  menu_type         char(1)         default ''                 comment '菜单类型（M目录 C菜单 F按钮）',
  visible           int             default 0                comment '菜单状态（0隐藏 1显示）',
  status            char(1)         default '0'                comment '菜单状态（0停用 1正常）',
  perms             varchar(100)    default null               comment '权限标识',
  icon              varchar(100)    default '#'                comment '菜单图标',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint                                     comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint                                     comment '更新时间',
  remark            varchar(500)    default ''                 comment '备注',
  primary key (menu_id)
) engine=innodb auto_increment=2000 comment = '菜单权限表';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
insert into sys_menu values('1', '系统管理', '0', '1', 'system',           null, '', 0, 1, 'M', 1, '1', '', 'system',   'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统管理目录');
insert into sys_menu values('2', '系统监控', '0', '2', 'monitor',          null, '', 0, 1, 'M', 1, '1', '', 'monitor',  'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统监控目录');
insert into sys_menu values('3', '系统工具', '0', '3', 'tool',             null, '', 0, 1, 'M', 1, '1', '', 'tool',     'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统工具目录');
insert into sys_menu values('4', 'Gitee仓库', '0', '4', 'https://gitee.com/TsMask/mask_api_midwayjs', null, '', '1', '1', 'M', '1', '1', '', 'guide',    'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, 'Gitee仓库地址');
-- 二级菜单
insert into sys_menu values('100',  '用户管理', '1',   '1', 'user',       'system/user/index',        '', 0, 1, 'C', 1, '1', 'system:user:list',        'user',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '用户管理菜单');
insert into sys_menu values('101',  '角色管理', '1',   '2', 'role',       'system/role/index',        '', 0, 1, 'C', 1, '1', 'system:role:list',        'peoples',       'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '角色管理菜单');
insert into sys_menu values('102',  '菜单管理', '1',   '3', 'menu',       'system/menu/index',        '', 0, 1, 'C', 1, '1', 'system:menu:list',        'tree-table',    'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '菜单管理菜单');
insert into sys_menu values('103',  '部门管理', '1',   '4', 'dept',       'system/dept/index',        '', 0, 1, 'C', 1, '1', 'system:dept:list',        'tree',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '部门管理菜单');
insert into sys_menu values('104',  '岗位管理', '1',   '5', 'post',       'system/post/index',        '', 0, 1, 'C', 1, '1', 'system:post:list',        'post',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '岗位管理菜单');
insert into sys_menu values('105',  '字典管理', '1',   '6', 'dict',       'system/dict/index',        '', 0, 1, 'C', 1, '1', 'system:dict:list',        'dict',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '字典管理菜单');
insert into sys_menu values('106',  '参数设置', '1',   '7', 'config',     'system/config/index',      '', 0, 1, 'C', 1, '1', 'system:config:list',      'edit',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '参数设置菜单');
insert into sys_menu values('107',  '通知公告', '1',   '8', 'notice',     'system/notice/index',      '', 0, 1, 'C', 1, '1', 'system:notice:list',      'message',       'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '通知公告菜单');
insert into sys_menu values('108',  '日志管理', '1',   '9', 'log',        '',                         '', 0, 1, 'M', 1, '1', '',                        'log',           'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '日志管理菜单');
insert into sys_menu values('109',  '服务监控', '2',   '1', 'server',     'monitor/server/index',     '', 0, 1, 'C', 1, '1', 'monitor:server:query',    'server',        'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '服务监控菜单');
insert into sys_menu values('111',  '缓存监控', '2',   '2', 'cache',      'monitor/cache/index',      '', 0, 1, 'C', 1, '1', 'monitor:cache:list',      'redis',         'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '缓存监控菜单');
insert into sys_menu values('112',  '缓存列表', '2',   '3', 'cacheList',  'monitor/cache/list',       '', 0, 1, 'C', 1, '1', 'monitor:cache:list',      'redis-list',    'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '缓存列表菜单');
insert into sys_menu values('113',  '在线用户', '2',   '4', 'online',     'monitor/online/index',     '', 0, 1, 'C', 1, '1', 'monitor:online:list',     'online',        'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '在线用户菜单');
insert into sys_menu values('114',  '调度任务', '2',   '5', 'job',        'monitor/job/index',        '', 0, 1, 'C', 1, '1', 'monitor:job:list',        'job',           'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '调度任务菜单');
insert into sys_menu values('115',  '系统接口', '3',   '1', 'swagger',    'tool/swagger/index',       '', 0, 1, 'C', 1, '1', 'monitor:swagger:list',    'swagger',       'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统接口菜单');
-- 三级菜单
insert into sys_menu values('500',  '操作日志', '108', '1', 'operlog',    'monitor/operlog/index',    '', 0, 1, 'C', 1, '1', 'monitor:operlog:list',    'form',          'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '操作日志菜单');
insert into sys_menu values('501',  '登录日志', '108', '2', 'logininfor', 'monitor/logininfor/index', '', 0, 1, 'C', 1, '1', 'monitor:logininfor:list', 'logininfor',    'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '登录日志菜单');
-- 用户管理按钮
insert into sys_menu values('1000', '用户查询', '100', '1',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1001', '用户新增', '100', '2',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1002', '用户修改', '100', '3',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1003', '用户删除', '100', '4',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1004', '用户导出', '100', '5',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:export',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1005', '用户导入', '100', '6',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:import',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1006', '重置密码', '100', '7',  '', '', '', 0, 1, 'F', 1, '1', 'system:user:resetPwd',       '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 角色管理按钮
insert into sys_menu values('1007', '角色查询', '101', '1',  '', '', '', 0, 1, 'F', 1, '1', 'system:role:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1008', '角色新增', '101', '2',  '', '', '', 0, 1, 'F', 1, '1', 'system:role:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1009', '角色修改', '101', '3',  '', '', '', 0, 1, 'F', 1, '1', 'system:role:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1010', '角色删除', '101', '4',  '', '', '', 0, 1, 'F', 1, '1', 'system:role:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1011', '角色导出', '101', '5',  '', '', '', 0, 1, 'F', 1, '1', 'system:role:export',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 菜单管理按钮
insert into sys_menu values('1012', '菜单查询', '102', '1',  '', '', '', 0, 1, 'F', 1, '1', 'system:menu:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1013', '菜单新增', '102', '2',  '', '', '', 0, 1, 'F', 1, '1', 'system:menu:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1014', '菜单修改', '102', '3',  '', '', '', 0, 1, 'F', 1, '1', 'system:menu:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1015', '菜单删除', '102', '4',  '', '', '', 0, 1, 'F', 1, '1', 'system:menu:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 部门管理按钮
insert into sys_menu values('1016', '部门查询', '103', '1',  '', '', '', 0, 1, 'F', 1, '1', 'system:dept:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1017', '部门新增', '103', '2',  '', '', '', 0, 1, 'F', 1, '1', 'system:dept:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1018', '部门修改', '103', '3',  '', '', '', 0, 1, 'F', 1, '1', 'system:dept:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1019', '部门删除', '103', '4',  '', '', '', 0, 1, 'F', 1, '1', 'system:dept:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 岗位管理按钮
insert into sys_menu values('1020', '岗位查询', '104', '1',  '', '', '', 0, 1, 'F', 1, '1', 'system:post:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1021', '岗位新增', '104', '2',  '', '', '', 0, 1, 'F', 1, '1', 'system:post:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1022', '岗位修改', '104', '3',  '', '', '', 0, 1, 'F', 1, '1', 'system:post:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1023', '岗位删除', '104', '4',  '', '', '', 0, 1, 'F', 1, '1', 'system:post:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1024', '岗位导出', '104', '5',  '', '', '', 0, 1, 'F', 1, '1', 'system:post:export',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 字典管理按钮
insert into sys_menu values('1025', '字典查询', '105', '1', '#', '', '', 0, 1, 'F', 1, '1', 'system:dict:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1026', '字典新增', '105', '2', '#', '', '', 0, 1, 'F', 1, '1', 'system:dict:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1027', '字典修改', '105', '3', '#', '', '', 0, 1, 'F', 1, '1', 'system:dict:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1028', '字典删除', '105', '4', '#', '', '', 0, 1, 'F', 1, '1', 'system:dict:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1029', '字典导出', '105', '5', '#', '', '', 0, 1, 'F', 1, '1', 'system:dict:export',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 参数设置按钮
insert into sys_menu values('1030', '参数查询', '106', '1', '#', '', '', 0, 1, 'F', 1, '1', 'system:config:query',        '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1031', '参数新增', '106', '2', '#', '', '', 0, 1, 'F', 1, '1', 'system:config:add',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1032', '参数修改', '106', '3', '#', '', '', 0, 1, 'F', 1, '1', 'system:config:edit',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1033', '参数删除', '106', '4', '#', '', '', 0, 1, 'F', 1, '1', 'system:config:remove',       '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1034', '参数导出', '106', '5', '#', '', '', 0, 1, 'F', 1, '1', 'system:config:export',       '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 通知公告按钮
insert into sys_menu values('1035', '公告查询', '107', '1', '#', '', '', 0, 1, 'F', 1, '1', 'system:notice:query',        '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1036', '公告新增', '107', '2', '#', '', '', 0, 1, 'F', 1, '1', 'system:notice:add',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1037', '公告修改', '107', '3', '#', '', '', 0, 1, 'F', 1, '1', 'system:notice:edit',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1038', '公告删除', '107', '4', '#', '', '', 0, 1, 'F', 1, '1', 'system:notice:remove',       '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 操作日志按钮
insert into sys_menu values('1039', '操作查询', '500', '1', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:operlog:query',      '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1040', '操作删除', '500', '2', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:operlog:remove',     '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1041', '日志导出', '500', '3', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:operlog:export',     '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 登录日志按钮
insert into sys_menu values('1042', '登录查询', '501', '1', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:logininfor:query',   '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1043', '登录删除', '501', '2', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:logininfor:remove',  '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1044', '日志导出', '501', '3', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:logininfor:export',  '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1045', '账户解锁', '501', '4', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:logininfor:unlock',  '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 在线用户按钮
insert into sys_menu values('1046', '在线查询', '103', '1', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:online:query',       '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1047', '批量强退', '103', '2', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:online:batchLogout', '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1048', '单条强退', '103', '3', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:online:forceLogout', '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
-- 定时任务按钮
insert into sys_menu values('1049', '任务查询', '114', '1', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:query',          '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1050', '任务新增', '114', '2', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:add',            '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1051', '任务修改', '114', '3', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:edit',           '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1052', '任务删除', '114', '4', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:remove',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1053', '状态修改', '114', '5', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:changeStatus',   '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_menu values('1054', '任务导出', '114', '6', '#', '', '', 0, 1, 'F', 1, '1', 'monitor:job:export',         '#', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');

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
insert into sys_role_menu values ('2', '2');
insert into sys_role_menu values ('2', '3');
insert into sys_role_menu values ('2', '4');
insert into sys_role_menu values ('2', '100');
insert into sys_role_menu values ('2', '101');
insert into sys_role_menu values ('2', '102');
insert into sys_role_menu values ('2', '103');
insert into sys_role_menu values ('2', '104');
insert into sys_role_menu values ('2', '105');
insert into sys_role_menu values ('2', '106');
insert into sys_role_menu values ('2', '107');
insert into sys_role_menu values ('2', '108');
insert into sys_role_menu values ('2', '109');
insert into sys_role_menu values ('2', '110');
insert into sys_role_menu values ('2', '111');
insert into sys_role_menu values ('2', '112');
insert into sys_role_menu values ('2', '113');
insert into sys_role_menu values ('2', '114');
insert into sys_role_menu values ('2', '115');
insert into sys_role_menu values ('2', '500');
insert into sys_role_menu values ('2', '501');
insert into sys_role_menu values ('2', '1000');
insert into sys_role_menu values ('2', '1001');
insert into sys_role_menu values ('2', '1002');
insert into sys_role_menu values ('2', '1003');
insert into sys_role_menu values ('2', '1004');
insert into sys_role_menu values ('2', '1005');
insert into sys_role_menu values ('2', '1006');
insert into sys_role_menu values ('2', '1007');
insert into sys_role_menu values ('2', '1008');
insert into sys_role_menu values ('2', '1009');
insert into sys_role_menu values ('2', '1010');
insert into sys_role_menu values ('2', '1011');
insert into sys_role_menu values ('2', '1012');
insert into sys_role_menu values ('2', '1013');
insert into sys_role_menu values ('2', '1014');
insert into sys_role_menu values ('2', '1015');
insert into sys_role_menu values ('2', '1016');
insert into sys_role_menu values ('2', '1017');
insert into sys_role_menu values ('2', '1018');
insert into sys_role_menu values ('2', '1019');
insert into sys_role_menu values ('2', '1020');
insert into sys_role_menu values ('2', '1021');
insert into sys_role_menu values ('2', '1022');
insert into sys_role_menu values ('2', '1023');
insert into sys_role_menu values ('2', '1024');
insert into sys_role_menu values ('2', '1025');
insert into sys_role_menu values ('2', '1026');
insert into sys_role_menu values ('2', '1027');
insert into sys_role_menu values ('2', '1028');
insert into sys_role_menu values ('2', '1029');
insert into sys_role_menu values ('2', '1030');
insert into sys_role_menu values ('2', '1031');
insert into sys_role_menu values ('2', '1032');
insert into sys_role_menu values ('2', '1033');
insert into sys_role_menu values ('2', '1034');
insert into sys_role_menu values ('2', '1035');
insert into sys_role_menu values ('2', '1036');
insert into sys_role_menu values ('2', '1037');
insert into sys_role_menu values ('2', '1038');
insert into sys_role_menu values ('2', '1039');
insert into sys_role_menu values ('2', '1040');
insert into sys_role_menu values ('2', '1041');
insert into sys_role_menu values ('2', '1042');
insert into sys_role_menu values ('2', '1043');
insert into sys_role_menu values ('2', '1044');
insert into sys_role_menu values ('2', '1045');
insert into sys_role_menu values ('2', '1046');
insert into sys_role_menu values ('2', '1047');
insert into sys_role_menu values ('2', '1048');
insert into sys_role_menu values ('2', '1049');
insert into sys_role_menu values ('2', '1050');
insert into sys_role_menu values ('2', '1051');
insert into sys_role_menu values ('2', '1052');
insert into sys_role_menu values ('2', '1053');
insert into sys_role_menu values ('2', '1054');

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
-- 10、操作日志记录
-- ----------------------------
drop table if exists sys_oper_log;
create table sys_oper_log (
  oper_id           bigint          not null auto_increment    comment '日志主键',
  title             varchar(50)     default ''                 comment '模块标题',
  business_type     int             default 0                  comment '业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据）',
  method            varchar(100)    default ''                 comment '方法名称',
  request_method    varchar(10)     default ''                 comment '请求方式',
  operator_type     int             default 0                  comment '操作类别（0其它 1后台用户 2手机端用户）',
  oper_name         varchar(50)     default ''                 comment '操作人员',
  dept_name         varchar(50)     default ''                 comment '部门名称',
  oper_url          varchar(255)    default ''                 comment '请求URL',
  oper_ip           varchar(128)    default ''                 comment '主机地址',
  oper_location     varchar(255)    default ''                 comment '操作地点',
  oper_param        varchar(2000)   default ''                 comment '请求参数',
  oper_msg          varchar(2000)   default ''                 comment '操作消息',
  status            int            default 0                   comment '操作状态（0异常 1正常）',
  oper_time         bigint                                     comment '操作时间',
  primary key (oper_id)
) engine=innodb auto_increment=100 comment = '操作日志记录';


-- ----------------------------
-- 11、字典类型表
-- ----------------------------
drop table if exists sys_dict_type;
create table sys_dict_type
(
  dict_id          bigint          not null auto_increment    comment '字典主键',
  dict_name        varchar(100)    default ''                 comment '字典名称',
  dict_type        varchar(100)    default ''                 comment '字典类型',
  status           char(1)         default '0'                comment '状态（0停用 1正常）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint                                     comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint                                     comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_id),
  unique (dict_type)
) engine=innodb auto_increment=100 comment = '字典类型表';

insert into sys_dict_type values(1,  '用户性别', 'sys_user_sex',        '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '用户性别列表');
insert into sys_dict_type values(2,  '菜单状态', 'sys_show_hide',       '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '菜单状态列表');
insert into sys_dict_type values(3,  '系统开关', 'sys_normal_disable',  '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统开关列表');
insert into sys_dict_type values(4,  '任务状态', 'sys_job_status',      '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '任务状态列表');
insert into sys_dict_type values(5,  '任务分组', 'sys_job_group',       '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '任务分组列表');
insert into sys_dict_type values(6,  '系统是否', 'sys_yes_no',          '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统是否列表');
insert into sys_dict_type values(7,  '通知类型', 'sys_notice_type',     '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '通知类型列表');
insert into sys_dict_type values(8,  '通知状态', 'sys_notice_status',   '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '通知状态列表');
insert into sys_dict_type values(9,  '操作类型', 'sys_oper_type',       '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '操作类型列表');
insert into sys_dict_type values(10, '系统状态', 'sys_common_status',   '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '登录状态列表');


-- ----------------------------
-- 12、字典数据表
-- ----------------------------
drop table if exists sys_dict_data;
create table sys_dict_data
(
  dict_code        bigint          not null auto_increment    comment '字典编码',
  dict_sort        int             default 0                  comment '字典排序',
  dict_label       varchar(100)    default ''                 comment '字典标签',
  dict_value       varchar(100)    default ''                 comment '字典键值',
  dict_type        varchar(100)    default ''                 comment '字典类型',
  css_class        varchar(100)    default null               comment '样式属性（其他样式扩展）',
  list_class       varchar(100)    default null               comment '表格回显样式',
  is_default       char(1)         default 'N'                comment '是否默认（N否 Y是）',
  status           char(1)         default '0'                comment '状态（0停用 1正常）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint                                     comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint                                     comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_code)
) engine=innodb auto_increment=100 comment = '字典数据表';

insert into sys_dict_data values(1,  1,  '未知',     '0',       'sys_user_sex',        '',   '',        'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '性别男');
insert into sys_dict_data values(2,  2,  '男',       '1',       'sys_user_sex',        '',   '',        'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '性别女');
insert into sys_dict_data values(3,  3,  '女',       '2',       'sys_user_sex',        '',   '',        'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '性别未知');
insert into sys_dict_data values(4,  1,  '显示',     '1',       'sys_show_hide',       '',   'primary', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '显示菜单');
insert into sys_dict_data values(5,  2,  '隐藏',     '0',       'sys_show_hide',       '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '隐藏菜单');
insert into sys_dict_data values(6,  1,  '正常',     '1',       'sys_normal_disable',  '',   'primary', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '正常状态');
insert into sys_dict_data values(7,  2,  '停用',     '0',       'sys_normal_disable',  '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '停用状态');
insert into sys_dict_data values(8,  1,  '正常',     '1',       'sys_job_status',      '',   'primary', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '正常状态');
insert into sys_dict_data values(9,  2,  '暂停',     '0',       'sys_job_status',      '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '停用状态');
insert into sys_dict_data values(10, 1,  '默认',     'DEFAULT', 'sys_job_group',       '',   '',        'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '默认分组');
insert into sys_dict_data values(11, 2,  '系统',     'SYSTEM',  'sys_job_group',       '',   '',        'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统分组');
insert into sys_dict_data values(12, 1,  '是',       'Y',       'sys_yes_no',          '',   'primary', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统默认是');
insert into sys_dict_data values(13, 2,  '否',       'N',       'sys_yes_no',          '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '系统默认否');
insert into sys_dict_data values(14, 1,  '通知',     '1',       'sys_notice_type',     '',   'warning', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '通知');
insert into sys_dict_data values(15, 2,  '公告',     '2',       'sys_notice_type',     '',   'success', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '公告');
insert into sys_dict_data values(16, 1,  '正常',     '1',       'sys_notice_status',   '',   'primary', 'Y', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '正常状态');
insert into sys_dict_data values(17, 2,  '关闭',     '0',       'sys_notice_status',   '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '关闭状态');
insert into sys_dict_data values(18, 99, '其他',     '0',       'sys_oper_type',       '',   'info',    'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '其他操作');
insert into sys_dict_data values(19, 1,  '新增',     '1',       'sys_oper_type',       '',   'info',    'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '新增操作');
insert into sys_dict_data values(20, 2,  '修改',     '2',       'sys_oper_type',       '',   'info',    'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '修改操作');
insert into sys_dict_data values(21, 3,  '删除',     '3',       'sys_oper_type',       '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '删除操作');
insert into sys_dict_data values(22, 4,  '授权',     '4',       'sys_oper_type',       '',   'primary', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '授权操作');
insert into sys_dict_data values(23, 5,  '导出',     '5',       'sys_oper_type',       '',   'warning', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '导出操作');
insert into sys_dict_data values(24, 6,  '导入',     '6',       'sys_oper_type',       '',   'warning', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '导入操作');
insert into sys_dict_data values(25, 7,  '强退',     '7',       'sys_oper_type',       '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '强退操作');
insert into sys_dict_data values(26, 8,  '清空数据', '8',        'sys_oper_type',       '',   'danger', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '清空操作');
insert into sys_dict_data values(27, 1,  '成功',     '1',       'sys_common_status',   '',   'primary', 'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '正常状态');
insert into sys_dict_data values(28, 2,  '失败',     '0',       'sys_common_status',   '',   'danger',  'N', '1', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '停用状态');


-- ----------------------------
-- 13、参数配置表
-- ----------------------------
drop table if exists sys_config;
create table sys_config (
  config_id         int             not null auto_increment    comment '参数主键',
  config_name       varchar(100)    default ''                 comment '参数名称',
  config_key        varchar(100)    default ''                 comment '参数键名',
  config_value      varchar(100)    default ''                 comment '参数键值',
  config_type       char(1)         default 'N'                comment '系统内置（Y是 N否）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint                                     comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint                                     comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (config_id)
) engine=innodb auto_increment=100 comment = '参数配置表';

insert into sys_config values(1, '主框架页-默认皮肤样式名称',     'sys.index.skinName',            'skin-blue',     'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow' );
insert into sys_config values(2, '用户管理-账号初始密码',         'sys.user.initPassword',         '123456',        'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '初始化密码 123456' );
insert into sys_config values(3, '主框架页-侧边栏主题',           'sys.index.sideTheme',           'theme-dark',    'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '深色主题theme-dark，浅色主题theme-light' );
insert into sys_config values(4, '账号自助-验证码开关',           'sys.account.captchaEnabled',    'true',          'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '是否开启验证码功能（true开启，false关闭）');
insert into sys_config values(5, '账号自助-验证码类型',           'sys.account.captchaType',       'math',          'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '使用验证码类型（math数值计算，char字符验证）');
insert into sys_config values(6, '账号自助-是否开启用户注册功能',  'sys.account.registerUser',      'false',         'Y', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '是否开启注册用户功能（true开启，false关闭）');


-- ----------------------------
-- 14、系统访问记录
-- ----------------------------
drop table if exists sys_logininfor;
create table sys_logininfor (
  info_id        bigint         not null auto_increment   comment '访问ID',
  user_name      varchar(50)    default ''                comment '用户账号',
  ipaddr         varchar(128)   default ''                comment '登录IP地址',
  login_location varchar(255)   default ''                comment '登录地点',
  browser        varchar(50)    default ''                comment '浏览器类型',
  os             varchar(50)    default ''                comment '操作系统',
  status         char(1)        default '0'               comment '登录状态（0失败 1成功）',
  msg            varchar(255)   default ''                comment '提示消息',
  login_time     bigint                                   comment '访问时间',
  primary key (info_id)
) engine=innodb auto_increment=100 comment = '系统访问记录';


-- ----------------------------
-- 15、调度任务调度表
-- ----------------------------
drop table if exists sys_job;
create table sys_job (
  job_id              bigint        not null auto_increment    comment '任务ID',
  job_name            varchar(64)   default ''                 comment '任务名称',
  job_group           varchar(64)   default 'DEFAULT'          comment '任务组名',
  invoke_target       varchar(64)  not null                    comment '调用目标字符串',
  target_params       varchar(500)  default ''                 comment '调用目标传入参数',
  cron_expression     varchar(255)  default ''                 comment 'cron执行表达式',
  misfire_policy      char(1)       default '3'                comment '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  concurrent          char(1)       default '0'                comment '是否并发执行（0禁止 1允许）',
  status              char(1)       default '0'                comment '任务状态（0暂停 1正常）',
  create_by           varchar(64)   default ''                 comment '创建者',
  create_time         bigint                                   comment '创建时间',
  update_by           varchar(64)   default ''                 comment '更新者',
  update_time         bigint                                   comment '更新时间',
  remark              varchar(500)  default ''                 comment '备注信息',
  primary key (job_id, job_name, job_group)
) engine=innodb auto_increment=100 comment = '调度任务调度表';

insert into sys_job values(1, '触发执行', 'DEFAULT', 'test', '字符串参数', '0/10 * * * * ?', '3', '0', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_job values(2, '缓慢执行', 'DEFAULT', 'foo',  '字符串参数', '0/15 * * * * ?', '3', '0', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');
insert into sys_job values(3, '异常执行', 'DEFAULT', 'bar',  '字符串参数', '0/20 * * * * ?', '3', '0', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '');


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
  create_time         bigint                                    comment '创建时间',
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
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint                                     comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint                                     comment '更新时间',
  remark            varchar(255)    default null               comment '备注',
  primary key (notice_id)
) engine=innodb auto_increment=10 comment = '通知公告表';

-- ----------------------------
-- 初始化-公告信息表数据
-- ----------------------------
insert into sys_notice values('1', '温馨提醒：2022-11-05 MASK新版本发布啦', '2', '新版本内容', '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '管理员');
insert into sys_notice values('2', '维护通知：2022-11-10 MASK系统凌晨维护', '1', '维护内容',   '1', '0', 'admin', REPLACE(unix_timestamp(current_timestamp(3)),'.',''), '', null, '管理员');

 