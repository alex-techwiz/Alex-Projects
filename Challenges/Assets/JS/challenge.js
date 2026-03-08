/* ==========================================
   1. CORE DATA & INITIALIZATION
   ========================================== */
window.allChallenges = JSON.parse(localStorage.getItem('alexChallenges')) || [];
window.activeIdx = null;

document.addEventListener('DOMContentLoaded', () => {
    window.checkDateReset();
    const lockInput = document.getElementById('accessKey');
    if (lockInput) {
        lockInput.addEventListener('input', function() {
            if (this.value === "Alex.S59834") {
                document.getElementById('lockScreen').style.display = "none";
                document.getElementById('mainContent').classList.remove('hidden');
                window.renderDashboard();
            }
        });
    }
});

/* ==========================================
   2. MIDNIGHT ENGINE
   ========================================== */
window.checkDateReset = function() {
    const today = new Date().toLocaleDateString();
    let changed = false;
    window.allChallenges.forEach(c => {
        if (c.lastDate && c.lastDate !== today) {
            if (c.tempUpdates && c.tempUpdates.length > 0) {
                if(!c.history) c.history = [];
                c.history.push({ day: c.currentDay, date: c.lastDate, logs: [...c.tempUpdates] });
            }
            c.currentDay++;
            c.tempUpdates = [];
            c.lastDate = today;
            changed = true;
        } else if (!c.lastDate) {
            c.lastDate = today;
            changed = true;
        }
    });
    if (changed) window.saveAll();
};

/* ==========================================
   3. DASHBOARD LOGIC
   ========================================== */
window.showNewChallengeForm = function() {
    document.getElementById('newChallengeForm').classList.remove('hidden');
};

window.createNewChallenge = function() {
    const nameInput = document.getElementById('newChallengeName');
    const name = nameInput.value.trim();
    if (!name) return alert("Enter a name!");
    window.allChallenges.push({ name, currentDay: 1, history: [], tempUpdates: [], lastDate: new Date().toLocaleDateString() });
    window.saveAll();
    window.renderDashboard();
    nameInput.value = "";
    document.getElementById('newChallengeForm').classList.add('hidden');
};

window.renderDashboard = function() {
    const grid = document.getElementById('challengeGrid');
    const logArea = document.getElementById('loggingArea');
    if (!grid || !logArea) return;
    logArea.classList.add('hidden');
    grid.classList.remove('hidden');
    if (window.allChallenges.length === 0) {
        grid.innerHTML = "<p style='text-align:center;'>No goals yet!</p>";
        return;
    }
    grid.innerHTML = window.allChallenges.map((c, index) => `
        <div class="hub-tile" onclick="window.openChallenge(${index})">
            <strong>${c.name}</strong><br><span>Day ${c.currentDay}</span>
        </div>
    `).join('');
};

/* ==========================================
   4. LOGGING & DANGER ZONE (THE FIX)
   ========================================== */
