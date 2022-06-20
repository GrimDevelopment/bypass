const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: [
    "bc.vc",
    "bcvc.live",
    "ouo.today"
  ],
  "requires-captcha": false,
  get: async function (url) {
    let b;
    try {
      // setup plugins
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().debug == true) console.log("[bcvc] Launching browser...");

      b = await pup.launch({headless: true});
      let p = await b.newPage();

      await p.goto(url);
      if (lib.config().debug == true) console.log("[bcvc] Launched. Counting down...");
      await p.waitForSelector("#getLink", {visible: true});
      await p.click("#getLink");
      await p.waitForNavigation();

      let u = await p.url();
      if (lib.config().debug == true) console.log("[bcvc] Done. Decoding URL...");
      u = new URL(u);
      u = u.searchParams.get("cr");
      u = Buffer.from(u, "base64").toString("ascii");
      
      await b.close();
      return u;
    } catch (err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}