-- ================================================================
-- 数据库初始化脚本（表结构 + 示例数据）
-- 项目: mask_api
-- 数据库: MySQL 5.7+ / 8.0   字符集: utf8mb4   排序: utf8mb4_unicode_ci
--
-- 整理说明:
--   1. 表按依赖与职责排序: 实体表 -> 关联表 -> 字典/配置 -> 调度任务 -> 通知公告 -> 系统日志
--   2. 每张表后附带可登录/可演示的示例数据
--   3. 示例账号: system / Abcd@1234..  (角色 system, 超级管理员, 免鉴权, 可见全部)
--               admin  / Abcd@1234..  (角色 admin,  管理员,  菜单控制全部+全部数据权限)
--               user   / Abcd@1234..  (角色 common, 普通角色, 部分菜单+自定数据权限)
--   4. 示例数据统一使用固定时间戳 1700000000000 (2023-11-14 UTC), 可按需全局替换
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ================================================================
-- 一、实体表
-- ================================================================

-- ----------------------------------------------------------------
-- 1、部门表 sys_dept（树形关系由 sys_dept_closure 闭包表维护）
--    用户 N:1 部门；角色 M:N 部门（sys_role_dept 数据权限）
-- ----------------------------------------------------------------
drop table if exists sys_dept;
create table sys_dept (
  id                bigint          not null auto_increment    comment '部门ID',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(255)    default ''                 comment '备注',
  dept_name         varchar(64)     default ''                 comment '部门名称',
  dept_leader       varchar(32)     default ''                 comment '负责人',
  dept_phone        varchar(32)     default ''                 comment '联系电话',
  dept_email        varchar(128)    default ''                 comment '邮箱',
  dept_sort         bigint          default 0                  comment '显示顺序',
  dept_status       varchar(1)      default '0'                comment '部门状态（0停用 1正常）',
  key idx_sys_dept_list (dept_sort, id),
  key idx_sys_dept_name (dept_name),
  primary key (id)
) engine=innodb auto_increment=200 comment='系统_部门表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-部门示例数据
insert into sys_dept (id, create_by, create_time, update_by, update_time, remark, dept_name, dept_leader, dept_phone, dept_email, dept_sort, dept_status) values
(100, 'system', 1700000000000, '', 0, '根节点', 'MASK科技', 'MASK', '15888888888', 'system@163.com', 0, '1'),
(101, 'system', 1700000000000, '', 0, '',      'XX总公司',  'MASK', '15800000001', 'system@163.com',  1, '1'),
(102, 'system', 1700000000000, '', 0, '',      'XX分公司',  'MASK', '15800000002', 'system@163.com',  2, '1'),
(103, 'system', 1700000000000, '', 0, '',      '研发部门',  'MASK', '15800000003', 'system@163.com', 1, '1'),
(104, 'system', 1700000000000, '', 0, '',      '市场部门',  'MASK', '15800000004', 'system@163.com', 2, '1');

-- 部门闭包表：ancestor_id 到 descendant_id 的全部祖先/后代关系，depth=0 为自身
drop table if exists sys_dept_closure;
create table sys_dept_closure (
  ancestor_id   bigint not null comment '祖先部门ID',
  descendant_id bigint not null comment '后代部门ID',
  depth         int    not null comment '层级距离（0自身 1直接子级）',
  primary key (ancestor_id, descendant_id),
  key idx_sys_dept_closure_descendant (descendant_id, depth, ancestor_id)
) engine=innodb comment='系统_部门闭包表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

insert into sys_dept_closure (ancestor_id, descendant_id, depth) values
(100, 100, 0),
(101, 101, 0), (100, 101, 1),
(102, 102, 0), (100, 102, 1),
(103, 103, 0), (101, 103, 1), (100, 103, 2),
(104, 104, 0), (101, 104, 1), (100, 104, 2);


-- ----------------------------------------------------------------
-- 2、岗位信息表 sys_post（用户 M:N 岗位，sys_user_post）
-- ----------------------------------------------------------------
drop table if exists sys_post;
create table sys_post (
  id            bigint          not null auto_increment    comment '岗位ID',
  create_by     varchar(64)     default ''                 comment '创建者',
  create_time   bigint          default 0                  comment '创建时间',
  update_by     varchar(64)     default ''                 comment '更新者',
  update_time   bigint          default 0                  comment '更新时间',
  remark        varchar(255)    default ''                 comment '备注',
  post_code     varchar(32)     not null                   comment '岗位编码',
  post_name     varchar(64)     not null                   comment '岗位名称',
  post_sort     int             default 0                  comment '显示顺序',
  post_status   varchar(1)      default '0'                comment '状态（0停用 1正常）',
  key idx_sys_post_sort_status (post_sort, post_status),
  key idx_sys_post_name (post_name),
  unique key uk_sys_post_post_code (post_code),
  primary key (id)
) engine=innodb auto_increment=10 comment='系统_岗位信息表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-岗位示例数据
insert into sys_post (id, create_by, create_time, update_by, update_time, remark, post_code, post_name, post_sort, post_status) values
(1, 'system', 1700000000000, '', 0, '董事长岗位',   'ceo',     '董事长',   1, '1'),
(2, 'system', 1700000000000, '', 0, '部门经理岗位', 'manager', '部门经理', 2, '1'),
(3, 'system', 1700000000000, '', 0, '普通员工岗位', 'staff',   '普通员工', 3, '1');

-- ----------------------------------------------------------------
-- 3、角色信息表 sys_role（用户 M:N 角色 sys_user_role；角色 M:N 菜单 sys_role_menu）
--    role_key='system' 为系统指定超级管理员，鉴权中间件对其免校验
-- ----------------------------------------------------------------
drop table if exists sys_role;
create table sys_role (
  id                   bigint         not null auto_increment    comment '角色ID',
  create_by            varchar(64)    default ''                 comment '创建者',
  create_time          bigint         default 0                  comment '创建时间',
  update_by            varchar(64)    default ''                 comment '更新者',
  update_time          bigint         default 0                  comment '更新时间',
  remark               varchar(200)   default ''                 comment '备注',
  role_name            varchar(64)    not null                   comment '角色名称',
  role_key             varchar(32)    not null                   comment '角色键值',
  role_sort            int            default 0                  comment '显示顺序',
  role_status          varchar(1)     default '0'                comment '角色状态（0停用 1正常）',
  deleted_at           bigint          not null default 0         comment '删除时间（0未删除）',
  deleted_by           varchar(64)     default ''                 comment '删除人',
  role_data_scope      varchar(1)     default '5'                comment '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限）',
  role_menu_check_strictly  varchar(1)     default '1'                comment '菜单树选择项是否关联显示（0：不关联 1：互相）',
  role_dept_check_strictly  varchar(1)     default '1'                comment '部门树选择项是否关联显示（0：不关联 1：互相）',
  active_role_key      varchar(32)     generated always as (if(deleted_at = 0, role_key, null)) stored comment '未删除角色键',
  key idx_sys_role_name (role_name),
  key idx_sys_role_list (role_status, role_sort),
  key idx_sys_role_deleted (deleted_at),
  unique key uk_sys_role_active_role_key (active_role_key),
  primary key (id)
) engine=innodb auto_increment=50 comment='系统_角色信息表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-内置角色数据（system 角色仅作兜底，不在角色管理界面显示）
insert into sys_role (id, create_by, create_time, update_by, update_time, remark, role_name, role_key, role_sort, role_status, role_data_scope, role_menu_check_strictly, role_dept_check_strictly) values
(1, 'system', 1700000000000, '', 0, '内置隐藏角色，仅供 system 账号兜底使用',       '系统管理员', 'system', 1, '1', '1', '1', '1'),
(2, 'system', 1700000000000, '', 0, '日常管理员角色，菜单全部+全部数据权限',       '管理员',     'admin',  2, '1', '1', '1', '1'),
(3, 'system', 1700000000000, '', 0, '普通默认角色，分配给默认 user 账号，自定数据权限', '普通角色',   'common', 3, '1', '2', '1', '1');

