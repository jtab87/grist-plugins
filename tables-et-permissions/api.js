const div = "container";
const bouton = "bouton";

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function () {
  document.getElementById("acl").addEventListener("click", function () {
    document.getElementById(div).innerHTML = "... en cours ...";
    document.getElementById(bouton).innerHTML = "";
    affiche_ACL();
  });
  document.getElementById("tables").addEventListener("click", function () {
    document.getElementById(div).innerHTML = "... en cours ...";
    document.getElementById(bouton).innerHTML = "";
    affiche_schema_tables();
  });

  grist.ready({ requiredAccess: 'none' });
  grist.onRecords(table => {
    //document.getElementById('dump').innerHTML = JSON.stringify(table, null, 2);
  });
  grist.onRecord(record => {

  });
});

//--------------------------------
function affiche_schema_tables() {
  grist.docApi.fetchTable("_grist_Tables").then(function (tables) {
    grist.docApi.fetchTable("_grist_Tables_column").then(function (data) {

      let result = [];

      function getInitTrigger(deps, ids, labels) {
        if (deps == "") return "";
        let result = [];
        deps.forEach(trigger => {
          let x = ids.indexOf(trigger);
          if (x > 0) {
            result.push(labels[x]);
          }
        });
        return result.join(",");
      }

      for (let i = 0; i < data.id.length; i++) {
        const tableNumber = data.parentId[i];
        const fieldName = data.label[i];
        const fieldType = data.type[i];
        const formula = data.isFormula[i] ? data.formula[i] : "";
        const initFormula = !data.isFormula[i] ? data.formula[i] : "";
        const initTrigger = data.recalcDeps[i] ? data.recalcDeps[i] : "";
        const choices = data.widgetOptions[i] && JSON.parse(data.widgetOptions[i]).choices || [];
        const dropcond = data.widgetOptions[i] && JSON.parse(data.widgetOptions[i]).dropdownCondition || "";

        if (fieldType != "ManualSortPos" && !fieldName.startsWith("gristHelper")) {
          result.push({
            tableNumber: tableNumber,
            tableName: tables.tableId[tables.id.indexOf(data.parentId[i])],
            fieldName: fieldName,
            fieldType: formula != "" ? "Formule" : fieldType,
            formula: formula,
            initFormula: initFormula,
            initTrigger: getInitTrigger(initTrigger, data.id, data.label),
            choices: choices,
            dropcond: dropcond ? dropcond.text : ""
          });
        }
      }

      result.sort((a, b) => a.tableNumber - b.tableNumber);

      const tablesGrouped = result.reduce((acc, curr) => {
        if (!acc[curr.tableName]) {
          acc[curr.tableName] = [];
        }
        acc[curr.tableName].push(curr);
        return acc;
      }, {});

      // Generating HTML for each table
      const container = document.getElementById(div);
      container.innerHTML = "Le : " + date_du_jour();
      for (const [tableName, rows] of Object.entries(tablesGrouped)) {
        const tableHtml = `
                <h2>${tableName}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Champ</th>
                            <th>Type</th>
                            <th>Formule</th>
                            <th>Choix</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => {
          const formulaContent = row.formula ? `<pre>${row.formula}</pre>` : '';
          const initFormulaContent = row.initFormula ? `<span class="titre">Initialisation du champ : </span><pre>${row.initFormula}</pre>` : '';
          const initTriggerContent = row.initTrigger ? `<span class="titre">Déclenché sur les modifs des colonnes : </span><pre>${row.initTrigger}</pre>` : '';
          const dropcondContent = row.dropcond ? `<span class="titre">Dropdown condition : </span><pre>${row.dropcond}</pre>` : '';
          const formulaText = initFormulaContent || formulaContent;
          const choicesText = row.choices.length > 0 ? row.choices.join('<br>') : '';

          return `
                  <tr>
                      <td><b>${row.fieldName}</b></td>
                      <td>${row.fieldType}</td>
                      <td>${formulaText}${initTriggerContent}${dropcondContent}</td>
                      <td>${choicesText}</td>
                  </tr>
              `;
        }).join('')}
                    </tbody>
                </table>
            `;
        container.innerHTML += tableHtml;
      }

      document.getElementById(bouton).innerHTML = getButton("downloadBtn", "Enregistrer");
      document.getElementById("downloadBtn").addEventListener("click", function () {
        downloadHTML(div, "stylejta", "Tables");
      });
    });
  });
}
/* ---------------------------------------------------------------------------------
 Pour récupérer la description de la table : interroger _grist_Views_section
 
 _grist_Views_section : { "id" 23, "tableRef": 3, "title": "team", "description": "description jta"}
 _grist_Tables        : { "id": 3, "tableId": "Team", "summarySourceTable": 0, "rawViewSectionRef": 23}
 
 description = _grist_Views_section.description[_grist_Views_section.id.indexOf(_grist_Tables.rawViewSectionRef)]
 ------------------------------------------------------------------------------------*/

//--------------------------------
function affiche_ACL() {
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

      // Fonction pour générer la section Users (table "_xxx")
      function generateUsersTable() {
        let html = `
            <h2>Users</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nom Attribut</th>
                        <th>Table Concernée</th>
                        <th>Champ Concerné</th>
                        <th>Attribut User</th>
                    </tr>
              </thead>
              <tbody>`;

        results.forEach(entry => {
          if (entry.table.startsWith('_xxx')) {
            html += `
              <tr>
                  <td>${entry.nom_attribut}</td>
                  <td>${entry.table_concernee}</td>
                  <td>${entry.champ_concerne}</td>
                  <td>${entry.attribut_user}</td>
              </tr>`;
          }
        });

        html += `</tbody></table>`;
        return html;
      }

      // Fonction pour générer la section Tables
      function generateTables() {
        let tableCourante = "";
        let html = `
            <h2>Tables</h2>
            <table>
                <thead>
                    <tr>
                        <th>Table</th>
                        <th>Colonnes</th>
                        <th>Condition</th>
                        <th>ACL</th>
                        <th>Memo</th>
                    </tr>
                </thead>
                <tbody>`;

        results.forEach(entry => {
          if (!entry.table.startsWith('_xxx')) {
            const premiereLigneTable = tableCourante != entry.table && tableCourante != "";
            if (premiereLigneTable == true) {
              html += `
              <tr>
                  <td class="sep"> </td>
                  <td class="sep"> </td>
                  <td class="sep"> </td>
                  <td class="sep"> </td>
                  <td class="sep"> </td>
              </tr>`;
            }
            html += `
              <tr>
                  <td>${premiereLigneTable ? entry.table : ""}</td>
                  <td>${entry.colonnes}</td>
                  <td>${entry.condition}</td>
                  <td>${colorizeString(entry.ACL)}</td>
                  <td>${entry.memo}</td>
              </tr>`;
          }
          tableCourante = entry.table;
        });

        html += `</tbody></table>`;
        return html;
      }
      // Insérer les sections dans le DOM
      document.getElementById(div).innerHTML = "Le : " + date_du_jour() + generateUsersTable() + generateTables();

      document.getElementById(bouton).innerHTML = getButton("downloadBtn", "Enregistrer");
      document.getElementById("downloadBtn").addEventListener("click", function () {
        downloadHTML(div, "stylejta", "ACL");
      });

    });
  });
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
function getButton(id, texte) {
  return `<button id='${id}'>${texte}</button>`;
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
