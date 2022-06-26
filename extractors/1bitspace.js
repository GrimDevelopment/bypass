const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
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
      pup.use(adb());
      
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);
       
      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }
 
      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      if (lib.config().debug == true) console.log("[1bitspace] Launching browser...");
      b = await pup.launch({headless: true});
      p = await b.newPage();

      await p.goto(url);

      // first page
      if (lib.config().debug == true) console.log("[1bitspace] Launched. Solving CAPTCHA...");
      await p.solveRecaptchas();
      await p.waitForTimeout(500);
      await p.click(".button-element-verification");
      if (lib.config().debug == true) console.log("[1bitspace] Solved CAPTCHA. Counting down (1/2)...");

      // second page
      await p.waitForSelector(".button-element-redirect:not([disabled])");
      if (lib.config().debug == true) console.log("[1bitspace] Done. Loading third page...");
      await p.click(".button-element-redirect:not([disabled])");
      await p.waitForNavigation();

      // third page
      if (lib.config().debug == true) console.log("[1bitspace] Loaded. Counting down (2)...");
      await p.waitForSelector("#continue-button:not([disabled])");
      if (lib.config().debug == true) console.log("[1bitspace] Done. Loading final page...");
      await p.click("#continue-button:not([disabled])");
      await p.waitForNavigation();

      let u = await p.url();

      if (lib.config().debug == true) console.log("[1bitspace] Loaded. Closing browser...");
      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}