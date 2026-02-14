// ===== TEAM STORAGE =====
let savedTeam = localStorage.getItem("teamName");

// ================= REGISTER =================
window.register = async function () {

    const input = document.getElementById("teamName");
    if (!input) return;

    const teamName = input.value.trim();
    if (!teamName) return alert("Enter team name");

    await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName })
    });

    localStorage.setItem("teamName", teamName);
    savedTeam = teamName;

    updateTeamLayout();
};

// ================= PLACE BID =================
window.bid = async function () {

    const amountInput = document.getElementById("bidAmount");
    if (!amountInput || !savedTeam) return;

    const amount = parseInt(amountInput.value);

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

    if (!base || !cap || !time) return;

    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            basePrice: parseInt(base.value) || 0,
            capital: parseInt(cap.value) || 0,
            roundTime: parseInt(time.value) || 0
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

// ================= UPDATE TEAM LAYOUT =================
function updateTeamLayout() {

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

    // ADMIN PAGE
    if (document.getElementById("adminTable")) {

        const highest = document.getElementById("highestTeam");
        if (highest)
            highest.innerText =
                "Highest Bidder: " + (data.highestTeam || "None");

        const timer = document.getElementById("timer");
        if (timer)
            timer.innerText =
                "Time Left: " + data.timeLeft + "s";

        const tbody = document.querySelector("#adminTable tbody");
        if (tbody) {
            tbody.innerHTML = "";

            let sno = 1;

            for (let team in data.teams) {
                const isHighest =
                    team === data.highestTeam ? "Yes" : "No";

                tbody.innerHTML += `
                    <tr>
                        <td>${sno}</td>
                        <td>${team}</td>
                        <td>₹${data.teams[team].bid}</td>
                        <td>${isHighest}</td>
                    </tr>
                `;

                sno++;
            }
        }
    }

    // TEAM PAGE
    if (savedTeam && data.teams[savedTeam]) {

        const info = document.getElementById("teamInfo");

        // Capital should show only if admin set it (>0)
        const capitalValue = data.teams[savedTeam].capital;

        info.innerHTML = `
            <div class="team-box">
                ${capitalValue > 0 ? `<p>Capital: ₹${capitalValue}</p>` : ""}
                <p>Your Current Bid: ₹${data.teams[savedTeam].bid}</p>
            </div>
        `;
    }

    updateTeamLayout();
}

setInterval(loadData, 1000);
