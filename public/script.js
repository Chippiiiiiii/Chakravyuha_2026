// ================= TEAM SESSION =================

// Only restore team from THIS browser storage
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


// ================= PLACE BID =================
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

    // If this browser has savedTeam but server does not → clear it
    if (savedTeam && !data.teams[savedTeam]) {
        localStorage.removeItem("teamName");
        savedTeam = null;
        updateLayout();
    }

    // ===== TEAM TIMER =====
    const teamTimer = document.getElementById("teamTimer");
    if (teamTimer) {
        teamTimer.innerText = "Time Left: " + data.timeLeft + "s";

        if (data.timeLeft <= 10) {
            teamTimer.style.color = "red";
        } else {
            teamTimer.style.color = "#00e676";
        }
    }

    // ===== TEAM PAGE INFO =====
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

    // ===== ROUND WINNER TABLE =====
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

// Initial load
loadData();
updateLayout();
