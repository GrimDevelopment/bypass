const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib")

module.exports = {
  hostnames: ["exe.io", "exey.io", "exe.app", "eie.io", "fc-lc.com", "fc.lc"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config.debug == true) console.log("[exeio] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      await blocker.enableBlockingInPage(p);
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[exeio] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle"});

      await p.evaluate(function() {
        document.forms[0].submit();
      });
      await p.waitForLoadState("load");

      p = await cont(p, url, b);
      
      await b.close();
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, url, b) {
  try {
    if (lib.config.debug == true) console.log("[exeio] Scanning page information...");

    if ((await p.$(".box-main > #before-captcha"))) {
      if (lib.config.debug == true) console.log("[exeio] Skipping non-CAPTCHA page...");
      await p.evaluate(function() {
        document.querySelector("form").submit();
      });
      await p.waitForLoadState("load");
      return (await cont(p, url, b));
    } else if ((await p.$(".btn-captcha"))) {
      await lib.solveThroughPage(p);

      p.on("dialog", function(d) {
        if (lib.config.debug == true) console.log("[exeio] Recieved a dialog, auto-accepting.");
        d.accept();
      })

      await p.evaluate(function() {
        document.querySelector("form").submit();
      });

      if (lib.config.debug == true) console.log("[exeio] Submitted. Waiting...");
      await p.waitForLoadState("load");
      return (await cont(p, url, b));
    } else if ((await p.$(".procced > .btn.get-link.text-white"))) {
      if (lib.config.debug == true) console.log("[exeio] Counting down...");
      await p.waitForSelector(".procced > .btn.get-link.text-white:not(.disabled)");
      let r = await p.evaluate(function() {
        return document.querySelector(".procced > .btn.get-link.text-white").href
      });
      return r;
    } else if ((await p.$("#content > div[style]"))) {
      if (lib.config.debug == true) console.log("[exeio] Counting down...");
      await p.waitForSelector("#surl:not(.disabled)");
      let r = await p.evaluate(function() {
        return document.querySelector("#surl").href
      });
      return r;
      // #surl
    } else {
      throw "The exe.io link is dead.";
    }
  } catch(err) {
    throw err;
  }
}

