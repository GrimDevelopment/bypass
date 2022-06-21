const lib = require("./lib");

// add a new extractor? add it to the test list.
const examples = [
  { extractor: "1bit.space", link: "https://1bit.space/FVJcWHr", expected: "https://mega.nz/#F!Xe4kVIII!z7WAxz65DzBhe6d1Cx_xHg" },
  { extractor: "1link.club", link: "http://1link.club/77679" },
  { extractor: "bc.vc", link: "https://bc.vc/vQesLIh", expected: "https://universal-bypass.org/" },
  { extractor: "boost.ink", link: "https://boost.ink/c5bba" },
  { extractor: "boostme.link", link: "https://boostme.link/iX9Krf" },
  { extractor: "cpmlink.net", link: "https://cpmlink.net/i7FyAQ" },
  { extractor: "cshort.org", link: "https://cshort.org/8i8dwPx0" },
  { extractor: "exe.io", link: "https://exe.io/ZaKsUgDc" }, 
  { extractor: "ity.im",  link: "http://ity.im/1QZh2" }, 
  { extractor: "karung.in", link: "http://karung.in/Gyucc", expected: "https://drive.google.com/uc?id=0B263gKU-C09_WW5rbURLeXN5QXc&export=download"},
  { extractor: "linkvertise.com (redirect)", link: "https://linkvertise.com/431184/roblox-scripts-website", expected: "https://tobirbxscripts.blogspot.com/" }, // (redirect) is there because there are two types of links on linkvertise, a paste and a redirect
  { extractor: "lnk.parts", link: "https://lnkload.com/2z8aF" },
  { extractor: "lnk2.cc", link: "https://lnk2.cc/wd1J1" },
  { extractor: "myl.li", link: "https://myl.li/NOEgI6aOp3bF" },
  { extractor: "oke.io", link: "https://oke.io/D3wL", expected: "https://mega.nz/#!TlkjwLrb!jj8GVmZJp1EmmSInnQ4FNsdmb4qq_Pp0b5IAJ5ik8u8" },
  { extractor: "ouo.io", link: "https://ouo.io/2dktqo" },
  { extractor: "sh.st", link: "http://ceesty.com/es47QR" },
  { extractor: "show.co", link: "https://show.co/HQrPtta", expected: "https://universal-bypass.org" },
  { extractor: "social-unlock.com", link: "https://social-unlock.com/417pK" },
  { extractor: "adf.ly", link: "http://usheethe.com/T3F5" },
  { extractor: "WPSafelink", link: "https://demo-safelink.themeson.com/template1/?f7fbb8af", expected: "https://themeson.com/safelink/" }
];

console.log("Beginning extractor tests...\n");
if (process.argv[2]) {
  let intForm = parseInt(process.argv[2])
  if (intForm!=process.argv[2]) intForm = examples.findIndex(e => e.extractor==process.argv[2])
  run(intForm);
} else {
  run(0);
}

async function run(i) {
  if (!i) i = 0;
  if (!examples[i]) {
    console.log("Testing complete. Exiting...");
    process.exit();
  }

  console.log(`- Testing "${examples[i].extractor}" (${i}) extractor...\n`);

  try {
    let r = await lib.get(examples[i].link, {ignoreCache: true, allowCache: false});
    if (r.destination) {
      if (!examples[i].expected) examples[i].expected = "https://git.gay/a/bifm"
      if (r.destination == examples[i].expected) {
        console.log(`\n-- Extractor "${examples[i].extractor}" (${i}) got expected solution. [${r.destination}]\n`);
        run((i + 1));
      } else {
        console.log(`\n-- Extractor "${examples[i].extractor}" (${i}) got unexpected solution. [${r.destination} !== ${examples[i].expected}]\n`);
        run((i + 1));
      }
    } else {
      // for multi-destinations, when i add them
    }
  } catch(err) {
    console.log(`\n-- Extractor "${examples[i].extractor}" (${i}) failed. Gave error that is shown below.`);
    console.log(`${(err.stack || err.message || err.code || err)}\n`);
    run((i + 1));
  }
}