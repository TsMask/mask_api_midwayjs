-- ----------------------------
-- demo模块内使用的，不需要可不导入
-- 测试demo_表，根据模块demo内删除其引用
-- ----------------------------

-- ----------------------------
-- 1、测试ORM表
-- ----------------------------
drop table if exists demo_orm;
create table demo_orm (
  id                int             not null auto_increment    comment '测试ID',
  title             varchar(64)     not null                   comment '测试标题',
  orm_type          varchar(12)     not null                   comment 'orm类型',
  status_flag       varchar(1)      default '0'                comment '状态（0关闭 1正常）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       bigint          default 0                  comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       bigint          default 0                  comment '更新时间',
  remark            varchar(200)    default ''                 comment '备注',
  primary key (id)
) engine=innodb auto_increment=10 comment = '测试ORM表';

-- ----------------------------
-- 初始化-测试ORM表数据
-- ----------------------------
insert into demo_orm values('1', 'MySQL', 'mysql', '1', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '测试ORM');
insert into demo_orm values('2', 'PgSQL', 'pg',    '1', 'system', REPLACE(unix_timestamp(now(3)),'.',''), '', 0, '测试ORM');
