// -------------------- SERVER SIDE --------------------

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.json());

let settings = {
    capital: 0,
    roundTime: 0,
    basePrice: 0
};

let teams = {};
let history = [];
let leaderboard = [];
let showLeaderboard = false;

function collectGameState() {
    return {
        timeLeft: settings.roundTime,
        basePrice: settings.basePrice,
        highestTeam: null,
        teams,
        history,
        leaderboard,
        showLeaderboard
    };
}

// Admin saves settings
app.post("/settings", (req, res) => {
    const { capital, roundTime, basePrice } = req.body;
    settings.capital = capital;
    settings.roundTime = roundTime;
    settings.basePrice = basePrice;

    io.emit("update", collectGameState());
    res.json({ success: true });
});

// Team registers
app.post("/register", (req, res) => {
    const { teamName } = req.body;

    if (!teamName) {
        return res.json({ error: "Team name required" });
    }

    if (!teams[teamName]) {
        teams[teamName] = {
            capital: settings.capital, // use Admin’s saved capital
            bid: 0
        };
    }

    io.emit("update", collectGameState());

    res.json({ success: true, capital: teams[teamName].capital });
});

// Team places bid
app.post("/bid", (req, res) => {
    const { teamName, amount } = req.body;

    if (!teams[teamName]) {
        return res.json({ error: "Team not registered" });
    }

    if (amount <= 0) {
        return res.json({ error: "Invalid bid amount" });
    }

    teams[teamName].bid = amount;

    io.emit("update", collectGameState());
    res.json({ success: true });
});

// Example round control
app.post("/start", (req, res) => {
    // start round logic...
    io.emit("update", collectGameState());
    res.json({ success: true });
});

app.post("/end", (req, res) => {
    // end round logic...
    io.emit("update", collectGameState());
    res.json({ success: true });
});

app.post("/toggleLeaderboard", (req, res) => {
    showLeaderboard = !showLeaderboard;
    io.emit("update", collectGameState());
    res.json({ success: true });
});

http.listen(3000, () => console.log("Server running on port 3000"));


// -------------------- CLIENT SIDE (Teams script.js) --------------------

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

        // Immediately show capital after registration
        const info = document.getElementById("teamInfo");
        if (info) {
            info.innerHTML = `
                <div class="team-box">
                    <p>Capital: ₹${data.capital}</p>
                    <p>Your Current Bid: ₹0</p>
                </div>`;
        }
    } else if (data.error) {
        alert(data.error);
    }
};

window.bid = async function () {
    if (!savedTeam) return alert("Register first");

    const amount = parseInt(document.getElementById("bidAmount").value);
    if (!amount || amount <= 0) return alert("Enter valid bid amount");

    const res = await fetch("/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: savedTeam, amount })
    });

    const data = await res.json();
    if (data.error) {
        alert(data.error);
    }
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

window.toggleLeaderboard = async function () {
    await fetch("/toggleLeaderboard", { method: "POST" });
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
    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer) teamTimer.innerText = "Time Left: " + data.timeLeft + "s";

    // Base Price Display
    const basePriceDisplay = document.getElementById("basePriceDisplay");
    if (basePriceDisplay) basePriceDisplay.innerText = "Base Price: ₹" + data.basePrice;

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

    // Leaderboard
    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (leaderboardContainer) {
        if (data.showLeaderboard) {
            leaderboardContainer.style.display = "block";
            leaderboardContainer.innerHTML = `
            <table>
                <thead>
                    <tr><th>Team No</th><th>Team Name</th><th>Rounds Won</th></tr>
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
        } else {
            leaderboardContainer.style.display = "none";
        }
    }

    updateLayout();
});

// Initialize layout
updateLayout();
