document.querySelectorAll(".require-script").forEach(function(ele) {
  ele.style.display = "inline";
});

function bypass() {
  document.querySelector(".loader").style.display = "inline";
  document.querySelector(".result").style.display = "none";
  document.querySelectorAll(".result *").forEach(function(e){e.remove();})
  let url = document.getElementById("url").value;
  if (!url.startsWith("http")) url = `http://${url}`;
  let opt = "&";

  if (document.getElementById("allowCache")?.checked) opt = opt + "allowCache=false&";
  if (document.getElementById("ignoreCache")?.checked) opt = opt + "ignoreCache=true&";
  if (document.getElementById("allowFF")?.checked) opt = opt + "allowFF=false&";
  if (document.getElementById("ignoreFF")?.checked) opt = opt + "ignoreFF=false&";

  opt = opt.substring(0, (opt.length - 1));

  let xhr = new XMLHttpRequest();
  xhr.open("GET", `/api/bypass?url=${encodeURIComponent(url)}${opt}`);
  xhr.send();
  xhr.onload = function() {
    document.querySelector(".loader").style.display = "none";
    document.querySelector(".result").style.display = "inline";
    try { 
      let d = JSON.parse(xhr.responseText);
      if (d.success == true) {
        let sd = document.createElement("DIV");
        sd.classList.add("success");
        let p = document.createElement("P");
        if (d.destination) {
          p.innerHTML = "Result: ";
          let a = document.createElement("A");
          a.href = escapeHtml(d.destination);
          a.rel = "noreferer nofollow";
          a.target = "_blank";
          a.innerHTML = d.destination;
          p.append(a);
          sd.append(p);
        } else if (d.destinations) { 
          p.innerHTML = "Results: <br>";
          let a, br;
          for (let b in d.destinations) {
            a = document.createElement("A");
            a.href = escapeHtml(d.destinations[b]);
            a.rel = "noreferer nofollow";
            a.target = "_blank";
            a.innerHTML = d.destinations[b];
            br = document.createElement("br");
            p.append(a);
            p.append(br);
          }
          sd.append(p);
        }
        let i = document.createElement("I");
        i.innerHTML = formatExtra(d);
        i.classList.add("extra")
        sd.append(i);
        document.querySelector(".result").append(sd);
      } else {
        let ed = document.createElement("DIV");
        ed.classList.add("error");
        let p = document.createElement("P");
        if (d.error) {
          p.innerHTML = `Error: <b>${escapeHtml(d.error)}</b>`;
        } else {
          p.innerHTML = `Error: <b>An unknown error occured.</b>`;
        }
        ed.append(p);
        document.querySelector(".result").append(ed);
      }
    } catch (e) {
      let ed = document.createElement("DIV");
      ed.classList.add("error");
      let p = document.createElement("P");
      if ((e.message || e.stack || e.code)) {
        p.innerHTML = `Error: <b>${escapeHtml(e.message || e.stack || e.code)}</b>`;
      } else {
        p.innerHTML = `Error: <b>An unknown error on the frontend occured.</b>`;
      }
      ed.append(p);
      document.querySelector(".result").append(ed);
    }
  }
  xhr.onerror = function(e) {
    let ed = document.createElement("DIV");
    ed.classList.add("error");
    let p = document.createElement("P");
    p.innerHTML = `Error: <b>A network error that was not on our part occured.</b>`;
    ed.append(p);
    document.querySelector(".result").append(ed);
  }
}

function formatExtra(data) {
  let a = ``;

  if (data["fromCache"]) a = `${a} from cache,`;
  else if (data["fromFastforward"]) a = `${a} from fastforward,`;
  else a = `${a} unique link,`;

  if (data["dateSolved"] && data["dateSolved"] !== "unknown") {
    let d = new Date(parseInt(data["dateSolved"]));
    d = d.toTimeString();
    d = d.toLowerCase();
    a = `${a} generated on ${d}`;
  } else {
    a = `${a} generated on an unknown date`;
  }

  return a.substring(1);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}