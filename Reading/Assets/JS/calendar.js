let currentBooks = [];
let isGridView = false;
let currentViewMonth = new Date().getMonth();
let currentViewYear = new Date().getFullYear();

window.onload = () => {
    fetch('library_checkouts.json').then(res => res.json()).then(data => {
        currentBooks = data;
        render();
    }).catch(() => document.getElementById('calendarDisplay').innerHTML = "Import a JSON file to begin.");
};

document.getElementById('fileInput').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        currentBooks = JSON.parse(event.target.result);
        render();
    };
    reader.readAsText(e.target.files[0]);
});

function toggleView() { isGridView = !isGridView; render(); }

function changeMonth(delta) {
    currentViewMonth += delta;
    if (currentViewMonth > 11) { currentViewMonth = 0; currentViewYear++; }
    if (currentViewMonth < 0) { currentViewMonth = 11; currentViewYear--; }
    render();
}

function render() {
    const display = document.getElementById('calendarDisplay');
    display.innerHTML = "";
    isGridView ? renderGrid(display) : renderList(display);
}

function renderList(container) {
    if (currentBooks.length === 0) return;
    currentBooks.forEach(book => {
        if (book.title && book.title !== "Unknown Title") {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `<div class="date-section"><span class="date">${book.dueDate}</span><span class="renewal-count">Renewals: ${book.renewals || 0}</span></div><div class="title">${book.title}</div>`;
            container.appendChild(card);
        }
    });
}

function renderGrid(container) {
    const firstDay = new Date(currentViewYear, currentViewMonth, 1).getDay();
    const daysInMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
    const uniqueMonths = [...new Set(currentBooks.map(b => {
        const [m, d, y] = b.dueDate.split('/');
        return `${parseInt(m)-1}/20${y}`;
    }))];

    const nav = document.createElement('div');
    nav.className = 'calendar-nav-header';
    const hasPrev = uniqueMonths.includes(`${currentViewMonth-1}/${currentViewYear}`);
    const hasNext = uniqueMonths.includes(`${currentViewMonth+1}/${currentViewYear}`);
    nav.innerHTML = `<button onclick="changeMonth(-1)" ${!hasPrev?'style="visibility:hidden"':''}>&lt;</button><h3>${new Intl.DateTimeFormat('en-US',{month:'long'}).format(new Date(currentViewYear, currentViewMonth))}</h3><button onclick="changeMonth(1)" ${!hasNext?'style="visibility:hidden"':''}>&gt;</button>`;
    container.appendChild(nav);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
        const h = document.createElement('div'); h.className='weekday-header'; h.innerText=d; grid.appendChild(h);
    });

    for(let i=0; i<firstDay; i++) grid.appendChild(Object.assign(document.createElement('div'), {className:'calendar-day'}));

    for(let d=1; d<=daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.innerHTML = `<span class="day-number">${d}</span>`;
        currentBooks.forEach(b => {
            const [m, day, y] = b.dueDate.split('/');
            if(parseInt(day)===d && (parseInt(m)-1)===currentViewMonth) {
                const item = document.createElement('div'); item.className='grid-book-item'; item.innerText=b.title; cell.appendChild(item);
            }
        });
        grid.appendChild(cell);
    }
    container.appendChild(grid);
}