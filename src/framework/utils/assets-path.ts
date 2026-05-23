import { resolve } from "node:path";

/**
 * 获取 assets 资源绝对路径
 * 通过 APP_ASSETS 环境变量统一指定资源目录
 *
 * - prod:  APP_ASSETS=./assets
 * - dev:   APP_ASSETS=./src/assets
 * - ncc:   APP_ASSETS=./assets
 * - test:  默认回退到 cwd/src/assets
 */
export function assetsPath(...segments: string[]): string {
  const dir = process.env.APP_ASSETS || resolve(process.cwd(), "src/assets");
  return resolve(dir, ...segments);
}