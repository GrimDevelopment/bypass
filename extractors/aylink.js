const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["aylink.co"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);

      if (lib.config().captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config().debug == true) console.log("[aylink] Launching browser...");
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[aylink] Launched. Going to referer URL first.");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      if (lib.config().debug == true) console.log("[aylink] Launched. Solving CAPTCHA...");
      await p.evaluate(function() {window.stop()});
      let sk = await p.evaluate(function() {return document.querySelector(".g-recaptcha").getAttribute("data-sitekey")});
      let c = await lib.solve(sk, "recaptcha", {referer: (await p.url())});
      await p.evaluate(`document.querySelector("[name='g-recaptcha-response']").value = "${c}";`);
      await p.evaluate(function() {document.querySelector("#recaptcha-form").submit()})
      if (lib.config().debug == true) console.log("[aylink] Solved CAPTCHA. Counting down...");

      await p.waitForNavigation();
      await p.waitForSelector(".complete", {visible: true});
      if (lib.config().debug == true) console.log("[aylink] Done. Opening next page...");
      await p.click(".complete");
      await p.bringToFront();
      let a = giveTab(b);
      await p.click(".complete");
      if (lib.config().debug == true) console.log("[aylink] Done. Waiting for page object...");

      a = await a;
      if (lib.config().debug == true) console.log("[aylink] Done. Extracting data...");
      a = await a.evaluate(function() {
        return document.body.innerHTML.split("url = '")[1]?.split("'")[0];
      });

      await b.close();

      return a;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function giveTab(b) {
  return new Promise(function(resolve, reject) {
    b.on("targetcreated", async function(p) {
      if ((await p.type()) == "page") {
        let a = await p.url();
        a = new URL(a);
        if (a.hostname == "bildirim.in") {
          a = (await (await p).page());
          resolve(a);
        }
      }
    })
  });
}