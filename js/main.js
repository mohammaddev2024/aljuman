// Main JavaScript for Persian Magazine Website
class PersianMagazine {
    constructor() {
        this.currentSection = 'home';
        this.currentFilter = 'all';
        this.currentSearchTerm = '';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.showSection('home');
        this.updateFavoritesCount();
        // Apply site settings if available
        this.applySiteSettings();
    }

    applySiteSettings() {
        const settings = window.dataManager && window.dataManager.getSettings ? window.dataManager.getSettings() : null;
        if (!settings) return;

        // Site name
        const siteNameEls = document.querySelectorAll('.logo-text h1');
        siteNameEls.forEach(el => el.textContent = settings.siteName || el.textContent);

        // Tagline / subtitle
        const taglineEls = document.querySelectorAll('.logo-text .tagline');
        taglineEls.forEach(el => el.textContent = settings.tagline || settings.taglineText || el.textContent);

        // Logo
        const logoImg = document.querySelector('.logo-img');
        if (logoImg && (settings.logoUrl || settings.logo)) logoImg.src = settings.logoUrl || settings.logo;

        // Contact info
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail && settings.email) contactEmail.textContent = settings.email;
        const contactPhone = document.getElementById('contactPhone');
        if (contactPhone && settings.phone) contactPhone.textContent = settings.phone;
        // Address not part of settings by default but update if provided
        const contactAddress = document.getElementById('contactAddress');
        if (contactAddress && settings.address) contactAddress.textContent = settings.address;

        // Social links
        const socialLinks = {
            telegram: settings.social?.telegram,
            instagram: settings.social?.instagram,
            twitter: settings.social?.twitter,
            linkedin: settings.social?.linkedin
        };

        if (socialLinks.telegram) {
            const a = document.querySelector('a[aria-label="تلگرام"]');
            if (a) a.href = socialLinks.telegram;
        }
        if (socialLinks.instagram) {
            const a = document.querySelector('a[aria-label="اینستاگرام"]');
            if (a) a.href = socialLinks.instagram;
        }
        if (socialLinks.twitter) {
            const a = document.querySelector('a[aria-label="توییتر"]');
            if (a) a.href = socialLinks.twitter;
        }
        if (socialLinks.linkedin) {
            const a = document.querySelector('a[aria-label="لینکدین"]');
            if (a) a.href = socialLinks.linkedin;
        }

