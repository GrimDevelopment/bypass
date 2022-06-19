const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");

module.exports = {
  hostnames: [
    "bc.vc",
    "bcvc.live",
    "ouo.today"
  ],
  "requires-captcha": true,
  get: async function (url) {
    let b;
    try {
      // setup plugins
      pup.use(stl());

      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);
      await p.waitForSelector("#getLink", {visible: true});
      await p.click("#getLink");
      await p.waitForNavigation();
      let u = await p.url();
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