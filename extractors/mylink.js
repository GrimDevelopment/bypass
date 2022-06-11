const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const cap = require("puppeteer-extra-plugin-recaptcha");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["myl.li", "mylink.vc"],
  "requires-captcha": true,
  get: async function(url) {
    try {
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

      let b = await pup.launch({headless: false});
      let p = await b.newPage();
      await p.goto(url);

      if (u.host == "myl.li") {
        await p.waitForNavigation();
      }

      if (p.$("g-recaptcha")) await p.solveRecaptchas();
      await p.click("#pub6 input[type=submit]");
      await p.waitForNavigation();
      
      p = await cont(p);

      let a = await p.url();
      await b.close();

      return a;
    } catch (err) {
      throw err;
    }
  }
}

async function cont(p) {
  await p.evaluate('document.querySelectorAll(`br`).forEach(function(ele) {ele.remove()});');

  if (p.$("form")) {
    await p.evaluate('document.querySelector("form").submit();');
  } else if (p.$("#continue")) {
    await p.click("#continue");
  } else if (p.$("input[type=submit]")) {
    await p.click("input[type=submit]");
  } 
  await p.waitForNavigation();

  if (new URL(await p.url()).host.includes("myl.") || new URL(await p.url()).host.includes("mylink.")) {
    return (await cont(p));
  } else {
    return p;
  }
}