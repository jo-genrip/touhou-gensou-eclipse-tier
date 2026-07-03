const targetWikiUrl = "https://w.atwiki.jp/genlip/pages/14.html";//画像を取得するサイト
const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetWikiUrl);

const excludeKeywords = ['shin.png', 'gi.png', 'tai.png', 'chikara.png', 'thikara.png', 'chi.png','T0_空っぽ1.png','検索.png','kougeki.png','fusegi.png','kasegi.png','1_IMG_7694.jpg','3_IMG_7696','0_IMG_7701','T4_さとり1.png','依姫.jpg','T4_典1.png','豊姫.jpg','T4_プリズムリバー1.png'];
//特定の画像を除外
const statusMsg = document.getElementById('status-msg');//ラベルの作成
const pool = document.getElementById('character-pool');//ラベルの作成
const tierContainer = document.getElementById('tier-container');//ラベルの作成
const addRowBtn = document.getElementById('add-row-btn');
const poolWrapper = document.getElementById('pool-wrapper');
const toggleBtn = document.getElementById('toggle-btn');

fetch(proxyUrl)
    .then(res => {
        if (!res.ok) throw new Error("通信エラー");
        return res.text(); // バイナリデータをtextで返してもらう
    })
    .then(htmlText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const rawImages = Array.from(doc.querySelectorAll('#wikibody img'));

        const filteredImages = rawImages.filter(img => {
            const link = img.closest('a') ? img.closest('a').href : '';
            let src = (img.getAttribute('src') || "").toLowerCase();
            
            try {
                src = decodeURIComponent(src);
            } catch (e) {}

            if (link.includes('310.html')) return false;

            const isExcluded = excludeKeywords.some(key => {
                const lowerKey = key.toLowerCase();
                return src.includes(lowerKey);
            });

            if (isExcluded) return false;

            const width = img.getAttribute('width');
            if (width && parseInt(width) < 30) return false;

            return true;
        });

        if (filteredImages.length === 0) {
            statusMsg.innerText = "画像が見つかりませんでした。Wikiの構造を確認してください。";
            return;
        }

        filteredImages.forEach((imgElement, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.id = 'char-' + index;

            const img = document.createElement('img');
            let src = imgElement.getAttribute('src');
            
            if (src.startsWith('//')) src = 'https:' + src;
            else if (src.startsWith('/')) src = 'https://w.atwiki.jp' + src;

            img.src = src;
            img.crossOrigin="anonymous";
            img.referrerPolicy = "no-referrer";
            
            item.appendChild(img);
            pool.appendChild(item);
        });

        statusMsg.innerText = "読み込み完了！ (" + filteredImages.length + "枚)";
        initSortable();
        setupRowControls(); // 初期行にイベントを適用
    })
    .catch(err => {
        statusMsg.innerText = "エラー: " + err.message + " (再読み込みしてみてください)";
    });

function initSortable() {
    new Sortable(pool, { group: 'tier', animation: 150, fallbackOnBody: true });
    document.querySelectorAll('.drop-area').forEach(el => {
        new Sortable(el, { group: 'tier', animation: 150 });
    });
   
    new Sortable(tierContainer, {
        animation: 150,
        handle: '.move-row-handle'
    });
}
   
addRowBtn.addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.className = 'row';
    newRow.innerHTML = `
        <div class="label" style="background: #555; color: #000;" contenteditable="true">New</div>
        <div class="drop-area"></div>
        <div class="row-controls">
            <input type="color" class="color-picker" value="#555555">
            <button class="move-row-handle">☰</button> <button class="del-row-btn">×</button>
        </div>
    `;
    tierContainer.appendChild(newRow);
    new Sortable(newRow.querySelector('.drop-area'), { group: 'tier', animation: 150 });
    setupRowControls(newRow);
});

function setupRowControls(targetRow = document) {
    targetRow.querySelectorAll('.color-picker').forEach(picker => {
        picker.oninput = (e) => {
            const label = e.target.closest('.row').querySelector('.label');
            label.style.background = e.target.value;
        };
    });
    targetRow.querySelectorAll('.del-row-btn').forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest('.row');
            const items = row.querySelectorAll('.item');
            items.forEach(item => pool.appendChild(item));
            row.remove();
        };
    });
}

toggleBtn.addEventListener('click', () => {
    poolWrapper.classList.toggle('closed');
    const isClosed = poolWrapper.classList.contains('closed');
    toggleBtn.innerText = isClosed ? "想起カードを表示 ▲" : "想起カードを非表示 ▼";
});

const saveImgBtn = document.getElementById('save-img-btn');

saveImgBtn.addEventListener('click', () => {
    const target = document.getElementById('tier-container');
    const addBtn = document.getElementById('add-row-btn');
    const rowControls = document.querySelectorAll('.row-controls');
    
    addBtn.style.display = 'none';
    saveImgBtn.style.display = 'none';
    rowControls.forEach(control => control.style.display = 'none');

    html2canvas(target, {
        useCORS: true,
        backgroundColor: '#1a1a1a',
        windowWidth: 860, // 
        onclone: (clonedDoc) => {
            const clonedTarget = clonedDoc.getElementById('tier-container');
            clonedTarget.style.width = '860px';
            
            const clonedDropAreas = clonedDoc.querySelectorAll('.drop-area');
            clonedDropAreas.forEach(area => {
                area.style.flexWrap = 'wrap';
                area.style.overflowX = 'visible';
                area.style.whiteSpace = 'normal';
            });
            
            const clonedLabels = clonedDoc.querySelectorAll('.label');
            clonedLabels.forEach(label => {
                label.style.width = '80px';
                label.style.fontSize = '20px';
            });
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'my-tier-list.png';
        link.href = canvas.toDataURL("image/png");
        link.click();

        addBtn.style.display = 'inline-block';
        saveImgBtn.style.display = 'inline-block';
        rowControls.forEach(control => control.style.display = 'flex');
    });
});