-- ----------------------------------------------------------------
-- 4、菜单权限表 sys_menu（树形: parent_id 自关联；menu_type: D目录 M菜单 A权限）
--    menu_perms 权限标识需与 controller 路由中间件 hasPerms 一致
-- ----------------------------------------------------------------
drop table if exists sys_menu;
create table sys_menu (
  id                bigint          not null auto_increment    comment '菜单ID',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(255)    default ''                 comment '备注',
  parent_id         bigint          default 0                  comment '父菜单ID 默认0',
  menu_name         varchar(32)     not null                   comment '菜单名称',
  menu_sort         bigint          default 0                  comment '显示顺序',
  menu_path         varchar(255)    default ''                 comment '完整路由地址或网络地址',
  menu_component    varchar(255)    default ''                 comment '组件路径',
  menu_perms        varchar(255)    default ''                 comment '权限标识',
  menu_icon         varchar(64)     default '#'                comment '菜单图标（#无图标）',
  menu_external     varchar(1)      default '0'                comment '外部跳转标记（0否 1是）',
  menu_cache        varchar(1)      default '0'                comment '缓存标记（0不缓存 1缓存）',
  menu_type         varchar(1)      not null                   comment '菜单类型（D目录 M菜单 A权限）',
  menu_visible      varchar(1)      default '0'                comment '是否显示（0隐藏 1显示）',
  menu_status       varchar(1)      default '0'                comment '菜单状态（0停用 1正常）',
  key idx_sys_menu_tree (parent_id, menu_sort),
  key idx_sys_menu_status_type (menu_status, menu_type),
  key idx_sys_menu_menu_perms (menu_perms),
  primary key (id)
) engine=innodb auto_increment=2000 comment='系统_菜单权限表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- menu_path：普通菜单保存完整访问路径；父级只表达菜单树层级，不参与路径拼接。
-- menu_component：与前端 src/views 下 SFC 文件路径一致，不包含扩展名。
-- menu_perms：使用 module:resource[:sub-resource]:action；纯页面无授权接口时保持空值。
insert into sys_menu (id, create_by, create_time, update_by, update_time, remark, parent_id, menu_name, menu_sort, menu_path, menu_component, menu_perms, menu_icon, menu_external, menu_cache, menu_type, menu_visible, menu_status) values
(1,   'system', 1700000000000, '', 0, '系统管理目录', 0, '系统管理', 1, '/system', '', '', '#', '0', '1', 'D', '1', '1'),
(100, 'system', 1700000000000, '', 0, '用户管理菜单', 1, '用户管理', 1, '/system/users', 'system/user/UserIndex', 'system:user:list', '#', '0', '1', 'M', '1', '1'),
(101, 'system', 1700000000000, '', 0, '', 100, '用户查询', 1, '', '', 'system:user:query', '#', '0', '0', 'A', '1', '1'),
(102, 'system', 1700000000000, '', 0, '', 100, '用户新增', 2, '', '', 'system:user:add', '#', '0', '0', 'A', '1', '1'),
(103, 'system', 1700000000000, '', 0, '', 100, '用户修改', 3, '', '', 'system:user:edit', '#', '0', '0', 'A', '1', '1'),
(104, 'system', 1700000000000, '', 0, '', 100, '用户删除', 4, '', '', 'system:user:remove', '#', '0', '0', 'A', '1', '1'),
(105, 'system', 1700000000000, '', 0, '', 100, '用户导出', 5, '', '', 'system:user:export', '#', '0', '0', 'A', '1', '1'),
(106, 'system', 1700000000000, '', 0, '', 100, '用户导入', 6, '', '', 'system:user:import', '#', '0', '0', 'A', '1', '1'),
(107, 'system', 1700000000000, '', 0, '', 100, '重置密码', 7, '', '', 'system:user:passwd', '#', '0', '0', 'A', '1', '1'),
(108, 'system', 1700000000000, '', 0, '', 100, '账户解锁', 8, '', '', 'system:user:unlock', '#', '0', '0', 'A', '1', '1'),
(120, 'system', 1700000000000, '', 0, '角色管理菜单', 1, '角色管理', 3, '/system/roles', 'system/role/RoleIndex', 'system:role:list', '#', '0', '1', 'M', '1', '1'),
(121, 'system', 1700000000000, '', 0, '', 120, '角色查询', 1, '', '', 'system:role:query', '#', '0', '0', 'A', '1', '1'),
(122, 'system', 1700000000000, '', 0, '', 120, '角色新增', 2, '', '', 'system:role:add', '#', '0', '0', 'A', '1', '1'),
(123, 'system', 1700000000000, '', 0, '', 120, '角色修改', 3, '', '', 'system:role:edit', '#', '0', '0', 'A', '1', '1'),
(124, 'system', 1700000000000, '', 0, '', 120, '角色删除', 4, '', '', 'system:role:remove', '#', '0', '0', 'A', '1', '1'),
(125, 'system', 1700000000000, '', 0, '', 120, '角色导出', 5, '', '', 'system:role:export', '#', '0', '0', 'A', '1', '1'),
(140, 'system', 1700000000000, '', 0, '分配角色内嵌隐藏菜单', 1, '分配角色', 4, '/system/roles/inline/users/:roleId', 'system/role/AuthUser', 'system:role:auth', '#', '0', '1', 'M', '0', '1'),
(160, 'system', 1700000000000, '', 0, '部门管理菜单', 1, '部门管理', 5, '/system/depts', 'system/dept/DeptIndex', 'system:dept:list', '#', '0', '1', 'M', '1', '1'),
(161, 'system', 1700000000000, '', 0, '', 160, '部门查询', 1, '', '', 'system:dept:query', '#', '0', '0', 'A', '1', '1'),
(162, 'system', 1700000000000, '', 0, '', 160, '部门新增', 1, '', '', 'system:dept:add', '#', '0', '0', 'A', '1', '1'),
(163, 'system', 1700000000000, '', 0, '', 160, '部门修改', 1, '', '', 'system:dept:edit', '#', '0', '0', 'A', '1', '1'),
(164, 'system', 1700000000000, '', 0, '', 160, '部门删除', 1, '', '', 'system:dept:remove', '#', '0', '0', 'A', '1', '1'),
(180, 'system', 1700000000000, '', 0, '岗位管理菜单', 1, '岗位管理', 7, '/system/posts', 'system/post/PostIndex', 'system:post:list', '#', '0', '1', 'M', '1', '1'),
(181, 'system', 1700000000000, '', 0, '', 180, '岗位查询', 1, '', '', 'system:post:query', '#', '0', '0', 'A', '1', '1'),
(182, 'system', 1700000000000, '', 0, '', 180, '岗位新增', 2, '', '', 'system:post:add', '#', '0', '0', 'A', '1', '1'),
(183, 'system', 1700000000000, '', 0, '', 180, '岗位修改', 3, '', '', 'system:post:edit', '#', '0', '0', 'A', '1', '1'),
(184, 'system', 1700000000000, '', 0, '', 180, '岗位删除', 4, '', '', 'system:post:remove', '#', '0', '0', 'A', '1', '1'),
(185, 'system', 1700000000000, '', 0, '', 180, '岗位导出', 5, '', '', 'system:post:export', '#', '0', '0', 'A', '1', '1'),
(200, 'system', 1700000000000, '', 0, '菜单管理菜单', 1, '菜单管理', 9, '/system/menus', 'system/menu/MenuIndex', 'system:menu:list', '#', '0', '1', 'M', '1', '1'),
(201, 'system', 1700000000000, '', 0, '', 200, '菜单查询', 1, '', '', 'system:menu:query', '#', '0', '0', 'A', '1', '1'),
(202, 'system', 1700000000000, '', 0, '', 200, '菜单新增', 2, '', '', 'system:menu:add', '#', '0', '0', 'A', '1', '1'),
(203, 'system', 1700000000000, '', 0, '', 200, '菜单修改', 3, '', '', 'system:menu:edit', '#', '0', '0', 'A', '1', '1'),
(204, 'system', 1700000000000, '', 0, '', 200, '菜单删除', 4, '', '', 'system:menu:remove', '#', '0', '0', 'A', '1', '1'),
(220, 'system', 1700000000000, '', 0, '字典管理菜单', 1, '字典管理', 11, '/system/dict', 'system/dict/DictIndex', 'system:dict:type:list', '#', '0', '1', 'M', '1', '1'),
(221, 'system', 1700000000000, '', 0, '', 220, '字典查询', 1, '', '', 'system:dict:type:query', '#', '0', '0', 'A', '1', '1'),
(222, 'system', 1700000000000, '', 0, '', 220, '字典查询', 2, '', '', 'system:dict:type:add', '#', '0', '0', 'A', '1', '1'),
(223, 'system', 1700000000000, '', 0, '', 220, '字典修改', 3, '', '', 'system:dict:type:edit', '#', '0', '0', 'A', '1', '1'),
(224, 'system', 1700000000000, '', 0, '', 220, '字典删除', 4, '', '', 'system:dict:type:remove', '#', '0', '0', 'A', '1', '1'),
(225, 'system', 1700000000000, '', 0, '', 220, '字典导出', 5, '', '', 'system:dict:type:export', '#', '0', '0', 'A', '1', '1'),
(240, 'system', 1700000000000, '', 0, '字典数据内嵌隐藏菜单', 1, '字典数据', 12, '/system/dict/inline/datas/:dictId', 'system/dict/DictData', 'system:dict:data:list', '#', '0', '1', 'M', '0', '1'),
(241, 'system', 1700000000000, '', 0, '', 240, '数据查询', 1, '', '', 'system:dict:data:query',  '#', '0', '0', 'A', '1', '1'),
(242, 'system', 1700000000000, '', 0, '', 240, '数据新增', 2, '', '', 'system:dict:data:add',   '#', '0', '0', 'A', '1', '1'),
(243, 'system', 1700000000000, '', 0, '', 240, '数据修改', 3, '', '', 'system:dict:data:edit',  '#', '0', '0', 'A', '1', '1'),
(244, 'system', 1700000000000, '', 0, '', 240, '数据删除', 4, '', '', 'system:dict:data:remove', '#', '0', '0', 'A', '1', '1'),
(245, 'system', 1700000000000, '', 0, '', 240, '数据导出', 5, '', '', 'system:dict:data:export', '#', '0', '0', 'A', '1', '1'),
(260, 'system', 1700000000000, '', 0, '参数设置菜单', 1, '参数设置', 13, '/system/configs', 'system/config/ConfigIndex', 'system:config:list', '#', '0', '1', 'M', '1', '1'),
(261, 'system', 1700000000000, '', 0, '', 260, '参数查询', 1, '', '', 'system:config:query', '#', '0', '0', 'A', '1', '1'),
(262, 'system', 1700000000000, '', 0, '', 260, '参数新增', 2, '', '', 'system:config:add', '#', '0', '0', 'A', '1', '1'),
(263, 'system', 1700000000000, '', 0, '', 260, '参数修改', 3, '', '', 'system:config:edit', '#', '0', '0', 'A', '1', '1'),
(264, 'system', 1700000000000, '', 0, '', 260, '参数删除', 4, '', '', 'system:config:remove', '#', '0', '0', 'A', '1', '1'),
(265, 'system', 1700000000000, '', 0, '', 260, '参数导出', 5, '', '', 'system:config:export', '#', '0', '0', 'A', '1', '1'),
(280, 'system', 1700000000000, '', 0, '通知公告菜单',  1, '通知公告', 15, '/system/notices', 'system/notice/NoticeIndex', 'system:notice:list', '#', '0', '1', 'M', '1', '1'),
(281, 'system', 1700000000000, '', 0, '', 280, '公告查询', 1, '', '', 'system:notice:query', '#', '0', '0', 'A', '1', '1'),
(282, 'system', 1700000000000, '', 0, '', 280, '公告新增', 2, '', '', 'system:notice:add', '#', '0', '0', 'A', '1', '1'),
(283, 'system', 1700000000000, '', 0, '', 280, '公告修改', 3, '', '', 'system:notice:edit', '#', '0', '0', 'A', '1', '1'),
(284, 'system', 1700000000000, '', 0, '', 280, '公告删除', 4, '', '', 'system:notice:remove', '#', '0', '0', 'A', '1', '1'),
(300, 'system', 1700000000000, '', 0, '日志管理目录', 1, '日志管理', 17, '/system/logs', '', '', '#', '0', '1', 'D', '1', '1'),
(320, 'system', 1700000000000, '', 0, '', 300, '操作日志', 1, '/system/logs/operation', 'system/log/operation/OperationLogIndex', 'system:operation:log:list', '#', '0', '1', 'M', '1', '1'),
(322, 'system', 1700000000000, '', 0, '', 320, '操作删除', 2, '', '', 'system:operation:log:remove', '#', '0', '0', 'A', '1', '1'),
(323, 'system', 1700000000000, '', 0, '', 320, '日志导出', 3, '', '', 'system:operation:log:export', '#', '0', '0', 'A', '1', '1'),
(340, 'system', 1700000000000, '', 0, '', 300, '登录日志', 2, '/system/logs/login', 'system/log/login/LoginLogIndex', 'system:login:log:list', '#', '0', '1', 'M', '1', '1'),
(342, 'system', 1700000000000, '', 0, '', 340, '登录删除', 2, '', '', 'system:login:log:remove', '#', '0', '0', 'A', '1', '1'),
(343, 'system', 1700000000000, '', 0, '', 340, '日志导出', 3, '', '', 'system:login:log:export', '#', '0', '0', 'A', '1', '1'),

