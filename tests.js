const lib = require("./lib");

// add a new extractor? add it to the test list.
const examples = [
  { link: "https://1bit.space/FVJcWHr", expected: "https://mega.nz/#F!Xe4kVIII!z7WAxz65DzBhe6d1Cx_xHg" },
  { link: "http://1link.club/77679" },
  { link: "https://bc.vc/vQesLIh", expected: "https://universal-bypass.org/" },
  { link: "https://boost.ink/c5bba" },
  { link: "https://boostme.link/iX9Krf" },
  { link: "https://cpmlink.net/i7FyAQ" },
  { link: "https://cshort.org/8i8dwPx0" },
  { link: "https://exe.io/ZaKsUgDc" }, 
  { link: "http://ity.im/1QZh2" }, 
  { link: "http://karung.in/Gyucc", expected: "https://drive.google.com/uc?id=0B263gKU-C09_WW5rbURLeXN5QXc&export=download"},
  { extractor: "linkvertise (redirect)", link: "https://linkvertise.com/431184/roblox-scripts-website", expected: "https://tobirbxscripts.blogspot.com/" }, // (redirect) is there because there are two types of links on linkvertise, a paste and a redirect
  { link: "https://lnkload.com/2z8aF" },
  { link: "https://lnk2.cc/wd1J1" },
  { link: "https://myl.li/NOEgI6aOp3bF" },
  { link: "https://oke.io/D3wL", expected: "https://mega.nz/#!TlkjwLrb!jj8GVmZJp1EmmSInnQ4FNsdmb4qq_Pp0b5IAJ5ik8u8" },
  { link: "https://ouo.io/2dktqo" },
  { extractor: "sh.st", link: "http://ceesty.com/es47QR" },
  { link: "https://show.co/HQrPtta", expected: "https://universal-bypass.org" },
  { link: "https://social-unlock.com/417pK" },
  { link: "https://za.gl/JPk6" },
  { extractor: "adf.ly", link: "http://usheethe.com/T3F5" },
  { extractor: "adlinkfly", link: "https://pdiskshortener.com/6I2CR2" },
  { extractor: "WPSafelink", link: "https://demo-safelink.themeson.com/template1/?f7fbb8af", expected: "https://themeson.com/safelink/" }
];

if (process.argv[2]) {
  if (lib.config().debug == true) console.log("\n[testing] Detected arguments.");

  if (lib.config().debug == true) console.log("[testing] Parsing arguments...");
  let intForm = parseInt(process.argv[2]);
  if (intForm !== process.argv[2]) intForm = examples.findIndex(e => (e.extractor || new URL(e.link).hostname) == process.argv[2]);
  
  if (lib.config().debug == true) console.log(`[testing] Parsed starting interger as: ${intForm}`);

  let end;
  if (process.argv[3]) {
    if (process.argv[3] == "-") end = (intForm + 1);
    else {
      end = parseInt(process.argv[3]);
      if (end == null) {
        end = examples.findIndex(e => (e.extractor || new URL(e.link).hostname) == process.argv[2]);
      }
    }
  }

  if (lib.config().debug == true) console.log(`[testing] Parsed ending interger as: ${end}`);

  console.log("\nBeginning extractor tests...\n");
  run(intForm, end);
} else {
  run(0);
}

async function run(i, end) {
  if (!i) i = 0;
  if (!examples[i] || end == i) {
    console.log("Testing complete. Exiting...");
    process.exit();
  }

  let name = (examples[i].extractor || new URL(examples[i].link).hostname);
  console.log(`- Testing "${name}" (${i}) extractor...\n`);

  try {
    let r = await lib.get(examples[i].link, {ignoreCache: true, allowCache: false, allowFF: false, ignoreFF: true});
    if (r.destination) {
      if (!examples[i].expected) examples[i].expected = "https://git.gay/a/bifm"
      if (r.destination == examples[i].expected) {
        console.log(`\n-- Extractor "${name}" (${i}) got expected solution. [${r.destination}]\n`);
        run((i + 1), end);
      } else {
        console.log(`\n-- Extractor "${name}" (${i}) got unexpected solution. [${r.destination} !== ${examples[i].expected}]\n`);
        run((i + 1), end);
      }
    } else {
      // for multi-destinations, when i add them
    }
  } catch(err) {
    console.log(`\n-- Extractor "${name}" (${i}) failed. Gave error that is shown below.`);
    console.log(`${(err.stack || err.message || err.code || err)}\n`);
    run((i + 1), end);
  }
}