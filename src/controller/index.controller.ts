import { Controller, Get } from '@midwayjs/decorator';

@Controller('/')
export class IndexController {
  @Get('/')
  async index(): Promise<string> {
    return 'Hello Midwayjs!';
  }
}
