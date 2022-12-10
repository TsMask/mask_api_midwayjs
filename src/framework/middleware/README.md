## 请求中间件

洋葱模型，常用验证日志等。

**忽略和匹配 不能同时使用**
//options.match and options.ignore can not both present

```js
// 路由将忽略此中间件
ignore(ctx: Context): boolean {
    return ctx.path === '/api/info'
}

// 匹配到的路由会执行此中间件
match(ctx: Context): boolean { return false }
```
