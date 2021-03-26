import * as fs from 'fs-extra';

const pages = fs.readdirSync('src/pages');

for(const page of pages) {
    if(page === 'index.html') {
        fs.copyFileSync(`src/pages/${page}`, `site/index.html`)
        continue;
    }
    fs.mkdirpSync(`site/${page.replace('.html', '')}`);
    fs.copyFileSync(`src/pages/${page}`, `site/${page.replace('.html', '')}/index.html`)
    console.log(page)
}