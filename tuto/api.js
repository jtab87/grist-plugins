const columnsMappingOptions = [
  {
    name: "dateValidite",
    title: "Date de validité",
    optional: false,
    description: "début de la validité",
    allowMultiple: false,
    strictType: true
  },
  {
    name: "type",
    title: "Type de référence",
    optional: true,
    type: "Choice,ChoiceList",
    description: "Type de la référence",
    allowMultiple: false
  }
];

//--------------------------------
grist.ready({ requiredAccess: 'none', columns: columnsMappingOptions });

grist.onRecords((rows, mappings) => {
  document.getElementById('col1').innerHTML = mappings.dateValidite;
  document.getElementById('col2').innerHTML = mappings.type;
});

grist.onRecord(record => {

});

grist.onOptions((options, settings) => {
  document.getElementById('dump3').innerHTML = "options.titre = " + options.titre;
});

// ------------ requête API interne ------------------------
async function query1(table) {
  document.getElementById('dump1').innerHTML = "... en cours...";
  const tokenInfo = await grist.docApi.getAccessToken({ readOnly: true });
  const url = tokenInfo.baseUrl + `/tables/${table}/records?auth=${tokenInfo.token}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.json();
}

//--------------------------------
async function run1() {
  let table = document.getElementById('table').value;
  try {
    const result = await query1(table);
    const xx = result.records.slice(0, 3);
    document.getElementById('dump1').innerHTML = "Les 3 premiers records : <br>" + JSON.stringify(xx, null, 2);
  } catch (e) {
    console.error(e);
    document.getElementById('dump1').innerHTML = "erreur : " + String(e);
  }
}

// ------------ requête API externe ------------------------
async function query2() {
  document.getElementById('dump2').innerHTML = "... en cours...";
  //const tokenInfo = await grist.docApi.getAccessToken({readOnly: true});
  const url = "https://geo.api.gouv.fr/regions";
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.json();
}

//--------------------------------
async function run2() {
  try {
    const result = await query2();
    html = "";
    result.forEach(function (rec) {
      html += rec.nom + "<br>";
    });
    document.getElementById('dump2').innerHTML = html; //JSON.stringify(result);
  } catch (e) {
    console.error(e);
    document.getElementById('dump2').innerHTML = "erreur : " + String(e);
  }
}

//--------------------------------
function clean(div) {
  document.getElementById(div).innerHTML = "";
}

//--------------------------------
async function changeOption() {
  await grist.setOption("titre", document.getElementById('optiontitre').value);
}

//--------------------------------
function fetch_table(table, div) {
  grist.docApi.fetchTable(table).then(function(records) {
    document.getElementById(div).innerHTML = JSON.stringify(records).replace(/],"/g, "],<br>\"");
  }).catch(function(e) {
	  document.getElementById(div).innerHTML ="erreur " + String(e);
	});
}

//--------------------------------
async function run3() {
  document.getElementById('dump4').innerHTML = "... en cours...";
  fetch_table(document.getElementById("table1").value, "dump4");
}

//--------------------------------
function list_tables() {
  grist.docApi.listTables().then(function(tables) {
    document.getElementById('dump5').innerHTML = JSON.stringify(tables);
  });
}

//--------------------------------
async function run4() {
  list_tables();
}

