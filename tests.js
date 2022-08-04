const lib = require("./lib");
const config = require("./config.json");

// add a new extractor? add it to the test list.
const examples = [
  { link: "http://1link.club/77679" },
  { extractor: "adf.ly", link: "http://usheethe.com/T3F5" },
  { extractor: "adlinkfly", link: "https://pdiskshortener.com/6I2CR2" },
  { link: "https://ay.live/rfsin1", expected: "https://rufus-usb.en.uptodown.com/windows" },
  { link: "https://bc.vc/vQesLIh", expected: "https://universal-bypass.org/" },
  { link: "https://boost.ink/c5bba" },
  { link: "https://boostme.link/iX9Krf" },
  { link: "https://cb.run/gLDw", expected: "https://drive.google.com/open?id=12zG9CDclQcFA1UOj1PxfIGinev7qIb-W" },
  { link: "https://cutw.in/8q9wzl" },
  { link: "https://cpmlink.net/i7FyAQ" },
  { link: "https://cshort.org/8i8dwPx0" },
  { link: "https://droplink.co/VOpK" },
  { link: "https://exe.io/ZaKsUgDc" }, 
  { link: "http://gplinks.in/EWu8", expected: "https://youtu.be/EqLPsj_vZDo" },
  { extractor: "hrshort.com", link: "https://open.crazyblog.in/tXDGig"},
  { link: "http://ity.im/1QZh2" }, 
  { link: "http://karung.in/Gyucc", expected: "https://drive.google.com/uc?id=0B263gKU-C09_WW5rbURLeXN5QXc&export=download"},
  { link: "https://www.keeplinks.org/p100/62b878489fbc5" },
  { extractor: "linkvertise (redirect)", link: "https://linkvertise.com/425581/example1" }, // (redirect) is there because there are two types of links on linkvertise, a paste and a redirect
  { extractor: "linkvertise (paste)", link: "https://link-target.net/425581/example" },
  { link: "https://lnkload.com/2z8aF" },
  { link: "https://lnk2.cc/wd1J1" },
  { link: "https://myl.li/NOEgI6aOp3bF" },
  { link: "https://oke.io/D3wL", expected: "https://mega.nz/#!TlkjwLrb!jj8GVmZJp1EmmSInnQ4FNsdmb4qq_Pp0b5IAJ5ik8u8" },
  { link: "https://ouo.io/2dktqo" },
  { link: "https://rekonise.com/bifm-jv7k6" },
  { extractor: "sh.st", link: "http://ceesty.com/es47QR" },
  { extractor: "shorturllink.in", link: "https://urlsopen.com/DC6F" },
  { link: "https://show.co/HQrPtta", expected: "https://universal-bypass.org" },
  { link: "https://social-unlock.com/417pK" },
  { link: "http://srt.am/e8kZ9m", expected: "https://www.google.com/" },
  { extractor: "thinfi (no password)", link: "https://thinfi.com/088ud" },
  { extractor: "thinfi (passworded)", link: "https://thinfi.com/088uk", password: "bifm"},
  { extractor: "WPSafelink", link: "https://demo-safelink.themeson.com/template1/?f7fbb8af", expected: "https://themeson.com/safelink/" },
  { link: "https://za.gl/JPk6" }
];

if (process.argv[2]) {
  if (lib.config.debug == true) console.log("\n[testing] Detected arguments.");

  if (lib.config.debug == true) console.log("[testing] Parsing arguments...");
  let intForm = parseInt(process.argv[2]);
  if (intForm !== process.argv[2] || typeof intForm !== "number") intForm = examples.findIndex(e => (e.extractor || new URL(e.link).hostname) == process.argv[2]);
  
  if (lib.config.debug == true) console.log(`[testing] Parsed starting interger as: ${intForm}`);

  let end;
  if (process.argv[3]) {
    if (process.argv[3] == "-") end = (intForm + 1);
    else {
      end = parseInt(process.argv[3]);
      if (typeof end !== "number") {
        end = examples.findIndex(e => (e.extractor || new URL(e.link).hostname) == process.argv[2]);
      }
    }
  }

  if (lib.config.debug == true) console.log(`[testing] Parsed ending interger as: ${end}`);

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
    let d = {ignoreCache: true, allowCache: false, allowFF: false, ignoreFF: true};
    if (examples[i].password) d.password = examples[i].password
    let r = await lib.get(examples[i].link, d);
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