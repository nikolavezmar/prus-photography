const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create a minimal HTML content to render the sprite
  const html = `
    <html>
      <body style="margin:0; background: red;">
        <div style="
          width: 720px; 
          height: 1280px; 
          background-image: url('file://${process.cwd()}/images/sprite_sheet_mirrored.png');
          background-position: 0 0;
        "></div>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.screenshot({ path: 'sprite_frame0.png', clip: {x:0, y:0, width:720, height:1280} });
  
  await browser.close();
})();
