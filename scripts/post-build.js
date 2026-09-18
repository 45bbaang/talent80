const fs = require('fs');

fs.copyFileSync('public/sw.js', 'dist/sw.js');
fs.copyFileSync('public/manifest.json', 'dist/manifest.json');
fs.copyFileSync('assets/icon.png', 'dist/icon-192.png');
fs.copyFileSync('assets/icon.png', 'dist/icon-512.png');

let html = fs.readFileSync('dist/index.html', 'utf8');
// lang="ko" 설정 → 크롬이 이미 한국어 페이지로 인식, 자동번역 차단
html = html.replace('<html', '<html lang="ko"');
html = html.replace(
  '</head>',
  '<link rel="manifest" href="/manifest.json"/><meta name="theme-color" content="#E8B54A"/><meta http-equiv="Content-Language" content="ko"/></head>'
);
fs.writeFileSync('dist/index.html', html);

console.log('post-build done');