        // Footer text
        const footerTextEl = document.querySelector('.footer-bottom p');
        if (footerTextEl && settings.footerText) footerTextEl.textContent = settings.footerText;
    }

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link, .sidebar-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.dataset.section;
                if (section) {
                    this.showSection(section);
                    this.updateActiveNavigation(link);
                    
                    // Close mobile sidebar if open
                    this.closeMobileSidebar();
                }
            });
        });

        // Category filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
                this.updateActiveFilter(e.target);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentSearchTerm = e.target.value;
                    this.loadArticles();
                }, 300);
            });
        }

        // Favorites filter button
        const favoritesFilterBtn = document.getElementById('favoritesFilterBtn');
        if (favoritesFilterBtn) {
            favoritesFilterBtn.addEventListener('click', () => {
                this.showFavorites();
            });
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Mobile menu
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.openMobileSidebar.bind(this));
        }
        if (sidebarClose) {
            sidebarClose.addEventListener('click', this.closeMobileSidebar.bind(this));
        }
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', this.closeMobileSidebar.bind(this));
        }

        // Modal functionality
        this.setupModalEvents();

        // --- New: react to dataManager events so UI updates when server data arrives ---
        try {
            window.addEventListener('dataManager:initialized', (e) => {
                // Apply settings and update favorites count immediately
                this.applySiteSettings();
                this.updateFavoritesCount();
                // Re-render current section based on available data
                if (this.currentSection === 'home') this.loadArticles();
                if (this.currentSection === 'magazine') this.loadMagazines();
                if (this.currentSection === 'favorites') this.showFavorites();
            });

            window.addEventListener('dataManager:articlesUpdated', (e) => {
                if (this.currentSection === 'home') this.loadArticles();
                if (this.currentSection === 'favorites') this.loadFavorites();
                this.updateFavoritesCount();
            });

            window.addEventListener('dataManager:magazinesUpdated', (e) => {
                if (this.currentSection === 'magazine') this.loadMagazines();
            });

            window.addEventListener('dataManager:settingsUpdated', (e) => {
                this.applySiteSettings();
            });

            window.addEventListener('dataManager:favoritesUpdated', (e) => {
                this.updateFavoritesCount();
                if (this.currentSection === 'favorites') this.showFavorites();
            });

            window.addEventListener('dataManager:syncComplete', (e) => {
                // optional: visual indicator could be added
                console.info('dataManager syncComplete', e.detail);
            });
        } catch (err) { /* ignore */ }
    }

    setupModalEvents() {
        const modal = document.getElementById('articleModal');
        const modalClose = document.getElementById('modalClose');
        const shareBtn = document.getElementById('shareBtn');
        const favoriteBtn = document.getElementById('favoriteBtn');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', this.shareArticle.bind(this));
        }

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', this.toggleFavorite.bind(this));
        }

        // Magazine modal events
        this.setupMagazineModalEvents();
        
        // Admin login modal events
        this.setupAdminLoginModalEvents();

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal && modal.classList.contains('active')) {
                this.closeModal();
                }
                this.closeMagazineModal();
                this.closeAdminLoginModal();
            }
        });
    }

    setupMagazineModalEvents() {
        const addMagazineBtn = document.getElementById('addMagazineBtn');
        const magazineModal = document.getElementById('magazineModal');
        const magazineModalClose = document.getElementById('magazineModalClose');
        const magazineForm = document.getElementById('magazineForm');

        if (addMagazineBtn) {
            addMagazineBtn.addEventListener('click', () => {
                if (window.dataManager.checkAdminAuth()) {
                    this.openMagazineModal();
                } else {
                    this.openAdminLoginModal();
                }
            });
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

    setupAdminLoginModalEvents() {
        const adminLoginModal = document.getElementById('adminLoginModal');
        const adminLoginClose = document.getElementById('adminLoginClose');
        const adminLoginForm = document.getElementById('adminLoginForm');

        if (adminLoginClose) {
            adminLoginClose.addEventListener('click', () => this.closeAdminLoginModal());
        }

        if (adminLoginModal) {
            adminLoginModal.addEventListener('click', (e) => {
                if (e.target === adminLoginModal) this.closeAdminLoginModal();
            });
        }

        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        }

        // Submit form
        const submitForm = document.getElementById('submitForm');
        if (submitForm) {
            submitForm.addEventListener('submit', this.handleSubmitForm.bind(this));
        }
    }

    setupTheme() {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    openMobileSidebar() {
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    updateActiveNavigation(activeLink) {
        document.querySelectorAll('.nav-link, .sidebar-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
        
        // Also update corresponding link in other navigation
        const section = activeLink.dataset.section;
        document.querySelectorAll(`[data-section="${section}"]`).forEach(link => {
            link.classList.add('active');
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('favoritesFilterBtn').classList.remove('active');
        activeBtn.classList.add('active');
    }

    showFavorites() {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('favoritesFilterBtn').classList.add('active');
        
        // Load and show favorites
        const favorites = window.dataManager.getFavorites();
        this.renderArticles(favorites);
        
        if (favorites.length === 0) {
            this.showEmptyState(true);
        } else {
            this.showEmptyState(false);
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific content
        if (sectionName === 'home') {
            this.loadArticles();
        } else if (sectionName === 'favorites') {
            this.loadFavorites();
        } else if (sectionName === 'magazine') {
            this.loadMagazines();
        }

        // Show admin button for magazine section if authenticated
        const addMagazineBtn = document.getElementById('addMagazineBtn');
        if (addMagazineBtn) {
            addMagazineBtn.style.display = 
                (sectionName === 'magazine' && window.dataManager.checkAdminAuth()) ? 'flex' : 'none';
        }
    }

    filterByCategory(category) {
        this.currentFilter = category;
        if (this.currentSection === 'home') {
            this.loadArticles();
        }
    }

    async loadArticles() {
        this.showLoading(true);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        let articles;
        
        if (this.currentSearchTerm) {
            articles = window.dataManager.searchArticles(this.currentSearchTerm);
        } else {
            articles = window.dataManager.getArticlesByCategory(this.currentFilter);
        }

        this.renderArticles(articles);
        this.showLoading(false);

        if (articles.length === 0) {
            this.showEmptyState(true);
        } else {
            this.showEmptyState(false);
        }
    }

    async loadFavorites() {
        this.showLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 300));

        const favorites = window.dataManager.getFavorites();
        this.renderFavorites(favorites);
        this.showLoading(false);

        const favoritesEmptyState = document.getElementById('favoritesEmptyState');
        if (favoritesEmptyState) {
            favoritesEmptyState.style.display = favorites.length === 0 ? 'block' : 'none';
        }
    }

    async loadMagazines() {
        const magazineGrid = document.getElementById('magazineGrid');
        const magazineEmptyState = document.getElementById('magazineEmptyState');

        let magazines = [];
        try {
            const res = await fetch('api/magazines.php', { credentials: 'same-origin' });
            if (res.ok) {
                const json = await res.json().catch(() => null);
                if (Array.isArray(json) && json.length > 0) {
                    magazines = json;
                } else {
                    console.warn('سرور: لیست مجلات خالی است یا فرمت نادرست است، بازگشت به داده‌های محلی');
                }
            } else {
                console.warn('سرور: پاسخ ناموفق برای magazines.php', res.status);
            }
        } catch (err) {
            console.warn('خطا در اتصال به سرور برای دریافت مجلات:', err);
        }

        // fallback to local if server didn't return any
        if ((!magazines || magazines.length === 0) && window.dataManager) {
            magazines = window.dataManager.getAllMagazines();
        }

        // render
        if (magazines && magazines.length > 0) {
            this.renderMagazines(magazines);
            if (magazineEmptyState) magazineEmptyState.style.display = 'none';
        } else {
            if (magazineGrid) magazineGrid.innerHTML = '';
            if (magazineEmptyState) magazineEmptyState.style.display = 'block';
        }
    }

    renderArticles(articles) {
        const articlesGrid = document.getElementById('articlesGrid');
        if (!articlesGrid) return;

        articlesGrid.innerHTML = '';

        articles.forEach(article => {
            const articleCard = this.createArticleCard(article);
            articlesGrid.appendChild(articleCard);
        });

        // Add animation class
        articlesGrid.classList.add('fade-in');
        setTimeout(() => articlesGrid.classList.remove('fade-in'), 500);
    }

    renderFavorites(favorites) {
        const favoritesGrid = document.getElementById('favoritesGrid');
        if (!favoritesGrid) return;

        favoritesGrid.innerHTML = '';

        favorites.forEach(article => {
            const articleCard = this.createArticleCard(article);
            favoritesGrid.appendChild(articleCard);
        });

        favoritesGrid.classList.add('fade-in');
        setTimeout(() => favoritesGrid.classList.remove('fade-in'), 500);
    }

    renderMagazines(magazines) {
        const magazineGrid = document.getElementById('magazineGrid');
        if (!magazineGrid) return;

        magazineGrid.innerHTML = '';

        magazines.forEach(magazine => {
            const magazineCard = this.createMagazineCard(magazine);
            magazineGrid.appendChild(magazineCard);
        });
    }

    // Helper to resolve author photo to an absolute, usable URL or null when absent
    normalizeAuthorPhoto(authorPhoto) {
        try {
            if (!authorPhoto || typeof authorPhoto !== 'string') return null;
            let src = authorPhoto.trim();
            if (!src) return null;

            // data URI or absolute http(s)
            if (/^(data:|https?:\/\/)/i.test(src)) return src;

            // Starts with project-relative slash (e.g. /assets/uploads/..)
            if (/^\/assets\//i.test(src)) return window.location.origin + src;

            // Starts with assets/uploads without leading slash
            if (/^assets\/uploads\//i.test(src)) return window.location.origin + '/' + src.replace(/^\/+/, '');

            // May contain ../ or ./ segments - normalize by taking basename
            const parts = src.split(/[\\/]+/);
            const filename = parts[parts.length - 1] || src;
            return window.location.origin + '/assets/uploads/' + filename.replace(/^\/+/, '');
        } catch (err) {
            return null;
        }
    }

    // Try to locate any plausible author-photo value inside the article object
    getAuthorPhotoFromArticle(article) {
        if (!article || typeof article !== 'object') return null;

        const candidates = [];

        // Common keys to check first
        ['authorPhoto','author_photo','authorImage','author_image','avatar','photo','image','author_avatar'].forEach(k => {
            if (article[k] && typeof article[k] === 'string') candidates.push(article[k]);
        });

        // Scan all string fields for anything that looks like an image or assets/uploads path
        Object.keys(article).forEach(k => {
            const v = article[k];
            if (typeof v === 'string') {
                if (/assets[\\/]+uploads|\\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(v)) {
                    candidates.push(v);
                }
            }
        });

        // Remove duplicates and falsy
        const uniq = Array.from(new Set(candidates.filter(Boolean)));

        // Prefer non-default images (avoid the known placeholder)
        const defaultAvatar = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150';
        const chosen = uniq.find(s => s.trim() && s.indexOf(defaultAvatar) === -1) || uniq[0] || null;

        return chosen;
    }

    createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.addEventListener('click', () => this.openArticleModal(article));

        // Resolve author photo: prefer specific fields or any candidate found inside the article
        const candidate = this.getAuthorPhotoFromArticle(article) || article.authorPhoto || article.author_photo || '';
        let resolvedAuthorPhoto = this.normalizeAuthorPhoto(candidate); // may be null

        // Add a conservative cache-buster only for same-origin images (avoid for data: or external CDN)
        let imgSrc = resolvedAuthorPhoto;
        try {
            if (resolvedAuthorPhoto && !/^data:/i.test(resolvedAuthorPhoto) && resolvedAuthorPhoto.startsWith(window.location.origin)) {
                imgSrc = resolvedAuthorPhoto + '?v=' + (article._photoVersion || article.id || Date.now());
            }
        } catch (e) { imgSrc = resolvedAuthorPhoto; }

        const formattedDate = window.dataManager.formatDate(article.createdAt);
        const categoryLabel = window.dataManager.getCategoryLabel(article.category);
        const excerptText = article.excerpt || (window.dataManager.generateExcerpt ? window.dataManager.generateExcerpt(article.content, 200) : '');

        // Build header: include image only when available
        const header = document.createElement('div');
        header.className = 'card-header';

        if (imgSrc) {
            const img = document.createElement('img');
            img.className = 'author-avatar';
            img.loading = 'lazy';
            img.alt = article.author || '';
            img.src = imgSrc;
            // on error hide the img element instead of showing default
            img.onerror = function() { this.style.display = 'none'; };
            header.appendChild(img);
        }

        const authorInfo = document.createElement('div');
        authorInfo.className = 'author-info';
        const h4 = document.createElement('h4');
        h4.textContent = article.author || '';
        const spanDate = document.createElement('span');
        spanDate.className = 'article-date';
        spanDate.textContent = formattedDate || '';
        authorInfo.appendChild(h4);
        authorInfo.appendChild(spanDate);

        header.appendChild(authorInfo);

        const content = document.createElement('div');
        content.className = 'card-content';
        content.innerHTML = `
            <h3 class="card-title">${article.title || ''}</h3>
            <p class="card-excerpt">${excerptText}</p>
            <div class="card-footer">
                <div class="card-tags">
                    ${Array.isArray(article.tags) ? article.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
                <span class="category-badge ${article.category || ''}">${categoryLabel}</span>
            </div>
        `;

        card.appendChild(header);
        card.appendChild(content);

        // image errors handled by individual img.onerror above

         return card;
     }

    openArticleModal(article) {
        const modal = document.getElementById('articleModal');
        const modalContent = document.getElementById('modalContent');
        const favoriteBtn = document.getElementById('favoriteBtn');

        if (!modal || !modalContent) return;

        const formattedDate = window.dataManager.formatDate(article.createdAt);
        const categoryLabel = window.dataManager.getCategoryLabel(article.category);

        const authorCandidate = this.getAuthorPhotoFromArticle(article) || article.authorPhoto || article.author_photo || '';
        const authorImg = this.normalizeAuthorPhoto(authorCandidate);

        // Add cache buster for modal image too
        let modalImgSrc = authorImg;
        try {
            if (authorImg && !/^data:/i.test(authorImg) && authorImg.startsWith(window.location.origin)) {
                modalImgSrc = authorImg + '?v=' + (article._photoVersion || article.id || Date.now());
            }
        } catch (e) { modalImgSrc = authorImg; }

        // Build modal content dynamically so we can omit the image when not available
        const headerHtml = `
            <div class="modal-article-header">
                <h1 class="modal-article-title">${article.title}</h1>
                <div class="modal-article-meta">
                ${modalImgSrc ? `<img src="${modalImgSrc}" alt="${article.author}" class="author-avatar">` : ''}
                    <div class="author-info">
                        <h4>${article.author}</h4>
                        <span class="article-date">${formattedDate}</span>
                    </div>
                    <span class="category-badge ${article.category}">${categoryLabel}</span>
                </div>
            </div>`;

        modalContent.innerHTML = headerHtml + `
            <div class="modal-article-content">
                ${article.content}
            </div>
            <div class="modal-article-tags">
                <strong>برچسب‌ها:</strong>
                <div class="card-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>`;

        // If modal image exists, hide it on error
        const modalImg = modalContent.querySelector('.author-avatar');
        if (modalImg) {
            modalImg.onerror = function() { this.style.display = 'none'; };
        }

         // Update favorite button state
         if (favoriteBtn) {
             const isFavorited = window.dataManager.isFavorite(article.id);
             favoriteBtn.classList.toggle('active', isFavorited);
             const icon = favoriteBtn.querySelector('i');
             icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
             favoriteBtn.dataset.articleId = article.id;
         }

         // Set article ID for sharing
         document.getElementById('shareBtn').dataset.articleId = article.id;

         modal.classList.add('active');
         document.body.style.overflow = 'hidden';
     }

     closeModal() {
        const modal = document.getElementById('articleModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    toggleFavorite() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        const articleId = favoriteBtn.dataset.articleId;
        
        if (!articleId) return;

        const isFavorited = window.dataManager.isFavorite(articleId);
        const icon = favoriteBtn.querySelector('i');

        if (isFavorited) {
            window.dataManager.removeFavorite(articleId);
            favoriteBtn.classList.remove('active');
            icon.className = 'far fa-heart';
            this.showToast('مقاله از علاقه‌مندی‌ها حذف شد');
        } else {
            window.dataManager.addFavorite(articleId);
            favoriteBtn.classList.add('active');
            icon.className = 'fas fa-heart';
            this.showToast('مقاله به علاقه‌مندی‌ها اضافه شد');
        }
        
        this.updateFavoritesCount();
        
        // Refresh favorites section if currently viewing
        if (this.currentSection === 'favorites') {
            this.loadFavorites();
        }
    }

    shareArticle() {
        const shareBtn = document.getElementById('shareBtn');
        const articleId = shareBtn.dataset.articleId;
        const article = window.dataManager.getArticleById(articleId);
        
        if (!article) return;

        const excerptText = article.excerpt || (window.dataManager.generateExcerpt ? window.dataManager.generateExcerpt(article.content, 200) : '');

        const shareData = {
            title: article.title,
            text: excerptText,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare(shareData);
            });
        } else {
            this.fallbackShare(shareData);
        }
    }

    fallbackShare(shareData) {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('لینک مقاله کپی شد');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('لینک مقاله کپی شد');
        }
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

    openAdminLoginModal() {
        const adminLoginModal = document.getElementById('adminLoginModal');
        if (adminLoginModal) {
            adminLoginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAdminLoginModal() {
        const adminLoginModal = document.getElementById('adminLoginModal');
        if (adminLoginModal) {
            adminLoginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            document.getElementById('adminLoginForm').reset();
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
            this.showToast('شماره جدید مجله با موفقیت اضافه شد');
            this.closeMagazineModal();
            this.loadMagazines();
        } catch (error) {
            console.error('Error adding magazine:', error);
            this.showToast('خطا در افزودن شماره مجله');
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (window.dataManager.adminLogin(username, password)) {
            this.showToast('ورود موفقیت‌آمیز بود');
            this.closeAdminLoginModal();
            
            // Show admin button if in magazine section
            if (this.currentSection === 'magazine') {
                const addMagazineBtn = document.getElementById('addMagazineBtn');
                if (addMagazineBtn) {
                    addMagazineBtn.style.display = 'flex';
                }
            }
        } else {
            this.showToast('نام کاربری یا رمز عبور اشتباه است');
        }
    }

    async handleSubmitForm(e) {
        e.preventDefault();
        
        const title = document.getElementById('submitTitle').value;
        const author = document.getElementById('submitAuthor').value;
        const email = document.getElementById('submitEmail').value;
        const category = document.getElementById('submitCategory').value;
        const content = document.getElementById('submitContent').value;

        // In a real application, this would be sent to a server
        // For now, we'll just show a success message
        this.showToast('مقاله شما با موفقیت ارسال شد و در انتظار بررسی است');
        e.target.reset();
    }

    deleteMagazine(magazineId) {
        const magazine = window.dataManager.getMagazineById(magazineId);
        if (!magazine) return;

        const confirmed = confirm(`آیا مطمئن هستید که می‌خواهید "${magazine.title}" را حذف کنید؟`);
        if (!confirmed) return;

        try {
            window.dataManager.deleteMagazine(magazineId);
            this.showToast('شماره مجله با موفقیت حذف شد');
            this.loadMagazines();
        } catch (error) {
            console.error('Error deleting magazine:', error);
            this.showToast('خطا در حذف شماره مجله');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.add('active');
            } else {
                loading.classList.remove('active');
            }
        }
    }

    showEmptyState(show) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = show ? 'block' : 'none';
        }
    }

    updateFavoritesCount() {
        const favoritesCount = document.querySelector('.favorites-filter-btn .favorites-count');
        const count = window.dataManager.getFavorites().length;
        
        if (favoritesCount) {
            favoritesCount.textContent = count;
            if (count > 0) {
                favoritesCount.classList.add('show');
            } else {
                favoritesCount.classList.remove('show');
            }
        }
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the magazine when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.persianMagazine = new PersianMagazine();
});

// Global functions for onclick handlers
window.closeMagazineModal = () => {
    if (window.persianMagazine) {
        window.persianMagazine.closeMagazineModal();
    }
};

window.closeAdminLoginModal = () => {
    if (window.persianMagazine) {
        window.persianMagazine.closeAdminLoginModal();
    }
};

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);