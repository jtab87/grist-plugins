let nbRecords = 0;
let nbTirage = 5;
let tableTirage;
let coltirage;
const columnsMappingOptions = [
    {
        name: "coltirage",
        title: "Enregistrer le tirage dans",
        optional: false,
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
function tirageAleatoire(x) {
    return Math.floor(Math.random() * x) + 1;
}

// ------------------------------------------
function run() {
    let xx = document.getElementById("nbtirage").value;

    if (xx.includes('%')) {
        nbTirage = parseFloat(xx.replace('%', '')) / 100;
        nbTirage = Math.ceil(nbRecords * nbTirage);
    } else {
        nbTirage = xx;
    }
    if (nbTirage <= 0 || nbTirage >= nbRecords) {
        msgErr("Le nombre doit être compris entre 1 et " + nbRecords);
        return;
    }
    msgErr();
    let tirages = [];
    let ta;
    for (let i = 0; i < nbTirage; i++) {
        do {
            ta = tirageAleatoire(nbRecords);
        } while (tirages.includes(ta));
        tirages.push(ta);
    }

    let message = "<hr>Nombre de tirages = <b>" + nbTirage + "</b>";
    message += "<br><br><i>Pour récupérer les lignes sélectionnées, filtrer la colonne '" + coltirage + "' sur 'ok'</i><hr>";
    //message += "<br>" + tirages.join(", ");
    let champs = {};
    for (i = 0; i < tableTirage.length; i++) {
        champs[coltirage] = "";
        if (tirages.includes(i + 1)) champs[coltirage] = "ok";
        grist.selectedTable.update({
            id: tableTirage[i].id,
            fields: champs
        });
    }
    document.getElementById('dump').innerHTML = message;
}

// ------------------------------------------
function msgErr(texte) {
    const errorMessage = document.getElementById('error-message');
    const bouton = document.getElementById('bouton');
    if (texte) {
        errorMessage.innerHTML = texte;
        errorMessage.style.display = 'block';
        bouton.style.display = 'none';
    } else {
        errorMessage.style.display = 'none';
        bouton.style.display = 'inline';
    }
}

// ------------------------------------------
ready(function () {

    const nbtirage = document.getElementById('nbtirage');

    nbtirage.addEventListener('input', function () {
        const pattern = /^[0-9]+%?$/;
        if (pattern.test(nbtirage.value)) {
            msgErr();
        } else {
            msgErr("Veuillez entrer un nombre valide ou un pourcentage valide (ex: 50 ou 50%)");
        }
    });

    grist.ready({ requiredAccess: 'none', columns: columnsMappingOptions });

    grist.onRecords((table, mappings) => {
        coltirage = mappings.coltirage;
        tableTirage = table;
        nbRecords = table.length;
        document.getElementById("titre").innerHTML = "Tirage aléatoire sur " + nbRecords + " records";
    });

    grist.onRecord(record => {
        //document.getElementById("dump").innerHTML = JSON.stringify(record,null, 2);
    });
});
