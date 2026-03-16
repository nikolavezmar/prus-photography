const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

(async () => {
  // Ensure puppeteer is installed for this temporary script
  try {
    require.resolve('puppeteer');
  } catch (e) {
    execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set window size
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://localhost:3000/');
  
  // Wait for the animation to start (2.5s delay)
  await page.waitForTimeout(3000);
  
  // Pause the man-container animation natively using CSS API
  await page.evaluate(() => {
    // 33% of 0.7s = 0.231s
    const els = document.querySelectorAll('.man-container.walking *');
    els.forEach(el => {
      // Set to paused and force it to be at exactly 33% into its loop
      el.style.animationPlayState = 'paused';
      el.style.animationDelay = '-0.231s'; 
    });
  });
  
  await page.screenshot({path: 'run_frame_33.png'});
  
  await page.evaluate(() => {
    // 66% of 0.7s = 0.462s
    const els = document.querySelectorAll('.man-container.walking *');
    els.forEach(el => {
      el.style.animationDelay = '-0.462s'; 
    });
  });
  
  await page.screenshot({path: 'run_frame_66.png'});

  await browser.close();
})();
