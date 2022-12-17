import { Config, Provide } from '@midwayjs/decorator';

/**
 * 文件服务
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class FileService {
  @Config('project.uploadPath')
  private uploadPath: string;

  async upload() {
    return this.uploadPath;
  }
}
