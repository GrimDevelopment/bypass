const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "link.tl",
    "link.parts",
    "lnkload.com"
  ],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      

      if (lib.config.debug == true) console.log("[linktl] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[linktl] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);
      
      if (lib.config.debug == true) console.log("[linktl] Launched. Starting continous function...");
      p = (await cont(p, b));

      await b.close();
      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, b) {
  if ((await p.$(".g-recaptcha"))) {
    
    if (lib.config.debug == true) console.log("[linktl] Opening CAPTCHA...");
    await p.click("#csubmit");
    await p.waitForTimeout(2000); // preventing bugs with captcha solver
    if (lib.config.debug == true) console.log("[linktl] Opened. Navigating out of popups...");
    await p.bringToFront();
    if (lib.config.debug == true) console.log("[linktl] Done. Solving CAPTCHA...");
    let body = (await p.evaluate(`document.body.innerHTML;`));
    body = body.split("if (Math.random() > 0.5)")?.[1]?.split(`goToUrl ("`)?.[1]?.split(`")`)?.[0];
    if (body == undefined || body == null) { 
      await lib.solveThroughPage(p);
      return (await cont(p,b));
    } else {
      return body;
    }
  } else {
    await b.close();
    throw "Unknown solution, redirect not found";
  }
}