window.openChallenge = function(index) {
    window.activeIdx = index;
    const c = window.allChallenges[index];
    const grid = document.getElementById('challengeGrid');
    const logArea = document.getElementById('loggingArea');
    
    grid.classList.add('hidden');
    logArea.classList.remove('hidden');

    logArea.innerHTML = `
        <button onclick="window.renderDashboard()" style="margin-bottom:15px; padding:10px; cursor:pointer;">← Back</button>
        <div class="day-card" style="border:3px solid #333; padding:25px; background:white; border-radius:15px; box-shadow: 4px 4px 0px #333;">
            <h2 style="margin:0;">${c.name}</h2>
            <h3 style="color:#2e7d32;">Day ${c.currentDay}</h3>
            
            <textarea id="updateNote" rows="3" placeholder="Log progress..."></textarea>
            
            <button onclick="window.logUpdate()" style="width:100%; background:#0277bd; color:white; padding:15px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">➕ Post Update</button>
            
            <div id="updateFeed" style="margin-top:20px; border-top:1px solid #eee; padding-top:10px;"></div>
            
            <button onclick="window.viewHistory(${index})" style="width:100%; background:#455a64; color:white; padding:15px; border:none; border-radius:10px; margin-top:20px; cursor:pointer;">📂 View History</button>

            <div style="margin-top:40px; border: 2px solid red; padding: 15px; border-radius: 12px; text-align: center; background: #fff5f5;">
                <p style="color:red; font-weight:bold; margin-bottom:10px;">🗑️ DELETE CHALLENGE</p>
                <input type="password" id="deletePass" placeholder="Enter Access Key to Delete" 
                       style="width:100%; padding:10px; border:2px solid red; border-radius:8px; margin-bottom:10px; text-align:center;">
                <button onclick="window.confirmDeletion(${index})" 
                        style="background:red; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%;">
                    CONFIRM PERMANENT DELETE
                </button>
            </div>
        </div>
    `;

window.confirmDeletion = function(index) {
    const input = document.getElementById('deletePass');
    const pass = input.value.trim();

    if (pass === "Alex.S59834") {
        // We use one final confirm here. If this fails, we'll remove it too.
        if (confirm("Permanently delete this challenge?")) {
            window.allChallenges.splice(index, 1);
            window.saveAll();
            window.renderDashboard();
        }
    } else {
        alert("Incorrect Key.");
        input.value = "";
    }
};
    window.renderFeed();
};

window.logUpdate = function() {
    const noteEl = document.getElementById('updateNote');
    const note = noteEl.value.trim();
    if (!note) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const c = window.allChallenges[window.activeIdx];
    if (!c.tempUpdates) c.tempUpdates = [];
    c.tempUpdates.push({ time, note });
    window.saveAll();
    noteEl.value = "";
    window.renderFeed();
};

window.renderFeed = function() {
    const feed = document.getElementById('updateFeed');
    if (!feed) return;
    const updates = window.allChallenges[window.activeIdx].tempUpdates || [];
    feed.innerHTML = updates.length ? updates.map(u => `<div style="padding:5px 0;"><strong>[${u.time}]</strong> ${u.note}</div>`).reverse().join('') : "No updates today.";
};

/* ==========================================
   5. HISTORY, DELETE & SYNC
   ========================================== */
window.viewHistory = function(index) {
    const c = window.allChallenges[index];
    const logArea = document.getElementById('loggingArea');
    let historyHTML = (c.history && c.history.length) ? c.history.map(h => `
        <div style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">
            <strong>Day ${h.day} (${h.date})</strong><br>
            ${h.logs.map(l => `• ${l.note}`).join('<br>')}
        </div>`).reverse().join('') : "No history yet.";
    logArea.innerHTML = `
        <button onclick="window.openChallenge(${index})" style="margin-bottom:15px; padding:10px;">← Back</button>
        <div class="day-card" style="border:3px solid #333; padding:25px; background:white; border-radius:15px;">
            <h2>History: ${c.name}</h2>${historyHTML}
        </div>
    `;
};

window.deleteChallenge = function(index) {
    // 1. First, ask for the Access Key
    const pass = prompt("DANGER: Enter your Access Key (Alex.S59834) to delete this challenge:");
    
    // 2. If they hit cancel, just stop
    if (pass === null) return;

    // 3. Check the key
    if (pass === "Alex.S59834") {
        const challengeName = window.allChallenges[index].name;
        
        // 4. Final confirmation
        if (confirm(`Are you sure you want to permanently delete "${challengeName}"?`)) {
            window.allChallenges.splice(index, 1);
            window.saveAll();
            window.renderDashboard();
            alert("Challenge deleted successfully.");
        }
    } else {
        alert("Incorrect Access Key. Deletion denied.");
    }
};

window.exportData = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.allChallenges));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr); 
    dl.setAttribute("download", "alex_backup.json");
    dl.click();
};

window.importData = function(event) {
    const reader = new FileReader();
    reader.onload = e => { 
        window.allChallenges = JSON.parse(e.target.result); 
        window.saveAll(); 
        window.renderDashboard(); 
        alert("Loaded!"); 
    };
    reader.readAsText(event.target.files[0]);
};

window.saveAll = function() { 
    localStorage.setItem('alexChallenges', JSON.stringify(window.allChallenges)); 
};