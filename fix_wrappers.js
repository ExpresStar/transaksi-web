const fs = require('fs');

// 1. Fix index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace both action cells in index.html to wrap with an inner div instead of styling the td directly.
const oldBlockTemplate = `<td class="action-cell">\\s*<button class="action-btn btn-yellow">📝 同意<\\/button>\\s*<button class="action-btn btn-red">📝 作废<\\/button>\\s*<button class="action-btn btn-blue">📝 详情<\\/button>\\s*<\\/td>\\s*<td class="action-cell">\\s*<button class="action-btn btn-teal">📝 校验卡号<\\/button>\\s*<button class="action-btn btn-orange">📝 校验姓名<\\/button>\\s*<\\/td>`;

const newBlockHtml = `<td>
                                    <div class="action-cell">
                                        <button class="action-btn btn-yellow">📝 同意</button>
                                        <button class="action-btn btn-red">📝 作废</button>
                                        <button class="action-btn btn-blue">📝 详情</button>
                                    </div>
                                </td>
                                <td>
                                    <div class="action-cell">
                                        <button class="action-btn btn-teal">📝 校验卡号</button>
                                        <button class="action-btn btn-orange">📝 校验姓名</button>
                                    </div>
                                </td>`;

const regexHtml = new RegExp(oldBlockTemplate, 'g');
html = html.replace(regexHtml, newBlockHtml);
fs.writeFileSync('index.html', html);


// 2. Fix script.js
let js = fs.readFileSync('script.js', 'utf8');

const oldJsBlockTemplate = `<td class="action-cell">\\s*\\$\\{isPending \\? \`<button class="action-btn btn-yellow btn-approve" data-id="\\$\\{row\\.id\\}" data-time="\\$\\{row\\.allow_transfer_time\\}" onclick="openApproveModal\\(\\$\\{row\\.id\\}\\)">📝 同意<\\/button>\` : ''\\}\\s*\\$\\{isPending \\? \`<button class="action-btn btn-red" onclick="openRejectModal\\(\\$\\{row\\.id\\}\\)">📝 作废<\\/button>\` : ''\\}\\s*<a href="\\/transaction-detail\\/\\$\\{row\\.id\\}" target="_blank" class="action-btn btn-blue" style="text-decoration:none; display:inline-block;">📝 详情<\\/a>\\s*<\\/td>\\s*<td class="action-cell">\\s*<button class="action-btn btn-teal">📝 校验卡号<\\/button>\\s*<button class="action-btn btn-orange">📝 校验姓名<\\/button>\\s*<\\/td>`;

const newJsBlock = `<td>
                    <div class="action-cell">
                        \${isPending ? \`<button class="action-btn btn-yellow btn-approve" data-id="\${row.id}" data-time="\${row.allow_transfer_time}" onclick="openApproveModal(\${row.id})">📝 同意</button>\` : ''}
                        \${isPending ? \`<button class="action-btn btn-red" onclick="openRejectModal(\${row.id})">📝 作废</button>\` : ''}
                        <a href="/transaction-detail/\${row.id}" target="_blank" class="action-btn btn-blue" style="text-decoration:none; display:inline-block;">📝 详情</a>
                    </div>
                </td>
                <td>
                    <div class="action-cell">
                        <button class="action-btn btn-teal">📝 校验卡号</button>
                        <button class="action-btn btn-orange">📝 校验姓名</button>
                    </div>
                </td>`;

const regexJs = new RegExp(oldJsBlockTemplate, 'g');
js = js.replace(regexJs, newJsBlock);
fs.writeFileSync('script.js', js);
console.log('Moved .action-cell into div wrappers successfully!');
