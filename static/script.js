// 兼容性处理：为不支持 crypto.randomUUID 的环境提供 polyfill
if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    window.crypto = window.crypto || {};
    window.crypto.randomUUID = function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}
// 全局变量
let currentResult = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 输入方式切换
    document.getElementById('fileInput').addEventListener('change', toggleInputMethod);
    document.getElementById('textInput').addEventListener('change', toggleInputMethod);
    
    // 文件输入变化时自动切换到文本输入
    document.getElementById('seq1_file').addEventListener('change', function() {
        if (this.files.length > 0) {
            document.getElementById('fileInput').checked = true;
            toggleInputMethod();
        }
    });
    
    document.getElementById('seq2_file').addEventListener('change', function() {
        if (this.files.length > 0) {
            document.getElementById('fileInput').checked = true;
            toggleInputMethod();
        }
    });
}

// 切换输入方式
function toggleInputMethod() {
    const fileInput = document.getElementById('fileInput').checked;
    const fileUploadArea = document.getElementById('fileUploadArea');
    const textInputArea = document.getElementById('textInputArea');
    
    if (fileInput) {
        fileUploadArea.style.display = 'block';
        textInputArea.style.display = 'none';
    } else {
        fileUploadArea.style.display = 'none';
        textInputArea.style.display = 'block';
    }
}

// 加载示例数据
async function loadSampleData(filename, targetElementId) {
    try {
        const response = await fetch(`/sample_data/${filename}`);
        if (response.ok) {
            const content = await response.text();
            document.getElementById(targetElementId).value = content;
            
            // 自动切换到文本输入模式
            document.getElementById('textInput').checked = true;
            toggleInputMethod();
            
            showNotification('示例数据加载成功！', 'success');
        } else {
            showNotification('示例数据加载失败', 'error');
        }
    } catch (error) {
        console.error('加载示例数据时出错:', error);
        showNotification('加载示例数据时出错', 'error');
    }
}

