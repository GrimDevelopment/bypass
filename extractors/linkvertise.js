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
  get: async function (url) {

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
    
    let b = await pup.launch({headless: false});
    let p = await b.newPage();

    await p.setUserAgent("Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36");
    await p.goto(url);
    await p.waitForTimeout(3000);
    if (p.$(".captcha-content")) await p.solveRecaptchas();
    await p.waitForSelector(".lv-dark-btn");
    await p.click(".lv-dark-btn");
    await p.waitForTimeout(1000);
    let tab = (await b.pages());
    tab = tab[tab.length - 1];
    await tab.waitForNavigation();
    let u = await tab.url();
    console.log(u);
    return u;
  }
}