// ================= SESSION =================
let savedTeam = localStorage.getItem("teamName") || null;


// ================= REGISTER =================
window.register = async function () {

    const input = document.getElementById("teamName");
    if (!input) return;

    const teamName = input.value.trim();
    if (!teamName) {
        alert("Enter team name");
        return;
    }

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName })
    });

    const data = await res.json();

    if (data.success) {
        localStorage.setItem("teamName", teamName);
        savedTeam = teamName;
        updateLayout();
    }
};


// ================= BID =================
window.bid = async function () {

    if (!savedTeam) {
        alert("Register first");
        return;
    }

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

    const base = document.getElementById("basePrice");
    const cap = document.getElementById("capital");
    const time = document.getElementById("roundTime");

    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            basePrice: parseInt(base?.value) || 0,
            capital: parseInt(cap?.value) || 0,
            roundTime: parseInt(time?.value) || 0
        })
    });

    alert("Settings Saved");
};

window.startRound = async function () {
    await fetch("/start", { method: "POST" });
};

window.endRound = async function () {
    await fetch("/end", { method: "POST" });
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
        if (teamLabel) teamLabel.innerText = "";
    }
}


// ================= LOAD DATA =================
async function loadData() {

    const res = await fetch("/data");
    const data = await res.json();

    // Clear invalid session
    if (savedTeam && !data.teams[savedTeam]) {
        localStorage.removeItem("teamName");
        savedTeam = null;
        updateLayout();
    }

    // ===== ADMIN TIMER =====
    const adminTimer = document.getElementById("timer");
    if (adminTimer) {
        adminTimer.innerText = "Time Left: " + data.timeLeft + "s";
    }

    // ===== TEAM TIMER =====
    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer) {
        teamTimer.innerText = "Time Left: " + data.timeLeft + "s";
    }

    // ===== HIGHEST BIDDER =====
    const highest = document.getElementById("highestTeam");
    if (highest) {
        highest.innerText =
            "Highest Bidder: " + (data.highestTeam || "None");
    }

    // ===== REGISTERED TEAMS TABLE =====
    const teamListTable = document.getElementById("teamListTable");
    if (teamListTable) {

        const tbody = teamListTable.querySelector("tbody");
        tbody.innerHTML = "";

        let teamNo = 1;

        for (let team in data.teams) {
            tbody.innerHTML += `
                <tr>
                    <td>${teamNo}</td>
                    <td>${team}</td>
                </tr>
            `;
            teamNo++;
        }
    }

    // ===== ROUND RESULTS =====
    const adminHistoryTable = document.getElementById("adminHistoryTable");
    if (adminHistoryTable) {

        const tbody = adminHistoryTable.querySelector("tbody");
        tbody.innerHTML = "";

        data.history.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.team}</td>
                    <td>₹${item.bid}</td>
                </tr>
            `;
        });
    }

    // ===== TEAM INFO =====
    if (savedTeam && data.teams[savedTeam]) {

        const info = document.getElementById("teamInfo");
        if (info) {
            info.innerHTML = `
                <div class="team-box">
                    <p>Capital: ₹${data.teams[savedTeam].capital}</p>
                    <p>Your Current Bid: ₹${data.teams[savedTeam].bid}</p>
                </div>
            `;
        }
    }

    // ===== TEAM WINNER TABLE =====
    const winnerTable = document.getElementById("winnerTable");
    if (winnerTable) {

        const tbody = winnerTable.querySelector("tbody");
        tbody.innerHTML = "";

        data.history.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.team}</td>
                </tr>
            `;
        });
    }

    updateLayout();
}


// ================= AUTO REFRESH =================
setInterval(loadData, 1000);
loadData();
updateLayout();
