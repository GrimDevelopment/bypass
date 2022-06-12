const fs = require("fs/promises");

module.exports = {
  fromUrl: async function(url) {
    let h = new URL(url).hostname;
    let d = await fs.readdir(`${__dirname}/extractors`);
    for (let i = 0; i < d.length; i++) {
      if (!(await require(`./extractors/${d[i]}`)).hostnames) console.log(d[i])
      if ((await require(`./extractors/${d[i]}`)).hostnames.includes(h)) return d[i];
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