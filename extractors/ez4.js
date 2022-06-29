const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["ez4short.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      if (lib.config().debug == true) console.log("[ez4] Launching browser...");
      pup.use(stl());
      pup.use(adb());
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[ez4] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle2"});
      if (lib.config().debug == true) console.log("[ez4] Launched. Starting continous function...");
      let r = await cont(p);
      await b.close();
      return r;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p) {
  if ((await p.$(".procced"))) {
    if (lib.config().debug == true) console.log("[ez4] Found final page, counting down...");
    await p.waitForSelector(".procced > .btn.get-link:not(.disabled)");
    if (lib.config().debug == true) console.log("[ez4] Done. Retrieving URL...");
    let r = await p.evaluate(function() {
      return document.querySelector(".procced > .btn.get-link").href
    });
    return r;
  } else {
    if (lib.config().debug == true) console.log("[ez4] Skipping non-final page...");
    await p.evaluate(function() {
      yuidea1();
    });
    await p.waitForNavigation();
    return (await cont(p));
  }
}