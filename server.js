const lib = require("./lib");
const express = require("express");
const app = express();

app.use(express.static("static/"));
app.set("view engine", "ejs");

app.listen(lib.config.http.port, "127.0.0.1", function() {
  console.log(`[http] Listening on HTTP port ${lib.config.http.port}`);
  if (lib.config.debug == true) console.log("[config] Debug is enabled.");
  console.log("[config] Listing current config", lib.config);
});

app.get("/api/bypass", async function(req, res) {
  let url = req.query.url;

  if (lib.config.debug == true) console.log(`[http] Recieved request at path /api/bypass `);

  try {
    if (!lib.isUrl(url) && url.startsWith("aH")) url = Buffer.from(req.query.url, "base64").toString("ascii");

    if (!lib.isUrl(url)) {
      if (lib.config.debug == true) console.log("[http] Gave invalid URL, sending error...");
      res.send({
        success: false,
        error: "Invalid URL to request.",
        fromBackend: false
      });
      return;
    }

    delete req.query.url;

    if (req.query.referer) {
      if (!lib.isUrl(req.query.referer)) {
        if (lib.config.debug == true) console.log("[http] Gave invalid referer URL, sending error...");
        res.send({
          success: false,
          error: "Invalid referer URL to request.",
          fromBackend: false
        });
        return;
      }
    }

    if (lib.config.debug == true) console.log(`[http] Requesting ./lib.js to get "${url}"`, req.query);

    let resp = await lib.get(url, req.query);
    if (resp == undefined || resp == null) {
      if (lib.config.debug == true) console.log("[http] Recieved undefined, giving error.");
      res.send({
        success: false,
        error: "Invalid response from backend.",
        fromBackend: true
      });
      return;
    }
  
    if (lib.config.debug == true) console.log(`[http] Sending response from ./lib.js`, resp);
    res.send({success: true, ...resp});
  } catch(err) {
    if (lib.config.debug == true) console.log("[http] Recieved error. Displayed below:");
    if (typeof err == "string") {
      console.log(req.url, err)
      if (err.split(lib.config.captcha?.key).length > 1 && lib.config.captcha?.key?.length > 0) {
        err = err.split(lib.config.captcha?.key).join("[REDACTED]");
      }
      res.send({
        success: false,
        error: err,
        fromBackend: true
      });
    } else {
      let e = (err.message || err.code);
      if (e.split(lib.config.captcha?.key).length > 1 && lib.config.captcha?.key?.length > 0) {
        e = e.split(lib.config.captcha?.key).join("[REDACTED]");
      }

      console.log(req.url, err.stack);

      res.send({
        success: false,
        error: e,
        fromBackend: true 
      });
    }
  }
});

app.get("/api/count", async function(req, res) {
  res.send({
    success: true,
    count: (await lib.cacheCount())
  });
});

app.get("/", async function(req, res) {
  res.render("home", {config: lib.config, count: (await lib.cacheCount()).toLocaleString(), alert: lib.config.alert});
});