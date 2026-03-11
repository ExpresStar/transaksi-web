// --- Sidebar Navigation Logic ---
let isPaymentTabOpen = false;

function toggleSubMenu(menuId, el) {
    const subMenu = document.getElementById(menuId);
    if (!subMenu) return;
    
    const isOpen = subMenu.classList.toggle('is-open');
    el.querySelector('.arrow').innerText = isOpen ? 'v' : '<';
    
    // Rotate arrow icon smoothly
    const arrow = el.querySelector('.arrow');
    if (arrow) {
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(0deg)';
        // (Rotation handled by CSS class transitions alternatively)
    }
}

function switchView(viewId, navId) {
    if (viewId === 'paymentView') isPaymentTabOpen = true;

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
        let tagsHtml = `
            <span class="nav-arrow">«</span>
            <span class="tag-item ${viewId === 'homeView' ? 'active' : ''}" onclick="switchView('homeView', 'nav-home')">首页</span>
        `;
        
        if (isPaymentTabOpen) {
            tagsHtml += `
                <span class="tag-item ${viewId === 'paymentView' ? 'active' : ''}" onclick="switchView('paymentView', 'nav-payment')">
                    交易列表 <span class="tag-close" onclick="event.stopPropagation(); closePaymentTab();">×</span>
                </span>
            `;
        }
        tagsContainer.innerHTML = tagsHtml;
    }
}

function closePaymentTab() {
    isPaymentTabOpen = false;
    switchView('homeView', 'nav-home');
}

