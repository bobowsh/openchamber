import fs from 'node:fs';
import path from 'node:path';

const bunCache = 'E:/work/openchamber/node_modules/.bun/common-tags@1.8.2/node_modules/common-tags';
const target = 'E:/work/openchamber/node_modules/common-tags';

const pkg = JSON.parse(fs.readFileSync(path.join(bunCache, 'package.json'), 'utf8'));
delete pkg.scripts;
delete pkg.devDependencies;
pkg.main = 'lib';

fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2));

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    if (fs.statSync(s).isDirectory()) {
      copyRecursive(s, d);
    } else if (!entry.includes('splitStringTransformer')) {
      fs.copyFileSync(s, d);
    }
  }
}

copyRecursive(path.join(bunCache, 'lib'), path.join(target, 'lib'));

// Replace corrupt splitStringTransformer with valid JS
const stDir = path.join(target, 'lib', 'splitStringTransformer');
fs.mkdirSync(stDir, { recursive: true });
fs.writeFileSync(
  path.join(stDir, 'splitStringTransformer.js'),
  'module.exports = function splitStringTransformer(splitBy) {\n' +
  '  return {\n' +
  '    onString(str) {\n' +
  '      return str.split(splitBy).filter(Boolean);\n' +
  '    }\n' +
  '  };\n' +
  '};\n'
);
fs.writeFileSync(
  path.join(stDir, 'index.js'),
  "const splitStringTransformer = require('./splitStringTransformer');\nmodule.exports = splitStringTransformer;\n"
);

console.log('common-tags installed to node_modules');
