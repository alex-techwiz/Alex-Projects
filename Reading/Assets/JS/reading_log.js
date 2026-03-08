// 1. Initial Load
    window.onload = function() {
        renderEntries();
    };

    // 2. Format Logic (Shows/Hides the correct boxes)
    function toggleFields() {
        const selected = document.querySelector('input[name="format"]:checked');
        if (!selected) return;

        const format = selected.value;
        const bookFields = document.getElementById('bookFields');
        const audioFields = document.getElementById('audioFields');
        const discContainer = document.getElementById('discContainer');
        const audioLabel = document.getElementById('audioLabel');

        // Hide everything first
        bookFields.style.display = "none";
        audioFields.style.display = "none";
        discContainer.style.display = "block"; 

        if (format === "Large Print") {
            bookFields.style.display = "block";
        } else if (format === "Audiobook CD") {
            audioFields.style.display = "block";
            audioLabel.innerText = "CD Progress (Disc & Track):";
        } else if (format === "Playaway") {
            audioFields.style.display = "block";
            discContainer.style.display = "none"; 
            audioLabel.innerText = "Playaway Time (e.g. 01:25:00):";
        } else if (format === "Both") {
            bookFields.style.display = "block";
            audioFields.style.display = "block";
            audioLabel.innerText = "Audio Progress:";
        }
    }

    // 3. Save Entry Logic
    function addEntry() {
        const title = document.getElementById('title').value;
        const format = document.querySelector('input[name="format"]:checked')?.value || "Physical";
        const thoughts = document.getElementById('thoughts').value;
        const rating = document.getElementById('rating').value;
        
        if (!title) {
            alert("Please enter a book title.");
            return;
        }

        // Determine progress string based on format
        let progressStr = "";
        if (format === "Large Print") {
            progressStr = "Page " + document.getElementById('pageNumber').value;
        } else if (format === "Audiobook CD") {
            progressStr = "Disc " + document.getElementById('discNum').value + ", Track " + document.getElementById('trackNum').value;
        } else if (format === "Playaway") {
            progressStr = "Time: " + document.getElementById('trackNum').value;
        } else if (format === "Both") {
            progressStr = "Page " + document.getElementById('pageNumber').value + " / Audio: " + document.getElementById('trackNum').value;
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
        document.getElementById('bookFields').style.display = "none";
        document.getElementById('audioFields').style.display = "none";
        document.getElementById('historySection').style.display = "none";
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 4. Display History
    function renderEntries() {
        const entryList = document.getElementById('entryList');
        const entries = JSON.parse(localStorage.getItem('myReadingJournal')) || [];
        entryList.innerHTML = '';

        entries.forEach(entry => {
            entryList.innerHTML += `
                <div class="journal-entry" style="border-left: 10px solid #2e7d32; padding: 15px; margin-bottom: 10px; background: #f9f9f9; border-radius: 8px;">
                    <span style="font-size: 0.8em; color: #666;">${entry.date} | <strong>${entry.format}</strong></span><br>
                    <strong>${entry.title}</strong> [${entry.rating}]<br>
                    <p style="color: #2e7d32; font-weight: bold;">${entry.progress}</p>
                    <p>${entry.thoughts}</p>
                    <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
                </div>
            `;
        });
    }

    // 5. Security & Audio
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