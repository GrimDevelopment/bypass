const pup = require("puppeteer-extra");
const adb = require("puppeteer-extra-plugin-adblocker");

module.exports = {
  hostnames: ["try2link.com"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      if (lib.config().debug == true) console.log("[try2link] Launching browser...");
      pup.use(adb());
      b = await pup.launch({headless: false});
      let p = await b.newPage();
      await p.goto(url);
      if (lib.config().debug == true) console.log("[try2link] Launched. Starting continous function...");
      
      return (await cont(b, p));
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(b, p) {
  let u = await p.url();
  if (u.includes("k=")) {
    if (lib.config().debug == true) console.log("[trylink] Auto-redirecting based on URL...");
    await p.goto(Buffer.from(u.split("k=")[1].split("&")[0], "base64").toString("ascii"));
    return (await cont(b, p));
  } else {
    if (lib.config().debug == true) console.log("[try2link] Waiting for countdown...");
    await p.waitForSelector(".btn-success.btn-lg:not(.disabled):not([disabled]):not([href='javascript: void(0)'])");
    return (await p.evaluate(function() {
      return document.querySelector(".btn.get-link").href
    }));
  }
}