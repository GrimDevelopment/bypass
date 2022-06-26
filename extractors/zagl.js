const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker")
const lib = require("../lib");

module.exports = {
  hostnames: ["za.uy", "za.gl", "zee.gl"],
  requiresCaptcha: false,
  get: async function(url, opt) {
    let b;
    try {
      let stlh = stl();
      stlh.enabledEvasions.delete("iframe.contentWindow");
      pup.use(stlh);
      pup.use(adb());

      if (lib.config().debug == true) console.log("[zagl] Launching browser...");
      b = await pup.launch({headless: true});
      let p = await b.newPage();
      await p.goto(url);
      if (lib.config().debug == true) console.log(`[zagl] Launched. Listening for "/links/go"...`);

      p = await fireWhenFound(p);
      await b.close();

      return p;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function fireWhenFound(p) {
  return new Promise(function(resolve, reject) {
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.pathname == "/links/go" && (await (await(res.request()).method())) == "POST") {
        let a = (await res.json());
        if (lib.config().debug == true) console.log("[za.gl] Got URL that met requirements, parsing...");
        if (a.url) resolve(a.url);
        else reject("Redirect not found.");
      } else {
        if (lib.config().debug == true && a.hostname.includes("za.")) console.log(`[zagl] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}