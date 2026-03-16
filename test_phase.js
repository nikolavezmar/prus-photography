const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  
  // Wait for the animation to start (2.5s delay)
  await page.waitForTimeout(2500);
  
  // Pause animations by setting animation-play-state
  await page.addStyleTag({
    content: `
      * {
        animation-play-state: paused !important;
      }
    `
  });

  // Calculate the time for 33% and 66% of a 0.7s cycle
  // 33% of 0.7s = 0.231s
  // 66% of 0.7s = 0.462s
  
  // Set animation delays to simulate being at 33%
  await page.evaluate(() => {
    const els = document.querySelectorAll('.man-container.walking *');
    els.forEach(el => {
      // Negative delay scrubs forward into the animation
      el.style.animationDelay = '-0.231s'; 
    });
  });
  
  await page.screenshot({path: '33_percent.png'});
  
  // Set animation delays to simulate being at 66%
  await page.evaluate(() => {
    const els = document.querySelectorAll('.man-container.walking *');
    els.forEach(el => {
      el.style.animationDelay = '-0.462s'; 
    });
  });
  
  await page.screenshot({path: '66_percent.png'});

  await browser.close();
})();