(2,   'system', 1700000000000, '', 0, '系统监控目录', 0, '系统监控', 3, '/monitor', '',  '', '#', '0', '1', 'D', '1', '1'),
(360, 'system', 1700000000000, '', 0, '系统信息菜单', 2, '系统信息', 1, '/monitor/system', 'monitor/system/SystemInfo', 'monitor:system:info', '#', '0', '1', 'M', '1', '1'),
(380, 'system', 1700000000000, '', 0, '缓存信息菜单', 2, '缓存信息', 3, '/monitor/cache/info', 'monitor/cache/CacheInfo', 'monitor:cache:info', '#', '0', '1', 'M', '1', '1'),
(400, 'system', 1700000000000, '', 0, '缓存列表菜单', 2, '缓存管理', 4, '/monitor/cache', 'monitor/cache/CacheIndex', 'monitor:cache:list', '#', '0', '1', 'M', '1', '1'),
(401, 'system', 1700000000000, '', 0, '', 400, '缓存查询', 1, '', '', 'monitor:cache:query', '#', '0', '0', 'A', '1', '1'),
(402, 'system', 1700000000000, '', 0, '', 400, '缓存删除', 2, '', '', 'monitor:cache:remove', '#', '0', '0', 'A', '1', '1'),
(420, 'system', 1700000000000, '', 0, '在线用户菜单',  2,   '在线用户', 5, '/monitor/online-users', 'monitor/online/OnlineIndex', 'monitor:online:user:list', '#', '0', '1', 'M', '1', '1'),
(422, 'system', 1700000000000, '', 0, '', 420, '强退用户', 2, '', '', 'monitor:online:user:logout', '#', '0', '0', 'A', '1', '1'),
(440, 'system', 1700000000000, '', 0, '调度任务菜单',  2,   '调度任务', 7, '/monitor/jobs', 'monitor/job/JobIndex', 'monitor:job:list', '#', '0', '1', 'M', '1', '1'),
(441, 'system', 1700000000000, '', 0, '', 440, '任务查询', 1, '', '', 'monitor:job:query', '#', '0', '0', 'A', '1', '1'),
(442, 'system', 1700000000000, '', 0, '', 440, '任务新增', 2, '', '', 'monitor:job:add', '#', '0', '0', 'A', '1', '1'),
(443, 'system', 1700000000000, '', 0, '', 440, '任务修改', 3, '', '', 'monitor:job:edit', '#', '0', '0', 'A', '1', '1'),
(444, 'system', 1700000000000, '', 0, '', 440, '任务删除', 4, '', '', 'monitor:job:remove', '#', '0', '0', 'A', '1', '1'),
(445, 'system', 1700000000000, '', 0, '', 440, '状态修改', 5, '', '', 'monitor:job:status', '#', '0', '0', 'A', '1', '1'),
(446, 'system', 1700000000000, '', 0, '', 440, '任务导出', 6, '', '', 'monitor:job:export', '#', '0', '0', 'A', '1', '1'),
(460, 'system', 1700000000000, '', 0, '调度日志内嵌隐藏菜单', 2, '调度日志', 8, '/monitor/jobs/inline/logs/:jobId', 'monitor/job/JobLog', 'monitor:job:log:list', '#', '0', '1', 'M', '0', '1'),
(461, 'system', 1700000000000, '', 0, '', 460, '日志查询', 1, '', '', 'monitor:job:log:query',  '#', '0', '0', 'A', '1', '1'),
(462, 'system', 1700000000000, '', 0, '', 460, '日志删除', 2, '', '', 'monitor:job:log:remove', '#', '0', '0', 'A', '1', '1'),
(463, 'system', 1700000000000, '', 0, '', 460, '日志导出', 3, '', '', 'monitor:job:log:export', '#', '0', '0', 'A', '1', '1'),

