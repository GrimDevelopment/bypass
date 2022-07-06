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
  if (document.getElementById("ignoreFF")?.checked) opt = opt + "ignoreFF=true&";
  if (document.getElementById("password").value !== "") opt = opt + `password=${encodeURIComponent(document.getElementById("password").value)}&`;
  if (document.getElementById("referer").value !== "") opt = opt + `referer=${encodeURIComponent(document.getElementById("referer").value)}&`;

  opt = opt.substring(0, (opt.length - 1));
  if (window.isLoading == 1) return;

  let xhr = new XMLHttpRequest();
  document.title = "[Waiting...] BIFM";
  window.isLoading = 1;
  toggleFields();
  xhr.open("GET", `/api/bypass?url=${encodeURIComponent(url)}${opt}`);
  xhr.send();
  xhr.onload = function() {
    window.isLoading = 0;
    toggleFields();
    document.title = "[Parsing...] BIFM";
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
          let a;
          if (d.isURL == true) {
            a = document.createElement("A");
            a.href = escapeHtml(d.destination);
            a.rel = "noreferer nofollow";
            a.target = "_blank";
          } else {
            a = document.createElement("CODE");
          }
          a.innerHTML = `${d.destination} `;
          p.append(a);
          let btn = document.createElement("button");
          btn.setAttribute("data-url", d.destination);
          btn.setAttribute("data-referer", url);
          if (d.isURL == true) {
            btn.innerHTML = "Bypass this URL";
            btn.onclick = function() {
              document.getElementById("url").value = this.getAttribute("data-url");
              document.getElementById("referer").value = this.getAttribute("data-referer");
              bypass();
            }
            p.append(btn);
          }
          sd.append(p);
        } else if (d.destinations) { 
          p.innerHTML = "Results: <br>";
          let a, br;
          for (let b in d.destinations) {
            a = document.createElement("A");
            a.href = escapeHtml(d.destinations[b]);
            a.rel = "noreferer nofollow";
            a.target = "_blank";
            a.innerHTML = `${d.destinations[b]} `;
            let btn = document.createElement("button");
            btn.setAttribute("data-url", d.destination);
            btn.setAttribute("data-referer", url);
            btn.innerHTML = "Bypass this URL";
            btn.onclick = function() {
              document.getElementById("url").value = this.getAttribute("data-url");
              document.getElementById("referer").value = this.getAttribute("data-referer");
              bypass();
            }
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
        document.title = "BIFM";
      } else {
        document.title = "[Error] BIFM";
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
      document.title = "[Error] BIFM";
      document.querySelector(".loader").style.display = "none";
      document.querySelector(".result").style.display = "inline";
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
    window.isLoading = 0;
    toggleFields();
    document.querySelector(".loader").style.display = "none";
    document.querySelector(".result").style.display = "inline";
    document.title = "[Error] BIFM";
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
  else a = `${a} unique destination,`;

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

function toggleFields() {
  let d = document.getElementById("url").disabled;
  let od;
  if (d == true) od = false;
  else od = true;
  document.getElementById("url").disabled = od;
  if (document.getElementById("allowCache")) document.getElementById("allowCache").disabled = od;
  if (document.getElementById("ignoreCache")) document.getElementById("ignoreCache").disabled = od;
  if (document.getElementById("allowFF")) document.getElementById("allowFF").disabled = od;
  if (document.getElementById("ignoreFF")) document.getElementById("ignoreFF").disabled = od;
  document.getElementById("password").disabled = od;
  document.getElementById("referer").disabled = od;
}