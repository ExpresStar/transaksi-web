// --- Sidebar Navigation Logic ---
function toggleSubMenu(menuId, el) {
    const subMenu = document.getElementById(menuId);
    if (!subMenu) return;
    if (subMenu.style.display === 'none') {
        subMenu.style.display = 'block';
        el.querySelector('.arrow').innerText = 'v';
    } else {
        subMenu.style.display = 'none';
        el.querySelector('.arrow').innerText = '<';
    }
}

function switchView(viewId, navId) {
    const homeView = document.getElementById('homeView');
    const paymentView = document.getElementById('paymentView');
    if (homeView) homeView.style.display = 'none';
    if (paymentView) paymentView.style.display = 'none';
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = viewId === 'homeView' ? 'flex' : 'block';
    }
    
    document.querySelectorAll('.sub-menu-item').forEach(el => el.classList.remove('active-sub'));
    if (navId) {
        const navEl = document.getElementById(navId);
        if (navEl) navEl.classList.add('active-sub');
    }
    
    const tagsContainer = document.querySelector('.tags-left');
    if (tagsContainer) {
        tagsContainer.innerHTML = `
            <span class="nav-arrow">«</span>
            <span class="tag-item" onclick="switchView('homeView', 'nav-home')">首页</span>
            ${viewId === 'paymentView' ? '<span class="tag-item active">交易列表 <span class="tag-close" onclick="switchView(&apos;homeView&apos;, &apos;nav-home&apos;)">×</span></span>' : ''}
        `;
    }
}

