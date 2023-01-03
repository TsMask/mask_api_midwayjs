# 各接口服务模块

对领域功能进行划分为不同的模块并实现其服务接口

```text
xxx                 目录-xxx模块
├── controller      目录-接口路由控制层
├── model           目录-数据对象模型层
├── repository      目录-CURD数据存储层
├── service         目录-业务逻辑服务层
└── ...
```

## 接口路由控制层

定义请求路由负责参数接收验证

## 数据对象模型层

对数据库中表的字段属性进行对象模型建立

## CURD数据存储层

对服务层处理后的数据进行存储，一般对各表间存储关系进行关联操作。

在使用时 `ts` 只能使用实现层的部分，所以定义接口后需要在 `impl` 目录中实现接口具体的函数行为。

### 存储层目录结构

```text
repository
├── impl                      目录-存储层接口实现
├── Ixxx.ts                   文件-存储层接口定义
└── ...
```

### 数据库事务

在某些时候需要保证数据的一致性，对数据库的 `SQL` 操作。

常见场景：用户转账时，A用户-100 => B用户+100，中间发生异常时导致B没收到A的转账

```ts
import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';

@Provide()
@Scope(ScopeEnum.Singleton)
export class xxxRepositoryImpl {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 更新操作
   * 
   * @returns true | false
   */
  async update_xxx(): Promise<boolean> {
    // 获取连接并创建新的queryRunner
    const queryRunner = this.db.executeRunner();

    // 对此事务执行一些操作
    try {
      // 开始事务
      await queryRunner.startTransaction();

      // sql语句
      let sql_str = `UPDATE tbl_xxx SET xx = ? WHERE id= ?`;

      const up_row1 = await queryRunner.query(sql_str, [101, "101"]);

      const up_row2 = await queryRunner.query(sql_str, [102, "102"]);

      if (parseInt(up_row1.affectedRows) <= 0 || parseInt(up_row2.affectedRows) <= 0) {
        // 有错误做出回滚更改 后释放连接
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 提交事务写入库 后释放连接
      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      // 有错误做出回滚更改 后释放连接
      await queryRunner.rollbackTransaction();
      throw new Error('服务数据异常');
    } finally {
      //释放连接
      await queryRunner.release();
    }
  }

}

```

## 业务逻辑处理服务层

对请求参数进行处理逻辑操作的层面，会包含很多条件判断或调用其他依赖库等。

在使用时 `ts` 只能使用实现层的部分，所以定义接口后需要在 `impl` 目录中实现接口具体的函数行为。

### 服务层目录结构

```text
service
├── impl                      目录-服务层接口实现
├── Ixxx.ts                   文件-服务层接口定义
└── ...
```
