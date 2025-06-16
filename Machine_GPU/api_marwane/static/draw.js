// === static/draw.js ===
let canvas, ctx;
let img = new Image();
let points = [];

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        if (typeof existingPoints !== 'undefined' && existingPoints.length > 0) {
            points = existingPoints;
            redraw();
        }
    };
    img.src = imageData;

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        points.push([Math.round(x), Math.round(y)]);
        redraw();
        autoSauver();
    });

    const form = document.createElement("div");
    form.innerHTML = `
        <div style="margin-top: 1rem">
            <input id="xCoord" type="number" placeholder="x" style="width: 60px;">
            <input id="yCoord" type="number" placeholder="y" style="width: 60px;">
            <button onclick="ajouterPointManuellement()">➕ Ajouter</button>
        </div>
    `;
    document.getElementById("coord-list").prepend(form);
};

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        for (let p of points) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
            ctx.fillStyle = "red";
            ctx.fill();
        }
    }
    updateCoordDisplay();
}

function undoLastPoint() {
    points.pop();
    redraw();
    autoSauver();
}

function resetCanvas() {
    points = [];
    redraw();
    autoSauver();
}

function sauverZone() {
    if (points.length < 3) {
        alert("Il faut au moins 3 points pour former une zone.");
        return;
    }
    document.getElementById("pointsInput").value = JSON.stringify(points);
    document.getElementById("zoneForm").submit();
    setTimeout(() => location.reload(), 500);
}

function updateCoordDisplay() {
    const list = document.getElementById("coord-list");
    const coordsHtml = points.map(p => `[${p[0]}, ${p[1]}]`).join("<br>");
    list.querySelector("strong")?.remove();
    list.innerHTML = `<strong>Coordonnées :</strong><br>${coordsHtml}`;
}

function ajouterPointManuellement() {
    const x = parseInt(document.getElementById("xCoord").value);
    const y = parseInt(document.getElementById("yCoord").value);
    if (!isNaN(x) && !isNaN(y)) {
        points.push([x, y]);
        redraw();
        autoSauver();
    } else {
        alert("Veuillez entrer des coordonnées valides.");
    }
}

function autoSauver() {
    if (points.length >= 3) {
        const form = new FormData();
        form.append("points", JSON.stringify(points));
        form.append("video_name", document.querySelector("input[name='video_name']").value);

        fetch("/sauver-zone", {
            method: "POST",
            body: form
        }).then(r => r.json()).then(data => {
            console.log("Zone sauvegardée automatiquement :", data);
        }).catch(err => {
            console.error("Erreur sauvegarde automatique :", err);
        });
    }
}