(3,   'system', 1700000000000, '', 0, '系统工具目录', 0, '系统工具', 5, '/tool', '', '', '#', '0', '1', 'D', '1', '1'),
(481, 'system', 1700000000000, '', 0, '文件上传菜单',  3, '文件上传', 1, '/tool/files', 'tool/upload/UploadIndex', '', '#', '0', '1', 'M', '1', '1'),
(483, 'system', 1700000000000, '', 0, '生成构建菜单',  3, '生成构建', 3, '/tool/build', 'tool/build/BuildIndex', '', '#', '0', '1', 'M', '1', '1'),
(485, 'system', 1700000000000, '', 0, '系统接口菜单',  3, '系统接口', 5, '/tool/api-docs', 'tool/swagger/SwaggerIndex', '', '#', '0', '1', 'M', '1', '1'),
(487, 'system', 1700000000000, '', 0, '链接菜单打开',  3, '接口文档', 7,  'https://mask-api-midwayjs.apifox.cn', '', '', '#', '0', '1', 'M', '1', '1'),
(489, 'system', 1700000000000, '', 0, '链接新窗打开',  3, '开源仓库', 9,  'https://gitee.com/TsMask/projects', '', '', '#', '1', '1', 'M', '1', '1'),

(4,   'system', 1700000000000, '', 0, '外部链接跳转', 0, '开源仓库', 7, 'https://gitee.com/TsMask', '', '', '#', '1', '0', 'D', '1', '1');