// Make functions globally available
window.switchView = switchView;
window.toggleSubMenu = toggleSubMenu;
// --------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Check login session
    if (window.location.pathname.includes('dashboard.html') && !localStorage.getItem('runner_logged_in')) {
        window.location.href = '/';
        return;
    }

    let currentUsername = localStorage.getItem('approver_username');
    
    // If no username found, default to bobi908
    if (!currentUsername) {
        currentUsername = 'bobi908';
        localStorage.setItem('approver_username', currentUsername);
    }

    const profileNameEl = document.querySelector('.profile-name');
    if (profileNameEl) profileNameEl.innerText = currentUsername;

    // Default view setting
    switchView('homeView', 'nav-home');
    
    // Hamburger menu toggle
    const hamburgerBtn = document.querySelector('.hamburger');
    const sidebar = document.getElementById('sidebar');
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 1. Inject Modal and Loading Overlay to Document Body
    const modalHTML = `
        <!-- Loading Overlay -->
        <div id="loading-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.7); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: #fff; padding: 15px 30px; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); font-size: 14px; color: #606266;">
                正在加载...
            </div>
        </div>

        <!-- Universal Action Modal -->
        <div id="action-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9998; align-items: center; justify-content: center;">
            <div style="background: #fff; width: 400px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); overflow: hidden;">
                <div style="padding: 15px; border-bottom: 1px solid #ebeef5; display: flex; justify-content: space-between; align-items: center;">
                    <span id="modal-title" style="font-size: 16px; font-weight: bold; color: #303133;">Processing</span>
                    <span style="cursor: pointer; color: #909399;" onclick="closeModal()">✖</span>
                </div>
                <div style="padding: 20px;">
                    <textarea id="admin-note" rows="5" placeholder="" style="width: 100%; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px; font-size: 13px; outline: none; resize: none;"></textarea>
                </div>
                <div style="padding: 10px 20px 20px; text-align: right;">
                    <button type="button" class="btn btn-blue" id="btn-submit-modal" disabled>通过</button>
                </div>
            </div>
        </div>
        
        <style>
            .btn-yellow { background: #e6a23c; color: #fff; } /* using typical element-ui warning color */
            .btn-blue { background: #409eff; color: #fff; }
            .btn-yellow:disabled { background: #f3d19e; cursor: not-allowed; }
            .btn-submit-disabled { opacity: 0.5; cursor: not-allowed; }
            .badge-timeago {
                display: inline-block;
                margin-top: 3px;
                padding: 1px 6px;
                background: #f0f9eb;
                color: #67c23a;
                border: 1px solid #c2e7b0;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            }
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    /* =========================================================
       USERNAME SYSTEM — stored in localStorage, prompted once
       ========================================================= */
    // Username already initialized above

    // Inject toasts
    const successToastEl = document.createElement('div');
    successToastEl.id = 'success-toast';
    successToastEl.style.cssText = `
        display:none; position:fixed; top:50%; left:50%;
        transform:translate(-50%,-50%) scale(0.8);
        background:#fff; border-radius:12px;
        box-shadow:0 8px 40px rgba(0,0,0,0.2);
        z-index:99999; padding:18px 28px; min-width:340px;
        transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); opacity:0;
    `;
    successToastEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:18px;">
            <div style="width:52px;height:52px;border-radius:50%;flex-shrink:0;
                background:#e8f9ee;display:flex;align-items:center;
                justify-content:center;font-size:26px;color:#28a745;">✔</div>
            <div style="text-align:left;">
                <div style="font-size:17px;font-weight:700;color:#28a745;margin-bottom:3px;">操作成功</div>
                <div style="font-size:12px;color:#aaa;">处理完成，数据已更新</div>
            </div>
        </div>
    `;
    document.body.appendChild(successToastEl);

    const failedToastEl = document.createElement('div');
    failedToastEl.id = 'failed-toast';
    failedToastEl.style.cssText = `
        display:none; position:fixed; top:50%; left:50%;
        transform:translate(-50%,-50%) scale(0.8);
        background:#fff; border-radius:12px;
        box-shadow:0 8px 40px rgba(0,0,0,0.2);
        z-index:99999; padding:18px 28px; min-width:340px;
        transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); opacity:0;
    `;
    failedToastEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:18px;">
            <div style="width:52px;height:52px;border-radius:50%;flex-shrink:0;
                background:#fde8e8;display:flex;align-items:center;
                justify-content:center;font-size:26px;color:#e74c3c;">✖</div>
            <div style="text-align:left;">
                <div id="failed-toast-title" style="font-size:17px;font-weight:700;color:#e74c3c;margin-bottom:3px;">此订单已被处理</div>
                <div id="failed-toast-sub" style="font-size:12px;color:#aaa;">请处理其他订单</div>
            </div>
        </div>
    `;
    document.body.appendChild(failedToastEl);

    /* =========================================================
       TIME HELPERS — never recreate timestamps, only format/diff
       ========================================================= */

    /**
     * Formats an ISO date string to YYYY-MM-DD HH:MM:SS.
     * Uses the stored timestamp from the server — never new Date().
     */
    /**
     * Formats an ISO date string to YYYY-MM-DD HH:MM:SS.
     * Uses the Asia/Ho_Chi_Minh timezone for consistency.
     */
    function formatTime(dateString) {
        if (!dateString) return '--';
        const d = new Date(dateString);
        // Konversi ke timezone Asia/Jakarta (WIB, UTC+7)
        const locale = d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        // locale format: DD/MM/YYYY HH.mm.ss  →  parse ke YYYY-MM-DD HH:mm:ss
        const [datePart, timePart] = locale.split(', ');
        const [day, month, year] = datePart.split('/');
        const time = timePart ? timePart.replace(/\./g, ':') : '00:00:00';
        return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}<br>${time}`;
    }

    /**
     * Returns a Chinese "time ago" string based on difference from now.
     * Only reads from the stored timestamp — the timestamp itself is NOT changed.
     */
    function getTimeAgo(timestamp) {
        const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
        if (diff <= 1) return '1分钟内';
        return diff + '分钟';
    }

    /* =========================================================
       BANK LOGO MAPPING
       ========================================================= */
    const bankLogos = {
        MB:   '/logos/mb.svg',
        BIDV: '/logos/bidv.svg',
        VCB:  '/logos/vcb.svg',
        TCB:  '/logos/tcb.svg',
        AGRI: '/logos/agri.svg',
        VPB:  '/logos/vpb.svg'
    };

    function getBankLogo(bankName) {
        return bankLogos[bankName] || '/logos/default.svg';
    }

    // Initial State Variables
    let currentMode = '';
    let currentPage = 1;
    let itemsPerPage = 10;
    let allData = [];
    let totalTransactions = 0; // 'approve' or 'reject'
    let currentTransactionId = null;

    // Elements
    const tbody = document.querySelector('.data-table tbody');
    const refreshBtn = document.querySelector('.table-toolbar .toolbar-btn:nth-child(2)'); // The ↻ button
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Modal Elements
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const adminNote = document.getElementById('admin-note');
    const btnSubmitModal = document.getElementById('btn-submit-modal');

    // 2. Fetch and Render Transactions
    const fetchTransactions = async () => {
        try {
            const response = await fetch('/transactions');
            const result = await response.json();
            
            if (result.success) {
                // Satu-satunya tempat data masuk dan di-sort
                allData = result.data;
                allData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                totalTransactions = allData.length;
                document.getElementById('total-tx').innerText = totalTransactions;

                // Pagination logic
                const totalPages = Math.ceil(totalTransactions / itemsPerPage) || 1;
                if (currentPage > totalPages) currentPage = totalPages;

                renderPagination(currentPage, totalPages);
                renderTable(); // render langsung dari allData global
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
                btn.className = `pagination-btn ${p === page ? 'active' : ''}`;
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
        currentPage = page;
        renderTable();
    };

    const renderTable = () => {
        // Selalu baca dari allData global yang sudah tersorted
        // Tidak ada parameter subarray — tidak ada risiko urutan berbeda
        const start = (currentPage - 1) * itemsPerPage;
        const end   = start + itemsPerPage;
        const pageData = allData.slice(start, end); // slice dari array yang SUDAH sorted
        // Save current scroll position from the actual scrolling container
        const appMain = document.querySelector('.app-main');
        const currentScroll = appMain ? appMain.scrollTop : window.scrollY;
        
        tbody.innerHTML = ''; // Clear static HTML
        
        pageData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Format dates using formatTime — never uses new Date() to regenerate
            const createdHtml = formatTime(row.created_at);
            const timeAgo = getTimeAgo(row.created_at);
            const allowHtml = formatTime(row.allow_transfer_time);

            // Determine status badge
            let statusBadge = '';
            let isPending = row.status === 'pending';
            let isApprovedLocally = row.status === 'approved';
            
            if (isPending) {
                statusBadge = '<span class="badge orange-outline">提现中 (Pending)</span>';
            } else if (isApprovedLocally) {
                // Show who took it in a gray badge
                const taker = row.approvedBy === currentUsername ? '您' : row.approvedBy;
                statusBadge = `<span class="badge" style="background: #f4f4f5; color: #909399; border: 1px solid #d3d4d6;">已同意 - @${taker}</span>`;
            } else if (row.status === 'rejected') {
                statusBadge = '<span class="badge btn-red" style="border:none;">已作废 (Rejected)</span>';
            }

            tr.innerHTML = `
                <td><input type="checkbox" ${!isPending ? 'disabled' : ''}></td>
                <td style="${!isPending ? 'color:#999;' : ''}">${row.order_no}</td>
                <td class="text-red" style="${!isPending ? 'color:#999;' : ''}">${row.recharge_no}</td>
                <td style="${!isPending ? 'color:#999;' : ''}">0961427367</td> <!-- Dummy Data -->
                <td><span class="badge blue" style="${!isPending ? 'opacity:0.5;' : ''}">代付</span></td>
                <td style="${!isPending ? 'color:#999;' : ''}">${Number(row.amount).toLocaleString('vi-VN')} VND</td>
                <td style="${!isPending ? 'color:#999;' : ''}">${row.receiver_name}</td>
                <td style="${!isPending ? 'color:#999;' : ''}">${row.card_number}</td>
                <td style="${!isPending ? 'color:#999;' : ''}">${row.bank_name}</td>
                <td>${statusBadge}</td>
                <td><span class="badge blue" style="${!isPending ? 'opacity:0.5;' : ''}">商户代付</span></td>
                <td style="${!isPending ? 'color:#999;' : ''}">
                    ${createdHtml}
                    <br><span class="badge-timeago" style="${!isPending ? 'color:#999; background:transparent; border:none;' : ''}">${timeAgo}</span>
                </td>
                <td style="${!isPending ? 'color:#999;' : ''}">--</td> <!-- Modified time placeholder -->
                <td style="${!isPending ? 'color:#999;' : ''}">--</td>
                <td><span class="badge green" style="${!isPending ? 'opacity:0.5;' : ''}">0.5小时</span></td>
                <td style="${!isPending ? 'color:#999;' : ''}">${allowHtml}</td>
                <td>
                    <div class="action-cell">
                        ${isPending ? `<button class="action-btn btn-yellow btn-approve" data-id="${row.id}" data-time="${row.allow_transfer_time}" onclick="openApproveModal(${row.id})" style="display:none;">📝 同意</button>` : ''}
                        ${isPending ? `<button class="action-btn btn-red" onclick="openRejectModal(${row.id})">📝 作废</button>` : ''}
                        <a href="/transaction-detail/${row.id}" target="_blank" class="action-btn btn-blue" style="text-decoration:none; display:inline-block; ${!isPending ? 'opacity:0.5; cursor:not-allowed; pointer-events:none;' : ''}">📝 详情</a>
                    </div>
                </td>
                <td>
                    <div class="action-cell">
                        <button class="action-btn btn-teal">📝 校验卡号</button>
                        <button class="action-btn btn-orange">📝 校验姓名</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Restore scroll position to freeze it in place
        if (appMain) appMain.scrollTop = currentScroll;
        else window.scrollTo(0, currentScroll);
        
        // Run time check immediately after render
        checkTimeIntervals();
    };

    // 3. Lightning Fast Refresh with Visual Blink
    let isRefreshing = false;
    refreshBtn.addEventListener('click', (e) => {
        // Visual button pop effect
        const btn = e.currentTarget;
        btn.classList.remove('btn-pop');
        void btn.offsetWidth; // trigger reflow
        btn.classList.add('btn-pop');

        if (isRefreshing) return; // Prevent spam clicks overlapping
        isRefreshing = true;
        
        const appMain = document.querySelector('.app-main');
        const currentScroll = appMain ? appMain.scrollTop : window.scrollY;
        
        // Lock the height temporarily so the page doesn't shrink and pull the scrollbar up
        tbody.style.minHeight = tbody.offsetHeight + 'px';
        
        // Clear table immediately to give visual feedback
        tbody.innerHTML = '';
        setTimeout(() => {
            fetchTransactions().then(() => {
                tbody.style.minHeight = ''; // Remove lock
                if (appMain) appMain.scrollTop = currentScroll;
                else window.scrollTo(0, currentScroll); // Ensure exact restoration
                isRefreshing = false; // Release lock
            }).catch(() => {
                isRefreshing = false;
            });
            fetchLiveFeed();
        }, 80); // ultra-fast 80ms blink
    });

    // Auto-refresh background every 1 second
    setInterval(() => {
        // Only auto refresh if no modal is currently open
        if (!currentMode) {
            fetchTransactions();
            fetchLiveFeed();
        }
    }, 1000);

    // Live Feed logic
    async function fetchLiveFeed() {
        try {
            const res = await fetch('/recent-approvals');
            const result = await res.json();
            if (result.success) {
                renderLiveFeed(result.data);
            }
        } catch (e) {
            console.error('Failed to fetch live feed:', e);
        }
    }

    function renderLiveFeed(transactions) {
        const container = document.getElementById('live-feed-container');
        if (!container) return;

        // Sort by approvedAt descending
        transactions.sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));

        if (transactions.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 13px;">暂无动态</div>';
            return;
        }

        container.innerHTML = '';
        transactions.forEach(tx => {
            const timeStr = new Intl.DateTimeFormat('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(new Date(tx.approvedAt));
            
            // Mark user's own snatches with a green background
            const isMe = tx.approvedBy === currentUsername;
            const bg = isMe ? '#f0f9eb' : 'transparent';
            const nameColor = isMe ? '#67c23a' : '#1a3c6e';

            const div = document.createElement('div');
            div.style.cssText = `padding: 10px; border-bottom: 1px dashed #eee; font-size: 13px; background: ${bg}; transition: background 0.3s;`;
            div.innerHTML = `
                <div style="color: #606266; margin-bottom: 4px;">
                    <span style="color: #f56c6c; font-weight: bold;">${tx.recharge_no}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${nameColor}; font-weight: 600;">@${tx.approvedBy}</span>
                    <span style="color: #999; font-size: 11px;">${timeStr}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Initial Live Feed load
    fetchLiveFeed();

    // 4. Modal Logic
    window.openRejectModal = (id) => {
        currentMode = 'reject';
        currentTransactionId = id;
        modalTitle.innerText = 'Reject Transaction (作废)';
        modalTitle.style.color = '#ff4949';
        adminNote.value = '';
        btnSubmitModal.disabled = true;
        btnSubmitModal.className = 'btn btn-red btn-submit-disabled';
        modal.style.display = 'flex';
        setTimeout(() => adminNote.focus(), 50);
    };

    window.openApproveModal = (id) => {
        currentMode = 'approve';
        currentTransactionId = id;
        modalTitle.innerText = '(同意)';
        modalTitle.style.color = '#e6a23c';
        adminNote.value = '';
        btnSubmitModal.disabled = true;
        btnSubmitModal.className = 'btn btn-yellow btn-submit-disabled';
        modal.style.display = 'flex';
        setTimeout(() => adminNote.focus(), 50);
    };

    window.openDetailModal = (id) => {
        window.open(`/transaction-detail/${id}`, '_blank');
    };

    window.closeModal = () => {
        modal.style.display = 'none';
        currentTransactionId = null;
        currentMode = '';
    };

    window.showSuccessToast = () => {
        const toast = document.getElementById('success-toast');
        toast.style.display = 'block';
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => { toast.style.display = 'none'; }, 250);
        }, 2500);
    };

    window.showFailedToast = (takenBy) => {
        const toast = document.getElementById('failed-toast');
        const sub = document.getElementById('failed-toast-sub');
        if (sub && takenBy) sub.textContent = `已被 ${takenBy} 处理`;
        toast.style.display = 'block';
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => { toast.style.display = 'none'; }, 250);
        }, 2500);
    };

    adminNote.addEventListener('input', (e) => {
        if (e.target.value.trim() !== '') {
            btnSubmitModal.disabled = false;
            btnSubmitModal.classList.remove('btn-submit-disabled');
        } else {
            btnSubmitModal.disabled = true;
            btnSubmitModal.classList.add('btn-submit-disabled');
        }
    });

    btnSubmitModal.addEventListener('click', async () => {
        if (!currentTransactionId || btnSubmitModal.disabled) return;
        
        const note = adminNote.value.trim();
        try {
            const endpoint = `/transactions/${currentTransactionId}/${currentMode}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_note: note, username: currentUsername })
            });
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                showSuccessToast();
                
                // Fetch new data quietly without clearing the table to avoid a "flicker" that looks like a reload
                fetchTransactions();
                if (typeof fetchLiveFeed === 'function') fetchLiveFeed();
                
            } else if (result.alreadyTaken) {
                closeModal();
                showFailedToast(result.takenBy);
                
                // Fetch new data quietly without clearing the table to avoid a "flicker" that looks like a reload
                fetchTransactions();
                if (typeof fetchLiveFeed === 'function') fetchLiveFeed();
                
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit action.');
        }
    });

    // 5. Interval Time Check for Yellow Buttons
    const checkTimeIntervals = () => {
        const now = new Date();
        const approveButtons = document.querySelectorAll('.btn-approve');
        
        approveButtons.forEach(btn => {
            const allowTime = new Date(btn.getAttribute('data-time'));
            if (now >= allowTime) {
                btn.style.display = 'flex'; // reveal when time reached
                btn.title = 'Ready to approve';
            } else {
                btn.style.display = 'none'; // hide until time reached
            }
        });
    };

    // Run interval every 1 second
    setInterval(checkTimeIntervals, 1000);

    
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
            clockEl.innerText = `${yyyy}年${MM}月${dd}日 ${hh}:${mm}:${ss}`;
        }
    };
    setInterval(updateClock, 1000);
    updateClock();

    // Initial Fetch

    fetchTransactions();
});
