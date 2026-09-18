const fs = require('fs');

fs.copyFileSync('public/sw.js', 'dist/sw.js');
fs.copyFileSync('public/manifest.json', 'dist/manifest.json');
fs.copyFileSync('assets/icon.png', 'dist/icon-192.png');
fs.copyFileSync('assets/icon.png', 'dist/icon-512.png');

let html = fs.readFileSync('dist/index.html', 'utf8');
html = html.replace(
  '</head>',
  '<link rel="manifest" href="/manifest.json"/><meta name="theme-color" content="#E8B54A"/></head>'
);
fs.writeFileSync('dist/index.html', html);

console.log('post-build done');
