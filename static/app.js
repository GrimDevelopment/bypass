document.querySelectorAll(".require-script").forEach(function(ele) {
  ele.style.display = "inline";
});

function bypass() {
  document.querySelector(".loader").style.display = "inline";
  document.querySelector(".result").style.display = "none";
  document.querySelectorAll(".result *").forEach(function(e){e.remove();})
  let url = document.getElementById("url").value;
  let opt = "&";

  if (document.getElementById("allowCache").checked) opt = opt + "allowCache=false&";
  if (document.getElementById("ignoreCache").checked) opt = opt + "ignoreCache=true";

  let xhr = new XMLHttpRequest();
  xhr.open("GET", `/api/bypass?url=${decodeURIComponent(url)}${opt}`);
  xhr.send();
  xhr.onload = function() {
    document.querySelector(".loader").style.display = "none";
    document.querySelector(".result").style.display = "inline";
    let d = JSON.parse(xhr.responseText);
    if (d.success == true) {
      let sd = document.createElement("DIV");
      sd.classList.add("success");
      if (d.destination) {
        let p = document.createElement("P");
        p.innerHTML = "Result: ";
        let a = document.createElement("A");
        a.href = d.destination;
        a.rel = "noreferer nofollow";
        a.target = "_blank";
        a.innerHTML = d.destination;
        p.append(a);
        sd.append(p);
        let i = document.createElement("I");
        i.innerHTML = formatExtra(d);
        i.classList.add("extra")
        sd.append(i);
        document.querySelector(".result").append(sd);
      } else { 
        // planned: add multiple-link support
      }
    } else {
      let ed = document.createElement("DIV");
      ed.classList.add("error");
      let p = document.createElement("P");
      if (d.error) {
        p.innerHTML = `Error: <b>${d.error}</b>`;
      } else {
        p.innerHTML = `Error: <b>An unknown error occured.</b>`;
      }
      ed.append(p);
      document.querySelector(".result").append(ed);
    }
  }
}

function formatExtra(data) {
  let a = ``;

  if (data["from-cache"]) a = `${a} from cache,`;
  else if (data["from-fastforward"]) a = `${a} from fastforward,`;
  else a = `${a} unique link,`;

  if (data["date-solved"]) {
    let d = new Date(parseInt(data["date-solved"]));
    d = d.toTimeString();
    d = d.toLowerCase();
    a = `${a} generated on ${d}`;
  }

  return a.substring(1);
}