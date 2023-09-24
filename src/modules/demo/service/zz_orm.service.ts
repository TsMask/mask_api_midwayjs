import { Provide, Singleton } from '@midwayjs/decorator';
import { ZzOrm } from '../model/zz_orm.entity';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';

/**
 * 测试ORM信息
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class ZzOrmService {
  @InjectEntityModel(ZzOrm)
  private zzOrmModel: Repository<ZzOrm>;

  /**
   * 分页查询测试ORM集合
   *
   * @param query 查询信息
   * @return 集合
   */
  async selectPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    let { pageSize, pageNum } = query;
    // 检查分页条件
    if (pageSize < 0 || pageSize > 50) {
      pageSize = 0;
    }
    if (pageNum < 1 || pageNum > 50) {
      pageNum = 10;
    }

    // 条件判断
    const where: any = {};
    if (query.title) {
      where.title = query.title;
    }

    // 执行查询
    const [rows, total] = await this.zzOrmModel.findAndCount({
      where,
      take: pageSize,
      skip: (pageNum - 1) * pageSize,
    });
    return { total, rows };
  }

  /**
   * 查询测试ORM集合
   *
   * @param ZzOrm 测试ORM信息
   * @return 列表
   */
  async selectList(ZzOrm: ZzOrm): Promise<ZzOrm[]> {
    const where: any = {};
    if (ZzOrm.title) {
      where.title = ZzOrm.title;
    }
    return await this.zzOrmModel.findBy(where);
  }

  /**
   * 通过ID查询测试ORM信息
   *
   * @param id 测试ORM的ID
   * @return 测试ORM信息
   */
  async selectById(id: string): Promise<ZzOrm> {
    return await this.zzOrmModel.findOne({
      where: {
        id: id,
      },
    });
  }

  /**
   * 新增测试ORM信息
   *
   * @param ZzOrm 测试ORM信息
   * @return 测试ORM ID
   */
  async insert(ZzOrm: ZzOrm): Promise<string> {
    const result = await this.zzOrmModel.save(ZzOrm);
    return result.id;
  }

  /**
   * 更新测试ORM信息
   *
   * @param ZzOrm 测试ORM信息
   * @return 测试ORM的ID
   */
  async update(zzOrm: ZzOrm): Promise<string> {
    const zz = await this.zzOrmModel.findOne({
      where: {
        id: zzOrm.id,
      },
    });
    if (!zz) return null;
    // 只改某些属性
    zz.title = zzOrm.title;
    zz.ormType = zzOrm.ormType;
    zz.status = zzOrm.status;
    zz.updateBy = zzOrm.updateBy;
    zz.updateTime = zzOrm.updateTime;
    zz.remark = zzOrm.remark;
    const result = await this.zzOrmModel.save(zzOrm);
    return result.id;
  }

  /**
   * 批量删除测试ORM信息
   *
   * @param ids 需要删除的测试ORM的ID数组
   * @return 删除记录数
   */
  async deleteByIds(ids: string[]): Promise<number> {
    const { affected } = await this.zzOrmModel.delete(ids);
    return affected || 0;
  }

  /**
   * 清空测试ORM表
   * @return 删除记录数
   */
  async clean(): Promise<number> {
    const rows = await this.zzOrmModel.count();
    await this.zzOrmModel.clear();
    return rows;
  }
}
