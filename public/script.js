let savedTeam = localStorage.getItem("teamName") || null;
const socket = io();

// --- TEAM FUNCTIONS ---

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
    } else if (data.error) {
        alert(data.error);
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

// --- ADMIN FUNCTIONS ---

window.saveSettings = async function () {
    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            capital: parseInt(document.getElementById("capital").value) || 0,
            roundTime: parseInt(document.getElementById("roundTime").value) || 0,
            basePrice: parseInt(document.getElementById("basePrice").value) || 0
        })
    });
};

window.startRound = async function () {
    await fetch("/start", { method: "POST" });
};

window.endRound = async function () {
    await fetch("/end", { method: "POST" });
};

// Toggle leaderboard in admin
window.toggleLeaderboard = function () {
    const container = document.getElementById("leaderboardContainer");
    if (container.style.display === "none") {
        container.style.display = "block";
    } else {
        container.style.display = "none";
    }
};

// --- LAYOUT CONTROL ---

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

// --- SOCKET.IO LISTENER ---

socket.on("update", (data) => {
    // Timers
    const timer = document.getElementById("timer");
    if (timer) timer.innerText = "Time Left: " + data.timeLeft + "s";

    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer) teamTimer.innerText = "Time Left: " + data.timeLeft + "s";

    // Base Price Display
    const basePriceDisplay = document.getElementById("basePriceDisplay");
    if (basePriceDisplay) basePriceDisplay.innerText = "Base Price: ₹" + data.basePrice;

    // Highest Bidder (Admin)
    const highest = document.getElementById("highestTeam");
    if (highest)
        highest.innerText = "Highest Bidder: " + (data.highestTeam || "None");

    // Registered Teams (Admin)
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

    // Round Results (Admin)
    const adminHistoryTable = document.getElementById("adminHistoryTable");
    if (adminHistoryTable) {
        const tbody = adminHistoryTable.querySelector("tbody");
        tbody.innerHTML = "";
        data.history.forEach((h, i) => {
            tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${h.team || "No Winner"}</td>
                <td>₹${h.bid}</td>
            </tr>`;
        });
    }

    // Round Bids (Admin)
    const roundBidsContainer = document.getElementById("roundBidsContainer");
    if (roundBidsContainer) {
        roundBidsContainer.innerHTML = "";
        data.history.forEach((h) => {
            let tableHTML = `
            <h3>Round ${h.round}</h3>
            <table>
                <thead>
                    <tr><th>Team No</th><th>Team Name</th><th>Bid</th></tr>
                </thead>
                <tbody>`;
            h.allBids.forEach(b => {
                tableHTML += `<tr><td>${b.teamNo}</td><td>${b.team}</td><td>₹${b.bid}</td></tr>`;
            });
            tableHTML += "</tbody></table>";
            roundBidsContainer.innerHTML += tableHTML;
        });
    }

    // Leaderboard (Admin + Teams)
    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = `
        <table>
            <thead>
                <tr><th>Team No</th><th>Team Name</th><th>Assets Owned</th></tr>
            </thead>
            <tbody>
                ${data.leaderboard.map(l => `
                    <tr>
                        <td>${l.teamNo}</td>
                        <td>${l.team}</td>
                        <td>${l.wins}</td>
                    </tr>`).join("")}
            </tbody>
        </table>`;
    }

    // Team Info (Teams Page)
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

    // Team Winner Table (Teams Page)
    const winnerTable = document.getElementById("winnerTable");
    if (winnerTable) {
        const tbody = winnerTable.querySelector("tbody");
        tbody.innerHTML = "";
        data.history.forEach((item, index) => {
            tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.team || "No Winner"}</td>
            </tr>`;
        });
    }

    updateLayout();
});

// Initialize layout
updateLayout();