-- ----------------------------------------------------------------
-- 5、用户信息表 sys_user（用户 N:1 部门 dept_id；密码 Argon2id 存储）
-- ----------------------------------------------------------------
drop table if exists sys_user;
create table sys_user (
  id                bigint          not null auto_increment    comment '用户ID',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(255)    default ''                 comment '备注',
  user_name         varchar(32)     not null                   comment '用户账号',
  user_nick         varchar(32)     not null                   comment '用户昵称',
  user_email        varchar(128)    default ''                 comment '用户邮箱',
  user_phone        varchar(32)     default ''                 comment '手机号码',
  user_gender       varchar(1)      default '0'                comment '用户性别（0未选择 1男 2女）',
  user_avatar       varchar(512)    default ''                 comment '头像地址',
  user_password     varchar(128)    default ''                 comment '密码',
  user_login_ip     varchar(64)     default ''                 comment '最后登录IP',
  user_login_time   bigint          default 0                  comment '最后登录时间',
  user_status       varchar(1)      default '0'                comment '账号状态（0停用 1正常）',
  dept_id           bigint          default 0                  comment '部门ID',
  deleted_at           bigint          not null default 0         comment '删除时间（0未删除）',
  deleted_by           varchar(64)     default ''                 comment '删除人',
  active_user_name     varchar(32)     generated always as (if(deleted_at = 0, user_name, null)) stored comment '未删除用户账号',
  unique key uk_sys_user_active_user_name (active_user_name),
  key idx_sys_user_dept (dept_id),
  key idx_sys_user_deleted_id (deleted_at, id),
  key idx_sys_user_login_time (user_login_time),
  key idx_sys_user_status (user_status),
  key idx_sys_user_phone (user_phone),
  key idx_sys_user_email (user_email),
  primary key (id)
) engine=innodb auto_increment=100 comment='系统_用户信息表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-内置用户数据（system 为隐藏兜底账号；admin 日常管理；user 默认普通账号）
-- 明文密码均为 Abcd@1234..，使用 Argon2id 存储
insert into sys_user (id, create_by, create_time, update_by, update_time, remark, user_name, user_nick, user_email, user_phone, user_gender, user_avatar, user_password, user_login_ip, user_login_time, user_status, dept_id) values
(1, 'system', 1700000000000, '', 0, '内置隐藏账号，仅超级管理员兜底使用', 'system', '超级管理员', 'system@163.com', '15888888888', '1', '', '$argon2id$v=19$m=65536,t=3,p=2$1EvSi8zBVy6mfMcPtVSQlg$eEZRm1SZsdQc6jURocWg+lmY25syZDdm9QPlZ5MszLE', '127.0.0.1', 1700000000000, '1', 100),
(2, 'system', 1700000000000, '', 0, '日常管理员账号',                   'admin',  '管理员',     'admin@qq.com',  '15800000001', '1', '', '$argon2id$v=19$m=65536,t=3,p=2$1EvSi8zBVy6mfMcPtVSQlg$eEZRm1SZsdQc6jURocWg+lmY25syZDdm9QPlZ5MszLE', '127.0.0.1', 1700000000000, '1', 101),
(3, 'system', 1700000000000, '', 0, '默认普通账号',                     'user',   '普通用户',   'user@gmail.com',   '15666666666', '0', '', '$argon2id$v=19$m=65536,t=3,p=2$1EvSi8zBVy6mfMcPtVSQlg$eEZRm1SZsdQc6jURocWg+lmY25syZDdm9QPlZ5MszLE', '127.0.0.1', 1700000000000, '1', 103);

-- ================================================================
-- 二、关联表（多对多）
-- ================================================================

-- ----------------------------------------------------------------
-- 6、用户-角色关联表 sys_user_role（用户 M:N 角色）
-- ----------------------------------------------------------------
drop table if exists sys_user_role;
create table sys_user_role (
  user_id   bigint not null comment '用户ID',
  role_id   bigint not null comment '角色ID',
  key idx_sys_user_role_role_id (role_id),
  primary key(user_id, role_id)
) engine=innodb comment='系统_用户和角色关联表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-内置用户角色数据
insert into sys_user_role (user_id, role_id) values
(1, 1),
(2, 2),
(3, 3);


-- ----------------------------------------------------------------
-- 7、用户-岗位关联表 sys_user_post（用户 M:N 岗位）
-- ----------------------------------------------------------------
drop table if exists sys_user_post;
create table sys_user_post (
  user_id   bigint not null comment '用户ID',
  post_id   bigint not null comment '岗位ID',
  key idx_sys_user_post_post_id (post_id),
  primary key (user_id, post_id)
) engine=innodb comment='系统_用户与岗位关联表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-用户岗位示例数据
insert into sys_user_post (user_id, post_id) values
(1, 1),
(2, 2),
(3, 3);


-- ----------------------------------------------------------------
-- 8、角色-菜单关联表 sys_role_menu（角色 M:N 菜单，功能权限）
--    说明: role_key='system'(id=1) 为超级管理员，菜单接口对其返回全部，无需配置；
--          管理员角色 admin(id=2) 菜单控制可见全部 + 全部数据权限；普通角色 common(id=3) 部分菜单 + 自定数据权限。
-- ----------------------------------------------------------------
drop table if exists sys_role_menu;
create table sys_role_menu (
  role_id   bigint not null comment '角色ID',
  menu_id   bigint not null comment '菜单ID',
  key idx_sys_role_menu_menu_id (menu_id),
  primary key(role_id, menu_id)
) engine=innodb comment='系统_角色和菜单关联表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-角色菜单示例数据
--   管理员角色 admin(id=2): 菜单控制可见全部（分配全部菜单/权限）+ 全部数据权限
--   普通角色 common(id=3): 仅可见部分（用户管理只读 + 通知公告 + 日志只读导出）+ 自定数据权限
insert into sys_role_menu (role_id, menu_id) values
(2, 1),
(2, 2),
(2, 3),
(2, 100),
(2, 101),
(2, 102),
(2, 103),
(2, 104),
(2, 105),
(2, 106),
(2, 107),
(2, 108),
(2, 120),
(2, 121),
(2, 122),
(2, 123),
(2, 124),
(2, 125),
(2, 140),
(2, 160),
(2, 161),
(2, 162),
(2, 163),
(2, 164),
(2, 180),
(2, 181),
(2, 182),
(2, 183),
(2, 184),
(2, 185),
(2, 200),
(2, 201),
(2, 202),
(2, 203),
(2, 204),
(2, 220),
(2, 221),
(2, 222),
(2, 223),
(2, 224),
(2, 225),
(2, 240),
(2, 241),
(2, 242),
(2, 243),
(2, 244),
(2, 245),
(2, 260),
(2, 261),
(2, 262),
(2, 263),
(2, 264),
(2, 265),
(2, 280),
(2, 281),
(2, 282),
(2, 283),
(2, 284),
(2, 300),
(2, 320),
(2, 322),
(2, 323),
(2, 340),
(2, 342),
(2, 343),
(2, 360),
(2, 380),
(2, 400),
(2, 401),
(2, 402),
(2, 420),
(2, 422),
(2, 440),
(2, 441),
(2, 442),
(2, 443),
(2, 444),
(2, 445),
(2, 446),
(2, 460),
(2, 461),
(2, 462),
(2, 463),
(2, 481),
(2, 483),
(2, 485),
(2, 487),
(2, 489),
(3, 4);

-- ----------------------------------------------------------------
-- 9、角色-部门关联表 sys_role_dept（角色 M:N 部门，数据权限）
--    说明: 数据范围由 sys_role.role_data_scope 控制；admin(id=2)=1 全部数据权限无需配部门，
--          此处仅为 common(id=3) 配可见部门(与 role_data_scope='2' 配合)。
-- ----------------------------------------------------------------
drop table if exists sys_role_dept;
create table sys_role_dept (
  role_id   bigint not null comment '角色ID',
  dept_id   bigint not null comment '部门ID',
  key idx_sys_role_dept_dept_id (dept_id),
  primary key(role_id, dept_id)
) engine=innodb comment='系统_角色和部门关联表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-角色部门示例数据（普通角色 common 仅可见 深圳总公司(101) 的数据）
insert into sys_role_dept (role_id, dept_id) values
(3, 101);

