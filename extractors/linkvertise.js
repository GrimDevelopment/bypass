const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");
const cap = require("puppeteer-extra-plugin-recaptcha");

module.exports = {
  hostnames: [
    "linkvertise.com",
    "linkvertise.net",
    "up-to-down.net",
    "link-to.net",
    "direct-link.net",
    "linkvertise.download",
    "file-link.net",
    "link-center.net",
    "link-target.net"
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

      await p.setUserAgent("Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36");
      await p.goto(url);

      await p.waitForTimeout(3000); // this is just for waiting to see if a captcha shows up
      if (p.$(".captcha-content")) await p.solveRecaptchas();

      await p.waitForSelector(".lv-dark-btn");
      await p.click(".lv-dark-btn");
      await p.waitForTimeout(1000);

      let tab = (await b.pages());
      tab = tab[tab.length - 1];

      let u = await tab.url();
      await b.close();

      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}