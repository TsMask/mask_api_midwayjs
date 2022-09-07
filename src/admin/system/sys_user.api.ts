// import { Controller, Get, Post, Inject } from '@midwayjs/decorator';
// import { Context } from '@midwayjs/koa';
// import { SysUserRepo } from '../../system/repo/sys_user.repo';

// @Controller('/system/user')
// export class SysUserApi {
//   @Inject()
//   ctx: Context;

//   @Inject()
//   private sys_user_repo: SysUserRepo;

//   @Get('/')
//   async sd() {
//     const user = await this.sys_user_repo.select_user_by_user_name("admin");
//     return {
//       user,
//       c: this.ctx,
//       b: this.ctx.ip,
//       son: this.ctx.request.body,
//     };
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
