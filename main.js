const lib = require("./lib");
const express = require("express");
const app = express();

app.use(express.static("static/"));
app.set("view engine", "ejs");

app.listen(lib.config().http.port, function() {
  console.log(`[http] Listening on HTTP port ${lib.config().http.port}`);
});

const config = require("./config.json");

app.get("/api/bypass", async function(req, res) {
  let url = req.query.url;

  try {
    if (!lib.isUrl(url) && url.startsWith("aH")) url = Buffer.from(req.query.url, "base64").toString("ascii");

    if (!lib.isUrl(url)) {
      res.send({
        success: false,
        error: "Invalid URL to request.",
        "from-backend": false
      });
      return;
    }
    
    let resp = await lib.get(url, req.query);
  
    res.send({success: true, ...resp});
  } catch(err) {
    if (typeof err == "string") {
      res.send({
        success: false,
        error: err,
        "from-backend": true
      });
    } else {
      let e;

      if (config["debug"] !== true) e = (err.message || err.code);
      else e = (err.stack || err.message || err.code)

      res.send({
        success: false,
        error: e,
        "from-backend": true 
      });
    }
  }
});

app.get("/", async function(req, res) {
  res.render("home", {config: lib.config(), alert: lib.config().alert});
});