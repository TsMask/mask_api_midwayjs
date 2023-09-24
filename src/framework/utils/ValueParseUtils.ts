import cronParser = require('cron-parser');

/**
 * 解析数值型
 * @param str 字符串
 */
export function parseNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return Number(str) || 0;
}

/**
 * 解析布尔型
 * @param str 字符串
 */
export function parseBoolean(str: string | number): boolean {
  if (typeof str === 'number') return Boolean(str);
  if (!str || str === 'false' || str === '0') return false;
  return Boolean(str) || false;
}

/**
 * 解析首字母转大写
 * @param str 字符串 ab
 * @returns 结果 Ab
 */
export function parseFirstUpper(str: string): string {
  if (!str) return str;
  str = str.replace(/[^_\w]+/g, '');
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * 解析下划线转驼峰
 * @param str 字符串 a_b
 * @returns  驼峰风格 aB
 */
export function parseStrLineToHump(str: string): string {
  if (!str) return str;
  return str.replace(/_(\w)/g, (_item, letter) => letter.toUpperCase());
}

/**
 * 解析驼峰转下划线
 * @param str 字符串 aB
 * @returns  下划线风格 a_b
 */
export function parseStrHumpToLine(str: string): string {
  if (!str) return str;
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 对象的key值驼峰转下划线
 * @param obj 对象属性 字符数组orJSON对象
 * @returns 驼峰转下划线
 */
export function parseObjHumpToLine(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => parseObjHumpToLine(v));
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const new_key = parseStrHumpToLine(key);
      if (new_key !== key) {
        obj[new_key] = obj[key];
        delete obj[key];
      }
      obj[new_key] = parseObjHumpToLine(obj[new_key]);
    });
    return obj;
  }
  return obj;
}

/**
 * 对象的key值下划线转驼峰
 * @param obj 对象属性 字符数组orJSON对象
 * @returns 下划线转驼峰
 */
export function parseObjLineToHump(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => parseObjLineToHump(v));
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const new_key = parseStrLineToHump(key);
      if (new_key !== key) {
        obj[new_key] = obj[key];
        delete obj[key];
      }
      obj[new_key] = parseObjLineToHump(obj[new_key]);
    });
    return obj;
  }
  return obj;
}

/**
 * 解析格式化json字符串
 *
 * @param str JSON字符串
 * @returns false时为非标准json对象
 */
export function parseStringToObject(str: string): Record<string, any> | null {
  try {
    const obj = JSON.parse(str);
    if (typeof obj === 'object' && obj !== null) {
      return obj as Record<string, any>;
    }
  } catch (error) {
    console.error(`Failed parse json "${str}": ${error.message}`);
  }
  return null;
}

/**
 * 解析 Cron 表达式，返回下一次执行的时间戳（毫秒）
 * @param {string} cron Cron 表达式
 * @returns {number | null} 下一次执行的时间戳（毫秒），如果解析失败则返回 null
 */
export function parseCronExpression(cron: string): number | null {
  try {
    const interval = cronParser.parseExpression(cron);
    return interval.next().getTime();
  } catch (error) {
    console.error(`Failed parse cron "${cron}": ${error.message}`);
    return 0;
  }
}

/**
 * 解析比特位为单位
 * @param bit 数值大小B
 * @returns GB MB KB B
 */
export function parseBit(bit: number): string {
  let GB = '';
  let MB = '';
  let KB = '';
  bit > 1 << 30 && (GB = Number(bit / (1 << 30)).toFixed(2));
  bit > 1 << 20 && bit < 1 << 30 && (MB = Number(bit / (1 << 20)).toFixed(2));
  bit > 1 << 10 && bit > 1 << 20 && (KB = Number(bit / (1 << 10)).toFixed(2));
  return GB ? GB + 'GB' : MB ? MB + 'MB' : KB ? KB + 'KB' : bit + 'B';
}

/**
 * 解析掩码内容值
 * @param value 内容值字符串
 * @returns 掩码 ******2
 */
export function parseSafeContent(value = '') {
  if (value.length < 3) {
    return '*'.repeat(value.length);
  } else if (value.length < 6) {
    return value[0] + '*'.repeat(value.length - 1);
  } else if (value.length < 10) {
    return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
  } else if (value.length < 15) {
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
  } else {
    return value.slice(0, 3) + '*'.repeat(value.length - 6) + value.slice(-3);
  }
}

/**
 * 解析数据层级转树结构
 *
 * @param data 数组数据
 * @param fieldId 读取节点字段 默认 'id'
 * @param fieldParentId 读取节点父节点字段 默认 'parentId'
 * @param fieldChildren 设置子节点字段 默认 'children'
 * @returns 层级数组
 */
export function parseDataToTree<T>(
  data: T[],
  fieldId = 'id',
  fieldParentId = 'parentId',
  fieldChildren = 'children'
) {
  // 节点分组
  const map: Map<string, T[]> = new Map();
  // 节点id
  const treeIds: string[] = [];
  // 树节点
  const tree: T[] = [];

  for (const item of data) {
    const parentId = item[fieldParentId];
    // 分组
    const mapItem = map.get(parentId) ?? [];
    mapItem.push(item);
    map.set(parentId, mapItem);
    // 记录节点id
    treeIds.push(item[fieldId]);
  }

  for (const [key, value] of map) {
    // 选择不是节点id的作为树节点
    if (!treeIds.includes(key)) {
      tree.push(...value);
    }
  }

  for (const iterator of tree) {
    componet(iterator);
  }

  /**闭包递归函数 */
  function componet(iterator: T) {
    const id = iterator[fieldId];
    const item = map.get(id);
    if (item) {
      iterator[fieldChildren] = item;
    }
    if (iterator[fieldChildren]) {
      for (const i of iterator[fieldChildren]) {
        componet(i);
      }
    }
  }
  return tree;
}

/**
 * 解析掩码手机号
 * @param mobile 11位手机号 字符串
 * @returns 掩码 136****2738
 */
export function parseMaskMobile(mobile: string): string {
  if (!mobile || mobile.length !== 11) return mobile;
  return mobile.replace(/(\d{3})\d*(\d{4})/, '$1****$2');
}

/**
 * 解析掩码邮箱号
 * @param email 邮箱号 字符串
 * @returns 掩码 123****@
 */
export function parseMaskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const strArr = email.split('@');
  const prefix = strArr[0];
  if (prefix.length < 3) return email;
  const mask = Array.from({ length: prefix.length - 3 }, () => '*').join('');
  return `${prefix.slice(0, 3)}${mask}@${strArr[1]}`;
}
