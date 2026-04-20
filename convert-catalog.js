import fs from 'fs';
import path from 'path';

const pnpmWorkspaceStr = fs.readFileSync('./pnpm-workspace.yaml', 'utf-8');
const catalog = {};
let inCatalog = false;
for (const line of pnpmWorkspaceStr.split('\n')) {
  if (line.startsWith('catalog:')) {
    inCatalog = true;
    continue;
  }
  if (inCatalog) {
    if (!line.startsWith('  ') && line.trim() !== '' && !line.startsWith('#')) {
      inCatalog = false;
    } else {
      const match = line.match(/^\s+['"]?([^:'"]+)['"]?:\s+(.+)$/);
      if (match) {
        catalog[match[1]] = match[2].trim();
      }
    }
  }
}

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      processDir(path.join(dir, entry.name));
    } else if (entry.name === 'package.json') {
      const file = path.join(dir, 'package.json');
      const content = fs.readFileSync(file, 'utf-8');
      const pkg = JSON.parse(content);
      let changed = false;
      for (const deps of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (pkg[deps]) {
          for (const key of Object.keys(pkg[deps])) {
            if (pkg[deps][key] === 'catalog:') {
              pkg[deps][key] = catalog[key] || '*';
              changed = true;
            }
          }
        }
      }
      if (changed) {
        fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
      }
    }
  }
}

processDir('.');
console.log('Catalogs replaced', catalog);
