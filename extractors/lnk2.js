const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["lnk2.cc"],
  get: async function(url) {

    // setting up plugins

    pup.use(adb({
      blockTrackers: true
    }));
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


    // opening browser

    let b = await pup.launch({headless: true});
    let p = await b.newPage();
    await p.goto(url);

    // solving captchas and navigating

    await p.solveRecaptchas();
    await p.evaluate(function() {
      document.querySelector("form").submit();
    });
    await p.waitForNavigation();
    await p.evaluate(function() {
      document.querySelector("form").submit();
    });
    await p.waitForNavigation();

    let f = await p.url();
    await b.close();

    return f;
  }
}