const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker");
const lib = require("../lib");

module.exports = {
  hostnames: ["link1s.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      pup.use(stl());
      pup.use(adb());

      if (lib.config().debug == true) console.log("[link1s] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(args);
      let p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[link1s] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle0"});

      if (lib.config().debug == true) console.log("[link1s] Launched. Skipping first page...");
      return cont(p, false);
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, nf) {
  if (nf !== false) await p.waitForNavigation({waitUntil: "domcontentloaded"});
  if (lib.config().debug == true) console.log("[link1s] Parsing page...");
  if ((await p.$(".btn.btn-success.btn-lg"))) {
    if (lib.config().debug == true) console.log("[link1s] Found possible solution page, extracting link...");
    return (await p.evaluate(function() {return document.querySelector(".btn.btn-success.btn-lg").href}));
  } else if ((await p.$(".skip-ad"))) {
    if (lib.config().debug == true) console.log("[link1s] Found possible solution page, counting down...");
    await p.waitForSelector(".skip-ad .btn:not([href=''])");
    return (await p.evaluate(function() {return document.querySelector(".skip-ad .btn:not([href=''])").href}));
  } else {
    if (lib.config().debug == true) console.log("[link1s] Skipping automatically...");
    if ((await p.$("#link1s"))) {
      await p.evaluate(function() {
        window.open(document.getElementById("link1s").href, "_self");
      })
    } else {
      await p.evaluate(function() {link1sgo()});
    }
    return (await cont(p));
  }
}