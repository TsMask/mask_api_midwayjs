// import { Controller, Body, Post, Inject } from '@midwayjs/decorator';
// import { Context } from '@midwayjs/koa';
// import { TOKEN } from '../../../common/constant/some';
// import { R_Ok_DATA } from '../../../common/core/r';
// import { LoginBody } from '../../../common/core/types/login_body';
// import { SysUserRepo } from '../service/impl/sys_user.service';

// @Controller()
// export class SysLoginApi {
//   @Inject()
//   ctx: Context;

//   @Post('/login')
//   async login(@Body() loginBody: LoginBody) {
//     return R_Ok_DATA({
//         [TOKEN]: "log"
//     });
//   }

//   @Post('/')
//   async home() {
//     return {
//       c: this.ctx,
//       b: this.ctx.ip,
//       son: this.ctx.request.body,
//     };
//   }

//   @Post('/register')
//   async register() {
//     const { username, password } = this.ctx.request.body;

//     return { username, password };
//   }

//   @Post('/logout')
//   async logout() {
//     const { username, password } = this.ctx.request.body;

//     return { username, password };
//   }
// }
