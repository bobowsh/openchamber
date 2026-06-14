import path from 'path';
import { fileURLToPath } from 'url';

export function getDefaultDataDir() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '..', '..', '.config', 'openchamber');
}

/**
 * 返回当前模块所在项目的根目录 (packages/web)。
 * 与 getDefaultDataDir 保持一致，均基于 import.meta.url 定位。
 */
export function getDefaultExeDir() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '..', '..');
}