-- ================================================================
-- 三、字典与配置
-- ================================================================

-- ----------------------------------------------------------------
-- 10、字典类型表 sys_dict_type（dict_type 与 sys_dict_data 字符串关联）
-- ----------------------------------------------------------------
drop table if exists sys_dict_type;
create table sys_dict_type (
  id               bigint          not null auto_increment    comment '字典ID',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(200)    default ''                 comment '备注',
  dict_name        varchar(64)     not null                   comment '字典名称',
  dict_type        varchar(64)     not null                   comment '字典类型',
  dict_status      varchar(1)      default '0'                comment '状态（0停用 1正常）',
  key idx_sys_dict_type_status_time (dict_status, create_time),
  key idx_sys_dict_type_name (dict_name),
  unique key uk_dict_type (dict_type),
  primary key (id)
) engine=innodb auto_increment=50 comment='系统_字典类型表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-字典类型示例数据
insert into sys_dict_type (id, create_by, create_time, update_by, update_time, remark, dict_name, dict_type, dict_status) values
(1, 'system', 1700000000000, '', 0, '用户性别属性', '用户性别', 'sys_user_gender', '1'),
(2, 'system', 1700000000000, '', 0, '系统开关属性', '正常停用', 'sys_normal_disable', '1'),
(3, 'system', 1700000000000, '', 0, '系统状态属性', '成功失败', 'sys_success_fail', '1'),
(4, 'system', 1700000000000, '', 0, '系统显隐属性', '显示隐藏', 'sys_show_hide', '1'),
(5, 'system', 1700000000000, '', 0, '通知公告类型', '通知类型', 'sys_notice_type', '1'),
(6, 'system', 1700000000000, '', 0, '通知公告状态', '通知状态', 'sys_notice_status', '1'),
(7, 'system', 1700000000000, '', 0, '操作日志类型', '操作日志类型', 'sys_operation_type', '1'),
(8, 'system', 1700000000000, '', 0, '任务分组属性', '任务分组', 'sys_job_group', '1'),
(9, 'system', 1700000000000, '', 0, '配置分组属性', '配置分组', 'sys_config_group', '1'),
(10, 'system', 1700000000000, '', 0, '参数键值类型属性', '参数键值类型', 'sys_config_value_type', '1');

-- ----------------------------------------------------------------
-- 11、字典数据表 sys_dict_data（按 dict_type 字符串归属到字典类型）
-- ----------------------------------------------------------------
drop table if exists sys_dict_data;
create table sys_dict_data (
  id               bigint          not null auto_increment    comment '数据ID',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      bigint          default 0                  comment '更新时间',
  remark           varchar(200)    default ''                 comment '备注',
  dict_type        varchar(64)     not null                   comment '字典类型',
  data_label       varchar(64)     not null                   comment '数据标签',
  data_value       varchar(128)    not null                   comment '数据键值',
  data_sort        int             default 0                  comment '数据排序',
  data_status      varchar(1)      default '0'                comment '状态（0停用 1正常）',
  tag_class        varchar(64)     default ''                 comment '样式属性（样式扩展）',
  tag_type         varchar(12)     default ''                 comment '标签类型（预设颜色）',
  key idx_sys_dict_data_type_sort (dict_type, data_sort),
  key idx_sys_dict_data_label (data_label),
  primary key (id)
) engine=innodb auto_increment=100 comment='系统_字典数据表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-字典数据示例数据
insert into sys_dict_data (id, create_by, create_time, update_by, update_time, remark, dict_type, data_label, data_value, data_sort, data_status, tag_class, tag_type) values
(1, 'system', 1700000000000, '', 0, '', 'sys_user_gender',       '男',   '1', 1, '1', '', ''),
(2, 'system', 1700000000000, '', 0, '', 'sys_user_gender',       '女',   '2', 2, '1', '', ''),
(3, 'system', 1700000000000, '', 0, '', 'sys_user_gender',       '未选择', '0', 3, '1', '', ''),
(4, 'system', 1700000000000, '', 0, '', 'sys_normal_disable', '正常', '1', 1, '1', '', 'success'),
(5, 'system', 1700000000000, '', 0, '', 'sys_normal_disable', '停用', '0', 0, '1', '', 'error'),
(6, 'system', 1700000000000, '', 0, '', 'sys_success_fail', '成功', '1', 1, '1', '', 'success'),
(7, 'system', 1700000000000, '', 0, '', 'sys_success_fail', '失败', '0', 0, '1', '', 'error'),
(8, 'system', 1700000000000, '', 0, '', 'sys_show_hide', '显示', '1', 1, '1', '', 'success'),
(9, 'system', 1700000000000, '', 0, '', 'sys_show_hide', '隐藏', '0', 0, '1', '', 'error'),
(10, 'system', 1700000000000, '', 0, '', 'sys_notice_type',    '通知', '1', 1, '1', '', 'warning'),
(11, 'system', 1700000000000, '', 0, '', 'sys_notice_type',    '公告', '2', 2, '1', '', 'processing'),
(12, 'system', 1700000000000, '', 0, '', 'sys_notice_status',  '关闭',   '0', 1, '1', '', 'error'),
(13, 'system', 1700000000000, '', 0, '', 'sys_notice_status',  '正常',   '1', 2, '1', '', 'success'),
(14, 'system', 1700000000000, '', 0, '', 'sys_notice_status',  '审核',   '2', 3, '1', '', 'warning'),
(15, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '其他',   '0', 0, '1', '', 'processing'),
(16, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '新增',   '1', 1, '1', '', 'processing'),
(17, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '修改',   '2', 2, '1', '', 'processing'),
(18, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '删除',   '3', 3, '1', '', 'error'),
(19, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '授权',   '4', 4, '1', '', 'success'),
(20, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '导出',   '5', 5, '1', '', 'warning'),
(21, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '导入',   '6', 6, '1', '', 'warning'),
(22, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '强退',   '7', 7, '1', '', 'error'),
(23, 'system', 1700000000000, '', 0, '', 'sys_operation_type',  '清空',   '8', 8, '1', '', 'error'),
(24, 'system', 1700000000000, '', 0, '', 'sys_job_group',  '默认',   'DEFAULT', 1, '1', '', ''),
(25, 'system', 1700000000000, '', 0, '', 'sys_job_group',  '监控',   'MONITOR', 1, '1', '', ''),
(26, 'system', 1700000000000, '', 0, '', 'sys_config_group',  '用户管理',   'user',    1, '1', '', ''),
(27, 'system', 1700000000000, '', 0, '', 'sys_config_group',  '账号认证',   'account', 2, '1', '', ''),
(28, 'system', 1700000000000, '', 0, '', 'sys_config_value_type',  '字符',   'string',  1, '1', '', ''),
(29, 'system', 1700000000000, '', 0, '', 'sys_config_value_type',  '数字',   'number',  2, '1', '', ''),
(30, 'system', 1700000000000, '', 0, '', 'sys_config_value_type',  '布尔',   'boolean', 3, '1', '', ''),
(31, 'system', 1700000000000, '', 0, '', 'sys_config_value_type',  'JSON',   'json',    4, '1', '', ''),
(32, 'system', 1700000000000, '', 0, '', 'sys_notice_status',  '已删除', '3', 4, '1', '', 'danger');


