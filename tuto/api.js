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

function clean(div) {
  document.getElementById(div).innerHTML = "";
}

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

async function run1() {
  let table = document.getElementById('table').value;
  try {
    const result = await query1(table);
    document.getElementById('dump1').innerHTML = JSON.stringify(result, null, 2);
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

async function changeOption() {
  await grist.setOption("titre", document.getElementById('optiontitre').value);
}


