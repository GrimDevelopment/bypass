const pup = require("puppeteer-extra");
const lib = require("../lib");

module.exports = {
  hostnames: ["open.crazyblog.in", "crazyblog.in", "redd.crazyblog.in"],
  requiresCaptcha: true, 
  get: async function get(url, opt) {
    let b;
    try {
      if (lib.config().debug == true) console.log("[crazyblog] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[crazyblog Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }

      if (lib.config().debug == true) console.log("[crazyblog] Correcting URL...");

      url = url.replace("open.crazyblog.in", "redd.crazyblog.in");
      url = url.replace("//crazyblog.in", "//redd.crazyblog.in");

      if (lib.config().debug == true) console.log(`[crazyblog] Done, URL is now "${url}". Navigating to page...`);
      await p.goto(url);
      if (lib.config().debug == true) console.log("[crazyblog] Done, counting down...");

      await p.waitForSelector(".get-link:not([disabled]):not([href='javascript: void(0)'])");
      if (lib.config().debug == true) console.log("[crazyblog] Done, retrieving link...");
      let r = await p.evaluate(function() {
        return document.querySelector(".get-link").href;
      });

      await b.close();
      return r;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}