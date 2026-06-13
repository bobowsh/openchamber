import path from 'path';
import { fileURLToPath } from 'url';

export function getDefaultDataDir() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '..', '..', '.config', 'openchamber');
}
