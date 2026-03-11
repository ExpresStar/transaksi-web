const fs = require('fs');

// 1. Patch style.css
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.pagination-ellipsis')) {
    css += `
/* Pagination Styles Updates */
.pagination-container {
  display: flex;
  gap: 5px;
  align-items: center;
}
.pagination-btn {
  min-width: 32px !important;
  height: 32px !important;
  padding: 0 4px !important;
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  color: #606266 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s !important;
  margin: 0 !important;
}
.pagination-btn:hover {
  color: #409eff !important;
  border-color: #c6e2ff !important;
  background-color: #ecf5ff !important;
}
.pagination-btn.active {
  background-color: #409eff !important;
  color: #fff !important;
  border-color: #409eff !important;
}
.pagination-ellipsis {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  font-size: 13px;
}
`;
    fs.writeFileSync('style.css', css);
}


// 2. Patch index.html
let html = fs.readFileSync('index.html', 'utf8');
const footerRegex = /<div class="table-footer"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- Notification Toast -->/;

const newFooterHtml = `<div class="table-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <div class="footer-left" style="display: flex; gap: 20px; align-items: center;">
                            <span id="footer-date" style="font-size: 13px; color: #606266; font-family: monospace;"></span>
                            <span style="font-size: 13px; color: #606266;">共 <span id="total-tx" style="font-size: 14px; font-weight: bold; color: #409eff; transition: all 0.3s ease;">0</span> 条</span>
                        </div>
                        <div class="footer-right">
                            <!-- Pagination -->
                            <div id="pagination-container" style="display: flex; gap: 5px;"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <!-- Notification Toast -->`;

html = html.replace(footerRegex, newFooterHtml);
fs.writeFileSync('index.html', html);


// 3. Patch script.js
let js = fs.readFileSync('script.js', 'utf8');

// Add global variables if missing
if (!js.includes('let currentPage = 1;')) {
    js = js.replace('let currentMode = \'\';', 'let currentMode = \'\';\n    let currentPage = 1;\n    let itemsPerPage = 10;\n    let allData = [];\n    let totalTransactions = 0;');
}

// Replace fetchTransactions
const fetchRegex = /const fetchTransactions = async \(\) => \{[\s\S]*?const renderTable = \(data\) => \{/;
const newFetch = `const fetchTransactions = async () => {
        try {
            const response = await fetch('http://localhost:3000/transactions');
            const result = await response.json();
            
            if (result.success) {
                allData = result.data;
                totalTransactions = allData.length;
                document.getElementById('total-tx').innerText = totalTransactions;
                
                // Pagination logic
                const totalPages = Math.ceil(totalTransactions / itemsPerPage) || 1;
                if (currentPage > totalPages) currentPage = totalPages;
                
                renderPagination(currentPage, totalPages);
                renderTablePage(currentPage);
            } else {
                alert('Failed to load data: ' + result.message);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const renderPagination = (page, totalPages) => {
        const container = document.getElementById('pagination-container');
        container.innerHTML = '';
        if (totalPages === 0) return;

        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 4) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (page >= totalPages - 3) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
            }
        }

        pages.forEach(p => {
            if (p === '...') {
                const span = document.createElement('span');
                span.className = 'pagination-ellipsis';
                span.innerText = '...';
                container.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.className = \`pagination-btn \${p === page ? 'active' : ''}\`;
                btn.innerText = p;
                btn.onclick = () => {
                    currentPage = p;
                    renderTablePage(currentPage);
                    renderPagination(currentPage, totalPages);
                };
                container.appendChild(btn);
            }
        });
    };

    const renderTablePage = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = allData.slice(start, end);
        renderTable(pageData);
    };

    const renderTable = (data) => {`;
js = js.replace(fetchRegex, newFetch);

// Add Clock Interval
if (!js.includes('const updateClock = () => {')) {
    const clockInsert = `
    // 6. Realtime Mandarin Clock
    const updateClock = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const clockEl = document.getElementById('footer-date');
        if (clockEl) {
            clockEl.innerText = \`\${yyyy}年\${MM}月\${dd}日 \${hh}:\${mm}:\${ss}\`;
        }
    };
    setInterval(updateClock, 1000);
    updateClock();

    // Initial Fetch
`;
    js = js.replace('// Initial Fetch', clockInsert);
}

fs.writeFileSync('script.js', js);
console.log('Patch completed successfully!');
