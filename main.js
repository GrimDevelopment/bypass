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

  if (!lib.isUrl(url)) url = Buffer.from(req.query.url, "base64").toString("ascii");
  if (!lib.isUrl(url)) {
    res.send({
      success: false,
      error: "Invalid URL to request.",
      "from-backend": false
    })
  }
  
  let resp = await lib.get(url, req.query);

  res.send({success: true, ...resp});
});

app.get("/", async function(req, res) {
  res.render("home", {config: lib.config()});
})