import fs from 'fs';
import path from 'path';

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
            if (pkg[deps][key] === 'workspace:*') {
              pkg[deps][key] = '*';
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
console.log('Fixed workspace:* to *');
