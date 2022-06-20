const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "123link.biz",
    "123link.pw",
    "123link.vip",
    "123link.co"
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

      if (lib.config()["debug"] == true) console.log("[123link] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);

      if (lib.config()["debug"] == true) console.log("[123link] Solving CAPTCHA...");
      await p.solveRecaptchas();
      if (lib.config()["debug"] == true) console.log("[123link] Solved CAPTCHA. Now submitting form...");
      
      await p.evaluate(function() {
        if (typeof document.querySelector("form").submit == "function") document.querySelector("form").submit();
        if (typeof document.querySelector("form").submit == "object") document.querySelector("form").submit.click();
      })

      await p.waitForNavigation();
      
      let u;
      if (lib.config()["debug"] == true) console.log("[123link] Retrieving link...");
      await p.waitForSelector(".btn-success:not([disabled]):not([href='javascript: void(0)'])");
      u = await p.evaluate(function() {return document.querySelector(".btn-success:not([disabled]):not([href='javascript: void(0)'])").href;});
      
      if (lib.config()["debug"] == true) console.log("[123link] Closing browser...");
      await b.close();
      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}