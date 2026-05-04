let financialData = null;
let friendlyNames = {};
let categories = {};
let allTickers = [];
let currentAsset = 'BTC-USD';
let currentMode = 'modeA';
let artBuffer;
let isFirstRender = true;
let isFullscreen = false;
let history = [];

const MODE_LABELS = {
    modeA: 'Op Art Geometry', modeB: 'Fluid Particles', modeC: 'Fractal Mandala',
    modeD: 'Op Art Interference', modeE: 'Action Painting', modeF: 'Color Field',
    modeG: 'Digital Impressionism'
};

function setup() {
    financialData = rawFinancialData.prices;
    categories = rawFinancialData.metadata;
    friendlyNames = rawFinancialData.names || {};
    allTickers = Object.keys(financialData);

    createCanvas(windowWidth, windowHeight);
    artBuffer = createGraphics(windowWidth, windowHeight);

    setupSearchDropdown();
    setupButtons();
    setupKeyboardShortcuts();
    loadFromURL();
    updateSubtitle();
    loop();
}

// ---- URL Params (Share Link) ----
function loadFromURL() {
    let params = new URLSearchParams(window.location.search);
    let a = params.get('asset'), m = params.get('mode');
    if (a && financialData[a]) { currentAsset = a; document.getElementById('asset-search').value = a; }
    if (m && MODE_LABELS[m]) { currentMode = m; document.getElementById('mode-select').value = m; }
    isFirstRender = true;
}

function getShareURL() {
    let url = new URL(window.location.href.split('?')[0]);
    url.searchParams.set('asset', currentAsset);
    url.searchParams.set('mode', currentMode);
    return url.toString();
}

// ---- Subtitle ----
function updateSubtitle() {
    let name = friendlyNames[currentAsset] ? `${friendlyNames[currentAsset]} (${currentAsset})` : currentAsset;
    document.getElementById('subtitle').innerText = `Visualizing ${name} with ${MODE_LABELS[currentMode]}`;
}

// ---- Search Dropdown ----
function setupSearchDropdown() {
    const input = document.getElementById('asset-search');
    const dropdown = document.getElementById('search-dropdown');

    function build(filter = "") {
        dropdown.innerHTML = "";
        let hasResults = false;
        for (const [cat, tickers] of Object.entries(categories)) {
            const filtered = tickers.filter(t => {
                let fname = (friendlyNames[t] || '').toUpperCase();
                return t.toUpperCase().includes(filter.toUpperCase()) || fname.includes(filter.toUpperCase());
            });
            if (filtered.length > 0) {
                hasResults = true;
                let catDiv = document.createElement('div');
                catDiv.className = 'dropdown-category'; catDiv.innerText = cat;
                dropdown.appendChild(catDiv);
                filtered.forEach(ticker => {
                    let item = document.createElement('div');
                    item.className = 'dropdown-item';
                    if (ticker === currentAsset) item.classList.add('selected');
                    let label = friendlyNames[ticker] ? `${friendlyNames[ticker]} (${ticker})` : ticker;
                    item.innerHTML = `<span>${label}</span>`;
                    item.onclick = () => {
                        input.value = ticker; currentAsset = ticker;
                        dropdown.style.display = 'none';
                        triggerRender(); // Auto-render on selection
                    };
                    dropdown.appendChild(item);
                });
            }
        }
        if (!hasResults) dropdown.innerHTML = "<div class='dropdown-item' style='color:#666'>No matches found</div>";
    }

    input.onfocus = () => { build(input.value); dropdown.style.display = 'block'; };
    input.oninput = () => build(input.value);
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) dropdown.style.display = 'none'; });
}

