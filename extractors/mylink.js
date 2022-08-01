const pw = require("playwright-extra");
const { PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["myl.li", "mylink.vc"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let u = new URL(url);

      if (u.searchParams.get("url")) return decodeURIComponent(u.searchParams.get("url"));

      // setting up plugins
      
      let blocker = await PlaywrightBlocker.fromPrebuiltFull();
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      

      // opening browser

      if (lib.config.debug == true) console.log("[mylink] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      blocker.enableBlockingInPage(p);
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[mylink] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config.debug == true) console.log("[mylink] Launched. Resolving data...");

      if (u.host == "myl.li") {
        await p.waitForNavigation();
      }

      if (lib.config.debug == true) console.log("[mylink] Resolved. Solving CAPTCHA...");
      await lib.solveThroughPage(p);
      await p.click("#pub6 input[type=submit]");
      if (lib.config.debug == true) console.log("[mylink] Solved CAPTCHA and submitted form. Waiting for redirect...");
      await p.waitForNavigation();
      
      p = await cont(p);

      let a = await p.url();
      await b.close();

      return a;
    } catch (err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p) {
  await p.evaluate('document.querySelectorAll(`br`).forEach(function(ele) {ele.remove()});');

  if ((await p.$("#captcha"))) {
    if (lib.config.debug == true) console.log("[mylink] Solving extra CAPTCHA...");
    await lib.solveThroughPage(p);
    if (lib.config.debug == true) console.log("[mylink] Solved. Continuing...");
  }

  await p.evaluate(function () {
    if (
      !document.querySelector("form h3") || 
      !document.querySelector("form h3")?.innerHTML?.includes("integrity") // to avoid auto-submitting secondary captcha page
    ) document.querySelector("form").submit();
  });
  
  if (lib.config.debug == true) console.log("[mylink] Autosubmitting form...");
  await p.waitForLoadState("networkidle");

  if (new URL(await p.url()).host.includes("myl.") || new URL(await p.url()).host.includes("mylink.")) {
    return (await cont(p));
  } else {
    if (lib.config.debug == true) console.log("[mylink] Solved for link.");
    return p;
  }
}