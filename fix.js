const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Restore the header
let headerTarget = `<th>操作</th>\n                                <th>操作2</th>`;
if (!html.includes('<th>操作2</th>')) {
    html = html.replace('<th>操作</th>', '<th>操作</th>\n                                <th>操作2</th>');
}

// Ensure all action cell blocks are replaced with the new ordered buttons and an empty td
html = html.replace(/<td class="action-cell">[\s\S]*?<\/td>/g, `<td class="action-cell">
                                    <button class="action-btn btn-yellow">📝 同意</button>
                                    <button class="action-btn btn-red">📝 作废</button>
                                    <button class="action-btn btn-blue">📝 详情</button>
                                </td>
                                <td></td>`);

// Fix any double replacements (for rows that didn't have the merged cell yet)
// Let's just do a specific regex for the old HTML:
let html2 = fs.readFileSync('index.html', 'utf8');

if (!html2.includes('<th>操作2</th>')) {
    html2 = html2.replace('<th>操作</th>', '<th>操作</th>\\n                                <th>操作2</th>');
}

html2 = html2.replace(/<td[^>]*>\s*<button class="action-btn btn-red">📝作废<\/button>\s*<button class="action-btn btn-teal">📝同意<\/button>\s*<\/td>\s*<td[^>]*>\s*<button class="action-btn btn-teal">📝校验卡号<\/button>\s*<button class="action-btn btn-orange">📝校验姓名<\/button>\s*<\/td>/g, `<td class="action-cell">\n                                    <button class="action-btn btn-yellow">📝 同意</button>\n                                    <button class="action-btn btn-red">📝 作废</button>\n                                    <button class="action-btn btn-blue">📝 详情</button>\n                                </td>\n                                <td></td>`);

// Fix the one row that WAS successfully replaced by the previous botched replace:
html2 = html2.replace(/<td class="action-cell">\s*<button class="action-btn btn-red">📝 作废<\/button>\s*<button class="action-btn btn-teal">📝 同意<\/button>\s*<button class="action-btn btn-blue"[^>]*>📝 详情<\/button>\s*<\/td>/g, `<td class="action-cell">\n                                    <button class="action-btn btn-yellow">📝 同意</button>\n                                    <button class="action-btn btn-red">📝 作废</button>\n                                    <button class="action-btn btn-blue">📝 详情</button>\n                                </td>\n                                <td></td>`);


fs.writeFileSync('index.html', html2);
console.log('Fixed index.html successfully!');
