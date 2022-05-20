const ext = require("./extractor");
const config = require("./config.json");
const two = require("2captcha");
const {MongoClient} = require("mongodb");
const client = new MongoClient(config["db"]["url"]);

(async function() {
  await client.connect();
})();

const db = client.db("bifm");
const links = db.collection("links");

module.exports = {
  get: async function(url, opt) {
    let ex = await ext.fromUrl(url);
    let extractor = require(`${__dirname}/extractors/${ex}`);
    console.log(url, opt)
    if (opt.ignoreCache !== true) {
      let f = await links.findOne({url: url});
      if (f !== null) {
        f._id = undefined;
        return f; 
      } 
    }

    f = await extractor.get(url, opt);

    if (opt.allowCache == true) {
      await links.insertOne(f);
    }

    return f;
  }, 
  solve: async function(sitekey, type, opt) {
    if (config["captcha"]["active"] == false) return null;
    const tc = new two.Solver(config["captcha"]["key"]);
    let ref = opt.referer;
    switch(type) {
      case "recaptcha":
        return (await tc.recaptcha(sitekey, ref)).data;
      case "hcaptcha":
        return (await tc.hcaptcha(sitekey, ref)).data;
      default:
        return null;
    }
  },
  cookieString: function(co) {
    let s = ``;
    for (let c in co) {
      if (co[c].value == "deleted") continue;
      s = `${s} ${co[c].name}=${encodeURIComponent(co[c].value)};`;
    }
    s = s.substring(0, s.length - 1);
    return s.substring(1);
  },
  byteCount: function(string) {return encodeURI(string).split(/%..|./).length - 1;},
  config: function() {return config;}
}