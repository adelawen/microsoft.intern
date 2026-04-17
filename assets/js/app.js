/**
 * Microsoft MOI Portfolio - Main Application JS
 * Fluent Design System inspired interactions
 */

'use strict';

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
  currentPage: 'about',
  files: JSON.parse(localStorage.getItem('portfolio_files') || '[]'),
  profile: JSON.parse(localStorage.getItem('portfolio_profile') || '{}'),
  projects: JSON.parse(localStorage.getItem('portfolio_projects') || '[]'),
};

// ============================================
// NAVIGATION
// ============================================
function navigate(page) {
  // Update state
  AppState.currentPage = page;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update page sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.toggle('active', section.id === `page-${page}`);
  });

  // Update top bar breadcrumb
  const pageNames = {
    about: '個人簡介',
    pm: '專案管理 (PM)',
    video: '影音製作',
    tech: '技術能力',
    portfolio: '作品集',
    upload: '檔案管理',
    contact: '聯絡資訊'
  };

  const breadcrumb = document.getElementById('breadcrumb-current');
  if (breadcrumb) breadcrumb.textContent = pageNames[page] || page;

  // Trigger page-specific init
  if (page === 'portfolio') renderProjects();
  if (page === 'upload') renderFileList();

  // Animate skill bars
  if (page === 'pm' || page === 'tech' || page === 'video') {
    setTimeout(animateSkillBars, 100);
    setTimeout(animateProgressRings, 100);
  }

  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');

  // Scroll to top
  document.querySelector('.main-content')?.scrollTo(0, 0);
}

// ============================================
// SKILL BARS ANIMATION
// ============================================
function animateSkillBars() {
  const bars = document.querySelectorAll('#page-' + AppState.currentPage + ' .skill-bar-fill');
  bars.forEach(bar => {
    const target = bar.dataset.pct || '0';
    setTimeout(() => { bar.style.width = target + '%'; }, 50);
  });
}

function animateProgressRings() {
  const rings = document.querySelectorAll('#page-' + AppState.currentPage + ' .progress-ring-fill');
  rings.forEach(ring => {
    const pct = parseFloat(ring.dataset.pct || 0) / 100;
    const circumference = 226;
    const offset = circumference - (pct * circumference);
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
  });
}

// ============================================
// FILE UPLOAD SYSTEM
// ============================================
function initUpload() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');

  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', (e) => handleFiles(e.target.files));
}