-- ----------------------------------------------------------------
-- 12、参数配置表 sys_config
-- ----------------------------------------------------------------
drop table if exists sys_config;
create table sys_config (
  id                bigint          not null auto_increment    comment '参数ID',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  config_name       varchar(64)     default ''                 comment '参数名称',
  config_key        varchar(64)     default ''                 comment '参数键名',
  config_value      varchar(512)    default ''                 comment '参数键值',
  config_value_type varchar(128)    default ''                 comment '参数键值类型',
  config_group      varchar(64)     default ''                 comment '参数组',
  config_sort       bigint          default 0                  comment '排序',
  config_status     varchar(1)      default '0'                comment '状态（0停用 1正常）',
  key idx_sys_config_group_sort (config_group, config_sort),
  key idx_sys_config_name (config_name),
  unique key uk_sys_config_config_key (config_key),
  primary key (id)
) engine=innodb auto_increment=50 comment='系统_参数配置表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-参数配置示例数据
insert into sys_config (id, create_by, create_time, update_by, update_time, remark, config_name, config_key, config_value, config_value_type, config_group, config_sort, config_status) values
(1, 'system', 1700000000000, '', 0, '用户管理-导入用户初始密码',     '用户初始密码', 'sys.user.init_password', 'Abcd@1234..', 'string', 'user',   1, '1'),
(2, 'system', 1700000000000, '', 0, '账号认证-是否开启用户注册功能', '开启用户注册', 'sys.user.register', 'false', 'boolean', 'user',   1, '1'),
(3, 'system', 1700000000000, '', 0, '账号认证-密码尝试错误最大次数', '密码尝试错误最大次数', 'sys.user.max_retry_count', '5', 'number', 'user',   10, '1'),
(4, 'system', 1700000000000, '', 0, '账号认证-密码尝试错误后锁定时间，单位分钟', '密码尝试错误后锁定时间', 'sys.user.lock_time', '10', 'number', 'user',   11, '1'),
(5, 'system', 1700000000000, '', 0, '安全认证-验证码开关', '验证码开关', 'sys.account.captcha_enabled', 'true', 'boolean', 'account',   5, '1'),
(6, 'system', 1700000000000, '', 0, '安全认证-验证码类型', '验证码类型', 'sys.account.captcha_type', 'math', 'string', 'account',   6, '1'),
(7, 'system', 1700000000000, '', 0, '安全认证-验证码math参数', '验证码math参数', 'sys.account.captcha_config_math', '{"height":40,"width":120,"noise":4,"background":"#fafafa"}', 'json', 'account', 7, '1'),
(8, 'system', 1700000000000, '', 0, '安全认证-验证码char参数', '验证码char参数', 'sys.account.captcha_config_char', '{"height":40,"width":120,"noise":4,"size":4,"chars":"023456789abcdefghjkmnprstuvwxyz","background":"#fafafa"}', 'json', 'account', 8, '1'),
(9, 'system', 1700000000000, '', 0, '安全认证-短信验证码过期时间，单位秒', '短信验证码过期时间', 'sys.account.captcha_sms_expires_in_seconds', '600', 'number', 'account', 20, '1'),
(10, 'system', 1700000000000, '', 0, '安全认证-短信验证码发送间隔，单位秒', '短信验证码发送间隔', 'sys.account.captcha_sms_resend_interval_seconds', '120', 'number', 'account', 22, '1'),
(11, 'system', 1700000000000, '', 0, '安全认证-邮箱验证码过期时间，单位秒', '邮箱验证码过期时间', 'sys.account.captcha_email_expires_in_seconds', '600', 'number', 'account', 30, '1'),
(12, 'system', 1700000000000, '', 0, '安全认证-邮箱验证码发送间隔，单位秒', '邮箱验证码发送间隔', 'sys.account.captcha_email_resend_interval_seconds', '120', 'number', 'account', 32, '1');

-- ================================================================
-- 四、调度任务
-- ================================================================

-- ----------------------------------------------------------------
-- 13、调度任务表 sys_job
-- ----------------------------------------------------------------
drop table if exists sys_job;
create table sys_job (
  id                  bigint        not null auto_increment    comment '任务ID',
  create_by           varchar(64)   default ''                 comment '创建者',
  create_time         bigint        default 0                  comment '创建时间',
  update_by           varchar(64)   default ''                 comment '更新者',
  update_time         bigint        default 0                  comment '更新时间',
  remark              varchar(255)  default ''                 comment '备注',
  job_name            varchar(64)   default ''                 comment '任务名称',
  job_group           varchar(32)   default 'DEFAULT'          comment '任务组名',
  job_invoke_target   varchar(64)   not null                   comment '调用目标字符串',
  job_target_params   varchar(1024) default ''                 comment '调用目标传入参数',
  job_cron            varchar(64)   default ''                 comment 'cron执行表达式',
  job_misfire_policy  varchar(1)    default '3'                comment '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  job_concurrent      varchar(1)    default '0'                comment '是否并发执行（0禁止 1允许）',
  job_status          varchar(1)    default '0'                comment '任务状态（0暂停 1正常）',
  job_save_log        varchar(1)    default '0'                comment '是否记录任务日志（0不记录 1记录）',
  key idx_sys_job_group_status_id (job_group, job_status, id),
  key idx_sys_job_invoke_target (job_invoke_target),
  primary key (id),
  unique key uk_sys_job_name_group (job_name, job_group)
) engine=innodb auto_increment=10 comment='系统_调度任务调度表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-调度任务示例数据（默认暂停，启用前请将 job_invoke_target 改为已注册的真实调用目标）
insert into sys_job (id, create_by, create_time, update_by, update_time, remark, job_name, job_group, job_invoke_target, job_target_params, job_cron, job_misfire_policy, job_concurrent, job_status, job_save_log) values
(1, 'system', 1700000000000, '', 0, '示例：触发执行', '测试—触发执行', 'DEFAULT', 'test_job', '{"t":10}', '0/10 * * * * ?', '3', '0', '0', '1'),
(2, 'system', 1700000000000, '', 0, '示例：缓慢执行', '测试—缓慢执行', 'DEFAULT', 'test_progress', '{"t":15}', '0/15 * * * * ?', '3', '0', '0', '1'),
(3, 'system', 1700000000000, '', 0, '示例：异常执行', '测试—异常执行', 'DEFAULT', 'test_error', '{"t":20}', '0/20 * * * * ?', '3', '0', '0', '1');

