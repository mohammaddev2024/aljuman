// Admin Panel JavaScript for Persian Magazine
class AdminPanel {
    constructor() {
        this.currentTab = 'add';
        this.editingArticleId = null;
        this.init();
    }

    init() {
        // Check admin authentication (development: do not redirect automatically)
        if (!window.dataManager.checkAdminAuth()) {
            // For production uncomment the lines below to enforce login and redirect unauthenticated users:
            // window.location.href = 'index.html';
            // return;
            console.warn('Admin not authenticated — continuing in dev mode.');
        }
        
        this.setupEventListeners();
        this.loadManageArticles();
        this.updateStats();
        this.switchTab(this.currentTab);
        this.setupFileUploads();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // use the button's dataset instead of e.target (which can be the icon or text)
                const tab = btn.dataset.tab || (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.tab) || (e.target && e.target.dataset && e.target.dataset.tab);
                if (!tab) return;
                this.switchTab(tab);
            });
        });

        // Initialize Quill editors after DOM load
        setTimeout(() => {
            try {
                const ImageResize = Quill.import('modules/imageResize');
            } catch (e) {}

            // Only init main editor if the container exists
            const editorEl = document.getElementById('editor');
            if (editorEl) {
                this.quill = new Quill('#editor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'align': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            [{ 'size': ['small', false, 'large', 'huge'] }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['clean']
                        ],
                        imageResize: {}
                    }
                });
            }

            // Only init edit editor if the container exists
            const editEditorEl = document.getElementById('editEditor');
            if (editEditorEl) {
                this.editQuill = new Quill('#editEditor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'align': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            [{ 'size': ['small', false, 'large', 'huge'] }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['clean']
                        ],
                        imageResize: {}
                    }
                });
            }
        }, 200);

        // Article form submission
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            articleForm.addEventListener('submit', this.handleArticleSubmit.bind(this));
        }

        // Edit form submission
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', this.handleEditSubmit.bind(this));
        }

        // Search and filter in manage tab
        const manageSearch = document.getElementById('manageSearch');
        if (manageSearch) {
            let searchTimeout;
            manageSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterManageArticles();
                }, 300);
            });
        }

        const manageCategory = document.getElementById('manageCategory');
        if (manageCategory) {
            manageCategory.addEventListener('change', this.filterManageArticles.bind(this));
        }

        // Edit modal events
        this.setupEditModalEvents();

        // Magazine events
        this.setupMagazineEvents();

        // Logout
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', this.handleSettingsSubmit.bind(this));
        }
    }

    setupEditModalEvents() {
        const editModal = document.getElementById('editModal');
        const editModalClose = document.getElementById('editModalClose');

        if (editModalClose) {
            editModalClose.addEventListener('click', () => this.closeEditModal());
        }

        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) this.closeEditModal();
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModal && editModal.classList.contains('active')) {
                this.closeEditModal();
            }
        });
    }

    setupMagazineEvents() {
        const addMagazineBtn = document.getElementById('addMagazineBtn');
        const magazineModal = document.getElementById('magazineModal');
        const magazineModalClose = document.getElementById('magazineModalClose');
        const magazineForm = document.getElementById('magazineForm');

        if (addMagazineBtn) {
            addMagazineBtn.addEventListener('click', () => this.openMagazineModal());
        }

        if (magazineModalClose) {
            magazineModalClose.addEventListener('click', () => this.closeMagazineModal());
        }

        if (magazineModal) {
            magazineModal.addEventListener('click', (e) => {
                if (e.target === magazineModal) this.closeMagazineModal();
            });
        }

        if (magazineForm) {
            magazineForm.addEventListener('submit', this.handleMagazineSubmit.bind(this));
        }
    }

    switchTab(tabName) {
        if (!tabName) return; // guard against invalid clicks
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn && btn.classList) btn.classList.remove('active');
        });
        const btnEl = document.querySelector(`[data-tab="${tabName}"]`);
        if (btnEl && btnEl.classList) btnEl.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content && content.classList) content.classList.remove('active');
        });
        const contentEl = document.getElementById(`${tabName}Tab`);
        if (!contentEl) return; // nothing to show
        if (contentEl && contentEl.classList) contentEl.classList.add('active');

        this.currentTab = tabName;

        // Refresh content based on active tab
        if (tabName === 'manage') {
            this.loadManageArticles();
        } else if (tabName === 'magazines') {
            this.loadMagazines();
        } else if (tabName === 'stats') {
            this.updateStats();
        } else if (tabName === 'settings') {
            this.loadSettingsForm();
        }
    }

    async handleArticleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        // Get HTML from Quill
        const contentHtml = this.quill ? this.quill.root.innerHTML : (formData.get('content') || document.getElementById('content').value);
        
        const articleData = {
             title: formData.get('title') || document.getElementById('title').value,
             author: formData.get('author') || document.getElementById('author').value,
             authorPhoto: formData.get('authorPhoto') || document.getElementById('authorPhoto').value,
             category: formData.get('category') || document.getElementById('category').value,
             tags: (formData.get('tags') || document.getElementById('tags').value).split(',').map(tag => tag.trim()).filter(Boolean),
            content: contentHtml
         };

        // Wrap content in paragraphs if not already formatted
        if (articleData.content && !articleData.content.includes('<p>') && !articleData.content.includes('<div')) {
            articleData.content = `<p>${articleData.content}</p>`;
        }

        try {
            const newArticle = window.dataManager.addArticle(articleData);
            this.showMessage('مقاله با موفقیت اضافه شد', 'success');
            e.target.reset();
            if (this.quill) this.quill.setContents([]);
            const featuredPreview = document.getElementById('featuredPreview'); if (featuredPreview) featuredPreview.innerHTML = '';
            
            // Update manage tab if it's visible
            if (this.currentTab === 'manage') {
                this.loadManageArticles();
            }
        } catch (error) {
            console.error('Error adding article:', error);
            this.showMessage('خطا در افزودن مقاله', 'error');
        }
    }

    loadManageArticles() {
        const articles = window.dataManager.getAllArticles();
        this.renderManageTable(articles);
    }

    filterManageArticles() {
        const searchTerm = document.getElementById('manageSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('manageCategory').value;
        
        let articles = window.dataManager.getAllArticles();
        
        if (categoryFilter) {
            articles = articles.filter(article => article.category === categoryFilter);
        }
        
        if (searchTerm) {
            articles = articles.filter(article => 
                article.title.toLowerCase().includes(searchTerm) ||
                article.author.toLowerCase().includes(searchTerm) ||
                article.content.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderManageTable(articles);
    }

    renderManageTable(articles) {
        const tableBody = document.getElementById('articlesTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (articles.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        هیچ مقاله‌ای یافت نشد
                    </td>
                </tr>
            `;
            return;
        }

        articles.forEach(article => {
            const row = document.createElement('tr');
            const formattedDate = window.dataManager.formatDate(article.createdAt);
            const categoryLabel = window.dataManager.getCategoryLabel(article.category);
            
            row.innerHTML = `
                <td>
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${article.title}
                    </div>
                </td>
                <td>${article.author}</td>
                <td>
                    <span class="category-badge ${article.category}">${categoryLabel}</span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div class="table-actions">
                        <button class="edit-btn" onclick="adminPanel.editArticle('${article.id}')">
                            <i class="fas fa-edit"></i> ویرایش
                        </button>
                        <button class="delete-btn" onclick="adminPanel.deleteArticle('${article.id}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    editArticle(articleId) {
        const article = window.dataManager.getArticleById(articleId);
        if (!article) return;

        this.editingArticleId = articleId;

        // Fill the edit form
        document.getElementById('editId').value = article.id;
        document.getElementById('editTitle').value = article.title;
        document.getElementById('editAuthor').value = article.author;
        document.getElementById('editAuthorPhoto').value = article.authorPhoto || '';
        document.getElementById('editCategory').value = article.category;
        document.getElementById('editTags').value = article.tags.join(', ');
        
        // Populate Quill editor with existing HTML
        if (this.editQuill) {
            this.editQuill.root.innerHTML = article.content || '';
        } else {
            const plainContent = article.content.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim();
            document.getElementById('editContent').value = plainContent;
        }

        // Show modal
        const editModal = document.getElementById('editModal');
        editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        
        const articleId = this.editingArticleId;
        if (!articleId) return;

        const updatedData = {
             title: document.getElementById('editTitle').value,
             author: document.getElementById('editAuthor').value,
             authorPhoto: document.getElementById('editAuthorPhoto').value,
             category: document.getElementById('editCategory').value,
             tags: document.getElementById('editTags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            content: this.editQuill ? this.editQuill.root.innerHTML : document.getElementById('editContent').value.replace(/\n/g, '</p><p>')
         };

        // Wrap content in paragraphs if not already formatted
        if (updatedData.content && !updatedData.content.includes('<p>') && !updatedData.content.includes('<div')) {
            updatedData.content = `<p>${updatedData.content}</p>`;
        }

        try {
            window.dataManager.updateArticle(articleId, updatedData);
            this.showMessage('مقاله با موفقیت به‌روزرسانی شد', 'success');
            this.closeEditModal();
            this.loadManageArticles();
        } catch (error) {
            console.error('Error updating article:', error);
            this.showMessage('خطا در به‌روزرسانی مقاله', 'error');
        }
    }

    closeEditModal() {
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            this.editingArticleId = null;
        }
    }

    async deleteArticle(articleId) {
        const article = window.dataManager.getArticleById(articleId);
        if (!article) return;

        const confirmed = confirm(`آیا مطمئن هستید که می‌خواهید مقاله "${article.title}" را حذف کنید؟`);
        if (!confirmed) return;

        try {
            window.dataManager.deleteArticle(articleId);
            this.showMessage('مقاله با موفقیت حذف شد', 'success');
            this.loadManageArticles();
            this.updateStats();
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showMessage('خطا در حذف مقاله', 'error');
        }
    }

    loadMagazines() {
        const magazines = window.dataManager.getAllMagazines();
        this.renderMagazines(magazines);
    }

    renderMagazines(magazines) {
        const magazinesGrid = document.getElementById('magazinesGrid');
        if (!magazinesGrid) return;

        magazinesGrid.innerHTML = '';

        if (magazines.length === 0) {
            magazinesGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;">
                    <i class="fas fa-book-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>هنوز شماره‌ای از مجله اضافه نشده</h3>
                    <p>با کلیک بر روی دکمه "افزودن شماره جدید" اولین شماره را اضافه کنید</p>
                </div>
            `;
            return;
        }

        magazines.forEach(magazine => {
            const magazineCard = this.createMagazineCard(magazine);
            magazinesGrid.appendChild(magazineCard);
        });
    }

    createMagazineCard(magazine) {
        const card = document.createElement('div');
        card.className = 'admin-magazine-card';

        const monthName = window.dataManager.getMonthName(magazine.month);
        const defaultCover = 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400';
        const coverImage = magazine.coverImage || defaultCover;

        card.innerHTML = `
            <img src="${coverImage}" alt="${magazine.title}" class="admin-magazine-cover" loading="lazy">
            <div class="admin-magazine-info">
                <h3 class="admin-magazine-title">${magazine.title}</h3>
                <p class="admin-magazine-date">${monthName} ${magazine.year}</p>
                <p class="magazine-description">${magazine.description || ''}</p>
                <div class="admin-magazine-actions">
                    <button class="view-btn" onclick="window.open('${magazine.pdfUrl}', '_blank')">
                        <i class="fas fa-eye"></i>
                        مشاهده
                    </button>
                    <button class="delete-magazine-btn" onclick="adminPanel.deleteMagazine('${magazine.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    openMagazineModal() {
        const magazineModal = document.getElementById('magazineModal');
        if (magazineModal) {
            magazineModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMagazineModal() {
        const magazineModal = document.getElementById('magazineModal');
        if (magazineModal) {
            magazineModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            document.getElementById('magazineForm').reset();
        }
    }

    async handleMagazineSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const magazineData = {
            title: formData.get('title') || document.getElementById('magazineTitle').value,
            month: parseInt(formData.get('month') || document.getElementById('magazineMonth').value),
            year: parseInt(formData.get('year') || document.getElementById('magazineYear').value),
            description: formData.get('description') || document.getElementById('magazineDescription').value,
            coverImage: formData.get('coverImage') || document.getElementById('magazineCover').value,
            pdfUrl: formData.get('pdfUrl') || document.getElementById('magazinePdf').value
        };

        try {
            window.dataManager.addMagazine(magazineData);
            this.showMessage('شماره جدید مجله با موفقیت اضافه شد', 'success');
            this.closeMagazineModal();
            this.loadMagazines();
            this.updateStats();
        } catch (error) {
            console.error('Error adding magazine:', error);
            this.showMessage('خطا در افزودن شماره مجله', 'error');
        }
    }

    deleteMagazine(magazineId) {
        const magazine = window.dataManager.getMagazineById(magazineId);
        if (!magazine) return;

        const confirmed = confirm(`آیا مطمئن هستید که می‌خواهید "${magazine.title}" را حذف کنید؟`);
        if (!confirmed) return;

        try {
            window.dataManager.deleteMagazine(magazineId);
            this.showMessage('شماره مجله با موفقیت حذف شد', 'success');
            this.loadMagazines();
            this.updateStats();
        } catch (error) {
            console.error('Error deleting magazine:', error);
            this.showMessage('خطا در حذف شماره مجله', 'error');
        }
    }

    updateStats() {
        const stats = window.dataManager.getStats();
        
        // Update stat cards
        const totalArticles = document.getElementById('totalArticles');
        const totalMagazines = document.getElementById('totalMagazines');
        const totalFavorites = document.getElementById('totalFavorites');
        
        if (totalArticles) totalArticles.textContent = stats.totalArticles;
        if (totalMagazines) totalMagazines.textContent = stats.totalMagazines;
        if (totalFavorites) totalFavorites.textContent = stats.totalFavorites;

        // Update category chart
        this.renderCategoryChart(stats.categoryStats);
    }

    renderCategoryChart(categoryStats) {
        const categoryChart = document.getElementById('categoryChart');
        if (!categoryChart) return;

        const categories = {
            'technology': 'فناوری',
            'art': 'هنر', 
            'culture': 'فرهنگ',
            'science': 'علم'
        };

        categoryChart.innerHTML = '';

        Object.entries(categories).forEach(([key, label]) => {
            const count = categoryStats[key] || 0;
            const statDiv = document.createElement('div');
            statDiv.className = 'category-stat';
            statDiv.innerHTML = `
                <span>${label}</span>
                <span>${count} مقاله</span>
            `;
            categoryChart.appendChild(statDiv);
        });
    }

    handleLogout() {
        const confirmed = confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟');
        if (confirmed) {
            window.dataManager.adminLogout();
            window.location.href = 'index.html';
        }
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;

        // Insert at the top of the current tab content
        const activeTabContent = document.querySelector('.tab-content.active');
        if (activeTabContent) {
            activeTabContent.insertBefore(messageDiv, activeTabContent.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Settings handlers
    loadSettingsForm() {
        const settings = window.dataManager.getSettings();
        if (!settings) return;

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setValue('siteName', settings.siteName);
        setValue('siteTagline', settings.tagline || settings.taglineText || '');
        setValue('siteLogo', settings.logoUrl || settings.logo || '');
        setValue('sitePhone', settings.phone);
        setValue('siteEmail', settings.email);
        setValue('socialTelegram', (settings.social && settings.social.telegram) || '');
        setValue('socialInstagram', (settings.social && settings.social.instagram) || '');
        setValue('socialTwitter', (settings.social && settings.social.twitter) || '');
        setValue('socialLinkedin', (settings.social && settings.social.linkedin) || '');
        setValue('footerText', settings.footerText || '');
    }

    async handleSettingsSubmit(e) {
        e.preventDefault();
        const settingsData = {
            siteName: document.getElementById('siteName')?.value || '',
            tagline: document.getElementById('siteTagline')?.value || '',
            logoUrl: document.getElementById('siteLogo')?.value || '',
            phone: document.getElementById('sitePhone')?.value || '',
            email: document.getElementById('siteEmail')?.value || '',
            social: {
                telegram: document.getElementById('socialTelegram')?.value || '',
                instagram: document.getElementById('socialInstagram')?.value || '',
                twitter: document.getElementById('socialTwitter')?.value || '',
                linkedin: document.getElementById('socialLinkedin')?.value || ''
            },
            footerText: document.getElementById('footerText')?.value || ''
        };

        try {
            window.dataManager.updateSettings(settingsData);
            this.showMessage('تنظیمات با موفقیت ذخیره شد', 'success');
            // Optionally update admin header/logo immediately
            const logoImg = document.querySelector('.admin-nav img, .logo-img');
            if (logoImg && settingsData.logoUrl) logoImg.src = settingsData.logoUrl;
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('خطا در ذخیره تنظیمات', 'error');
        }
    }

    setupFileUploads() {
        // Magazine cover upload
        const coverInput = document.getElementById('magazineCoverFile');
        const coverUrlInput = document.getElementById('magazineCover');
        const coverPreview = document.getElementById('magazineCoverPreview');

        if (coverInput && coverUrlInput) {
            coverInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                try {
                    const res = await fetch('api/upload.php', { method: 'POST', body: form });
                    const json = await res.json();
                    if (json && json.url) {
                        coverUrlInput.value = json.url;
                        if (coverPreview) coverPreview.src = json.url;
                        this.showToast('تصویر جلد آپلود و قرار داده شد');
                    } else {
                        this.showToast('خطا در آپلود تصویر');
                    }
                } catch (err) {
                    console.error('Upload error', err);
                    this.showToast('خطا در آپلود تصویر');
                }
            });
        }
        // if a cover URL already exists (e.g., editing), show preview
        try { if (coverPreview && coverUrlInput && coverUrlInput.value) coverPreview.src = coverUrlInput.value; } catch(e){}

        // Magazine PDF upload
        const pdfInput = document.getElementById('magazinePdfFile');
        const pdfUrlInput = document.getElementById('magazinePdf');
        const pdfNameEl = document.getElementById('magazinePdfName');
        if (pdfInput && pdfUrlInput) {
            pdfInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                try {
                    const res = await fetch('api/upload.php', { method: 'POST', body: form });
                    const json = await res.json();
                    if (json && json.url) {
                        pdfUrlInput.value = json.url;
                        if (pdfNameEl) pdfNameEl.textContent = file.name;
                        this.showToast('فایل PDF آپلود و قرار داده شد');
                    } else {
                        this.showToast('خطا در آپلود PDF');
                    }
                } catch (err) {
                    console.error('Upload error', err);
                    this.showToast('خطا در آپلود PDF');
                }
            });
        }
        try { if (pdfNameEl && pdfUrlInput && pdfUrlInput.value) pdfNameEl.textContent = pdfUrlInput.value.split('/').pop(); } catch(e){}

        // Edit-author photo upload (edit modal)
        const editAuthorFile = document.getElementById('editAuthorPhotoFile');
        const editAuthorUrl = document.getElementById('editAuthorPhoto');
        const editAuthorPreview = document.getElementById('editAuthorPhotoPreview');
        if (editAuthorFile && editAuthorUrl) {
            editAuthorFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                try {
                    const res = await fetch('api/upload.php', { method: 'POST', body: form });
                    const json = await res.json();
                    if (json && json.url) {
                        editAuthorUrl.value = json.url;
                        if (editAuthorPreview) editAuthorPreview.src = json.url;
                        this.showToast('تصویر نویسنده آپلود شد');
                    } else {
                        this.showToast('خطا در آپلود تصویر نویسنده');
                    }
                } catch (err) {
                    console.error('Upload error', err);
                    this.showToast('خطا در آپلود تصویر نویسنده');
                }
            });
        }
        try { if (editAuthorPreview && editAuthorUrl && editAuthorUrl.value) editAuthorPreview.src = editAuthorUrl.value; } catch(e){}

        // Author photo upload in article editor (if present)
        const authorPhotoInput = document.getElementById('authorPhotoFile');
        const authorPhotoUrl = document.getElementById('authorPhoto');
        const authorPreview = document.getElementById('authorPhotoPreview');

        if (authorPhotoInput && authorPhotoUrl) {
            authorPhotoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                try {
                    const res = await fetch('api/upload.php', { method: 'POST', body: form });
                    const json = await res.json();
                    if (json && json.url) {
                        authorPhotoUrl.value = json.url;
                        if (authorPreview) authorPreview.src = json.url;
                        this.showToast('تصویر نویسنده آپلود شد');
                    } else {
                        this.showToast('خطا در آپلود تصویر نویسنده');
                    }
                } catch (err) {
                    console.error('Upload error', err);
                    this.showToast('خطا در آپلود تصویر نویسنده');
                }
            });
        }
        try { if (authorPreview && authorPhotoUrl && authorPhotoUrl.value) authorPreview.src = authorPhotoUrl.value; } catch(e){}
    }
}

// Make functions globally available for onclick handlers
window.adminPanel = null;

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Global functions for onclick handlers
window.closeEditModal = () => {
    if (window.adminPanel) {
        window.adminPanel.closeEditModal();
    }
};

window.closeMagazineModal = () => {
    if (window.adminPanel) {
        window.adminPanel.closeMagazineModal();
    }
};