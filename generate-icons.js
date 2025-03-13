/**
 * 生成Chrome插件所需的不同尺寸图标
 * 将SVG转换为16x16、48x48和128x128像素的PNG图标
 */
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// 图标尺寸
const sizes = [16, 48, 128];

// 生成PNG图标
async function generateIcons() {
  try {
    // 读取SVG文件
    const svgPath = path.join(__dirname, 'images', 'icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // 创建临时SVG文件URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

    // 加载SVG图像
    const image = await loadImage(svgDataUrl);

    // 为每个尺寸生成PNG
    for (const size of sizes) {
      // 创建画布
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // 绘制图像
      ctx.drawImage(image, 0, 0, size, size);

      // 保存为PNG
      const pngPath = path.join(__dirname, 'images', `icon${size}.png`);
      const out = fs.createWriteStream(pngPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on('finish', () => {
        console.log(`✅ 已生成 ${size}x${size} 图标: ${pngPath}`);
      });
    }
  } catch (error) {
    console.error('生成图标时出错:', error);
  }
}

// 执行生成
generateIcons();