const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set window size
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://localhost:3000/');
  
  // Wait for the animation to start (2.5s delay)
  await page.waitForTimeout(2500);
  
  // Let the animation run for a bit, then pause it using the Web Animations API
  // We want to pause it approximately 33% into the 0.7s cycle. 
  // Let's just pause *all* animations in the doc after 0.23 seconds of walking.
  await page.waitForTimeout(231);
  
  await page.evaluate(() => {
    document.getAnimations().forEach(anim => anim.pause());
  });
  
  await page.screenshot({path: 'run_frame_33.png'});
  
  // Now let it play for another 0.23 seconds to reach 66%
  await page.evaluate(() => {
    document.getAnimations().forEach(anim => anim.play());
  });
  
  await page.waitForTimeout(231);
  
  await page.evaluate(() => {
    document.getAnimations().forEach(anim => anim.pause());
  });
  
  await page.screenshot({path: 'run_frame_66.png'});

  await browser.close();
})();
