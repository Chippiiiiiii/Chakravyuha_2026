async function register() {
    const teamName = document.getElementById("teamName").value.trim();
    if (!teamName) return alert("Enter team name");

    await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName })
    });

    alert("Registered");
}

async function bid() {
    const teamName = document.getElementById("teamName").value.trim();
    const amount = parseInt(document.getElementById("bidAmount").value);

    const res = await fetch("/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, amount })
    });

    const data = await res.json();
    if (data.error) alert(data.error);
}

async function saveSettings() {
    const basePrice = parseInt(document.getElementById("basePrice").value);
    const capital = parseInt(document.getElementById("capital").value);
    const roundTime = parseInt(document.getElementById("roundTime").value);

    await fetch("/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePrice, capital, roundTime })
    });

    alert("Settings Saved");
}

async function startRound() {
    await fetch("/start", { method: "POST" });
}

async function endRound() {
    await fetch("/end", { method: "POST" });
}

async function loadData() {
    const res = await fetch("/data");
    const data = await res.json();

    // ADMIN PAGE
    if (document.getElementById("adminTable")) {

        document.getElementById("highestTeam").innerText =
            "Highest Bidder: " + (data.highestTeam || "None");

        document.getElementById("timer").innerText =
            "Time Left: " + data.timeLeft + "s";

        const tbody = document.querySelector("#adminTable tbody");
        tbody.innerHTML = "";

        let teamNo = 1;

        for (let team in data.teams) {
            const isHighest = team === data.highestTeam ? "Yes" : "No";

            tbody.innerHTML += `
                <tr>
                    <td>${teamNo}</td>
                    <td>${team}</td>
                    <td>₹${data.teams[team].bid}</td>
                    <td>${isHighest}</td>
                </tr>
            `;

            teamNo++;
        }

        // HISTORY
        const historyBody = document.querySelector("#historyTable tbody");
        historyBody.innerHTML = "";

        data.history.forEach((item, index) => {
            historyBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.team}</td>
                    <td>₹${item.bid}</td>
                </tr>
            `;
        });
    }

    // TEAM PAGE
    if (document.getElementById("teamsRow")) {

        const teamName = document.getElementById("teamName").value.trim();

        if (data.teams[teamName]) {
            document.getElementById("teamsRow").innerHTML = `
                <div class="team-box">
                    <h2>${teamName}</h2>
                    <p>Capital: ₹${data.teams[teamName].capital}</p>
                    <p>Your Current Bid: ₹${data.teams[teamName].bid}</p>
                </div>
            `;
        }

        if (data.roundEnded) {
            document.getElementById("resultBox").innerHTML = `
                <h2>Winner: ${data.lastWinner || "No Winner"}</h2>
            `;
        } else {
            document.getElementById("resultBox").innerHTML = "";
        }
    }
}

setInterval(loadData, 1000);
