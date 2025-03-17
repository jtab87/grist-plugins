function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function () {
  document.getElementById("acl").addEventListener("click", function () {
    document.getElementById('dump').innerHTML = "... en cours ...";
    affiche_ACL("dump");
  });
  document.getElementById("tables").addEventListener("click", function () {
    document.getElementById('dump').innerHTML = "... en cours ...";
    affiche_schema_tables("dump");
  });

  grist.ready({ requiredAccess: 'none' });
  grist.onRecords(table => {
    //document.getElementById('dump').innerHTML = JSON.stringify(table, null, 2);
  });
  grist.onRecord(record => {

  });
});

//--------------------------------
function affiche_schema_tables(div) {
  grist.docApi.fetchTable("_grist_Tables").then(function (tables) {
    grist.docApi.fetchTable("_grist_Tables_column").then(function (champs) {
      const BR = "<br>";
      let html = "le : " + date_du_jour();
      for (let i = 0; i < tables.id.length; i++) {
        let id_table = tables.id[i];
        let nom_table = tables.tableId[i];
        html += getBalise("h3", nom_table) + debutTABLE("tbl1") + getTR(getTH("champ") + getTH("type") + getTH("formule") + getTH("choix"));
        for (let j = 0; j < champs.id.length; j++) {
          if (champs.parentId[j] == id_table) {
            let nom_champ = champs.colId[j];
            let label_champ = champs.label[j];
            let type_champ = champs.type[j];
            let choix = "";
            let formule = champs.formula[j];
            if (formule != "") {
              if (champs.isFormula[j] == false) {
                formule = getBalise("pre", getBalise("span", "Init : <br>", "titre1") + formule);
              } else {
                type_champ = "ƒ formule";
                formule = getBalise("pre", formule);
              }
            }
            if (champs.widgetOptions[j] != "") {
              let xx = JSON.parse(champs.widgetOptions[j]);
              if (xx.choices && type_champ.startsWith("Choice")) {
                choix = xx.choices;
                choix = choix.join(BR);
              }
              if (xx.dropdownCondition) {
                formule = formule + getBalise("pre", getBalise("span", "DropdownCondition : <br>", "titre1") + xx.dropdownCondition.text);
              }
            }
            if (champs.recalcDeps[j] !== null && champs.recalcDeps[j] !== "") {
              formule = formule + getBalise("pre", getBalise("span", "Appliqué sur les modifs de : <br>", "titre1") + getColIds(champs.recalcDeps[j], champs.parentPos, champs.colId));
            }
            if (type_champ.startsWith("ChoiceList") || type_champ.startsWith("RefList")) {
              choix = getBalise("div", "Choix multiples", "titre1") + choix;
            }
            if (type_champ.startsWith("Ref")) type_champ = "🔗" + type_champ;
            if (type_champ != "ManualSortPos" && !nom_champ.startsWith("gristHelper_")) {
              html += getTR(getTD(nom_champ, "gras") + getTD(type_champ) + getTD(formule) + getTD(choix));
            }
          }
        }
        html += finTABLE();
      };
      document.getElementById(div).innerHTML = getDIV(html, "contenuTable") + BR + getButton("downloadBtn", "Enregistrer");
      document.getElementById("downloadBtn").addEventListener("click", function () {
        downloadHTML("contenuTable", "stylejta", "Tables");
      });
    });
  });
}

