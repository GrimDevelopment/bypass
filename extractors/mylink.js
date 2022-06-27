const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");
const stl = require("puppeteer-extra-plugin-stealth");
const cap = require("puppeteer-extra-plugin-recaptcha");
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

      pup.use(adb({blockTrackers: true})); 
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

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

      if (lib.config().debug == true) console.log("[mylink] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[lnk2] Launched. Going to referer URL first.");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config().debug == true) console.log("[mylink] Launched. Resolving data...");

      if (u.host == "myl.li") {
        await p.waitForNavigation();
      }

      if (lib.config().debug == true) console.log("[mylink] Resolved. Solving CAPTCHA...");
      await p.solveRecaptchas();
      await p.click("#pub6 input[type=submit]");
      if (lib.config().debug == true) console.log("[mylink] Solved CAPTCHA and submitted form. Waiting for redirect...");
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
    if (lib.config().debug == true) console.log("[mylink] Solving extra CAPTCHA...");
    await p.solveRecaptchas();
    if (lib.config().debug == true) console.log("[mylink] Solved. Continuing...");
  }

  await p.evaluate(function () {
    if (
      !document.querySelector("form h3") || 
      !document.querySelector("form h3").innerHTML.includes("integrity") // to avoid auto-submitting secondary captcha page
    ) document.querySelector("form").submit();
  });
  
  if (lib.config().debug == true) console.log("[mylink] Autosubmitting form...");
  await p.waitForNavigation();

  if (new URL(await p.url()).host.includes("myl.") || new URL(await p.url()).host.includes("mylink.")) {
    return (await cont(p));
  } else {
    if (lib.config().debug == true) console.log("[mylink] Solved for link.");
    return p;
  }
}