// Make functions globally available
window.switchView = switchView;
window.toggleSubMenu = toggleSubMenu;
window.closePaymentTab = closePaymentTab;
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
    
    // Fullscreen toggle logic
    const btnFullScreen = document.getElementById('btnFullScreen');
    if (btnFullScreen) {
        btnFullScreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }

    // Logout logic
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('确认退出系统吗？')) {
                localStorage.removeItem('runner_logged_in');
                localStorage.removeItem('approver_username');
                window.location.href = '/';
            }
        });
    }

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
            <div style="background: #fff; width: 420px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); overflow: hidden; animation: zoomIn 0.2s ease-out;">
                <div style="padding: 15px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                    <span id="modal-title" style="font-size: 18px; font-weight: bold; color: #e6a23c;">(同意)</span>
                    <span style="cursor: pointer; color: #909399; font-size: 20px;" onclick="closeModal()">×</span>
                </div>
                <div style="padding: 20px;">
                    <textarea id="admin-note" rows="5" placeholder="" style="width: 100%; border: 1px solid #dcdfe6; border-radius: 4px; padding: 12px; font-size: 14px; outline: none; resize: none; color: #606266;"></textarea>
                    
                    <!-- Result Area for Verification -->
                    <div id="verify-result" style="display:none; margin-top: 15px; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; font-size: 16px;"></div>
                </div>
                <div style="padding: 0 20px 20px; text-align: right;">
                    <button type="button" id="btn-submit-modal" class="btn-modal" disabled>通过</button>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            
            .btn-modal {
                padding: 10px 28px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid transparent;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 100px;
            }

            /* Approve/General Style */
            .btn-modal.type-approve {
                background: #F4c530;
                border-color: #F4c530;
                color: #fff;
            }
            .btn-modal.type-approve:hover:not(:disabled) {
                background: #e0b42b;
                border-color: #e0b42b;
                color: #fff;
            }

            /* Reject Style */
            .btn-modal.type-reject {
                background: #fef0f0;
                border-color: #fbc4c4;
                color: #f56c6c;
            }
            .btn-modal.type-reject:hover:not(:disabled) {
                background: #f56c6c;
                color: #fff;
            }

            /* Blue/Normal Style */
            .btn-modal.type-blue {
                background: #ecf5ff;
                border-color: #d9ecff;
                color: #409eff;
            }
            .btn-modal.type-blue:hover:not(:disabled) {
                background: #409eff;
                color: #fff;
            }

            .btn-submit-disabled { 
                opacity: 0.5; 
                cursor: not-allowed !important; 
                filter: grayscale(0.5);
            }
            .badge-timeago {
                display: inline-block;
                margin-top: 1px;
                padding: 0px 4px;
                background: #f0f9eb;
                color: #67c23a;
                border: 1px solid #c2e7b0;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
                white-space: nowrap;
            }
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Modal Elements (Define right after injection)
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const adminNote = document.getElementById('admin-note');
    const btnSubmitModal = document.getElementById('btn-submit-modal');

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
    let allData = [];
    let itemsPerPage = 10;
    let currentPage = 1;
    let totalTransactions = 0;
    let currentTransactionId = null;
    let isRefreshing = false;

    // Filter State
    let currentFilters = {
        rechargeNo: '',
        downstreamNo: '',
        receiver: '',
        cardNo: '',
        minAmount: '',
        maxAmount: '',
        status: '',
        dateRange: null // { start, end }
    };

    // Elements
    const tbody = document.querySelector('.data-table tbody');
    const refreshBtn = document.querySelector('.table-toolbar .toolbar-btn:nth-child(2)'); // The ↻ button
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // 2. Fetch and Render Transactions
    const fetchTransactions = async (shouldRender = true) => { // Added shouldRender parameter
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
                
                // Only render table if shouldRender is true
                if (shouldRender) {
                    renderTable();
                }

                // --- Race Condition Check while Modal is Open ---
                if (currentMode && currentTransactionId) {
                    const isStillPending = allData.some(tx => Number(tx.id) === Number(currentTransactionId));
                    if (!isStillPending) {
                        closeModal();
                        showFailedToast(); // Show general "Already processed" toast
                        
                        // Force a table render so the "taken" row disappears immediately
                        renderTable();
                    }
                }
            } else {
                console.warn('Failed to fetch transactions'); // Changed alert to console.warn
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const renderPagination = (page, totalPages) => {
        const container = document.getElementById('pagination-container');
        container.innerHTML = '';
        if (totalPages <= 0) return;

        // Custom Helper for Creating Buttons
        const createNavBtn = (content, targetPage, isActive = false, isDisabled = false) => {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${isActive ? 'active' : ''}`;
            btn.innerHTML = content;
            btn.disabled = isDisabled;
            if (!isDisabled && !isActive) {
                btn.onclick = () => {
                    renderTablePage(targetPage);
                };
            }
            return btn;
        };

        // 1. First Page Button (Back to page 1)
        container.appendChild(createNavBtn('«', 1, false, page === 1));

        // 2. Previous Page
        container.appendChild(createNavBtn('‹', page - 1, false, page === 1));

        // 3. Page Numbers Logic
        let pages = [];
        if (totalPages <= 10) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 5) {
                // Near start
                pages = [1, 2, 3, 4, 5, 6, '...', totalPages];
            } else if (page >= totalPages - 4) {
                // Near end
                pages = [1, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                // In middle - more numbers around current
                pages = [1, '...', page - 2, page - 1, page, page + 1, page + 2, '...', totalPages];
            }
        }

        pages.forEach(p => {
            if (p === '...') {
                const span = document.createElement('span');
                span.className = 'pagination-ellipsis';
                span.innerText = '...';
                container.appendChild(span);
            } else {
                container.appendChild(createNavBtn(p, p, p === page));
            }
        });

        // 4. Next Page
        container.appendChild(createNavBtn('›', page + 1, false, page === totalPages));

        // 5. Last Page Button
        container.appendChild(createNavBtn('»', totalPages, false, page === totalPages));
    };

    const renderTablePage = (page) => {
        currentPage = page;
        renderTable();
    };

    const renderTable = () => {
        // Apply filters to allData to get displayData
        let displayData = allData.filter(row => {
            // Recharge No
            if (currentFilters.rechargeNo && !row.recharge_no.includes(currentFilters.rechargeNo)) return false;
            // Downstream No
            if (currentFilters.downstreamNo && !row.order_no.includes(currentFilters.downstreamNo)) return false;
            // Receiver
            if (currentFilters.receiver && !row.receiver_name.toLowerCase().includes(currentFilters.receiver.toLowerCase())) return false;
            // Card No
            if (currentFilters.cardNo && !row.card_number.includes(currentFilters.cardNo)) return false;
            // Status
            if (currentFilters.status && row.status !== currentFilters.status) return false;
            
            // Amount Range
            const amount = Number(row.amount);
            if (currentFilters.minAmount && amount < Number(currentFilters.minAmount)) return false;
            if (currentFilters.maxAmount && amount > Number(currentFilters.maxAmount)) return false;

            // Processor (Admin)
            if (currentFilters.processor && !((row.approvedBy || '').toLowerCase().includes(currentFilters.processor.toLowerCase()))) return false;

            // Date Range
            if (currentFilters.dateRange) {
                const rowDate = new Date(row.created_at);
                if (rowDate < currentFilters.dateRange.start || rowDate > currentFilters.dateRange.end) return false;
            }

            return true;
        });

        totalTransactions = displayData.length;
        document.getElementById('total-tx').innerText = totalTransactions;

        const totalPages = Math.ceil(totalTransactions / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        renderPagination(currentPage, totalPages);

        const start = (currentPage - 1) * itemsPerPage;
        const end   = start + itemsPerPage;
        const pageData = displayData.slice(start, end);
        
        const appMain = document.querySelector('.app-main');
        const currentScroll = appMain ? appMain.scrollTop : window.scrollY;
        
        let html = '';
        pageData.forEach(row => {
            const createdHtml = formatTime(row.created_at);
            const timeAgo = getTimeAgo(row.created_at);
            const allowHtml = formatTime(row.allow_transfer_time);

            let statusBadge = '';
            let isPending = row.status === 'pending';
            let isApprovedLocally = row.status === 'approved';
            
            if (isPending) {
                statusBadge = '<span class="badge orange-outline">提现中</span>';
            } else if (isApprovedLocally) {
                const taker = row.approvedBy === currentUsername ? '您' : row.approvedBy;
                statusBadge = `<span class="badge" style="background: #f4f4f5; color: #909399; border: 1px solid #d3d4d6;">已同意 - @${taker}</span>`;
            } else if (row.status === 'rejected') {
                statusBadge = '<span class="badge btn-red" style="border:none;">已作废</span>';
            }

            html += `
                <tr>
                    <td><input type="checkbox" ${!isPending ? 'disabled' : ''}></td>
                    <td style="${!isPending ? 'color:#999;' : ''}">${row.order_no}</td>
                    <td class="text-red" style="${!isPending ? 'color:#999;' : ''}">${row.recharge_no}</td>
                    <td style="${!isPending ? 'color:#999;' : ''}">0961427367</td>
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
                    <td style="${!isPending ? 'color:#999;' : ''}">${formatTime(row.updated_at || row.created_at)}</td>
                    <td style="${!isPending ? 'color:#999;' : ''}">${formatTime(row.polling_at)}</td>
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
                            <button class="action-btn btn-teal" onclick="openVerifyModal(${row.id}, 'card')">📝 校验卡号</button>
                            <button class="action-btn btn-orange" onclick="openVerifyModal(${row.id}, 'name')">📝 校验姓名</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Restore scroll position
        if (appMain) appMain.scrollTop = currentScroll;
        
        // Run time check immediately after render
        checkTimeIntervals();
    };

    refreshBtn.addEventListener('click', async (e) => {
        if (isRefreshing) return;
        isRefreshing = true;
        
        try {
            // 1. Fetch data first (don't render yet)
            await Promise.all([
                fetchTransactions(false),
                fetchLiveFeed()
            ]);

            // 2. Trigger ONE clean blink aligned with the render
            tbody.classList.remove('blink-data');
            void tbody.offsetWidth; 
            tbody.classList.add('blink-data');
            
            // 3. Render immediately - it will happen during the blink animation
            renderTable();

        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            // 4. Cleanup after animation
            setTimeout(() => {
                tbody.classList.remove('blink-data');
                isRefreshing = false;
            }, 300);
        }
    });

    // Auto-refresh background every 1 second (always run to detect snatches)
    setInterval(() => {
        if (!isRefreshing) {
            // We fetch but DON'T render the table (false)
            // This keeps background data fresh for modal checks, but table stays static.
            fetchTransactions(false); 
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
        modalTitle.innerText = '(作废)';
        modalTitle.style.color = '#f56c6c';
        adminNote.value = '';
        adminNote.placeholder = '请输入作废理由...';
        adminNote.style.display = 'block';
        document.getElementById('verify-result').style.display = 'none';
        btnSubmitModal.disabled = true;
        btnSubmitModal.innerText = '确认作废';
        btnSubmitModal.className = 'btn-modal type-reject btn-submit-disabled';
        modal.style.display = 'flex';
        setTimeout(() => adminNote.focus(), 50);
    };

    window.openApproveModal = (id) => {
        currentMode = 'approve';
        currentTransactionId = id;
        modalTitle.innerText = '(同意)';
        modalTitle.style.color = '#e6a23c';
        adminNote.value = '';
        adminNote.placeholder = '请输入审批备注...';
        adminNote.style.display = 'block';
        document.getElementById('verify-result').style.display = 'none';
        btnSubmitModal.disabled = true;
        btnSubmitModal.innerText = '通过';
        btnSubmitModal.className = 'btn-modal type-approve btn-submit-disabled';
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
        document.getElementById('verify-result').style.display = 'none';
        adminNote.style.display = 'block';
    };

    window.openVerifyModal = (id, type) => {
        const tx = allData.find(t => t.id == id);
        if (!tx) return;

        currentTransactionId = id;
        currentMode = type === 'card' ? 'verify_card' : 'verify_name';
        
        const title = type === 'card' ? '(校验卡号)' : '(校验姓名)';
        modalTitle.innerText = title;
        modalTitle.style.color = type === 'card' ? '#00b4a7' : '#e6a23c';
        
        adminNote.value = '';
        adminNote.placeholder = type === 'card' ? '请输入转账截图上的卡号...' : '请输入转账截图上的收款姓名...';
        adminNote.style.display = 'block';
        
        const resultArea = document.getElementById('verify-result');
        resultArea.style.display = 'none';
        
        btnSubmitModal.disabled = true;
        btnSubmitModal.innerText = '完成校验';
        btnSubmitModal.className = 'btn-modal type-approve btn-submit-disabled';
        
        modal.style.display = 'flex';
        setTimeout(() => adminNote.focus(), 50);
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
        const val = e.target.value.trim();
        const resultArea = document.getElementById('verify-result');
        
        if (currentMode === 'verify_card' || currentMode === 'verify_name') {
            if (val === '') {
                resultArea.style.display = 'none';
                btnSubmitModal.disabled = true;
                btnSubmitModal.classList.add('btn-submit-disabled');
                return;
            }

            const tx = allData.find(t => t.id == currentTransactionId);
            const targetVal = currentMode === 'verify_card' ? tx.card_number : tx.receiver_name;
            
            resultArea.style.display = 'block';
            if (val === targetVal) {
                resultArea.innerHTML = '✔ 校验成功';
                resultArea.style.color = '#67c23a';
                resultArea.style.background = '#f0f9eb';
                resultArea.style.border = '1px solid #c2e7b0';
                btnSubmitModal.disabled = false;
                btnSubmitModal.classList.remove('btn-submit-disabled');
            } else {
                resultArea.innerHTML = '✘ 校验失败';
                resultArea.style.color = '#f56c6c';
                resultArea.style.background = '#fef0f0';
                resultArea.style.border = '1px solid #fbc4c4';
                btnSubmitModal.disabled = true;
                btnSubmitModal.classList.add('btn-submit-disabled');
            }
        } else {
            // Normal (approve/reject) mode
            if (val !== '') {
                btnSubmitModal.disabled = false;
                btnSubmitModal.classList.remove('btn-submit-disabled');
            } else {
                btnSubmitModal.disabled = true;
                btnSubmitModal.classList.add('btn-submit-disabled');
            }
        }
    });

    btnSubmitModal.addEventListener('click', async () => {
        if (!currentTransactionId || btnSubmitModal.disabled) return;
        
        // If it's just a verification modal, we just close it when they click the button
        if (currentMode === 'verify_card' || currentMode === 'verify_name') {
            closeModal();
            return;
        }

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
                
                // Immediately refresh the table once without the "blink" animation
                // This ensures the processed item disappears and data stays fresh
                await fetchTransactions(true); 
                if (typeof fetchLiveFeed === 'function') fetchLiveFeed();
                
            } else if (result.alreadyTaken) {
                closeModal();
                showFailedToast(result.takenBy);
                
                // Immediately refresh the table once without the "blink" animation
                await fetchTransactions(true);
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

    // 7. Toggle Filter Section Logic
    // ---------------------------------------------------------
    // 6. FILTER LOGIC
    // ---------------------------------------------------------
    const btnSearch = document.getElementById('btnSearch');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const btnToday = document.getElementById('btnToday');
    const btnYesterday = document.getElementById('btnYesterday');

    const filterRechargeNo = document.getElementById('filterRechargeNo');
    const filterDownstreamNo = document.getElementById('filterDownstreamNo');
    const filterReceiver = document.getElementById('filterReceiver');
    const filterCardNo = document.getElementById('filterCardNo');
    const filterMinAmount = document.getElementById('filterMinAmount');
    const filterMaxAmount = document.getElementById('filterMaxAmount');
    const filterStatus = document.getElementById('filterStatus');
    const filterProcessor = document.getElementById('filterProcessor');

    const applySearch = () => {
        currentFilters.rechargeNo = filterRechargeNo.value.trim();
        currentFilters.downstreamNo = filterDownstreamNo.value.trim();
        currentFilters.receiver = filterReceiver.value.trim();
        currentFilters.cardNo = filterCardNo.value.trim();
        currentFilters.minAmount = filterMinAmount.value.trim();
        currentFilters.maxAmount = filterMaxAmount.value.trim();
        currentFilters.status = filterStatus.value;
        currentFilters.processor = filterProcessor.value.trim();
        
        currentPage = 1; // Reset to page 1 on search
        renderTable();
    };

    const resetAllFilters = () => {
        // Clear inputs
        filterRechargeNo.value = '';
        filterDownstreamNo.value = '';
        filterReceiver.value = '';
        filterCardNo.value = '';
        filterMinAmount.value = '';
        filterMaxAmount.value = '';
        filterStatus.value = '';
        filterProcessor.value = '';
        
        // Reset state
        currentFilters = {
            rechargeNo: '',
            downstreamNo: '',
            receiver: '',
            cardNo: '',
            minAmount: '',
            maxAmount: '',
            status: '',
            processor: '',
            dateRange: null
        };
        
        currentPage = 1;
        renderTable();
    };

    btnSearch.addEventListener('click', applySearch);
    btnResetFilter.addEventListener('click', resetAllFilters);

    btnToday.addEventListener('click', () => {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
        currentFilters.dateRange = { start, end };
        currentPage = 1;
        renderTable();
    });

    btnYesterday.addEventListener('click', () => {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23,59,59,999);
        currentFilters.dateRange = { start, end };
        currentPage = 1;
        renderTable();
    });

    // Toggle filter section
    const toggleFilterBtn = document.getElementById('toggleFilterBtn');
    const filterSection = document.getElementById('filterSection');

    if (toggleFilterBtn && filterSection) {
        toggleFilterBtn.addEventListener('click', () => {
            filterSection.classList.toggle('collapsed');
            toggleFilterBtn.classList.toggle('active');
        });
    }

    // Initial Fetch
    fetchTransactions(true);
 });
