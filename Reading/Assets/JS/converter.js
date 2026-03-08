function convert() {
            const rawText = document.getElementById('input').value;
            const debug = document.getElementById('debug');
            const dlAnchor = document.getElementById('downloadLink');
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== "");
            let books = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes("Item Barcode:")) {
                    const barcode = lines[i].replace("Item Barcode:", "").trim();
                    let rawDateLine = lines[i + 1] || "";
                    const renewalMatch = rawDateLine.match(/^(\d+)\s+([\d\/]+)/);
                    const renewals = renewalMatch ? renewalMatch[1] : "0";
                    const dueDate = renewalMatch ? renewalMatch[2] : "Unknown";

                    let title = "Unknown Title";
                    for (let j = i; j >= 0; j--) {
                        if (lines[j].includes("Cover image for")) {
                            title = lines[j+1] || lines[j];
                            title = title.replace(/Cover image for\s+/i, "").split("\t")[0];
                            break;
                        }
                    }
                    books.push({ id: barcode, title: title, dueDate: dueDate, renewals: renewals });
                }
            }

            if (books.length > 0) {
                const today = new Date();
                const dateStr = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                                today.getDate().toString().padStart(2, '0') + '-' + 
                                today.getFullYear().toString().slice(-2);
                const filename = `library_checkouts_${dateStr}.json`;

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
                dlAnchor.setAttribute("href", dataStr);
                dlAnchor.setAttribute("download", filename);
                dlAnchor.style.display = "block";
                dlAnchor.innerText = `Click to Download: ${filename}`;
                dlAnchor.click();
                debug.innerHTML = `Successfully found ${books.length} items.`;
            } else {
                debug.innerHTML = "No items found. Check your paste format.";
            }
        }