// 比对序列
async function compareSequences() {
    // 显示加载指示器
    showLoading(true);
    hideError();
    
    try {
        // 获取输入数据
        const formData = new FormData();
        
        // 检查输入方式
        const isFileInput = document.getElementById('fileInput').checked;
        
        if (isFileInput) {
            // 文件上传模式
            const seq1File = document.getElementById('seq1_file').files[0];
            const seq2File = document.getElementById('seq2_file').files[0];
            
            if (!seq1File || !seq2File) {
                throw new Error('请选择两个序列文件');
            }
            
            formData.append('seq1_file', seq1File);
            formData.append('seq2_file', seq2File);
        } else {
            // 文本输入模式
            const seq1Text = document.getElementById('seq1_text').value.trim();
            const seq2Text = document.getElementById('seq2_text').value.trim();
            
            if (!seq1Text || !seq2Text) {
                throw new Error('请输入两个序列');
            }
            
            formData.append('seq1_text', seq1Text);
            formData.append('seq2_text', seq2Text);
        }
        
        // 发送比对请求
        const response = await fetch('/compare', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentResult = result;
            displayResults(result);
            showNotification('序列比对完成！', 'success');
        } else {
            throw new Error(result.error || '比对失败');
        }
        
    } catch (error) {
        console.error('比对过程中出错:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// 显示结果
function displayResults(result) {
    // 隐藏欢迎信息
    document.getElementById('welcomeMessage').style.display = 'none';
    
    // 显示结果区域
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    resultArea.classList.add('fade-in');
    
    // 显示统计信息
    displayStatistics(result);
    
    // 显示可视化结果
    displayVisualization(result);
    
    // 显示差异详情
    displayDifferences(result);
}

// 显示统计信息
function displayStatistics(result) {
    const statisticsDiv = document.getElementById('statistics');
    
    const statsHTML = `
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-value">${result.similarity}%</div>
                <div class="stat-label">相似度</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-value">${result.total_positions}</div>
                <div class="stat-label">总位置数</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-value">${result.matches}</div>
                <div class="stat-label">匹配位置</div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-value">${result.differences}</div>
                <div class="stat-label">差异位置</div>
            </div>
        </div>
    `;
    
    statisticsDiv.innerHTML = statsHTML;
}

// 显示可视化结果
function displayVisualization(result) {
    const visualizationDiv = document.getElementById('visualization');
    
    const visualizationHTML = `
        <div class="differences-table">
            <h4><i class="fas fa-eye"></i> 序列比对可视化</h4>
            ${result.visualization}
        </div>
    `;
    
    visualizationDiv.innerHTML = visualizationHTML;
}

// 显示差异详情
function displayDifferences(result) {
    const differencesDiv = document.getElementById('differences');
    
    if (result.differences_detail.length === 0) {
        differencesDiv.innerHTML = `
            <div class="differences-table">
                <h4><i class="fas fa-check-circle text-success"></i> 无差异发现</h4>
                <p class="text-muted">两个序列完全匹配！</p>
            </div>
        `;
        return;
    }
    
    let differencesHTML = `
        <div class="differences-table">
            <h4><i class="fas fa-exclamation-triangle text-warning"></i> 差异详情 (共${result.differences_detail.length}个)</h4>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>位置</th>
                            <th>序列1</th>
                            <th>序列2</th>
                            <th>类型</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // 只显示前50个差异，避免表格过长
    const displayDifferences = result.differences_detail.slice(0, 50);
    
    displayDifferences.forEach(diff => {
        const typeClass = diff.type === 'mismatch' ? 'text-danger' : 'text-warning';
        const typeText = diff.type === 'mismatch' ? '错配' : '缺失';
        
        differencesHTML += `
            <tr>
                <td><strong>${diff.position}</strong></td>
                <td><span class="badge bg-secondary">${diff.seq1_char}</span></td>
                <td><span class="badge bg-secondary">${diff.seq2_char}</span></td>
                <td><span class="${typeClass}">${typeText}</span></td>
            </tr>
        `;
    });
    
    differencesHTML += `
                    </tbody>
                </table>
            </div>
    `;
    
    if (result.differences_detail.length > 50) {
        differencesHTML += `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                为了便于查看，只显示了前50个差异。总共有 ${result.differences_detail.length} 个差异位置。
            </div>
        `;
    }
    
    differencesHTML += '</div>';
    
    differencesDiv.innerHTML = differencesHTML;
}

// 清除结果
function clearResults() {
    // 隐藏结果区域
    document.getElementById('resultArea').style.display = 'none';
    
    // 显示欢迎信息
    document.getElementById('welcomeMessage').style.display = 'block';
    
    // 清除输入
    document.getElementById('seq1_file').value = '';
    document.getElementById('seq2_file').value = '';
    document.getElementById('seq1_text').value = '';
    document.getElementById('seq2_text').value = '';
    
    // 重置为文件输入模式
    document.getElementById('fileInput').checked = true;
    toggleInputMethod();
    
    currentResult = null;
}

// 显示加载指示器
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// 显示错误信息
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>错误：</strong> ${message}
    `;
    errorDiv.style.display = 'block';
    errorDiv.classList.add('fade-in');
}

// 隐藏错误信息
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} notification`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        backdrop-filter: blur(10px);
    }
`;
document.head.appendChild(style);

// 导出结果功能
function exportResults() {
    if (!currentResult) {
        showNotification('没有可导出的结果', 'error');
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        similarity: currentResult.similarity,
        total_positions: currentResult.total_positions,
        matches: currentResult.matches,
        differences: currentResult.differences,
        differences_detail: currentResult.differences_detail,
        aligned_sequences: {
            seq1: currentResult.aligned_seq1,
            seq2: currentResult.aligned_seq2
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `sequence_comparison_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    
    showNotification('结果已导出', 'success');
}

// 键盘快捷键
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter 开始比对
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        compareSequences();
    }
    
    // Escape 清除结果
    if (event.key === 'Escape') {
        clearResults();
    }
}); 