function handleFiles(fileList) {
  const files = Array.from(fileList);
  let added = 0;

  files.forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    const fileObj = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: ext,
      category: classifyFile(ext),
      date: new Date().toLocaleDateString('zh-TW'),
      dataUrl: null,
    };

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      fileObj.dataUrl = e.target.result;
      AppState.files.push(fileObj);
      saveFiles();
      renderFileList();
      added++;
      if (added === files.length) {
        showToast(`已成功上傳 ${added} 個檔案`, 'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

function classifyFile(ext) {
  const map = {
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
    ppt: 'presentation', pptx: 'presentation',
    xls: 'spreadsheet', xlsx: 'spreadsheet',
    mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
    mp3: 'audio', wav: 'audio',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
    zip: 'archive', rar: 'archive',
  };
  return map[ext] || 'other';
}

function getFileIcon(category, ext) {
  const icons = {
    document: '📄',
    presentation: '📊',
    spreadsheet: '📈',
    video: '🎬',
    audio: '🎵',
    image: '🖼️',
    archive: '📦',
    other: '📎',
  };
  return icons[category] || '📎';
}

function getFileIconBg(category) {
  const colors = {
    document: 'background:#deecf9',
    presentation: 'background:#fff4ce',
    spreadsheet: 'background:#dff6dd',
    video: 'background:#f4f0fa',
    audio: 'background:#fde7e9',
    image: 'background:#d0f0ef',
    archive: 'background:#edebe9',
    other: 'background:#edebe9',
  };
  return colors[category] || 'background:#edebe9';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderFileList() {
  const container = document.getElementById('file-list-container');
  if (!container) return;

  if (AppState.files.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--ms-gray-110);">
        <div style="font-size:48px; margin-bottom:16px; opacity:0.4">📂</div>
        <div style="font-size:14px; font-weight:600; margin-bottom:8px;">尚無上傳的檔案</div>
        <div style="font-size:12px;">在上方拖曳或點擊上傳你的作品集檔案</div>
      </div>
    `;
    return;
  }

  // Group by category
  const groups = {};
  AppState.files.forEach(f => {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category].push(f);
  });

  const categoryNames = {
    document: '📄 文件', presentation: '📊 簡報', spreadsheet: '📈 試算表',
    video: '🎬 影片', audio: '🎵 音訊', image: '🖼️ 圖片',
    archive: '📦 壓縮檔', other: '📎 其他',
  };

  let html = '';
  Object.entries(groups).forEach(([cat, files]) => {
    html += `
      <div style="margin-bottom:24px;">
        <div style="font-size:12px; font-weight:700; color:var(--ms-gray-110); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; padding:0 4px;">
          ${categoryNames[cat] || cat} <span style="color:var(--ms-gray-90); font-weight:400">(${files.length})</span>
        </div>
        <div class="file-list">
          ${files.map(f => `
            <div class="file-item" id="file-${f.id}">
              <div class="file-icon" style="${getFileIconBg(f.category)}">
                ${getFileIcon(f.category, f.type)}
              </div>
              <div class="file-info">
                <div class="file-name">${escapeHtml(f.name)}</div>
                <div class="file-meta">${formatFileSize(f.size)} • ${f.date} • ${f.type.toUpperCase()}</div>
              </div>
              <div class="file-actions">
                ${f.dataUrl && f.category === 'image' ? `
                  <button class="btn btn-sm btn-secondary" onclick="previewFile('${f.id}')" title="預覽">
                    👁️
                  </button>
                ` : ''}
                ${f.dataUrl ? `
                  <a class="btn btn-sm btn-secondary" href="${f.dataUrl}" download="${escapeHtml(f.name)}" title="下載">
                    ⬇️
                  </a>
                ` : ''}
                <button class="btn btn-sm" style="background:var(--ms-gray-20);color:var(--ms-gray-150);border-color:var(--ms-gray-40);" 
                  onclick="deleteFile('${f.id}')" title="刪除">
                  🗑️
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteFile(id) {
  AppState.files = AppState.files.filter(f => String(f.id) !== String(id));
  saveFiles();
  renderFileList();
  showToast('檔案已刪除', 'info');
}

function previewFile(id) {
  const file = AppState.files.find(f => String(f.id) === String(id));
  if (!file || !file.dataUrl) return;

  const modal = document.getElementById('preview-modal');
  const content = document.getElementById('preview-content');
  if (!modal || !content) return;

  content.innerHTML = `<img src="${file.dataUrl}" style="max-width:100%; border-radius:8px;" alt="${escapeHtml(file.name)}">`;
  document.getElementById('preview-title').textContent = file.name;
  modal.classList.add('active');
}

function saveFiles() {
  try {
    localStorage.setItem('portfolio_files', JSON.stringify(AppState.files));
  } catch(e) {
    console.warn('Storage full, clearing old data');
    AppState.files = AppState.files.slice(-20);
    localStorage.setItem('portfolio_files', JSON.stringify(AppState.files));
  }
}

// ============================================
// PROJECTS
// ============================================
const defaultProjects = [
  {
    id: 1,
    title: 'Microsoft Teams 功能優化提案',
    desc: '針對遠距協作場景，提出 Teams 會議功能改善方案，涵蓋用戶研究、PRD 撰寫與 KPI 設定。',
    type: 'PM',
    typeBadge: 'badge-blue',
    tags: ['用戶研究', 'PRD', 'A/B Testing', 'KPI'],
    icon: '📋',
    date: '2025-01',
    color: 'linear-gradient(135deg, #deecf9, #c7e0f4)'
  },
  {
    id: 2,
    title: '品牌宣傳影片 - TechTalk Series',
    desc: '主導拍攝、剪輯與後製，打造校園科技講座系列影片，YouTube 達 5,000+ 觀看次數。',
    type: '影音',
    typeBadge: 'badge-green',
    tags: ['Premiere Pro', '腳本撰寫', '顏色校正', 'YouTube SEO'],
    icon: '🎬',
    date: '2024-11',
    color: 'linear-gradient(135deg, #dff6dd, #c8f0c6)'
  },
  {
    id: 3,
    title: '產品路線圖規劃工具',
    desc: '開發內部 Roadmap 管理工具，整合 Azure DevOps API，協助 PM 團隊視覺化追蹤里程碑。',
    type: 'Tech',
    typeBadge: 'badge-orange',
    tags: ['React', 'Azure DevOps', 'REST API', 'TypeScript'],
    icon: '🛠️',
    date: '2024-09',
    color: 'linear-gradient(135deg, #fff4ce, #ffe8a3)'
  },
  {
    id: 4,
    title: 'Agile Sprint 管理流程改善',
    desc: '導入 OKR 框架與 Scrum 方法論，讓跨部門專案交付週期縮短 30%，並建立 Retrospective 文化。',
    type: 'PM',
    typeBadge: 'badge-blue',
    tags: ['Agile', 'Scrum', 'OKR', 'Stakeholder Management'],
    icon: '🔄',
    date: '2024-07',
    color: 'linear-gradient(135deg, #deecf9, #b3d6f2)'
  },
  {
    id: 5,
    title: '微軟 AI 產品體驗設計',
    desc: '參與 Copilot 使用者訪談設計，輸出 UX 洞察報告，提出 3 項功能改善建議被採納進 Backlog。',
    type: 'PM',
    typeBadge: 'badge-blue',
    tags: ['UX Research', 'Copilot', 'User Interview', 'Insight Report'],
    icon: '🤖',
    date: '2025-03',
    color: 'linear-gradient(135deg, #f4f0fa, #e8dfff)'
  },
  {
    id: 6,
    title: 'Motion Graphics 教學頻道',
    desc: '創立 After Effects 與 Premiere Pro 教學頻道，製作 20+ 支教學影片，累計訂閱 2,000+。',
    type: '影音',
    typeBadge: 'badge-green',
    tags: ['After Effects', 'Motion Graphics', '字幕製作', '影音剪輯'],
    icon: '✨',
    date: '2024-05',
    color: 'linear-gradient(135deg, #d0f0ef, #a0dedd)'
  },
];

function renderProjects(filter = 'all') {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  const projects = AppState.projects.length ? AppState.projects : defaultProjects;
  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);

  container.innerHTML = filtered.map(p => `
    <div class="project-card" onclick="openProjectDetail(${p.id})">
      <div class="project-thumbnail" style="background:${p.color || 'var(--ms-blue-light)'}">
        <div class="project-thumbnail-icon">${p.icon || '📁'}</div>
        <span class="project-type-badge ${p.typeBadge || 'badge-blue'}" 
          style="background:rgba(255,255,255,0.85); color:#333;">
          ${p.type}
        </span>
      </div>
      <div class="project-body">
        <div class="project-title">${escapeHtml(p.title)}</div>
        <div class="project-desc">${escapeHtml(p.desc)}</div>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="tag tag-blue">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="project-footer">
          <span class="project-date">📅 ${p.date}</span>
          <button class="btn btn-sm btn-secondary">查看詳情 →</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterProjects(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('btn-primary'));
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.style.background = '';
    b.style.color = '';
    b.style.borderColor = '';
  });
  btn.classList.add('btn-primary');
  renderProjects(type);
}

function openProjectDetail(id) {
  const projects = AppState.projects.length ? AppState.projects : defaultProjects;
  const p = projects.find(x => x.id === id);
  if (!p) return;

  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-type').textContent = p.type;
  document.getElementById('detail-date').textContent = p.date;
  document.getElementById('detail-desc').textContent = p.desc;
  document.getElementById('detail-tags').innerHTML = p.tags.map(t =>
    `<span class="tag tag-blue">${escapeHtml(t)}</span>`
  ).join('');
  document.getElementById('detail-icon').textContent = p.icon || '📁';

  document.getElementById('project-modal').classList.add('active');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// MODAL
// ============================================
function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

// ============================================
// PROFILE EDITING
// ============================================
function initEditableFields() {
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    // Load saved value
    const key = el.dataset.key;
    if (key && AppState.profile[key]) {
      el.textContent = AppState.profile[key];
    }

    el.addEventListener('blur', () => {
      const key = el.dataset.key;
      if (key) {
        AppState.profile[key] = el.textContent;
        localStorage.setItem('portfolio_profile', JSON.stringify(AppState.profile));
        showToast('已儲存變更', 'success');
      }
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      }
    });
  });
}

// ============================================
// AVATAR UPLOAD
// ============================================
function initAvatarUpload() {
  const uploadBtn = document.getElementById('avatar-upload-btn');
  const avatarInput = document.getElementById('avatar-input');
  const avatarEl = document.getElementById('hero-avatar');

  if (!uploadBtn || !avatarInput) return;

  // Load saved avatar
  const savedAvatar = localStorage.getItem('portfolio_avatar');
  if (savedAvatar && avatarEl) {
    avatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar">`;
  }

  uploadBtn.addEventListener('click', () => avatarInput.click());

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('請上傳圖片格式的大頭照', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target.result;
      if (avatarEl) avatarEl.innerHTML = `<img src="${url}" alt="avatar">`;
      localStorage.setItem('portfolio_avatar', url);
      showToast('大頭照已更新！', 'success');
    };
    reader.readAsDataURL(file);
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// ============================================
// MOBILE SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Init navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Init systems
  initUpload();
  initEditableFields();
  initAvatarUpload();

  // Navigate to default page
  navigate('about');

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  console.log('%c🚀 Microsoft MOI Portfolio Loaded', 'color: #0078d4; font-size: 14px; font-weight: bold;');
});
