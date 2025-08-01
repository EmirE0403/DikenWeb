// build.js - ES Module versiyonu
import fs from 'fs';
import path from 'path';
import { minify } from 'terser';

const inputFiles = [
  'engine/core.js',
  'engine/renderer.js',
  'engine/math.js',
  'engine/camera.js',
  'engine/object.js',
  'engine/components.js',
  'engine/scene.js'
];

const outputDir = 'dist';
const outputFile = path.join(outputDir, 'dikenweb.js');
const minifiedFile = path.join(outputDir, 'dikenweb.min.js');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

let combined = `
// DikenWeb Engine v1.0.0 - Built ${new Date().toISOString()}
// @author EmirE
// Global namespace olarak DikenWeb tanımlanıyor
var DikenWeb = DikenWeb || {};
(function(global) {
`;

for (const file of inputFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Dosya bulunamadı: ${file}`);
    process.exit(1);
  }
  
  let code = fs.readFileSync(file, 'utf-8');

  // import ve export satırlarını kaldır ve global namespace'e ekle
  code = code
    .replace(/^\s*import .*?;?\s*$/gm, '')
    .replace(/^\s*export\s+class\s+(\w+)/gm, (match, className) => {
      return `global.DikenWeb.${className} = class ${className}`;
    })
    .replace(/^\s*export\s+function\s+(\w+)/gm, (match, funcName) => {
      return `global.DikenWeb.${funcName} = function ${funcName}`;
    })
    .replace(/^\s*export\s+const\s+(\w+)\s*=\s*/gm, (match, constName) => {
      return `global.DikenWeb.${constName} = `;
    })
    .replace(/^\s*export\s*{[^}]+};?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '');

  combined += `\n// --- ${file} ---\n` + code;
}

combined += '\n})(typeof window !== "undefined" ? window : this);\n';

fs.writeFileSync(outputFile, combined, 'utf-8');
console.log('✅ DikenWeb build tamamlandı:', outputFile);

// Minify işlemi
(async () => {
  try {
    const minified = await minify(combined, {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        properties: false
      },
      format: {
        comments: false
      }
    });
    
    if (minified.code) {
      fs.writeFileSync(minifiedFile, minified.code, 'utf-8');
      console.log('✅ Minify tamamlandı:', minifiedFile);
      
      const originalSize = (combined.length / 1024).toFixed(2);
      const minifiedSize = (minified.code.length / 1024).toFixed(2);
      console.log(`📊 Boyut: ${originalSize} KB → ${minifiedSize} KB`);
    } else {
      console.error('❌ Minify başarısız:', minified.error);
    }
  } catch (error) {
    console.error('❌ Minify hatası:', error);
  }
})();