-- ----------------------------------------------------------------
-- 14、调度任务日志表 sys_job_log（按 job_name+job_group 归属，冗余调用信息便于历史追溯）
-- ----------------------------------------------------------------
drop table if exists sys_job_log;
create table sys_job_log (
  id                bigint          not null auto_increment    comment '任务日志ID',
  create_time       bigint          default 0                  comment '创建时间',
  job_name          varchar(64)     not null                   comment '任务名称',
  job_group         varchar(32)     not null                   comment '任务组名',
  job_invoke_target varchar(64)     not null                   comment '调用目标字符串',
  job_target_params varchar(1024)   default ''                 comment '调用目标传入参数',
  log_msg           varchar(2048)   default ''                 comment '日志信息',
  log_status        varchar(1)      default '0'                comment '执行状态（0失败 1正常）',
  log_cost_time     bigint          default 0                  comment '消耗时间（毫秒）',
  key idx_sys_job_log_job (job_name, job_group, log_status, create_time),
  key idx_sys_job_log_status_time (log_status, create_time),
  key idx_sys_job_log_invoke_target (job_invoke_target),
  key idx_sys_job_log_create_time (create_time),
  primary key (id)
) engine=innodb comment='系统_调度任务调度日志表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-任务日志示例数据
insert into sys_job_log (id, create_time, job_name, job_group, job_invoke_target, job_target_params, log_msg, log_status, log_cost_time) values
(1, 1700000000000, '示例：触发执行', 'DEFAULT', 'simple', '{"t":10}', '示例执行成功', '1', 12);


-- ================================================================
-- 五、通知公告
-- ================================================================

-- ----------------------------------------------------------------
-- 15、通知公告表 sys_notice
-- ----------------------------------------------------------------
drop table if exists sys_notice;
create table sys_notice (
  id              bigint          not null auto_increment    comment '公告ID',
  create_by       varchar(64)     default ''                 comment '创建者',
  create_time     bigint          default 0                  comment '创建时间',
  update_by       varchar(64)     default ''                 comment '更新者',
  update_time     bigint          default 0                  comment '更新时间',
  remark          varchar(255)    default ''                 comment '备注',
  notice_title    varchar(50)     not null                   comment '公告标题',
  notice_type     varchar(1)      not null                   comment '公告类型（1通知 2公告）',
  notice_content  text            not null                   comment '公告内容',
  notice_status   varchar(1)      default '0'                comment '公告状态（0关闭 1正常 2审核 3已删除）',
  key idx_sys_notice_list (notice_status, notice_type, create_time),
  key idx_sys_notice_title (notice_title),
  key idx_sys_notice_create_by (create_by),
  primary key (id)
) engine=innodb auto_increment=10 comment='系统_通知公告表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-通知公告示例数据
insert into sys_notice (id, create_by, create_time, update_by, update_time, remark, notice_title, notice_type, notice_content, notice_status) values
(1, 'system', 1700000000000, '', 0, '初始数据', '系统维护通知', '1', '系统将于本周日凌晨 02:00-04:00 进行例行维护，期间服务暂停访问，请提前做好准备。', '1'),
(2, 'system', 1700000000000, '', 0, '初始数据', '新版本上线公告','2', '后台管理系统已升级至新版本，新增菜单权限、数据字典、操作日志等功能，欢迎使用。',  '1');

-- ================================================================
-- 六、系统日志
-- ================================================================

-- ----------------------------------------------------------------
-- 16、系统操作日志表 sys_operation_log（用 create_by 字符串软关联 sys_user.user_name）
-- ----------------------------------------------------------------
drop table if exists sys_operation_log;
create table sys_operation_log (
  id                bigint          not null auto_increment    comment '操作ID',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  title             varchar(32)     default ''                 comment '模块标题',
  operation_type      varchar(1)      default '0'                comment '业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据）',
  operation_url       varchar(200)    default ''                 comment '请求URL',
  operation_method    varchar(10)     default ''                 comment '请求方式',
  operation_ip        varchar(64)     default ''                 comment '主机地址',
  operation_location  varchar(32)     default ''                 comment '操作地点',
  operation_param     varchar(2000)   default ''                 comment '请求参数',
  operation_function  varchar(64)     default ''                 comment '方法函数方法',
  operation_cost_time bigint          default 0                  comment '消耗时间（毫秒）',
  operation_status    varchar(1)      default '0'                comment '操作状态（0异常 1正常）',
  operation_msg       varchar(2048)   default ''                 comment '操作消息',
  key idx_sys_operation_log_create_time (create_time),
  key idx_sys_operation_log_create_by_time (create_by, create_time),
  key idx_sys_operation_log_type_time (operation_type, create_time),
  key idx_sys_operation_log_status_time (operation_status, create_time),
  primary key (id)
) engine=innodb auto_increment=1 comment='系统_系统操作日志表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-操作日志示例数据
insert into sys_operation_log (id, create_by, create_time, title, operation_type, operation_url, operation_method, operation_ip, operation_location, operation_param, operation_function, operation_cost_time, operation_status, operation_msg) values
(1, 'system', 1700000000000, '用户管理', '1', '/system/user', 'POST', '127.0.0.1', '内网IP', '{"userName":"user"}', 'SysUser.Add', 25, '1', '新增成功');


-- ----------------------------------------------------------------
-- 17、系统登录日志表 sys_login_log（用 login_user_name 字符串软关联 sys_user.user_name）
-- ----------------------------------------------------------------
drop table if exists sys_login_log;
create table sys_login_log (
  id               bigint          not null auto_increment    comment '登录ID',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      bigint          default 0                  comment '创建时间',
  login_user_name  varchar(32)     default ''                 comment '用户账号',
  login_ip         varchar(64)     default ''                 comment '登录IP地址',
  login_location   varchar(32)     default ''                 comment '登录地点',
  login_browser    varchar(64)     default ''                 comment '浏览器类型',
  login_os         varchar(64)     default ''                 comment '操作系统',
  login_status     varchar(1)      default '0'                comment '登录状态（0失败 1成功）',
  login_msg        varchar(2048)   default ''                 comment '提示消息',
  key idx_sys_login_log_create_time (create_time),
  key idx_sys_login_log_user_time (login_user_name, create_time),
  key idx_sys_login_log_ip_time (login_ip, create_time),
  key idx_sys_login_log_status_time (login_status, create_time),
  primary key (id)
) engine=innodb auto_increment=1 comment='系统_系统登录日志表' DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化-登录日志示例数据
insert into sys_login_log (id, create_by, create_time, login_user_name, login_ip, login_location, login_browser, login_os, login_status, login_msg) values
(1, 'system', 1700000000000, 'admin', '127.0.0.1', '内网IP', 'Chrome 120', 'Windows 11', '1', '登录成功'),
(2, 'system', 1700000000000, 'mask', '127.0.0.1', '内网IP', 'Chrome 120', 'Windows 11', '0', '用户不存在/密码错误');


SET FOREIGN_KEY_CHECKS = 1;
