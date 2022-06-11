const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["myl.li", "mylink.vc"],
  "requires-captcha": true,
  get: async function(url) {
    let u = new URL(url);

    if (u.searchParams.get("url")) return decodeURIComponent(u.searchParams.get("url"));

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

    if (u.host == "myl.li") {
      await p.waitForNavigation();
    }

    if (p.$("g-recaptcha")) await p.solveRecaptchas();
    await p.click("#pub6 input[type=submit]");
    await p.waitForNavigation();
    
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue"); // yes this many were needed
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#continue");
    await p.waitForNavigation();
    await p.click("#go input[type=submit]");
    await p.waitForNavigation();

    let a = await p.url();
    await b.close();

    return a;
  }
}