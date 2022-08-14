const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("cross-fetch");
const lib = require("../lib");

module.exports = {
  hostnames: ["link1s.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      let blocker = await PlaywrightBlocker.fromPrebuiltFull(fetch);

      if (lib.config.debug == true) console.log("[link1s] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      
      let p = await b.newPage();
      await blocker.enableBlockingInPage(p);

      if (opt.referer) {
        if (lib.config.debug == true) console.log("[link1s] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle"});

      await solveStackpath(p);

      if (lib.config.debug == true) console.log("[link1s] Launched. Skipping first page...");
      return cont(p, false);
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function solveStackpath(p) {
  let title = await p.evaluate(function() {return document.title;});
  if (title == "StackPath") {
    if (lib.config.debug) console.log(`[stackpath] Found StackPath protection, solving...`);
    let title = await p.evaluate(function() {return document.querySelector(".layout > .layout__main > h1")?.innerHTML?.toLowerCase?.();});
    
    if (!title) {
      if (lib.config.debug) console.log(`[stackpath] Got no title, waiting for refresh...`);
      await p.waitForNavigation();
      return (await solveStackpath(p));
    } else {
      if (lib.config.debug == true) console.log(`[stackpath] Got title:`, title);
      switch(title) {
        case "are you human?":
          let img = await p.evaluate(function() {return document.getElementById("captchaImageInline").src;});
          let captcha = await lib.solve(img, "image", {textInstructions: "Only type the black letters.", regsense: 0, numeric: 2});
          await p.type("#captchaInput", captcha);
          await p.click("#submitObject");
        return (await solveStackpath(p));
      }
    }
  } else {
    return true;
  }
}

async function cont(p) {
  try {
    await solveStackpath(p);

    if ((await p.$(".btn.btn-success.btn-lg"))) {
      if (lib.config.debug == true) console.log("[link1s] Found possible solution page, extracting link...");
      return (await p.evaluate(function() {return document.querySelector(".btn.btn-success.btn-lg").href}));
    } else if ((await p.$(".skip-ad"))) {
      if (lib.config.debug == true) console.log("[link1s] Found possible solution page, counting down...");
      await p.waitForSelector(".skip-ad .btn:not([href=''])");
      return (await p.evaluate(function() {return document.querySelector(".skip-ad .btn:not([href=''])").href}));
    } else {
    
      if ((await p.$("#link1s"))) {
        if (lib.config.debug == true) console.log("[link1s] Skipping automatically...");
        await p.evaluate(function() {
          window.open(document.getElementById("link1s").href, "_self");
        });
      } else {
        try {
          await p.evaluate(function() {link1sgo()});
          if (lib.config.debug == true) console.log("[link1s] Skipping automatically...");
        } catch(e) {}
      }
      return (await cont(p));
    }
  } catch(err) {
    if (!err.message?.includes("Execution content was destroyed")) throw err;
  }
}