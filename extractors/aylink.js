const pw = require("playwright-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const lib = require("../lib");

module.exports = {
  hostnames: ["aylink.co"],
  requiresCaptcha: true,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("user-agent-override");
      pw.firefox.use(stlh);

      if (lib.config.captcha.active == false) {
        throw "Captcha service is required for this link, but this instance doesn't support it."
      }

      if (lib.config.debug == true) console.log("[aylink] Launching browser...");
      let args = (lib.config.defaults?.puppeteer || {headless: true});
      b = await pw.firefox.launch(args);
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config.debug == true) console.log("[aylink] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url);

      let a = await cont(p);
      
      await b.close();
      return a;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p) {
  try {
    await p.evaluate(function() {
      if (document.querySelector(".sweet-alert")) document.querySelector(".sweet-alert").remove();
    });

    if (lib.config.debug == true) console.log("[aylink] Launched. Solving CAPTCHA...");
    await p.evaluate(function() {window.stop()});
    if ((await p.$("[name='g-recaptcha-response']"))) {
      let sk = await p.evaluate(function() {return document.querySelector(".g-recaptcha").getAttribute("data-sitekey")});
      let c = await lib.solve(sk, "recaptcha", {referer: (await p.url())});
      await p.evaluate(`document.querySelector("[name='g-recaptcha-response']").value = "${c}";`);
      await p.evaluate(function() {document.querySelector("#recaptcha-form").submit()})
      if (lib.config.debug == true) console.log("[aylink] Solved CAPTCHA. Counting down...");

      await p.waitForLoadState("load");
      return (await cont(p));
    } else if ((await p.$(".complete"))) {
      await p.waitForSelector(".complete", {visible: true});
      if (lib.config.debug == true) console.log("[aylink] Done. Fetching next page...");
      url = fireWhenFound(p);
      await p.click(".complete");
      await p.bringToFront();
      await p.click(".complete");

      url = await url;
      if (lib.config.debug == true) console.log("[aylink] Got next page, requesting...");

      await p.goto(url, {waitUntil: "domcontentloaded"});
      if (lib.config.debug == true) console.log("[aylink] Done. Parsing next page...");
      let a = await p.content();
      a = a.split(`</script>\n<script type="text/javascript">`)[1];
      a = a.split(`let`)[1];
      a = a.split(`url = '`)[1].split(`',`)[0];
      return a;
    }
  } catch(err) {
    throw err;
  }
}

async function fireWhenFound(p) {
  return new Promise(function(resolve, reject) {
    try {
      p.on("response", async function(res) {
        let a = new URL((await res.url()));
        if (a.pathname == ("/links/go2") && (await (await(res.request()).method())) == "POST") {
          let a = (await res.json());
          resolve(a?.url)
        }
      });
    } catch(e) {
      reject(e);
    }
  });
}