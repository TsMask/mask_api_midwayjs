import type { ProcessorData, ProcessorOptions } from '../../../../typings/processor';

import { basic } from './basic';

export async function progress(options: ProcessorOptions): Promise<ProcessorData> {
  for (let progress = 0; progress < 20; progress += 1) {
    await sleep(2000);
  }
  return basic(options);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
