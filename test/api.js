
function clicbouton1() {
	run1();
}
function clicbouton2() {
	run2();
}

grist.ready({ requiredAccess: 'none' });
grist.onRecords(table => {

});
grist.onRecord(record => {

});

// ------------ requête API interne ------------------------
async function query1() {
  document.getElementById('dump').innerHTML = "... en cours...";
  const tokenInfo = await grist.docApi.getAccessToken({readOnly: true});
  const url = tokenInfo.baseUrl + `/tables/Salaries/records?auth=${tokenInfo.token}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.json();
}

async function run1() {
  try {
    const result = await query1();
    html = "";
    result.records.forEach(function(rec) {
		html += rec.fields.nom + " " + rec.fields.prenom + "<br>";
    });
    document.getElementById('dump').innerHTML = html;
  } catch (e) {
    console.error(e);
	document.getElementById('dump').innerHTML = "erreur : " + String(e);
  }
}

// ------------ requête API externe ------------------------
async function query2() {
  document.getElementById('dump').innerHTML = "... en cours...";
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
    result.forEach(function(rec) {
		html += rec.nom + "<br>";
    });
    document.getElementById('dump').innerHTML = html; //JSON.stringify(result);
  } catch (e) {
    console.error(e);
	document.getElementById('dump').innerHTML = "erreur : " + String(e);
  }
}


