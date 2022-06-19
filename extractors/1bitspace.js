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
      pup.use(stl());
       
      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }
 
      pup.use(cap({
        provider: {
          id: lib.config().captcha.service,
          token: lib.config().captcha.key
        }
      }));

      b = await pup.launch({headless: false});
      let p = await b.newPage();

      await p.goto(url);

      // first page
      await p.solveRecaptchas();
      await p.click(".button-element-verification");

      // second page
      await p.waitForSelector(".button-element-redirect:not([disabled])");
      await p.click(".button-element-redirect:not([disabled])");
      await p.waitForNavigation();

      // third page
      await p.waitForSelector("#continue-button:not([disabled])");
      await p.click("#continue-button:not([disabled])");
      await p.waitForNavigation();

      let u = await p.url();

      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}