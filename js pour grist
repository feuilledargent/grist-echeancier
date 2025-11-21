console.log("Widget chargé !");

// ===== Utilitaires =====
function fmtNum(n) { return (n == null || isNaN(n)) ? "—" : Number(n).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(d) { const dt = new Date(d); return isNaN(dt) ? "—" : dt.toLocaleDateString("fr-FR"); }
function round2(n) { return Math.round(Number(n) * 100) / 100; }

let params = null;

// ===== Calcul échéancier =====
function calculEcheancier() {
    if (!params) return { rows:[], mensualiteBase:0, totalInterets:0, totalFrais:0, coutTotal:0 };
    const montant = Number(params.Montant || 0);
    const duree = Number(params.Duree_Mois || 0);
    let tauxAnnuel = Number(params.TauxAnnuel || 0);
    const typeTaux = String(params.TypeTaux || "Proportionnel");
    const fraisType = String(params.Frais_bancaires || "Frais fixes");
    const fraisFixes = Number(params.FraisFixesParEcheance || 0);
    const fraisVarTaux = Number(params.FraisVariablesTaux || 0);
    const datePrem = params.DatePremiereEcheance ? new Date(params.DatePremiereEcheance) : new Date();
    if (tauxAnnuel > 1) tauxAnnuel = tauxAnnuel / 100;
    const tauxMensuel = typeTaux.toLowerCase().includes("proportion") ? (tauxAnnuel / 12) : (Math.pow(1 + tauxAnnuel, 1/12) - 1);
    let mensualiteBase = 0;
    if (duree > 0) {
        mensualiteBase = (tauxMensuel > 0) ? montant * tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -duree)) : montant / duree;
    }
    mensualiteBase = round2(mensualiteBase);
    let capitalRestant = round2(montant);
    const rows = [];
    let totalInterets = 0, totalFrais = 0;
    for (let i=1; i<=duree; i++) {
        const interet = round2(capitalRestant * tauxMensuel);
        const frais = fraisType.toLowerCase().includes("fixe") ? round2(fraisFixes) : round2(mensualiteBase * fraisVarTaux);
        let capitalRemb = round2(mensualiteBase - interet);
        if (i === duree && capitalRemb > capitalRestant) capitalRemb = capitalRestant;
        const capitalFinal = round2(capitalRestant - capitalRemb);
        const mensualiteTotale = round2(mensualiteBase + frais);
        const dateEch = new Date(datePrem.getFullYear(), datePrem.getMonth() + (i-1), datePrem.getDate());
        rows.push({
            Numero:i,
            Date:dateEch,
            CapitalInitial:capitalRestant,
            Interets:interet,
            MontantFrais:frais,
            CapitalRembourse:capitalRemb,
            CapitalFinal:capitalFinal,
            Mensualite:mensualiteTotale
        });
        totalInterets = round2(totalInterets + interet);
        totalFrais = round2(totalFrais + frais);
        capitalRestant= capitalFinal;
    }
    const coutTotal = round2(montant + totalInterets + totalFrais);
    return { rows, mensualiteBase, totalInterets, totalFrais, coutTotal };
}

// ===== Affichage =====
function render() {
    const tb = document.getElementById("tbody");
    tb.innerHTML = "";
    if (!params) {
        tb.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#888;'>Sélectionnez une ligne dans PARAMETRES</td></tr>";
        return;
    }
    const { rows, mensualiteBase, totalInterets, totalFrais, coutTotal } = calculEcheancier();
    document.getElementById("montant").textContent = fmtNum(params.Montant);
    document.getElementById("taux").textContent = (params.TauxAnnuel ? ((params.TauxAnnuel > 1 ? params.TauxAnnuel : params.TauxAnnuel*100).toFixed(3) + " %") : "—");
    document.getElementById("mensualite").textContent = fmtNum(mensualiteBase);
    document.getElementById("duree").textContent = params.Duree_Mois || "—";
    document.getElementById("total-interets").textContent = fmtNum(totalInterets);
    document.getElementById("cout-total").textContent = fmtNum(coutTotal);

    let count = 0;
    let pageNumber = 1;
    const totalPages = Math.ceil(rows.length <= 35 ? 1 : 1 + (rows.length - 35) / 40);

    for (const r of rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.Numero}</td>
            <td>${fmtDate(r.Date)}</td>
            <td>${fmtNum(r.CapitalInitial)}</td>
            <td>${fmtNum(r.Interets)}</td>
            <td>${fmtNum(r.MontantFrais)}</td>
            <td>${fmtNum(r.CapitalRembourse)}</td>
            <td>${fmtNum(r.CapitalFinal)}</td>
            <td>${fmtNum(r.Mensualite)}</td>
        `;
        tb.appendChild(tr);
        count++;

        const limit = pageNumber === 1 ? 35 : 39;
        if (count === limit) {
            const counterRow = document.createElement("tr");
            counterRow.innerHTML = `<td colspan="8" class="page-counter">Page ${pageNumber} sur ${totalPages}</td>`;
            tb.appendChild(counterRow);

            const breakRow = document.createElement("tr");
            breakRow.classList.add("page-break");
            tb.appendChild(breakRow);

            pageNumber++;
            count = 0;
        }
    }

    if (count > 0) {
        const counterRow = document.createElement("tr");
        counterRow.innerHTML = `<td colspan="8" class="page-counter">Page ${pageNumber} sur ${totalPages}</td>`;
        tb.appendChild(counterRow);
    }
}

// Bouton Imprimer
document.getElementById("btn-print").addEventListener("click", () => {
    window.print();
});

// ===== Grist =====
grist.ready();
grist.onRecord((row) => {
    params = row;
    render();
});