//--------------------------------
function affiche_ACL(div) {
  grist.docApi.fetchTable("_grist_ACLResources").then(function (tables) {
    grist.docApi.fetchTable("_grist_ACLRules").then(function (rules) {
      let records = inverseFetch(rules);
      let results = [];
      const TABLEUSER = "_xxx";
      const BR = "<br>";
      for (let i = 0; i < records.length; i++) {
        let r = tables.id.indexOf(records[i].resource);
        let obj = {
          "tri": "",
          "table": tables.tableId[r],
          "colonnes": tables.colIds[r].replace(/,/g, BR),
          "condition": records[i].aclFormula || "Tous les autres",
          "ACL": records[i].permissionsText,
          "memo": records[i].memo,
          "nom_attribut": "",
          "table_concernee": "",
          "champ_concerne": "",
          "attribut_user": ""
        }
        let userAttributes = records[i].userAttributes;
        if (userAttributes) {
          userAttributes = JSON.parse(userAttributes);
          obj.nom_attribut = userAttributes.name;
          obj.table_concernee = userAttributes.tableId;
          obj.champ_concerne = userAttributes.lookupColId;
          obj.attribut_user = userAttributes.charId;
          obj.table = TABLEUSER;
        }
        obj.tri = obj.table + obj.colonnes + records[i].rulePos;
        results.push(obj);
      }
      results.sort((a, b) => {
        if (a.tri < b.tri) {
          return -1;
        }
        if (a.tri > b.tri) {
          return 1;
        }
        return 0;
      });
      let html = "Le : " + date_du_jour();
      html += getBalise("h3", "Users") + debutTABLE("tbl1") + getTR(getTH("nom attribut") + getTH("table concernée") + getTH("champ concerné") + getTH("attribut user"));
      results.forEach(function (elt, index) {
        if (elt.table == TABLEUSER) {
          html += getTR(getTD(elt.nom_attribut) + getTD(elt.table_concernee) + getTD(elt.champ_concerne) + getTD(elt.attribut_user));
        }
      });
      html += finTABLE(BR);
      html += getBalise("h3", "Tables") + debutTABLE("tbl1") + getTR(getTH("table") + getTH("colonnes") + getTH("condition") + getTH("ACL") + getTH("Message"));
      let tableCourante = "";
      results.forEach(function (elt, index) {
        if (elt.table !== TABLEUSER) {
          if (elt.table !== tableCourante && tableCourante !== "") {
            html += getTR(getTD("", "sep") + getTD("", "sep") + getTD("", "sep") + getTD("", "sep") + getTD("", "sep"));
          }
          html += getTR(getTD(elt.table == tableCourante ? "" : elt.table, "gras") + getTD(elt.colonnes) + getTD(elt.condition) + getTD(colorizeString(elt.ACL)) + getTD(elt.memo));
          tableCourante = elt.table;
        }
      });
      html += finTABLE();
      document.getElementById(div).innerHTML = getDIV(html, "contenuACL") + BR + getButton("downloadBtn", "Enregistrer");
      document.getElementById("downloadBtn").addEventListener("click", function () {
        downloadHTML("contenuACL", "stylejta", "ACL");
      });
    });
  });
}

//--------------------------------
function date_du_jour(fmt) {
  fmt = fmt ? fmt : "j/m/a";
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  fmt = fmt.replace("j", day).replace("m", month).replace("a", year);
  return fmt;
}
function concatLigne(ligne1, ligne2) {
  return ligne1 + (ligne1 ? "<br>" : "") + ligne2;
}
function getBalise(balise, txt, classe, colspan) {
  classe = classe ? classe = " class='" + classe + "'" : "";
  colspan = colspan ? colspan = " colspan=" + colspan : "";
  return `<${balise}${classe}${colspan}>` + txt + `</${balise}>`;
}
function getTD(txt, classe, colspan) {
  return getBalise("td", txt, classe, colspan);
}
function getTH(txt, classe, colspan) {
  return getBalise("th", txt, classe, colspan);
}
function getTR(txt, classe) {
  return getBalise("tr", txt, classe);
}
function getButton(id, texte) {
  return `<button id='${id}'>${texte}</button>`;
}
function getDIV(texte, id, classe) {
  id = id ? id = " id='" + id + "'" : "";
  classe = classe ? classe = " class='" + classe + "'" : "";
  return `<div ${id}${classe}>${texte}</div>`;
}
function debutTABLE(classe) {
  return `<table class="${classe}">`;
}
function finTABLE(br) {
  br = br ? br : "";
  return "</table>" + br;
}
function getColIds(recalcDeps, parentPos, colId) {
  let result = [];
  recalcDeps.forEach(dep => {
    if (dep !== "L") {
      const parentIndex = parentPos.indexOf(dep);
      if (parentIndex !== -1) {
        result.push(colId[parentIndex]);
      }
    }
  });
  return result.join(", ");
}

//--------------------------------
function inverseFetch(records) {
  const keys = Object.keys(records);
  const result = [];
  const length = records[keys[0]].length;
  for (let i = 0; i < length; i++) {
    let obj = {};
    keys.forEach(key => {
      obj[key] = records[key][i];
    });
    result.push(obj);
  }
  return result;
}

//--------------------------------
function colorizeString(str) {
  let result = str.replace(/([+-])([A-Za-z]+)/g, (match, sign, letters) => {
    if (sign === '+') {
      return `${sign}<span style="color: green;">${letters}</span>`;
    } else if (sign === '-') {
      return `${sign}<span style="color: red;">${letters}</span>`;
    }
  });
  return result;
}

//--------------------------------
function downloadHTML(divHtml, divStyle, nomFichier) {
  var htmlContent = document.getElementById(divHtml).innerHTML;
  var styleContent = document.getElementById(divStyle).innerHTML;
  var combinedContent = "<html>\n<head>\n<style>\n" + styleContent + "\n</style>\n</head>\n<body>\n\n" + htmlContent + "\n</body>\n</html>";
  var blob = new Blob([combinedContent], { type: 'text/html' });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomFichier + ".html";
  link.click();
}
