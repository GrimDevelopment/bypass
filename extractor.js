const fs = require("fs/promises");

module.exports = {
  fromUrl: async function(url) {
    let h = new URL(url).hostname;
    if (h.startsWith("www.")) h = h.substring(4);
    let d = await fs.readdir(`${__dirname}/extractors`);
    for (let i = 0; i < d.length; i++) {
      let r = await require(`./extractors/${d[i]}`);
      if (!r.hostnames) {
        console.log(`extractors/${d[i]} is broken.`)
        continue;
      }
      if (r.hostnames.includes(h)) return d[i];
    }
    return "generic";
  },
  all: async function() {
    let dir = await fs.readdir(`./extractors`);
    for (let i = 0; i < dir.length; i++) {
      dir[i] = await import(`./extractors/${dir[i]}`);
    }
    return dir;
  }
}