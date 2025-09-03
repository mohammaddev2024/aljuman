// Database Management System for Persian Magazine
class DatabaseManager {
    constructor() {
        this.dbName = 'PersianMagazineDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        // Initialize with localStorage for compatibility
        this.initializeDefaultData();
    }

    // Articles Management
    getAllArticles() {
        try {
            const articles = JSON.parse(localStorage.getItem(`${this.dbName}_articles`) || '[]');
            return articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    }

    getArticleById(id) {
        const articles = this.getAllArticles();
        return articles.find(article => article.id === id);
    }

    getArticlesByCategory(category) {
        const articles = this.getAllArticles();
        if (category === 'all') return articles;
        return articles.filter(article => article.category === category);
    }

    searchArticles(query) {
        const articles = this.getAllArticles();
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return articles;

        return articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    addArticle(articleData) {
        try {
            const articles = this.getAllArticles();
            const newArticle = {
                id: Date.now().toString(),
                ...articleData,
                excerpt: this.generateExcerpt(articleData.content, 200),
                status: articleData.status || 'published',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            articles.unshift(newArticle);
            localStorage.setItem(`${this.dbName}_articles`, JSON.stringify(articles));
            return newArticle;
        } catch (error) {
            console.error('Error adding article:', error);
            throw error;
        }
    }

    updateArticle(id, updatedData) {
        try {
            const articles = this.getAllArticles();
            const index = articles.findIndex(article => article.id === id);
            
            if (index !== -1) {
                articles[index] = {
                    ...articles[index],
                    ...updatedData,
                    excerpt: updatedData.content ? this.generateExcerpt(updatedData.content, 200) : articles[index].excerpt,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(`${this.dbName}_articles`, JSON.stringify(articles));
                return articles[index];
            }
            return null;
        } catch (error) {
            console.error('Error updating article:', error);
            throw error;
        }
    }

    deleteArticle(id) {
        try {
            const articles = this.getAllArticles();
            const index = articles.findIndex(article => article.id === id);
            
            if (index !== -1) {
                const deleted = articles.splice(index, 1)[0];
                localStorage.setItem(`${this.dbName}_articles`, JSON.stringify(articles));
                
                // Remove from favorites if exists
                this.removeFavorite(id);
                return deleted;
            }
            return null;
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    }

    // Magazines Management
    getAllMagazines() {
        try {
            const magazines = JSON.parse(localStorage.getItem(`${this.dbName}_magazines`) || '[]');
            return magazines.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
        } catch (error) {
            console.error('Error loading magazines:', error);
            return [];
        }
    }

    getMagazineById(id) {
        const magazines = this.getAllMagazines();
        return magazines.find(magazine => magazine.id === id);
    }

    addMagazine(magazineData) {
        try {
            const magazines = this.getAllMagazines();
            const newMagazine = {
                id: Date.now().toString(),
                ...magazineData,
                createdAt: new Date().toISOString()
            };
            
            magazines.unshift(newMagazine);
            localStorage.setItem(`${this.dbName}_magazines`, JSON.stringify(magazines));
            return newMagazine;
        } catch (error) {
            console.error('Error adding magazine:', error);
            throw error;
        }
    }

    deleteMagazine(id) {
        try {
            const magazines = this.getAllMagazines();
            const index = magazines.findIndex(magazine => magazine.id === id);
            
            if (index !== -1) {
                const deleted = magazines.splice(index, 1)[0];
                localStorage.setItem(`${this.dbName}_magazines`, JSON.stringify(magazines));
                return deleted;
            }
            return null;
        } catch (error) {
            console.error('Error deleting magazine:', error);
            throw error;
        }
    }

    // Favorites Management
    getFavorites() {
        try {
            const favorites = JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]');
            return favorites.map(id => this.getArticleById(id)).filter(Boolean);
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    addFavorite(articleId) {
        try {
            const favorites = JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]');
            if (!favorites.includes(articleId)) {
                favorites.push(articleId);
                localStorage.setItem(`${this.dbName}_favorites`, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
        }
    }

    removeFavorite(articleId) {
        try {
            const favorites = JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]');
            const index = favorites.indexOf(articleId);
            if (index !== -1) {
                favorites.splice(index, 1);
                localStorage.setItem(`${this.dbName}_favorites`, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }

    isFavorite(articleId) {
        try {
            const favorites = JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]');
            return favorites.includes(articleId);
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    // Submissions Management
    getAllSubmissions() {
        try {
            const submissions = JSON.parse(localStorage.getItem(`${this.dbName}_submissions`) || '[]');
            return submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error loading submissions:', error);
            return [];
        }
    }

    addSubmission(submissionData) {
        try {
            const submissions = this.getAllSubmissions();
            const newSubmission = {
                id: Date.now().toString(),
                ...submissionData,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            submissions.unshift(newSubmission);
            localStorage.setItem(`${this.dbName}_submissions`, JSON.stringify(submissions));
            return newSubmission;
        } catch (error) {
            console.error('Error adding submission:', error);
            throw error;
        }
    }

    approveSubmission(id) {
        try {
            const submissions = this.getAllSubmissions();
            const submission = submissions.find(s => s.id === id);
            
            if (submission) {
                // Convert submission to article
                const articleData = {
                    title: submission.title,
                    author: submission.author,
                    authorPhoto: submission.authorPhoto || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
                    category: submission.category,
                    tags: submission.tags || [],
                    content: submission.content,
                    status: 'published'
                };
                
                const newArticle = this.addArticle(articleData);
                
                // Remove from submissions
                const index = submissions.findIndex(s => s.id === id);
                if (index !== -1) {
                    submissions.splice(index, 1);
                    localStorage.setItem(`${this.dbName}_submissions`, JSON.stringify(submissions));
                }
                
                return newArticle;
            }
            return null;
        } catch (error) {
            console.error('Error approving submission:', error);
            throw error;
        }
    }

    deleteSubmission(id) {
        try {
            const submissions = this.getAllSubmissions();
            const index = submissions.findIndex(s => s.id === id);
            
            if (index !== -1) {
                const deleted = submissions.splice(index, 1)[0];
                localStorage.setItem(`${this.dbName}_submissions`, JSON.stringify(submissions));
                return deleted;
            }
            return null;
        } catch (error) {
            console.error('Error deleting submission:', error);
            throw error;
        }
    }

    // Settings Management
    getSettings() {
        try {
            const defaultSettings = {
                siteName: 'مجله فرهنگی نور',
                siteTagline: 'روشنایی دانش و فرهنگ',
                siteLogo: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=60',
                socialLinks: {
                    telegram: '',
                    instagram: '',
                    twitter: '',
                    linkedin: ''
                }
            };
            
            const settings = JSON.parse(localStorage.getItem(`${this.dbName}_settings`) || JSON.stringify(defaultSettings));
            return { ...defaultSettings, ...settings };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    updateSettings(settingsData) {
        try {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...settingsData };
            localStorage.setItem(`${this.dbName}_settings`, JSON.stringify(updatedSettings));
            return updatedSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    // Statistics
    getStats() {
        try {
            const articles = this.getAllArticles();
            const magazines = this.getAllMagazines();
            const favorites = JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]');
            const submissions = this.getAllSubmissions();
            
            const categoryStats = {};
            const categories = ['technology', 'art', 'culture', 'science'];
            
            categories.forEach(category => {
                categoryStats[category] = articles.filter(article => article.category === category).length;
            });

            return {
                totalArticles: articles.length,
                totalMagazines: magazines.length,
                totalFavorites: favorites.length,
                totalSubmissions: submissions.length,
                categoryStats
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalArticles: 0,
                totalMagazines: 0,
                totalFavorites: 0,
                totalSubmissions: 0,
                categoryStats: {}
            };
        }
    }

    // Admin Authentication
    checkAdminAuth() {
        try {
            const adminSession = localStorage.getItem(`${this.dbName}_adminSession`);
            if (adminSession) {
                const session = JSON.parse(adminSession);
                const now = new Date().getTime();
                if (now - session.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
                    return true;
                } else {
                    localStorage.removeItem(`${this.dbName}_adminSession`);
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking admin auth:', error);
            return false;
        }
    }

    adminLogin(username, password) {
        // Simple authentication - in production, use proper authentication
        if (username === 'admin' && password === 'admin123') {
            const session = {
                timestamp: new Date().getTime(),
                user: 'admin'
            };
            localStorage.setItem(`${this.dbName}_adminSession`, JSON.stringify(session));
            return true;
        }
        return false;
    }

    adminLogout() {
        localStorage.removeItem(`${this.dbName}_adminSession`);
    }

    // Utility Methods
    getCategoryLabel(category) {
        const labels = {
            'technology': 'فناوری',
            'art': 'هنر',
            'culture': 'فرهنگ',
            'science': 'علم'
        };
        return labels[category] || category;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'تاریخ نامعلوم';
        }
    }

    getMonthName(monthNumber) {
        const months = [
            '', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return months[monthNumber] || '';
    }

    generateExcerpt(content, maxLength = 200) {
        try {
            const plainText = content.replace(/<[^>]*>/g, '');
            if (plainText.length <= maxLength) return plainText;
            return plainText.substring(0, maxLength).trim() + '...';
        } catch (error) {
            return 'خلاصه در دسترس نیست';
        }
    }

    // Initialize default data
    initializeDefaultData() {
        const articles = this.getAllArticles();
        if (articles.length === 0) {
            const defaultArticles = [
                {
                    id: '1',
                    title: 'آینده هوش مصنوعی در ایران',
                    author: 'دکتر علی محمدی',
                    authorPhoto: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150',
                    category: 'technology',
                    tags: ['هوش مصنوعی', 'فناوری', 'ایران'],
                    content: `
                        <p>بررسی روند توسعه هوش مصنوعی در ایران و چالش‌های پیش رو در این حوزه. این مقاله نگاهی جامع به وضعیت فعلی و آینده فناوری هوش مصنوعی در کشور دارد.</p>
                        
                        <p>هوش مصنوعی یکی از مهم‌ترین فناوری‌های قرن بیست و یکم محسوب می‌شود که در حال تغییر بنیادین دنیای ما است. در ایران نیز این فناوری در حال رشد و توسعه است و آینده‌ای روشن در انتظار آن می‌باشد.</p>
                        
                        <p>در سال‌های اخیر، شاهد رشد قابل توجهی در حوزه هوش مصنوعی در ایران بوده‌ایم. دانشگاه‌ها و مراکز تحقیقاتی کشور در حال کار بر روی پروژه‌های مختلفی هستند که می‌تواند ایران را در مقام یکی از کشورهای پیشرو در این حوزه قرار دهد.</p>
                        
                        <p>چالش‌های موجود شامل کمبود سرمایه‌گذاری، نیاز به نیروی متخصص بیشتر و ضرورت ایجاد زیرساخت‌های مناسب است. اما با وجود این چالش‌ها، پتانسیل بالای کشور در این حوزه قابل انکار نیست.</p>
                    `,
                    status: 'published',
                    createdAt: new Date('2024-01-15').toISOString()
                },
                {
                    id: '2',
                    title: 'هنر معاصر ایران و جهانی شدن',
                    author: 'استاد مریم حسینی',
                    authorPhoto: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
                    category: 'art',
                    tags: ['هنر معاصر', 'ایران', 'جهانی سازی'],
                    content: `
                        <p>نگاهی به تأثیر جهانی شدن بر هنر معاصر ایران و چگونگی حفظ هویت فرهنگی در عین پذیرش تحولات جهانی.</p>
                        
                        <p>هنر معاصر ایران در دوران جهانی شدن با چالش‌ها و فرصت‌های فراوانی روبرو شده است. از یک سو، هنرمندان ایرانی امکان عرضه آثار خود در سطح بین‌المللی را پیدا کرده‌اند و از سوی دیگر، با ضرورت حفظ هویت فرهنگی خود مواجه هستند.</p>
                        
                        <p>هنرمندان معاصر ایران توانسته‌اند ترکیب منحصر به فردی از سنت و مدرنیته ایجاد کنند. آثار آنها در گالری‌ها و موزه‌های معتبر جهان به نمایش درآمده و توجه منتقدان هنری بین‌المللی را جلب کرده است.</p>
                    `,
                    status: 'published',
                    createdAt: new Date('2024-01-20').toISOString()
                },
                {
                    id: '3',
                    title: 'فرهنگ غذایی ایران در قرن نوزدهم',
                    author: 'پروفسور رضا کریمی',
                    authorPhoto: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
                    category: 'culture',
                    tags: ['فرهنگ', 'غذا', 'تاریخ', 'ایران'],
                    content: `
                        <p>مطالعه‌ای درباره تحولات فرهنگ غذایی ایران در قرن نوزدهم و تأثیرات اجتماعی و اقتصادی آن بر جامعه ایرانی.</p>
                        
                        <p>فرهنگ غذایی ایران در قرن نوزدهم دستخوش تحولات عمیقی شد که هنوز هم آثار آن در سفره ایرانی‌ها مشهود است. این تحولات تحت تأثیر عوامل مختلف اجتماعی، اقتصادی و فرهنگی صورت گرفت.</p>
                    `,
                    status: 'published',
                    createdAt: new Date('2024-01-25').toISOString()
                }
            ];

            localStorage.setItem(`${this.dbName}_articles`, JSON.stringify(defaultArticles));
        }

        const magazines = this.getAllMagazines();
        if (magazines.length === 0) {
            const defaultMagazines = [
                {
                    id: '1',
                    title: 'شماره ۱ - بهمن ۱۴۰۳',
                    month: 11,
                    year: 1403,
                    description: 'اولین شماره مجله فرهنگی نور با محوریت فناوری و هنر معاصر',
                    coverImage: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
                    pdfUrl: '#',
                    createdAt: new Date('2024-02-01').toISOString()
                }
            ];

            localStorage.setItem(`${this.dbName}_magazines`, JSON.stringify(defaultMagazines));
        }
    }

    // Export/Import functionality
    exportData() {
        return {
            articles: this.getAllArticles(),
            magazines: this.getAllMagazines(),
            favorites: JSON.parse(localStorage.getItem(`${this.dbName}_favorites`) || '[]'),
            submissions: this.getAllSubmissions(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.articles && Array.isArray(data.articles)) {
                localStorage.setItem(`${this.dbName}_articles`, JSON.stringify(data.articles));
            }
            if (data.magazines && Array.isArray(data.magazines)) {
                localStorage.setItem(`${this.dbName}_magazines`, JSON.stringify(data.magazines));
            }
            if (data.favorites && Array.isArray(data.favorites)) {
                localStorage.setItem(`${this.dbName}_favorites`, JSON.stringify(data.favorites));
            }
            if (data.submissions && Array.isArray(data.submissions)) {
                localStorage.setItem(`${this.dbName}_submissions`, JSON.stringify(data.submissions));
            }
            if (data.settings) {
                localStorage.setItem(`${this.dbName}_settings`, JSON.stringify(data.settings));
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }
}

// Global database manager instance
window.db = new DatabaseManager();