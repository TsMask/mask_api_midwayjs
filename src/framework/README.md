# 框架核心

封装的各种工具类函数，应用于整个程序。如只在小范围内使用的函数就不要放到框架核心目录里。

## 项目结构

```text
framework
├── cache               目录-缓存
├── constants           目录-常量属性值定义
├── datasource          目录-数据源
├── decorator           目录-装饰器定义
├── enums               目录-枚举类型定义
├── filter              目录-全局异常过滤器定义
├── middleware          目录-中间件定义
├── model               目录-模型对象定义
├── service             目录-服务函数定义
└── utils               目录-工具函数定义
```

## 装饰器定义

[自定义装饰器](http://www.midwayjs.org/docs/custom_decorator)

## 中间件定义

洋葱模型，常用验证日志等。

> 忽略和匹配 不能同时使用  
> options.match and options.ignore can not both present

```js
// 路由将忽略此中间件
ignore(ctx: Context): boolean {
    return ctx.path === '/api/info'
}

// 匹配到的路由会执行此中间件
match(ctx: Context): boolean { return false }
```

## 全局异常过滤器定义

当请求结束时，存在异常保持返回数据前

## 工具函数定义

常用可控函数
