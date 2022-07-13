const pup = require("puppeteer-extra");
const stl = require("puppeteer-extra-plugin-stealth");
const adb = require("puppeteer-extra-plugin-adblocker");
const lib = require("../lib");

module.exports = {
  hostnames: ["work.ink"],
  get: async function(url, opt) {
    let b;
    try {
      pup.use(stl());
      pup.use(adb());

      if (lib.config().debug == true) console.log("[workink] Launching browser...");  
      let args = (lib.config().defaults?.puppeteer || {headless: true});
      b = await pup.launch(lib.removeTor(args));
      p = await b.newPage();
      if (opt.referer) {
        if (lib.config().debug == true) console.log("[workink] Going to referer URL first...");
        await p.goto(opt.referer, {waitUntil: "domcontentloaded"});
      }
      await p.goto(url, {waitUntil: "networkidle0"});
      if (lib.config().debug == true) console.log("[workink] Done. Starting continous function...");

      let u = await cont(p);

      await b.close();
      return u;
    } catch(err) {
      if (b !== undefined) await b.close();
      throw err;
    }
  }
}

async function cont(p, a) {
  try {
    let isCf = await p.evaluate(function() {
      if (document.querySelector("title").innerHTML == "Security Challenge") return true;
      else return false;
    });

    if (isCf == true) {
      a = ((a + 1) || 0);
      if (a && a >= 10) throw "Could not pass Cloudflare protection.";
      if (lib.config().debug == true) console.log("[workink] Waiting out Cloudflare protection, attempt", a);
      await p.waitForNavigation();
      return (await cont(p, a));
    } else {
      if (lib.config().debug == true) console.log("[workink] Faking steps (1/2)...");
      await closePopupsUntilActive(p);
      if (lib.config().debug == true) console.log("[workink] Faking steps (2/2)...");
      let u = fireWhenFound(p);
      await p.click(".proceed_button.active");
      u = await u;
      if (lib.config().debug == true) console.log("[workink] Done. Got destination, returning...");
      return u;
    }
  } catch(e) {
    if (e.message == "Execution context was destroyed, most likely because of a navigation.") {
      if (lib.config().debug == true) console.log("[workink] Waiting for Cloudflare redirect to complete...");
      try {
        await p.waitForNavigation({timeout: (7 * 1000)});
      } catch(e) {}
      return (await cont(p));
    }
    throw e;
  }
}

async function closePopupsUntilActive(p) {
  if (lib.config().debug == true) console.log("[workink] Opening all tasks at once...");
  await p.evaluate(function() {document.querySelectorAll(".todo:not(.todo-done)").forEach(function(e) {e.click()})});
  if (lib.config().debug == true) console.log("[workink] Done. Removing all popups...");
  await p.evaluate(async function() {if (document.querySelector("#popup")) document.querySelector("#popup").remove()});
  if (lib.config().debug == true) console.log("[workink] Waiting for button to become active...");
  try {
    await p.waitForSelector(".proceed_button.active");
    if (lib.config().debug == true) console.log("[workink] Button is active, waiting...");
    return true;
  } catch(e) {
    if (e.message.toLowerCase().includes("timeout")) return (await closePopupsUntilActive(p));
    else throw e;
  }
}

async function fireWhenFound(p) {
  if (lib.config().debug == true) console.log("[workink] Beginning to listen for destination...");
  return new Promise(function(resolve, reject) {
    p.on("response", async function(res) {
      let a = new URL((await res.url()));
      if (a.pathname == "/api/redirection/getLinkWithConfirmations.php" && (await (await(res.request()).method())) == "POST") {
        if (lib.config().debug == true) console.log("[workink] Found destination request, parsing...");
        let a = (await res.json());
        if (a.success == true) resolve(a.link);
        else reject(a);
      } else {
        if (lib.config().debug == true && a.hostname.includes("ouo")) console.log(`[ouo] Ignoring request ${(await (await(res.request()).method()))} "${(await res.url())}" from listener.`);
      }
    });
  });
}