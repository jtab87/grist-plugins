const icone = getIcone();
let chart;
let token = "";
let baseUrl = "";
let chpParentId = "";
let chpNom = "";
let chpFonction = "";
let chpDirection = "";
let chpImage = "";
const columnsMappingOptions = [
  {
    name: "parentId",
    title: "Identifiant du N+1",
    optional: false,
    allowMultiple: false
  },
  {
    name: "nom",
    title: "Le nom de l'agent",
    optional: false,
    type: "Text",
    allowMultiple: false
  },
  {
    name: "fonction",
    title: "La fonction de l'agent",
    optional: true
  },
  {
    name: "direction",
    title: "La direction de l'agent",
    optional: true
  },
  {
    name: "image",
    title: "L'image de l'agent",
    optional: true,
    type: "Attachments",
    allowMultiple: false
  }
];

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function () {

  grist.ready({ requiredAccess: 'none', columns: columnsMappingOptions });

  grist.onRecords((table, mappings) => {
    //document.getElementById('dump').innerHTML = JSON.stringify(table, null, 2);
    chpParentId = mappings.parentId;
    chpNom = mappings.nom;
    chpFonction = mappings.fonction;
    chpDirection = mappings.direction;
    chpImage = mappings.image;

    let nbNull = 0;
    table.forEach(elt => {
      if (elt[chpParentId] == null) nbNull++;
    });

    if (nbNull > 1) {
      document.getElementById('msg').innerHTML = "Il ne faut qu'un seul agent sans N+1 (parentId=null)<br>L'organigramme ne peut pas fonctionner";
    } else if (nbNull == 0) {
      document.getElementById('msg').innerHTML = "Il faut un agent sans N+1 (parentId=null)<br>L'organigramme ne peut pas fonctionner";
    } else {
      document.getElementById('msg').innerHTML = "";
      grist.docApi.getAccessToken({ readOnly: true }).then(response => {
        token = response.token;
        baseUrl = response.baseUrl;
        genereOrganigramme(table);
      });
    }
  });

  grist.onRecord(record => {

  });

  grist.onOptions((options) => {
    document.getElementById('titre').innerHTML = options.titre || "Organigramme";
  });

});

async function genereOrganigramme(table) {
  let colorVignette = await grist.getOption("couleurVignette") || "lightblue";
  chart = new d3.OrgChart()
    .nodeHeight((d) => 85 + 25)
    .nodeWidth((d) => 220 + 2)
    .childrenMargin((d) => 50)
    .compactMarginBetween((d) => 35)
    .compactMarginPair((d) => 30)
    .neighbourMargin((a, b) => 20)
    .parentNodeId((d) => d[chpParentId])
    .linkUpdate(function (d, i, arr) {
      d3.select(this)
        .attr('stroke', (d) => d.data._upToTheRootHighlighted ? '#e27396' : 'lightgray')
        .attr('stroke-width', (d) => d.data._upToTheRootHighlighted ? 5 : 1.5)
      if (d.data._upToTheRootHighlighted) {
        d3.select(this).raise();
      }
    })
    .nodeContent(function (d, i, arr, state) {
      const color = colorVignette;
      const imageDiffVert = 25 + 2;
      return `
				<div style='width:${d.width
        }px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
						<div style="font-family: 'Inter', sans-serif;background-color:${color};  margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 1px solid #E4E2E9">
							<div onclick="toRoot(${d.data.id},${d.data._upToTheRootHighlighted})" style="display:flex;justify-content:flex-end;margin-top:5px;margin-right:8px">#${d.data.id
        }</div>
							<div style="background-color:${color};margin-top:${-imageDiffVert - 20}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
							<div style="margin-top:${-imageDiffVert - 20
        }px;">   
							<img src="${d.data[chpImage] && d.data[chpImage][0] ? getImage(d.data[chpImage][0]) : icone
        }" style="margin-left:${20}px;border-radius:100px;width:40px;height:40px;" /></div>
							<div style="font-size:15px;color:#08011E;margin-left:20px;margin-top:10px">  ${d.data[chpNom]
        } </div>
							<div style="color:#716E7B;margin-left:20px;margin-top:3px;font-size:10px;"> ${(d.data[chpFonction] || "") + "<br>" + (d.data[chpDirection] || "")
        } </div>

						</div>
					</div>
							`;
    })
    .container('.chart-container')
    .data(table)
    .render();
}

function toRoot(id, highlighted) {
  chart.clearHighlighting();
  if (highlighted !== true) {
    chart.setUpToTheRootHighlighted(id).render().fit();
  }
}

function filterChart(e) {
  const value = e.srcElement.value;
  chart.clearHighlighting();
  const data = chart.data();
  data.forEach((d) => (d._expanded = false));
  data.forEach((d) => {
    if (value != '' && d[chpNom].toLowerCase().includes(value.toLowerCase())) {
      d._highlighted = true;
      d._expanded = true;
    }
  });
  chart.data(data).render().fit();

  //console.log('filtering chart', e.srcElement.value);
}

function getImage(id) {
  const url = `${baseUrl}/attachments/${id}/download?auth=${token}`;
  return url;
}

async function clic(action) {
  const configPanel = document.getElementById('config-panel');
  let titre = await grist.getOption("titre") || "Organigramme";
  let couleur = await grist.getOption("couleurVignette") || "lightblue";
  if (action == 0) {
    document.getElementById("input-titre").value = titre;
    document.getElementById("input-couleur").value = couleur;
  }
  if (action == 1) {
    await grist.setOption("titre", document.getElementById("input-titre").value);
    await grist.setOption("couleurVignette", document.getElementById("input-couleur").value);
  }
  if (configPanel.style.display == 'block') {
    configPanel.style.display = 'none';
  } else {
    configPanel.style.display = 'block';
  }
}

function getIcone() {
  return "data:image/png;base64,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";

}
