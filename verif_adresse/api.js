const url_base = "https://api-adresse.data.gouv.fr/search/?q=";
let url = "";
let id_record = 0;
let nbmax = 5;
const minCar = 10;
let qValide = true;
const colsMap = { "numero": "numero", "nom_voie": "nom_voie", "code_postal": "code_postal", "ville": "ville", "dept": "dept", "region": "region", "x": "x", "y": "y" };
const columnsMappingOptions = [
  {
    name: "numero",
    title: "Numéro de la voie",
    optional: false,
    allowMultiple: false
  },
  {
    name: "nom_voie",
    title: "Nom de la voie",
    optional: false,
    allowMultiple: false
  },
  {
    name: "code_postal",
    title: "Code postal",
    optional: false,
    allowMultiple: false
  },
  {
    name: "ville",
    title: "Ville",
    optional: false,
    allowMultiple: false
  },
  {
    name: "dept",
    title: "Département",
    optional: true,
    allowMultiple: false
  },
  {
    name: "region",
    title: "Région",
    optional: true,
    allowMultiple: false
  },
  {
    name: "x",
    title: "x",
    optional: true,
    allowMultiple: false
  },
  {
    name: "y",
    title: "y",
    optional: true,
    allowMultiple: false
  }
];

// ------------------------------------------
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// ------------------------------------------
async function query() {
  url += "&autocomplete=0&limit=" + nbmax;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return response.json();
}

// ------------------------------------------
async function run() {
  try {
    if (!qValide) {
      msg(`La requête doit comporter au moins ${minCar} caractères`);
      return;
    }
    msg("&nbsp;");
    const result = await query();
    //document.getElementById('dump').innerHTML = JSON.stringify(result);
    const addressArray = result.features.map(feature => {
      const { housenumber, street, postcode, city, x, y, context, score } = feature.properties;
      let buff = context.split(",");
      return {
        "numero": housenumber || "",
        "nom_voie": street,
        "code_postal": postcode,
        "ville": city,
        "x": x,
        "y": y,
        "dept": buff[1] ? buff[1].trim() : "",
        "region": buff[2] ? buff[2].trim() : "",
        "score": `<span class='${score > 0.7 ? "ok" : "ko"}'>${(score * 100).toFixed(1)}%</span>`
      };
    });

    addressArray.sort((a, b) => {
      const cityA = a["code_postal"].toLowerCase();
      const cityB = b["code_postal"].toLowerCase();
      if (cityA < cityB) return -1;
      if (cityA > cityB) return 1;
      return 0;
    });

    const tbody = document.querySelector('#addressTable tbody');
    tbody.innerHTML = "";

    addressArray.forEach((address, index) => {
      const row = document.createElement('tr');

      row.addEventListener('click', () => {
        let adresse = addressArray[index];
        maj_adresse(adresse);
      });

      Object.keys(address).forEach(key => {
        if (key != "x" && key != "y") {
          const cell = document.createElement('td');
          cell.innerHTML = address[key];
          row.appendChild(cell);
        }
      });

      tbody.appendChild(row);
    });

  } catch (e) {
    console.error(e);
    msg("erreur : " + String(e));
  }
}

// ------------------------------------------
function maj_adresse(adresse) {
  const objMaj = {};
  objMaj[colsMap.numero] = adresse.numero;
  objMaj[colsMap.nom_voie] = adresse.nom_voie;
  objMaj[colsMap.code_postal] = adresse.code_postal;
  objMaj[colsMap.ville] = adresse.ville;
  if (colsMap.dept) objMaj[colsMap.dept] = adresse.dept;
  if (colsMap.region) objMaj[colsMap.region] = adresse.region;
  if (colsMap.x) objMaj[colsMap.x] = adresse.x;
  if (colsMap.y) objMaj[colsMap.y] = adresse.y;

  grist.docApi.applyUserActions([['UpdateRecord', "Adresses", id_record, objMaj]]).then(function (e) {
    msg("maj ok");
  }).catch(function (e) {
    msg("erreur " + String(e));
  });
}

// ------------------------------------------
function msg(message) {
  document.getElementById("info").innerHTML = message;
}

// ------------------------------------------
async function changeNbMax(e) {
  nbmax = e.value;
  await grist.setOption('nbmax', nbmax);
}

// ------------------------------------------
async function getNbMax() {
  nbmax = await grist.getOption('nbmax') || 5;
  var combo = document.getElementById("nbmax");
  combo.value = nbmax;
}

// ------------------------------------------
ready(function () {
  grist.ready({ requiredAccess: 'none', columns: columnsMappingOptions });
  grist.onRecords((table, mappings) => {
    getNbMax();
    colsMap.numero = mappings.numero;
    colsMap.nom_voie = mappings.nom_voie;
    colsMap.code_postal = mappings.code_postal;
    colsMap.ville = mappings.ville;
    colsMap.dept = mappings.dept;
    colsMap.region = mappings.region;
    colsMap.x = mappings.x;
    colsMap.y = mappings.y;
  });
  grist.onRecord((record, mappings) => {
    id_record = record.id;
    let q = [];
    if (record[mappings.numero].trim() != "") q.push(record[mappings.numero].trim());
    if (record[mappings.nom_voie].trim() != "") q.push(record[mappings.nom_voie].trim());
    if (record[mappings.code_postal]) q.push(record[mappings.code_postal]);
    if (record[mappings.ville].trim() != "") q.push(record[mappings.ville].trim());
    url = q.join("+").replace(/[ ]{1,2}/g, "+");
    qValide = url.length >= minCar;
    url = url_base + url;
    document.getElementById("dump").innerHTML = url;
  });

});

