const lib = require("./lib");
const express = require("express");
const app = express();

app.use(express.static("static/"));
app.set("view engine", "ejs");

app.listen(lib.config().http.port, function() {
  console.log(`[http] Listening on HTTP port ${lib.config().http.port}`);
});

app.get("/api/bypass", async function(req, res) {
  let url = req.query.url;

  if (lib.config().debug == true) console.log(`[http] Recieved request at path /api/bypass `);

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

    delete req.query.url;
    if (lib.config().debug == true) console.log(`[http] Requesting ./lib.js to get "${url}"`, req.query);

    let resp = await lib.get(url, req.query);
  
    if (lib.config().debug == true) console.log(`[http] Sending response from ./lib.js`);
    res.send({success: true, ...resp});
  } catch(err) {
    if (lib.config().debug == true) console.log("[http] Recieved error. Displayed below:");
    if (typeof err == "string") {
      if (lib.config().debug == true) console.log(err)
      res.send({
        success: false,
        error: err,
        "from-backend": true
      });
    } else {
      let e = (err.message || err.code);

      if (err.stack && lib.config().debug == true) {
        console.log(err.stack);
      } 

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