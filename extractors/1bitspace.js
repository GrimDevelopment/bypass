const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "1bit.space"
  ],
  "requires-captcha": true,
  get: async function(url) {
    let b;
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

      if (lib.config()["debug"] == true) console.log("[1bitspace] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();

      await p.goto(url);

      // first page
      if (lib.config()["debug"] == true) console.log("[1bitspace] Solving captchas...");
      await p.solveRecaptchas();
      if (lib.config()["debug"] == true) console.log("[1bitspace] Solved.");
      await p.click(".button-element-verification");
      if (lib.config()["debug"] == true) console.log("[1bitspace] Loading second page...");

      // second page
      if (lib.config()["debug"] == true) console.log("[1bitspace] Counting down...");
      await p.waitForSelector(".button-element-redirect:not([disabled])");
      await p.click(".button-element-redirect:not([disabled])");
      if (lib.config()["debug"] == true) console.log("[1bitspace] Loading third page...");
      await p.waitForNavigation();

      // third page
      if (lib.config()["debug"] == true) console.log("[1bitspace] Counting down (2)...");
      await p.waitForSelector("#continue-button:not([disabled])");
      await p.click("#continue-button:not([disabled])");
      if (lib.config()["debug"] == true) console.log("[1bitspace] Loading last page...");
      await p.waitForNavigation();

      let u = await p.url();

      if (lib.config()["debug"] == true) console.log("[1bitspace] Closing browser...");
      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}