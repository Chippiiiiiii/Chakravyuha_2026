let savedTeam = localStorage.getItem("teamName") || null;

window.register = async function () {
    const name = document.getElementById("teamName").value.trim();
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

function updateLayout() {

    const registerCard = document.getElementById("registerCard");
    const bidCard = document.getElementById("bidCard");
    const teamLabel = document.getElementById("teamLabel");

    if (savedTeam) {
        if (registerCard) registerCard.style.display = "none";
        if (bidCard) bidCard.style.display = "block";
        if (teamLabel) teamLabel.innerText = "Team name: " + savedTeam;
    }
}

async function loadData() {

    const res = await fetch("/data");
    const data = await res.json();

    const timer = document.getElementById("timer");
    if (timer) timer.innerText = "Time Left: " + data.timeLeft + "s";

    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer) teamTimer.innerText = "Time Left: " + data.timeLeft + "s";

    const highest = document.getElementById("highestTeam");
    if (highest)
        highest.innerText =
            "Highest Bidder: " + (data.highestTeam || "None");

    // Registered Teams
    const teamListTable = document.getElementById("teamListTable");
    if (teamListTable) {
        const tbody = teamListTable.querySelector("tbody");
        tbody.innerHTML = "";
        let no = 1;
        for (let t in data.teams) {
            tbody.innerHTML += `<tr><td>${no}</td><td>${t}</td></tr>`;
            no++;
        }
    }

    // Round Results
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

    // Round Details
    const container =
        document.getElementById("roundDetailsContainer");

    if (container) {

        container.innerHTML = "";

        if (data.timerRunning) {

            let liveHTML = `
            <div class="round-card">
                <h3>Round ${data.roundNumber} (Live)</h3>
                <table>
                <thead>
                <tr>
                    <th>Team No</th>
                    <th>Team Name</th>
                    <th>Bid</th>
                </tr>
                </thead>
                <tbody>`;

            let no = 1;

            for (let t in data.teams) {
                let bid = data.currentRoundBids[t] || 0;
                liveHTML += `
                <tr>
                    <td>${no}</td>
                    <td>${t}</td>
                    <td>₹${bid}</td>
                </tr>`;
                no++;
            }

            liveHTML += "</tbody></table></div>";
            container.innerHTML += liveHTML;
        }

        data.roundDetails.forEach(r => {

            let html = `
            <div class="round-card">
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
                html += `
                <tr>
                    <td>${b.teamNo}</td>
                    <td>${b.team}</td>
                    <td>₹${b.bid}</td>
                </tr>`;
            });

            html += "</tbody></table></div>";

            container.innerHTML += html;
        });
    }

    // Team Info
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

    // Team Winner Table
    const winnerTable = document.getElementById("winnerTable");
    if (winnerTable) {
        const tbody = winnerTable.querySelector("tbody");
        tbody.innerHTML = "";
        data.history.forEach((item, index) => {
            tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.team}</td>
            </tr>`;
        });
    }

    updateLayout();
}

setInterval(loadData, 1000);
loadData();
updateLayout();