// ---- Buttons ----
function setupButtons() {
    document.getElementById('render-btn').addEventListener('click', () => {
        let v = document.getElementById('asset-search').value.trim().toUpperCase();
        if (financialData[v]) { currentAsset = v; } else { alert("Asset not found."); return; }
        currentMode = document.getElementById('mode-select').value;
        triggerRender();
    });

    document.getElementById('mode-select').addEventListener('change', () => {
        currentMode = document.getElementById('mode-select').value;
        triggerRender(); // Auto-render on mode change too
    });

    document.getElementById('random-btn').addEventListener('click', () => {
        currentAsset = allTickers[floor(random(allTickers.length))];
        let modes = Object.keys(MODE_LABELS);
        currentMode = modes[floor(random(modes.length))];
        document.getElementById('asset-search').value = currentAsset;
        document.getElementById('mode-select').value = currentMode;
        triggerRender();
    });

    document.getElementById('save-btn').addEventListener('click', () => {
        saveCanvas(artBuffer, `art_${currentAsset}_${currentMode}`, 'png');
    });

    document.getElementById('share-btn').addEventListener('click', () => {
        let url = getShareURL();
        navigator.clipboard.writeText(url).then(() => {
            let flash = document.createElement('div');
            flash.className = 'copied-flash'; flash.innerText = '✓ Link Copied!';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 1600);
        }).catch(() => { prompt("Copy this link:", url); });
    });

    // Panel toggle buttons
    document.getElementById('toggle-ui').addEventListener('click', (e) => {
        e.stopPropagation();
        let panel = document.getElementById('ui-overlay');
        panel.classList.toggle('collapsed');
        e.target.innerText = panel.classList.contains('collapsed') ? '›' : '‹';
    });

    document.getElementById('toggle-history').addEventListener('click', (e) => {
        e.stopPropagation();
        let panel = document.getElementById('history-panel');
        panel.classList.toggle('collapsed');
        e.target.innerText = panel.classList.contains('collapsed') ? '‹' : '›';
    });
}

// ---- Keyboard Shortcuts ----
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Ignore if typing in search input
        if (document.activeElement.id === 'asset-search') return;

        if (e.key === 'f' || e.key === 'F') {
            isFullscreen = !isFullscreen;
            document.getElementById('ui-overlay').classList.toggle('hidden', isFullscreen);
            document.getElementById('history-panel').classList.toggle('hidden', isFullscreen);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            let idx = allTickers.indexOf(currentAsset);
            if (e.key === 'ArrowRight') idx = (idx + 1) % allTickers.length;
            else idx = (idx - 1 + allTickers.length) % allTickers.length;
            currentAsset = allTickers[idx];
            document.getElementById('asset-search').value = currentAsset;
            triggerRender();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            let modes = Object.keys(MODE_LABELS);
            let idx = modes.indexOf(currentMode);
            if (e.key === 'ArrowDown') idx = (idx + 1) % modes.length;
            else idx = (idx - 1 + modes.length) % modes.length;
            currentMode = modes[idx];
            document.getElementById('mode-select').value = currentMode;
            triggerRender();
        }
    });
}

// ---- Trigger Render ----
function triggerRender() {
    isFirstRender = true;
    updateSubtitle();
}

// ---- History ----
function addToHistory() {
    // Capture a small thumbnail from the art buffer
    let thumb = artBuffer.get();
    thumb.resize(120, 96);
    let dataURL = thumb.canvas.toDataURL('image/jpeg', 0.6);
    history.unshift({ asset: currentAsset, mode: currentMode, img: dataURL });
    if (history.length > 10) history.pop(); // Keep max 10
    renderHistory();
}

function renderHistory() {
    let list = document.getElementById('history-list');
    list.innerHTML = '';
    history.forEach((h, i) => {
        let wrapper = document.createElement('div');
        let img = document.createElement('img');
        img.className = 'history-thumb'; img.src = h.img;
        img.onclick = () => {
            currentAsset = h.asset; currentMode = h.mode;
            document.getElementById('asset-search').value = h.asset;
            document.getElementById('mode-select').value = h.mode;
            triggerRender();
        };
        let label = document.createElement('div');
        label.className = 'history-label';
        label.innerText = `${friendlyNames[h.asset] || h.asset}`;
        wrapper.appendChild(img); wrapper.appendChild(label);
        list.appendChild(wrapper);
    });
}

