/* ==========================================
   ALEX'S UPDATED READING JOURNAL LOGIC
   ========================================== */

// 1. Initial Load
window.onload = function() {
    renderEntries();
};

// 2. Updated Format Logic (Handles Playaway HD vs HD Light)
function toggleFields() {
    const selected = document.querySelector('input[name="format"]:checked');
    if (!selected) return;

    const format = selected.value;
    const bookFields = document.getElementById('bookFields');
    const audioFields = document.getElementById('audioFields');
    const discContainer = document.getElementById('discContainer');
    const audioLabel = document.getElementById('audioLabel');

    // Default states
    bookFields.style.display = "none";
    audioFields.style.display = "none";
    discContainer.style.display = "block"; 

    if (format === "Large Print" || format === "KOReader") {
        bookFields.style.display = "block";
    } else if (format === "Audiobook CD") {
        audioFields.style.display = "block";
        audioLabel.innerText = "CD Progress (Disc & Track):";
    } else if (format.includes("Playaway") || format === "Audiobookshelf") {
        // Hide Disc input for digital/handheld audio
        audioFields.style.display = "block";
        discContainer.style.display = "none"; 
        audioLabel.innerText = format + " Time (e.g. 01:25:00):";
    } else if (format === "Both") {
        bookFields.style.display = "block";
        audioFields.style.display = "block";
        audioLabel.innerText = "Audio Progress:";
    }
}

// 3. Save Entry Logic (Refined for New Formats)
function addEntry() {
    const title = document.getElementById('title').value;
    const format = document.querySelector('input[name="format"]:checked')?.value || "Large Print";
    const thoughts = document.getElementById('thoughts').value;
    const rating = document.getElementById('rating').value;
    
    if (!title) {
        alert("Please enter a book title.");
        return;
    }

    // Determine progress string based on format
    let progressStr = "";
    const pageNum = document.getElementById('pageNumber').value;
    const discNum = document.getElementById('discNum').value;
    const timeOrTrack = document.getElementById('trackNum').value;

    if (format === "Large Print" || format === "KOReader") {
        progressStr = "Page " + pageNum;
    } else if (format === "Audiobook CD") {
        progressStr = "Disc " + discNum + ", Track " + timeOrTrack;
    } else if (format.includes("Playaway") || format === "Audiobookshelf") {
        progressStr = "Timestamp: " + timeOrTrack;
    } else if (format === "Both") {
        progressStr = "Page " + pageNum + " / Audio: " + timeOrTrack;
    }

    const entry = {
        id: Date.now(),
        title: title,
        format: format,
        progress: progressStr,
        thoughts: thoughts,
        rating: rating,
        date: new Date().toLocaleDateString()
    };

    const entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
    entries.push(entry);
    localStorage.setItem('myReadingJournal', JSON.stringify(entries));

    renderEntries();
    playAudio(440); 
    
    // Reset Form
    document.getElementById('readingForm').reset();
    bookFields.style.display = "none";
    audioFields.style.display = "none";
    // Keep history section visible if unlocked
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Display History (High Contrast for Astigmatism)
function renderEntries() {
    const entryList = document.getElementById('entryList');
    const entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
    entryList.innerHTML = '';

    entries.reverse().forEach(entry => {
        entryList.innerHTML += `
            <div class="journal-entry" style="border-left: 10px solid #2e7d32; padding: 15px; margin-bottom: 15px; background: #fff; border: 2px solid #333; border-radius: 8px; box-shadow: 4px 4px 0px #333;">
                <span style="font-size: 0.85em; color: #666; font-weight: bold;">${entry.date} | ${entry.format}</span><br>
                <strong style="font-size: 1.2em;">${entry.title}</strong> <span style="color:#f39c12;">[${entry.rating}]</span><br>
                <p style="color: #2e7d32; font-weight: bold; margin: 5px 0;">📍 ${entry.progress}</p>
                <p style="margin-top: 5px; line-height: 1.4;">${entry.thoughts}</p>
                <button class="delete-btn" onclick="deleteEntry(${entry.id})" style="background:#cc0000; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
            </div>
        `;
    });
}

// 5. Security & Audio Logic (Kept as requested)
document.getElementById('accessKey').addEventListener('input', function() {
    const secret = "Alex.S59834";
    const submitBtn = document.getElementById('submitBtn');
    const historySection = document.getElementById('historySection');

    if (this.value === secret) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
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

function deleteEntry(id) {
    if(!confirm("Delete this entry?")) return;
    let entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('myReadingJournal', JSON.stringify(entries));
    renderEntries();
    playAudio(220); 
}

function playAudio(frequency) {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
    } catch(e) { console.log("Audio Error"); }
}

/* ==========================================
   6. SYNC LOGIC (Smart Merge Export/Import)
   ========================================== */

/**
 * Exports the journal to a JSON file with a timestamp.
 * Saves to your device, ready for upload to your HP Server.
 */
window.exportJournal = function() {
    const entries = localStorage.getItem('myReadingJournal');
    if (!entries || entries === "[]") {
        alert("No entries to export!");
        return;
    }

    // Create a filename with the current date and time (e.g., March-8-5pm)
    const now = new Date();
    const dateStr = now.toLocaleDateString().replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/\s|:/g, '');
    const filename = `reading_journal_backup_${dateStr}_${timeStr}.json`;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(entries);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    if (typeof playAudio === "function") playAudio(880); 
};

/**
 * Imports a JSON file and merges it with existing entries.
 * Prevents duplicates using the unique entry ID.
 */
window.importJournal = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedEntries = JSON.parse(e.target.result);
            if (Array.isArray(importedEntries)) {
                // 1. Get current entries from THIS device
                const currentEntries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];

                // 2. Combine current and imported data
                const combined = [...currentEntries, ...importedEntries];

                // 3. Smart Merge: Remove duplicates by checking the unique ID
                // This ensures an entry isn't added twice if you import the same file.
                const uniqueEntries = combined.filter((entry, index, self) =>
                    index === self.findIndex((t) => t.id === entry.id)
                );

                // 4. Sort by ID (chronological order)
                uniqueEntries.sort((a, b) => a.id - b.id);

                // 5. Save the merged list back to LocalStorage
                localStorage.setItem('myReadingJournal', JSON.stringify(uniqueEntries));
                
                // 6. UI Refresh
                if (typeof renderEntries === "function") renderEntries();
                if (typeof playAudio === "function") playAudio(660);
                
                const addedCount = uniqueEntries.length - currentEntries.length;
                alert(`Sync Successful! Added ${addedCount} new entries (duplicates ignored).`);
                
            } else {
                alert("Invalid file format: Not a Reading Journal array.");
            }
        } catch (err) {
            console.error(err);
            alert("Error reading file. Please ensure it's a valid .json file.");
        }
    };
    reader.readAsText(file);
    
    // Clear the input so you can select the same file again if needed
    event.target.value = '';
};