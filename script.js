// script.js
// Module Échéancier PDF pour Grist
// Table attendue : "ECHÉANCIER" (ex: row objects) et "PARAMÈTRES" pour le header

// CONFIG
const TABLE_NAME = "ECHÉANCIER";
const PARAM_TABLE = "PARAMÈTRES";

// Utilitaires
function fmtNum(n){
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
function fmtDate(d){
  if (!d) return "—";
  // d may be ISO string or Date
  const dt = (typeof d === "string") ? new Date(d) : d;
  const opt = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return dt.toLocaleDateString('fr-FR', opt);
}

// Rendu du header
function renderHeader(params){
  document.getElementById('montant').textContent = params?.Montant ? fmtNum(params.Montant) + ' €' : '—';
  document.getElementById('taux').textContent = params?.TauxAnnuel ? (Number(params.TauxAnnuel) * 100).toFixed(3) + ' %' : '—';
  document.getElementById('mensualite').textContent = params?.Mensualité ? fmtNum(params.Mensualité) + ' €' : '—';
  document.getElementById('duree').textContent = params?.Duree_Mois || params?.Durée_Mois || params?.Durée_Mois || '—';
  document.getElementById('total-interets').textContent = params?.TotalInterets ? fmtNum(params.TotalInterets) + ' €' : '—';
  document.getElementById('cout-total').textContent = params?.CoutTotal ? fmtNum(params.CoutTotal) + ' €' : '—';
}

// Rendu du tableau
function renderTable(rows){
  const tbody = document.getElementById('amort-tbody');
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:12px;">Aucune ligne</td></tr>';
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.Numero ?? ''}</td>
      <td>${fmtDate(r.Date)}</td>
      <td>${r.CapitalInitial != null ? fmtNum(r.CapitalInitial) + ' €' : ''}</td>
      <td>${r.Interets != null ? fmtNum(r.Interets) + ' €' : ''}</td>
      <td>${r.MontantFrais != null ? fmtNum(r.MontantFrais) + ' €' : ''}</td>
      <td>${r.CapitalRembourse != null ? fmtNum(r.CapitalRembourse) + ' €' : ''}</td>
      <td>${r.CapitalFinal != null ? fmtNum(r.CapitalFinal) + ' €' : ''}</td>
      <td>${r.Mensualite != null ? fmtNum(r.Mensualite) + ' €' : ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Ajoute numéros de page (Page X / Y) via jsPDF après génération par html2pdf
function addPageNumbersToPdf(pdf) {
  const totalPages = pdf.internal.getNumberOfPages();
  const fontSize = 9;
  const marginBottom = 10; // mm

  // position in mm -> convert to PDF units (default is 'pt' in html2pdf's jsPDF if not set; in our options we use mm)
  pdf.setFontSize(fontSize);
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // On écrit en bas à droite : "Page i / total"
    const text = `Page ${i} / ${totalPages}`;
    // On obtient largeur de la page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const textWidth = pdf.getStringUnitWidth(text) * (fontSize / pdf.internal.scaleFactor);
    const x = pageWidth - 15; // mm from left if units mm
    // Position Y : a little above bottom margin
    const y = pageHeight - 10;
    pdf.text(text, x, y, { align: 'right' });
  }
}

// Génération du PDF via html2pdf.js
function generatePdf(filename = 'echeancier.pdf') {
  const element = document.getElementById('pdf-content');

  // Options html2pdf
  const opt = {
    margin: [10, 10, 15, 10], // top, left, bottom, right (mm)
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  document.getElementById('status').textContent = 'Génération PDF en cours...';

  // html2pdf chain: toPdf().get('pdf') -> then add page numbers, then save
  html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
    // Ajouter page numbers
    addPageNumbersToPdf(pdf);
  }).save().then(function () {
    document.getElementById('status').textContent = 'PDF généré';
    setTimeout(() => document.getElementById('status').textContent = '', 2500);
  }).catch(function (err) {
    console.error(err);
    document.getElementById('status').textContent = 'Erreur lors de la génération du PDF';
  });
}

// Données reçues de Grist
let latestParams = null;
let latestRows = [];

// Fonction pour rafraîchir le rendu (appelée après réception des données)
function refreshRender() {
  renderHeader(latestParams || {});
  renderTable(latestRows || []);
}

// Boutons UI
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-refresh').addEventListener('click', refreshRender);
  document.getElementById('btn-generate').addEventListener('click', () => {
    generatePdf(`echeancier_${new Date().toISOString().slice(0,10)}.pdf`);
  });
});

// --- Intégration Grist ---
// ATTENTION : la forme exacte de l'API Grist dépend de la version.
// Ce bloc suppose l'API "grist" mise à disposition dans le widget environment.
//
// On essaye d'être résilient : si grist n'est pas présent, on permet un rendu manuel.
// Si grist est disponible, on souscrit aux enregistrements.

function attachToGrist() {
  if (typeof grist === 'undefined') {
    console.warn("Grist API not found. You can still test the rendering manually.");
    return;
  }

  // ready
  if (grist.ready) grist.ready();

  // Récupérer la table de paramètres (on prend la première ligne si plusieurs)
  try {
    grist.onRecord(PARAM_TABLE, (row) => {
      if (row) {
        // Grist peut renvoyer row as object with fields
        latestParams = {
          Montant: row.Montant,
          TauxAnnuel: row.TauxAnnuel,
          Mensualité: row.Mensualité,
          Duree_Mois: row.Durée_Mois || row.Duree_Mois || row.Durée_Mois || row.Durée_Mois,
          TotalInterets: row.TotalInterets,
          CoutTotal: row.CoutTotal
        };
        refreshRender();
      }
    });
  } catch (e) {
    // fallback: try onRecords
    try {
      grist.onRecords(PARAM_TABLE, (rows) => {
        if (rows && rows.length > 0) {
          const row = rows[0];
          latestParams = {
            Montant: row.Montant,
            TauxAnnuel: row.TauxAnnuel,
            Mensualité: row.Mensualité,
            Duree_Mois: row.Durée_Mois || row.Duree_Mois,
            TotalInterets: row.TotalInterets,
            CoutTotal: row.CoutTotal
          };
          refreshRender();
        }
      });
    } catch (err) {
      console.warn('Impossible de souscrire à PARAMÈTRES via onRecords/onRecord', err);
    }
  }

  // Écouter table ECHÉANCIER
  try {
    grist.onRecords(TABLE_NAME, (rows) => {
      latestRows = rows.map(r => ({
        Numero: r.Numero,
        Date: r.Date,
        CapitalInitial: r.CapitalInitial,
        Interets: r.Interets,
        MontantFrais: r.MontantFrais,
        CapitalRembourse: r.CapitalRembourse,
        CapitalFinal: r.CapitalFinal,
        Mensualite: r.Mensualite
      }));
      refreshRender();
    });
  } catch (e) {
    console.warn("onRecords not available; trying onTable");
    try {
      grist.getTable(TABLE_NAME).then(table => {
        table.getRecords().then(rows => {
          latestRows = rows;
          refreshRender();
        });
      });
    } catch (err) {
      console.warn('Impossible de récupérer ECHÉANCIER', err);
    }
  }
}

// Try attach
attachToGrist();
