const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");
const cap = require("puppeteer-extra-plugin-recaptcha");

module.exports = {
  hostnames: [
    "bc.vc",
    "bcvc.live",
    "ouo.today"
  ],
  "requires-captcha": true,
  get: async function (url) {
    let b;
    try {
      // this may not work for pastes, will add support for them once i come across one

      // setup plugins
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

      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);
      await p.waitForSelector("#getLink", {visible: true});
      await p.click("#getLink");
      await p.waitForNavigation();
      let u = await p.url();
      u = new URL(u);
      u = u.searchParams.get("cr");
      u = Buffer.from(u, "base64").toString("ascii");
      await b.close();
      return u;
    } catch (err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}