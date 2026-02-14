// ================= SESSION =================
let savedTeam = localStorage.getItem("teamName") || null;


// ================= REGISTER =================
window.register = async function () {

    const input = document.getElementById("teamName");
    if (!input) return;

    const name = input.value.trim();
    if (!name) return alert("Enter team name");

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: name })
    });

    const data = await res.json();

    if (data.success) {
        localStorage.setItem("teamName", name);
        savedTeam = name;
        updateLayout();
    }
};


// ================= PLACE BID =================
window.bid = async function () {

    if (!savedTeam) return alert("Register first");

    const amount = parseInt(document.getElementById("bidAmount").value);

    const res = await fetch("/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: savedTeam, amount })
    });

    const data = await res.json();
    if (data.error) alert(data.error);
};


// ================= ADMIN FUNCTIONS =================
window.saveSettings = async function () {

    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            basePrice: parseInt(basePrice.value) || 0,
            capital: parseInt(capital.value) || 0,
            roundTime: parseInt(roundTime.value) || 0
        })
    });
};

window.startRound = async function () {
    await fetch("/start", { method: "POST" });
};

window.endRound = async function () {
    await fetch("/end", { method: "POST" });
};

window.goDashboard = async function () {
    await fetch("/activateDashboard", { method: "POST" });
};


// ================= UPDATE LAYOUT =================
function updateLayout() {

    const registerCard = document.getElementById("registerCard");
    const bidCard = document.getElementById("bidCard");
    const teamLabel = document.getElementById("teamLabel");

    if (savedTeam) {
        if (registerCard) registerCard.style.display = "none";
        if (bidCard) bidCard.style.display = "block";
        if (teamLabel) teamLabel.innerText = "Team name: " + savedTeam;
    } else {
        if (registerCard) registerCard.style.display = "block";
        if (bidCard) bidCard.style.display = "none";
    }
}


// ================= LOAD DATA =================
async function loadData() {

    const res = await fetch("/data");
    const data = await res.json();

    // ================= TIMER =================
    const adminTimer = document.getElementById("timer");
    if (adminTimer)
        adminTimer.innerText = "Time Left: " + data.timeLeft + "s";

    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer)
        teamTimer.innerText = "Time Left: " + data.timeLeft + "s";


    // ================= HIGHEST BIDDER =================
    const highest = document.getElementById("highestTeam");
    if (highest)
        highest.innerText =
            "Highest Bidder: " + (data.highestTeam || "None");


    // ================= REGISTERED TEAMS TABLE =================
    const teamListTable = document.getElementById("teamListTable");
    if (teamListTable) {

        const tbody = teamListTable.querySelector("tbody");
        tbody.innerHTML = "";

        let no = 1;
        for (let t in data.teams) {
            tbody.innerHTML += `<tr>
                <td>${no}</td>
                <td>${t}</td>
            </tr>`;
            no++;
        }
    }


    // ================= ROUND RESULTS =================
    const adminHistoryTable = document.getElementById("adminHistoryTable");
    if (adminHistoryTable) {

        const tbody = adminHistoryTable.querySelector("tbody");
        tbody.innerHTML = "";

        data.history.forEach((h, i) => {
            tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${h.team}</td>
                <td>₹${h.bid}</td>
            </tr>`;
        });
    }


    // ================= ROUND DETAILS =================
    const roundDetailsContainer =
        document.getElementById("roundDetailsContainer");

    if (roundDetailsContainer) {

        roundDetailsContainer.innerHTML = "";

        data.roundDetails.forEach(r => {

            let html = `<div class="round-card">
                <h3>Round ${r.round}</h3>
                <table>
                <thead>
                <tr>
                    <th>Team No</th>
                    <th>Team Name</th>
                    <th>Bid</th>
                </tr>
                </thead>
                <tbody>`;

            r.bids.forEach(b => {
                html += `<tr>
                    <td>${b.teamNo}</td>
                    <td>${b.team}</td>
                    <td>₹${b.bid}</td>
                </tr>`;
            });

            html += `</tbody></table></div>`;
            roundDetailsContainer.innerHTML += html;
        });
    }


    // ================= TEAM INFO =================
    if (savedTeam && data.teams[savedTeam]) {

        const info = document.getElementById("teamInfo");

        if (info) {
            info.innerHTML = `
            <div class="team-box">
                <p>Capital: ₹${data.teams[savedTeam].capital}</p>
                <p>Your Current Bid: ₹${data.teams[savedTeam].bid}</p>
            </div>`;
        }
    }


    // ================= ASSETS DASHBOARD =================
    if (data.dashboardActive) {

        const auctionSection =
            document.getElementById("auctionSection");
        const assetsSection =
            document.getElementById("assetsSection");

        if (auctionSection) auctionSection.style.display = "none";
        if (assetsSection) assetsSection.style.display = "block";

        const assetsTable = document.getElementById("assetsTable");

        if (assetsTable) {

            const tbody = assetsTable.querySelector("tbody");
            tbody.innerHTML = "";

            let arr = [];
            let no = 1;

            for (let t in data.teams) {
                let wins =
                    data.history.filter(h => h.team === t).length;

                arr.push({
                    teamNo: no,
                    name: t,
                    assets: wins
                });
                no++;
            }

            arr.sort((a, b) => b.assets - a.assets);

            arr.forEach((t, i) => {

                let trophy =
                    (i === 0 && t.assets > 0) ? " 🏆" : "";

                tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${t.teamNo}</td>
                    <td>${t.name}${trophy}</td>
                    <td>${t.assets}</td>
                </tr>`;
            });
        }
    }

    updateLayout();
}


// ================= AUTO REFRESH =================
setInterval(loadData, 1000);
loadData();
updateLayout();
