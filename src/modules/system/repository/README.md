## 数据库存储层

实体参数进行对数据库的 sql 操作

```ts
async update_user_field(): Promise<boolean> {
    // 获取连接并创建新的queryRunner
    const queryRunner = getConnection().createQueryRunner();
    
    // 对此事务执行一些操作
    try {
        // 开始事务
        await queryRunner.startTransaction();

        // sql语句
        let sql_str = `UPDATE account_users SET morey = ? WHERE id=?`; 
       
        const up_row1 = await queryRunner.query(sql_str, [100, "101"]);

        const up_row2 = await queryRunner.query(sql_str, [200, "102"]);

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

```
