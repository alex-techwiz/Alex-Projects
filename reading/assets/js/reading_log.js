/* ==========================================
   ALEX'S COMPOSITE READING JOURNAL LOGIC
   ========================================== */

// 1. Initial Load
window.onload = function() {
    renderEntries();
};

// 2. Toggle Logic for Checkboxes
function toggleFields() {
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
    
    const bookFields = document.getElementById('bookFields');
    const audioFields = document.getElementById('audioFields');
    const discContainer = document.getElementById('discContainer');

    if (checkedBoxes.length === 0) {
        if(bookFields) bookFields.style.display = "none";
        if(audioFields) audioFields.style.display = "none";
        return; 
    }

    const needsBook = checkedBoxes.includes("Large Print") || checkedBoxes.includes("KOReader");
    if(bookFields) bookFields.style.display = needsBook ? "block" : "none";

    const audioFormats = ["Audiobook CD", "Playaway HD Light", "Playaway HD", "Audiobookshelf"];
    const needsAudio = checkedBoxes.some(format => audioFormats.includes(format));
    if(audioFields) audioFields.style.display = needsAudio ? "block" : "none";

    if(discContainer) discContainer.style.display = checkedBoxes.includes("Audiobook CD") ? "block" : "none";
}

// 3. Add Entry Logic
function addEntry() {
    const title = document.getElementById('title').value;
    const thoughts = document.getElementById('thoughts').value;
    const rating = document.getElementById('rating').value;
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);

    if (!title || checkedBoxes.length === 0) {
        alert("Please enter a title and select at least one format.");
        return;
    }

    let progressParts = [];
    if (document.getElementById('bookFields').style.display === "block") {
        const pg = document.getElementById('pageNumber').value;
        if (pg) progressParts.push("Page " + pg);
    }
    
    if (document.getElementById('audioFields').style.display === "block") {
        const disc = document.getElementById('discNum').value;
        const time = document.getElementById('trackNum').value;
        
        if (disc && document.getElementById('discContainer').style.display === "block") {
            progressParts.push(`Disc ${disc}, Track ${time}`);
        } else if (time) {
            progressParts.push(`Time: ${time}`);
        }
    }

    const entry = {
        id: Date.now(),
        title: title,
        format: checkedBoxes.join(", "), 
        progress: progressParts.join(" | ") || "Logged",
        thoughts: thoughts,
        rating: rating,
        date: new Date().toLocaleDateString()
    };

    const entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
    entries.push(entry);
    localStorage.setItem('myReadingJournal', JSON.stringify(entries));

    renderEntries();
    playAudio(440);
    
    document.getElementById('readingForm').reset();
    toggleFields(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Unified Password-Protected Delete
function deleteEntry(id) {
    const pass = prompt("Enter Access Key (Alex.S59834) to delete:");
    if (pass === "Alex.S59834") {
        let entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('myReadingJournal', JSON.stringify(entries));
        renderEntries();
        playAudio(220);
    } else if (pass !== null) {
        alert("Incorrect key.");
    }
}

// 5. Security & History Toggle
document.getElementById('accessKey').addEventListener('input', function() {
    const secret = "Alex.S59834";
    const submitBtn = document.getElementById('submitBtn');
    const historySection = document.getElementById('historySection');

    if (this.value === secret) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.innerText = "Add to Journal (Unlocked)";
        historySection.style.display = "block";
        playAudio(660); 
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.innerText = "Add to Journal (Locked)";
        historySection.style.display = "none";
    }
});

// 6. Audio Feedback
function playAudio(frequency) {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
    } catch(e) { console.log("Audio Audio Error"); }
}

// 7. Render Function
function renderEntries() {
    const entryList = document.getElementById('entryList');
    if (!entryList) return;
    const entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
    entryList.innerHTML = '';

    entries.slice().reverse().forEach(entry => {
        entryList.innerHTML += `
            <div class="journal-entry" style="border-left: 10px solid #2e7d32; padding: 15px; margin-bottom: 15px; border: 2px solid #333; border-radius: 8px;">
                <span style="font-size: 0.85em; color: #666;">${entry.date} | ${entry.format}</span><br>
                <strong>${entry.title}</strong> [${entry.rating}]<br>
                <p style="color: #2e7d32; font-weight: bold;">📍 ${entry.progress}</p>
                <p>${entry.thoughts}</p>
                <button onclick="deleteEntry(${entry.id})" style="background:#cc0000; color:white; width:auto; padding:5px 10px; font-size: 14px;">🗑️ Delete</button>
            </div>
        `;
    });
}

// 8. SYNC TOOLS
window.exportJournal = function() {
    const entries = localStorage.getItem('myReadingJournal');
    if (!entries) return alert("No data!");
    const blob = new Blob([entries], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading_journal_${Date.now()}.json`;
    a.click();
};

window.importJournal = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const imported = JSON.parse(e.target.result);
        const current = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
        const combined = [...current, ...imported];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        localStorage.setItem('myReadingJournal', JSON.stringify(unique));
        renderEntries();
        alert("Imported and Merged!");
    };
    reader.readAsText(file);
};