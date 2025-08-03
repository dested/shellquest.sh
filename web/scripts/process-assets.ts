import fs from 'fs';
import {glob} from 'glob';
import prettier from 'prettier';

// grab all image paths from the /src/images folder, and print out a js file that exports  the imported images
const files = await glob('./src/assets/**/*.{png,mp4,jpg,jpeg,gif,svg}');
const names = [];
const images = files.map((file) => {
  file = file.replaceAll('\\', '/');
  const name = file
    .replace('src/assets/', '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '_');
  // sanitize the name for js
  names.push(name);
  return `import ${name} from '${
    file.replace('src/assets/', './') + (file.indexOf('.svg') !== -1 ? '' : '')
  }';`;
});
const formattedContent = await prettier.format(
  images.join('') + '\n' + `export const Assets = {${names.join(',\r\n')}};`,
  {
    parser: 'typescript',
    semi: true,
    singleQuote: true,
  },
);

fs.writeFile('./src/assets/assets.ts', formattedContent, (err) => {
  if (err) {
    console.log(err);
  }
});
