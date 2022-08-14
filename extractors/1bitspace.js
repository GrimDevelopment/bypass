const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "1bit.space"
  ],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b, p;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);
       
      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config.debug == true) console.log("[1bitspace] Launching browser...");

      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);
      
      let a = (lib.config.defaults?.puppeteer || {headless: true});

      b = await pw.firefox.launch(a);
      p = await b.newPage();

      await blocker.enableBlockingInPage(p);

      if (opt.referer) {
        if (lib.config.debug == true) console.log("[1bitspace] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      // first page
      if (lib.config.debug == true) console.log("[1bitspace] Launched. Solving CAPTCHA...");
      await lib.solveThroughPage(p);
      await p.waitForTimeout(500);
      await p.click(".button-element-verification");
      if (lib.config.debug == true) console.log("[1bitspace] Solved CAPTCHA. Counting down...");

      // second page
      await p.waitForSelector(".button-element-redirect:not([disabled])");
      if (lib.config.debug == true) console.log("[1bitspace] Done. Loading third page...");
      await p.click(".button-element-redirect:not([disabled])");
      await p.waitForNavigation();

      // third page
      if (lib.config.debug == true) console.log("[1bitspace] Loaded. Parsing URL...");
      let u = await p.url();
      u = u.split("api/tokenURL/")[1].split("/")[0];
      u = u.split("").reverse().join("");
      u = Buffer.from(u, "base64").toString("ascii");
      u = JSON.parse(u);
      u = u[1];

      if (lib.config.debug == true) console.log("[1bitspace] Done. Closing browser...");
      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}