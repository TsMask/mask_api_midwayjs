import { Inject, Provide, Singleton } from '@midwayjs/core';

import { DemoORM } from '../model/demo_orm';
import { DemoORMRepository } from '../repository/demo_orm';

/**测试ORM信息 服务层处理 */
@Provide()
@Singleton()
export class DemoORMService {
  /**测试ORM数据层 */
  @Inject()
  private demoORMRepository: DemoORMRepository;

  /**
   * 分页查询
   *
   * @param query 参数
   * @returns [集合, 总数]
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[DemoORM[], number]> {
    return await this.demoORMRepository.selectByPage(query);
  }

  /**
   * 查询集合
   *
   * @param demoORM 信息
   * @returns 集合
   */
  public async find(demoORM: DemoORM): Promise<DemoORM[]> {
    return await this.demoORMRepository.select(demoORM);
  }

  /**
   * 通过ID查询
   *
   * @param id ID
   * @returns 信息
   */
  public async findById(id: number): Promise<DemoORM> {
    return await this.demoORMRepository.selectById(id);
  }

  /**
   * 新增
   *
   * @param demoORM 信息
   * @returns ID
   */
  public async insert(demoORM: DemoORM): Promise<number> {
    const ms = Date.now();
    demoORM.createBy = 'system';
    demoORM.updateBy = demoORM.createBy;
    demoORM.createTime = ms;
    demoORM.updateTime = ms;
    return await this.demoORMRepository.insert(demoORM);
  }

  /**
   * 更新
   *
   * @param demoORM 信息
   * @returns 影响记录数
   */
  public async update(demoORM: DemoORM): Promise<number> {
    if (demoORM.id <= 0) {
      return 0;
    }
    const item = await this.demoORMRepository.selectById(demoORM.id);
    if (item.id <= 0) {
      return 0;
    }
    item.title = demoORM.title;
    item.ormType = demoORM.ormType;
    item.ormStatus = demoORM.ormStatus;
    item.remark = demoORM.remark;
    item.updateBy = 'system';
    item.updateTime = Date.now();
    return await this.demoORMRepository.update(item);
  }

  /**
   * 批量删除
   *
   * @param ids ID数组
   * @returns 影响记录数
   */
  public async deleteByIds(ids: number[]): Promise<number> {
    return await this.demoORMRepository.deleteByIds(ids);
  }

  /**
   * 清空测试ORM表
   *
   * @returns 影响记录数
   */
  public async clean(): Promise<number> {
    return await this.demoORMRepository.clean();
  }
}
