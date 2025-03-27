-- ----------------------------
-- oauth2模块内使用的，不需要可不导入
-- 测试oauth2_表，根据模块oauth2内删除其引用
-- ----------------------------

-- ----------------------------
-- 1、用户授权第三方应用表
-- ----------------------------
drop table if exists oauth2_client;
create table oauth2_client (
  id                int             not null auto_increment    comment '应用ID',
  client_id         varchar(32)     not null                   comment '应用的唯一标识',
  client_secret     varchar(64)     not null                   comment '应用的凭证秘钥',
  title             varchar(64)     default ''                 comment '应用名称',
  ip_white          varchar(255)    default ''                 comment 'IP白名单',
  del_flag          varchar(1)      default '0'                comment '删除标记（0存在 1删除）',
  login_ip          varchar(128)    default ''                 comment '最后登录IP',
  login_time        bigint          default 0                  comment '最后登录时间',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (id)
) engine=innodb auto_increment=1 comment = '用户授权第三方应用表';


-- ----------------------------
-- 2、用户授权第三方应用登录日志表
-- ----------------------------
drop table if exists oauth2_log_login;
create table oauth2_log_login (
  id             bigint         not null auto_increment   comment '登录ID',
  client_id      varchar(32)    default ''                comment '应用的唯一标识',
  login_ip       varchar(128)   default ''                comment '登录IP地址',
  login_location varchar(32)    default ''                comment '登录地点',
  browser        varchar(64)    default ''                comment '浏览器类型',
  os             varchar(64)    default ''                comment '操作系统',
  status_flag    varchar(1)     default '0'               comment '登录状态（0失败 1成功）',
  msg            varchar(255)   default ''                comment '提示消息',
  login_time     bigint         default 0                 comment '登录时间',
  primary key (id)
) engine=innodb auto_increment=1 comment='用户授权第三方应用登录日志表';
