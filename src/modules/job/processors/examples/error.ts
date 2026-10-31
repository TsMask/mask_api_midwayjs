import type { ProcessorData, ProcessorOptions } from '../../../../typings/processor';

import { basic } from './basic';

export async function error(options: ProcessorOptions): Promise<ProcessorData> {
  for (let progress = 0; progress < 5; progress += 1) {
    await sleep(2000);
    if (progress === 3) {
      throw new Error('程序中途执行错误');
    }
  }
  return basic(options);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