// ---- Main Draw Loop ----
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    artBuffer = createGraphics(windowWidth, windowHeight);
    isFirstRender = true;
}

function draw() {
    let dataset = financialData[currentAsset];
    if (!dataset) return;

    if (isFirstRender) {
        renderArtToBuffer(dataset);
        isFirstRender = false;
        addToHistory();
    }

    background('#0f1115');
    let ox = map(mouseX, 0, width, -15, 15), oy = map(mouseY, 0, height, -15, 15);
    image(artBuffer, ox, oy);
    handleInteractivity(dataset);
}

function renderArtToBuffer(data) {
    artBuffer.background('#0f1115');
    if (currentMode === 'modeA') drawModeA(artBuffer, data);
    else if (currentMode === 'modeB') drawModeB(artBuffer, data);
    else if (currentMode === 'modeC') drawModeC(artBuffer, data);
    else if (currentMode === 'modeD') { drawModeD(artBuffer, data); }
    else if (currentMode === 'modeE') drawModeE(artBuffer, data);
    else if (currentMode === 'modeF') drawModeF(artBuffer, data);
    else if (currentMode === 'modeG') drawModeG(artBuffer, data);
}

// ---- Interactivity ----
function handleInteractivity(data) {
    // Mode D breathing animation
    if (currentMode === 'modeD') {
        // Slight overlay shift for breathing effect
        push();
        let breathAmt = sin(frameCount * 0.015) * 3;
        tint(255, 20);
        image(artBuffer, breathAmt, breathAmt);
        pop();
    }

    let tooltip = document.getElementById('data-tooltip');
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let idx;
        if (currentMode === 'modeA') {
            let angle = atan2(mouseY - height/2, mouseX - width/2);
            if (angle < 0) angle += TWO_PI;
            idx = floor(map(angle, 0, TWO_PI, 0, data.length - 1));
        } else if (currentMode === 'modeC') {
            let d = dist(mouseX, mouseY, width/2, height/2);
            idx = floor(map(d, 0, min(width,height)*0.45, 0, data.length - 1));
        } else {
            idx = floor(map(mouseX, 0, width, 0, data.length - 1));
        }
        idx = constrain(idx, 0, data.length - 1);
        let pt = data[idx];

        // Probe visual
        stroke(255, 50);
        if (currentMode === 'modeA') {
            let a = map(idx, 0, data.length-1, 0, TWO_PI);
            line(width/2, height/2, width/2+cos(a)*height, height/2+sin(a)*height);
        } else if (currentMode === 'modeC') {
            noFill(); let r = map(idx, 0, data.length-1, 0, min(width,height)*0.45);
            circle(width/2, height/2, r*2);
        } else { line(mouseX, 0, mouseX, height); }

        push(); noFill(); stroke(255, 80); circle(mouseX, mouseY, 100); pop();

        // Tooltip position with boundary detection (#7)
        let tLeft = mouseX + 20, tTop = mouseY + 20;
        if (tLeft + 200 > width) tLeft = mouseX - 220;
        if (tTop + 100 > height) tTop = mouseY - 120;
        tooltip.style.display = 'block';
        tooltip.style.left = tLeft + 'px'; tooltip.style.top = tTop + 'px';

        // Artistic tooltip for abstract modes (#8)
        if (currentMode === 'modeE' || currentMode === 'modeF') {
            document.getElementById('tooltip-date').innerText = pt.date;
            let mood = pt.rsi > 55 ? '🔥 Bullish' : pt.rsi < 45 ? '❄️ Bearish' : '⚖️ Neutral';
            document.getElementById('tooltip-price').innerText = mood;
            document.getElementById('tooltip-rsi').innerText = '';
            document.getElementById('tooltip-macd').innerText = '';
        } else {
            document.getElementById('tooltip-date').innerText = pt.date;
            document.getElementById('tooltip-price').innerText = `$${pt.close.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('tooltip-rsi').innerText = `RSI: ${pt.rsi.toFixed(1)}`;
            document.getElementById('tooltip-macd').innerText = `MACD: ${pt.macd_histogram.toFixed(2)}`;
        }
    } else { tooltip.style.display = 'none'; }
}

// ========== ART MODES ==========

function drawModeA(t, data) {
    t.push(); t.translate(t.width/2, t.height/2);
    let rMax = min(t.width, t.height)*0.45, step = TWO_PI / data.length;
    for (let i = 0; i < data.length; i++) {
        let pt = data[i], rsi = constrain(pt.rsi||50, 0, 100);
        let c = rsi > 50 ? lerpColor(color(200,200,200,150), color(255,50,50,200), map(rsi,50,100,0,1)) :
                           lerpColor(color(200,200,200,150), color(50,150,255,200), map(rsi,50,0,0,1));
        let d = constrain(map(pt.macd_histogram||0, -1000,1000, -rMax*0.3, rMax*0.3), -rMax*0.5, rMax*0.5);
        let a = i*step, r = rMax*0.5 + d;
        t.stroke(c); t.strokeWeight(1.5);
        t.line(cos(a)*r*0.2, sin(a)*r*0.2, cos(a+pt.macd*0.0001)*r, sin(a+pt.macd*0.0001)*r);
    }
    t.pop();
}

function drawModeB(t, data) {
    let minE = min(data.map(d=>d.ema60)), maxE = max(data.map(d=>d.ema60)), maxV = max(data.map(d=>d.volume));
    t.push(); t.blendMode(ADD);
    for (let i = 1; i < data.length; i++) {
        let pt = data[i], prev = data[i-1], x = map(i,0,data.length-1,50,t.width-50);
        let a = map(pt.ema20-prev.ema20, -maxE*0.05, maxE*0.05, PI/4, -PI/4);
        let f = map(pt.volume,0,maxV,0.1,1);
        let numP = max(3, floor(map(f, 0.1, 1, 3, 15))); // min 3 particles always
        t.stroke(color(100+f*100,150,255*f,80));
        for (let p = 0; p < numP; p++) {
            let px = x, py = map(pt.ema60,minE,maxE,t.height-100,100) + random(-50,50)*f;
            t.beginShape(); t.noFill(); t.strokeWeight(random(0.5,2.5));
            for (let s = 0; s < floor(random(15,60)); s++) {
                t.vertex(px,py); px+=cos(a)*5+random(-1,2); py+=sin(a)*5+random(-2,2);
                if (px>t.width||py<0||py>t.height) break;
            }
            t.endShape();
        }
    }
    t.pop();
}

function drawModeC(t, data) {
    t.push(); t.translate(t.width/2, t.height/2);
    let s = floor(map(constrain(data.reduce((s,p)=>s+Math.abs(p.macd_histogram||0),0)/data.length,0,500),0,500,6,24));
    let step = TWO_PI / s; t.blendMode(SCREEN);
    for (let sym = 0; sym < s; sym++) {
        t.push(); t.rotate(sym*step); t.noFill(); t.beginShape();
        for (let i = 0; i < data.length; i+=3) {
            let pt = data[i], r = map(i,0,data.length,10,min(t.width,t.height)*0.45)*map(pt.rsi,0,100,0.5,1.5);
            let tw = map(pt.ema20-pt.ema60,-100,100,-PI/4,PI/4);
            let c = lerpColor(color(0,200,255,120), color(255,0,100,120), pt.rsi/100); // alpha 50->120
            t.stroke(c); t.strokeWeight(1); t.vertex(cos(tw)*r, sin(tw)*r);
        }
        t.endShape(); t.pop();
    }
    t.pop();
}

function drawModeD(t, data) {
    let minC = min(data.map(d=>d.close)), maxC = max(data.map(d=>d.close)), maxV = max(data.map(d=>d.volume));
    t.push(); let num = min(data.length,floor(t.width/4)), step = t.width / num;
    for (let i = 0; i < num; i++) {
        let pt = data[floor(map(i,0,num,0,data.length-1))], x = i*step;
        let f = map(pt.volume/maxV,0,1,0.01,0.2), amp = map(map(pt.close,minC,maxC,0,1),0,1,10,100);
        t.stroke(pt.close>pt.open ? color(200,255,200,150) : color(100,150,255,150));
        t.strokeWeight(step*0.8); t.noFill(); t.beginShape();
        for (let y = 0; y < t.height; y += 10) {
            let off = sin(y*f+x*0.05)*amp;
            if (abs(pt.ema20-pt.ema60)<(maxC-minC)*0.01) off+=random(-5,5);
            t.vertex(x+off, y);
        }
        t.endShape();
    }
    t.pop();
}

function drawModeE(t, data) {
    t.push(); let prices = data.map(d=>d.close), m = prices.reduce((a,b)=>a+b)/prices.length;
    let v = Math.sqrt(prices.reduce((a,b)=>a+Math.pow(b-m,2),0)/prices.length)/m;
    t.background('#f0ead6');
    let cs = [color(20,20,20,200),color(200,50,50,180),color(50,80,150,150),color(220,180,50,160),color(255,255,255,200)];
    for (let i = 0; i < data.length; i++) {
        let pt = data[i], c = cs[i%cs.length];
        if (pt.rsi>70) c=cs[1]; else if (pt.rsi<30) c=cs[2];
        t.stroke(c); t.fill(c);
        let x=random(t.width), y=random(t.height), sz=map(v,0,0.1,2,20)*random(0.5,2);
        if (random()>0.3){t.beginShape();for(let a=0;a<TWO_PI;a+=0.5)t.vertex(x+cos(a)*sz*random(0.8,1.2),y+sin(a)*sz*random(0.8,1.2));t.endShape(CLOSE);}
        if (random()>0.95){t.noFill();t.strokeWeight(random(1,3));t.beginShape();let cx=x,cy=y;for(let st=0;st<20;st++){t.vertex(cx,cy);cx+=random(-20,20);cy+=random(10,40);}t.endShape();}
    }
    t.pop();
}

function drawModeF(t, data) {
    t.push(); let tr = (data[data.length-1].ema60-data[0].ema60)/data[0].ema60;
    t.background(tr>0?color(40,10,10):color(10,10,40));
    let r = data.reduce((a,b)=>a+b.rsi,0)/data.length, md = data.reduce((a,b)=>a+Math.abs(b.macd_histogram),0)/data.length;
    for(let f of [{y:0.2,h:0.3},{y:0.5,h:0.25},{y:0.8,h:0.35}]){
        let c = r>55?color(200+random(-20,20),50+random(50),50,30):color(50,100+random(50),200+random(-20,20),30);
        t.noStroke();for(let l=0;l<40;l++){t.fill(c);t.rect(t.width*0.15+random(-md/10,md/10),t.height*f.y-(t.height*f.h/2)+random(-md/10,md/10),t.width*0.7,t.height*f.h,10);}
    }
    t.pop();
}

function drawModeG(t, data) {
    t.push(); t.background('#1a1a1a');
    let minC = min(data.map(d=>d.close)), maxC = max(data.map(d=>d.close));
    for(let i=0;i<8000;i++){
        let rx=random(t.width),ry=random(t.height),pt=data[floor(map(rx,0,t.width,0,data.length-1))];
        let c=lerpColor(color(50,100,255,180),color(255,100,50,180),map(pt.close,minC,maxC,0,1));
        if(random()>0.8)c=color(255,255,200,150);
        t.stroke(c);t.strokeWeight(random(1,4));
        let a=map((pt.ema20-pt.ema60)/pt.ema60,-0.05,0.05,PI/4,-PI/4)+random(-0.2,0.2);
        let l=map(pt.volume,0,max(data.map(d=>d.volume)),5,20);
        t.line(rx,ry,rx+cos(a)*l,ry+sin(a)*l);
    }
    t.pop();
}
