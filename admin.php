<?php
// admin.php
session_start();
if (empty($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}
?>

<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پنل مدیریت - مجله فرهنگی نور</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/admin.css">
    <!-- Quill editor styles -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="admin-container">
        <!-- Admin Header -->
        <header class="admin-header">
            <div class="admin-nav">
                <h1>پنل مدیریت مجله فرهنگی نور</h1>
                <div class="admin-actions">
                    <a href="index.html" class="back-btn">
                        <i class="fas fa-arrow-left"></i>
                        بازگشت به سایت
                    </a>
                    <button id="adminLogout" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        خروج
                    </button>
                </div>
            </div>
        </header>

        <!-- Admin Content -->
        <main class="admin-main">
            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="add">افزودن مقاله</button>
                <button class="tab-btn" data-tab="manage">مدیریت مقالات</button>
                <button class="tab-btn" data-tab="magazines">مدیریت مجلات</button>
                <button class="tab-btn" data-tab="stats">آمار</button>
                <button class="tab-btn" data-tab="settings">تنظیمات</button>
            </div>

            <!-- Add Article Tab -->
            <div class="tab-content active" id="addTab">
                <div class="tab-header">
                    <h2>افزودن مقاله جدید</h2>
                </div>
                
                <form class="article-form" id="articleForm">
                    <div class="form-group">
                        <label for="title">عنوان مقاله *</label>
                        <input type="text" id="title" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="author">نام نویسنده *</label>
                            <input type="text" id="author" required>
                        </div>
                        <div class="form-group">
                            <label for="authorPhoto">آدرس تصویر نویسنده</label>
                            <input type="url" id="authorPhoto" placeholder="https://example.com/photo.jpg">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="authorPhotoFile">بارگذاری تصویر نویسنده</label>
                            <input type="file" id="authorPhotoFile" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>پیش‌نمایش تصویر</label>
                            <div>
                                <img id="authorPhotoPreview" src="" alt="پیش‌نمایش" style="max-width:120px; max-height:120px; display:block; object-fit:cover; border-radius:6px;">
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="category">دسته‌بندی *</label>
                            <select id="category" required>
                                <option value="">انتخاب کنید</option>
                                <option value="technology">فناوری</option>
                                <option value="art">هنر</option>
                                <option value="culture">فرهنگ</option>
                                <option value="science">علم</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tags">برچسب‌ها (با کامای انگلیسی جدا کنید)</label>
                            <input type="text" id="tags" placeholder="برنامه‌نویسی, وب, فناوری">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="content">متن کامل مقاله *</label>
                        <!-- Quill editor container -->
                        <div id="editor" class="quill-editor" style="height: 320px;"></div>
                        <!-- Hidden input to keep compatibility if needed -->
                        <input type="hidden" id="content" required>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="submit-btn">
                            <i class="fas fa-save"></i>
                            ذخیره مقاله
                        </button>
                    </div>
                </form>
            </div>

            <!-- Manage Articles Tab -->
            <div class="tab-content" id="manageTab">
                <div class="tab-header">
                    <h2>مدیریت مقالات</h2>
                </div>
                
                <div class="manage-controls">
                    <input type="text" id="manageSearch" placeholder="جستجو در مقالات...">
                    <select id="manageCategory">
                        <option value="">همه دسته‌ها</option>
                        <option value="technology">فناوری</option>
                        <option value="art">هنر</option>
                        <option value="culture">فرهنگ</option>
                        <option value="science">علم</option>
                    </select>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>عنوان</th>
                                <th>نویسنده</th>
                                <th>دسته‌بندی</th>
                                <th>تاریخ ایجاد</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody id="articlesTableBody">
                            <!-- Articles will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Magazines Tab -->
            <div class="tab-content" id="magazinesTab">
                <div class="tab-header">
                    <h2>مدیریت مجلات</h2>
                    <button class="add-btn" id="addMagazineBtn">
                        <i class="fas fa-plus"></i>
                        افزودن شماره جدید
                    </button>
                </div>
                
                <div class="magazines-grid" id="magazinesGrid">
                    <!-- Magazines will be loaded here -->
                </div>
            </div>

            <!-- Stats Tab -->
            <div class="tab-content" id="statsTab">
                <h2>آمار سایت</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-newspaper"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalArticles">0</h3>
                            <p>کل مقالات</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalMagazines">0</h3>
                            <p>شماره مجلات</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalFavorites">0</h3>
                            <p>مقالات علاقه‌مندی</p>
                        </div>
                    </div>
                </div>

                <div class="category-stats">
                    <h3>آمار بر اساس دسته‌بندی</h3>
                    <div class="category-chart" id="categoryChart">
                        <!-- Category stats will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Settings Tab -->
            <div class="tab-content" id="settingsTab">
                <div class="tab-header">
                    <h2>تنظیمات سایت</h2>
                </div>

                <form id="settingsForm" class="article-form">
                    <div class="form-group">
                        <label for="siteName">نام سایت</label>
                        <input type="text" id="siteName" placeholder="مثال: مجله فرهنگی نور">
                    </div>
                    <div class="form-group">
                        <label for="siteTagline">شعار / زیرعنوان سایت</label>
                        <input type="text" id="siteTagline" placeholder="مثال: روشنایی دانش و فرهنگ">
                    </div>

                    <div class="form-group">
                        <label for="siteLogo">آدرس لوگو (URL)</label>
                        <input type="url" id="siteLogo" placeholder="https://example.com/logo.png">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="sitePhone">تلفن تماس</label>
                            <input type="text" id="sitePhone" placeholder="021-12345678">
                        </div>
                        <div class="form-group">
                            <label for="siteEmail">ایمیل تماس</label>
                            <input type="email" id="siteEmail" placeholder="info@noormagazine.ir">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>شبکه‌های اجتماعی</label>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="socialTelegram">تلگرام (آدرس)</label>
                                <input type="url" id="socialTelegram" placeholder="https://t.me/yourchannel">
                            </div>
                            <div class="form-group">
                                <label for="socialInstagram">اینستاگرام (آدرس)</label>
                                <input type="url" id="socialInstagram" placeholder="https://instagram.com/yourprofile">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="socialTwitter">توییتر (آدرس)</label>
                                <input type="url" id="socialTwitter" placeholder="https://twitter.com/yourprofile">
                            </div>
                            <div class="form-group">
                                <label for="socialLinkedin">لینکدین (آدرس)</label>
                                <input type="url" id="socialLinkedin" placeholder="https://linkedin.com/in/yourprofile">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="footerText">متن فوتر</label>
                        <input type="text" id="footerText" placeholder="© ۱۴۰۳ مجله فرهنگی نور">
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="submit-btn">
                            <i class="fas fa-save"></i>
                            ذخیره تنظیمات
                        </button>
                    </div>
                </form>
            </div>

        </main>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" id="editModal">
        <div class="modal">
            <div class="modal-header">
                <h3>ویرایش مقاله</h3>
                <button class="modal-close" id="editModalClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <form id="editForm" class="article-form">
                    <input type="hidden" id="editId">
                    
                    <div class="form-group">
                        <label for="editTitle">عنوان مقاله *</label>
                        <input type="text" id="editTitle" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editAuthor">نام نویسنده *</label>
                            <input type="text" id="editAuthor" required>
                        </div>
                        <div class="form-group">
                            <label for="editAuthorPhoto">آدرس تصویر نویسنده</label>
                            <input type="url" id="editAuthorPhoto">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editAuthorPhotoFile">بارگذاری تصویر نویسنده (ویرایش)</label>
                        <input type="file" id="editAuthorPhotoFile" accept="image/*">
                        <div style="margin-top:8px;">
                            <img id="editAuthorPhotoPreview" src="" alt="پیش‌نمایش" style="max-width:120px; max-height:120px; display:block; object-fit:cover; border-radius:6px;">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editCategory">دسته‌بندی *</label>
                            <select id="editCategory" required>
                                <option value="">انتخاب کنید</option>
                                <option value="technology">فناوری</option>
                                <option value="art">هنر</option>
                                <option value="culture">فرهنگ</option>
                                <option value="science">علم</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editTags">برچسب‌ها</label>
                            <input type="text" id="editTags">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="editContent">متن کامل مقاله *</label>
                        <!-- Quill editor for edit modal -->
                        <div id="editEditor" class="quill-editor" style="height: 320px;"></div>
                        <input type="hidden" id="editContent" required>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="submit-btn">
                            <i class="fas fa-save"></i>
                            ذخیره تغییرات
                        </button>
                        <button type="button" class="cancel-btn" onclick="closeEditModal()">انصراف</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Magazine Modal -->
    <div class="modal-overlay" id="magazineModal">
        <div class="modal">
            <div class="modal-header">
                <h3>افزودن شماره جدید مجله</h3>
                <button class="modal-close" id="magazineModalClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <form id="magazineForm" class="magazine-form">
                    <div class="form-group">
                        <label for="magazineTitle">عنوان شماره</label>
                        <input type="text" id="magazineTitle" required placeholder="مثال: شماره ۱ - بهمن ۱۴۰۳">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="magazineMonth">ماه</label>
                            <select id="magazineMonth" required>
                                <option value="">انتخاب کنید</option>
                                <option value="1">فروردین</option>
                                <option value="2">اردیبهشت</option>
                                <option value="3">خرداد</option>
                                <option value="4">تیر</option>
                                <option value="5">مرداد</option>
                                <option value="6">شهریور</option>
                                <option value="7">مهر</option>
                                <option value="8">آبان</option>
                                <option value="9">آذر</option>
                                <option value="10">دی</option>
                                <option value="11">بهمن</option>
                                <option value="12">اسفند</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="magazineYear">سال</label>
                            <input type="number" id="magazineYear" required min="1400" max="1450" value="1403">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="magazineDescription">توضیحات</label>
                        <textarea id="magazineDescription" rows="3" placeholder="توضیح کوتاهی از محتوای این شماره"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="magazineCover">آدرس تصویر جلد</label>
                        <input type="url" id="magazineCover" placeholder="https://example.com/cover.jpg">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="magazineCoverFile">بارگذاری تصویر جلد</label>
                            <input type="file" id="magazineCoverFile" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>پیش‌نمایش جلد</label>
                            <div>
                                <img id="magazineCoverPreview" src="" alt="پیش‌نمایش جلد" style="max-width:160px; max-height:200px; display:block; object-fit:cover; border-radius:6px;">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="magazinePdf">آدرس فایل PDF</label>
                        <input type="url" id="magazinePdf" required placeholder="https://example.com/magazine.pdf">
                    </div>
                    <div class="form-group">
                        <label for="magazinePdfFile">بارگذاری فایل PDF</label>
                        <input type="file" id="magazinePdfFile" accept="application/pdf">
                        <div id="magazinePdfName" style="margin-top:6px; color:var(--text-muted);"></div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="submit-btn">ذخیره شماره</button>
                        <button type="button" class="cancel-btn" onclick="closeMagazineModal()">انصراف</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Quill scripts -->
    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/quill-image-resize-module@3.0.0/image-resize.min.js"></script>
    <script src="js/data.js"></script>
    <script>
    (async function(){
        try{
            const [artsRes, magsRes, settingsRes, favsRes] = await Promise.all([
                fetch('api/articles.php', { credentials: 'same-origin' }),
                fetch('api/magazines.php', { credentials: 'same-origin' }),
                fetch('api/settings.php', { credentials: 'same-origin' }),
                fetch('api/favorites.php', { credentials: 'same-origin' })
            ]);

            // Articles
            if (artsRes.ok) {
                const serverArticles = await artsRes.json();
                if (Array.isArray(serverArticles) && serverArticles.length > 0) {
                    const prev = localStorage.getItem('persianMagazineArticles');
                    if (prev) localStorage.setItem('persianMagazineArticles_backup_' + Date.now(), prev);
                    const articles = serverArticles.map(r => ({
                        id: String(r.id),
                        title: r.title || '',
                        author: r.author || '',
                        // normalize author photo to an absolute URL when possible
                        authorPhoto: (function(){
                            const ap = r.author_photo || r.authorPhoto || '';
                            if (!ap) return '';
                            if (/^(https?:|data:|\/|\\\/\\\/)/.test(ap)) return ap;
                            // relative path -> prefix with origin and project root
                            return window.location.origin + '/' + ap.replace(/^\/+/, '');
                        })(),
                        category: r.category || '',
                        tags: (r.tags_json ? JSON.parse(r.tags_json) : (r.tags || [])),
                        content: r.content || '',
                        excerpt: r.excerpt || '',
                        createdAt: r.created_at || r.createdAt || new Date().toISOString()
                    }));
                    localStorage.setItem('persianMagazineArticles', JSON.stringify(articles));
                } else {
                    console.warn('سرور مقالات را خالی بازگرداند — از دادهٔ محلی محافظت شد');
                }
            }

            // Magazines
            if (magsRes.ok) {
                const serverMags = await magsRes.json();
                if (Array.isArray(serverMags) && serverMags.length > 0) {
                    const prevM = localStorage.getItem('persianMagazineMagazines');
                    if (prevM) localStorage.setItem('persianMagazineMagazines_backup_' + Date.now(), prevM);
                    const magazines = serverMags.map(m => ({
                        id: String(m.id),
                        title: m.title || '',
                        month: m.month || null,
                        year: m.year || null,
                        description: m.description || '',
                        coverImage: (function(){
                            const c = m.cover_image || m.coverImage || '';
                            if (!c) return '';
                            if (/^(https?:|data:|\/|\\\/\\\/)/.test(c)) return c;
                            return window.location.origin + '/' + c.replace(/^\/+/, '');
                        })(),
                        pdfUrl: (function(){
                            const p = m.pdf_url || m.pdfUrl || '';
                            if (!p) return '';
                            if (/^(https?:|data:|\/|\\\/\\\/)/.test(p)) return p;
                            return window.location.origin + '/' + p.replace(/^\/+/, '');
                        })(),
                        createdAt: m.created_at || m.createdAt || new Date().toISOString()
                    }));
                    localStorage.setItem('persianMagazineMagazines', JSON.stringify(magazines));
                } else {
                    console.warn('سرور مجلات را خالی بازگرداند — از دادهٔ محلی محافظت شد');
                }
            }

            // Settings
            if (settingsRes.ok) {
                const s = await settingsRes.json();
                if (s && Object.keys(s).length > 0) {
                    const prevS = localStorage.getItem('persianMagazineSettings');
                    if (prevS) localStorage.setItem('persianMagazineSettings_backup_' + Date.now(), prevS);
                    const settings = {
                        siteName: s.site_name || s.siteName || 'مجله فرهنگی نور',
                        tagline: s.tagline || s.taglineText || '',
                        logoUrl: s.logo_url || s.logoUrl || '',
                        phone: s.phone || '',
                        email: s.email || '',
                        social: (s.social_json ? JSON.parse(s.social_json) : (s.social || {})),
                        footerText: s.footer_text || s.footerText || ''
                    };
                    localStorage.setItem('persianMagazineSettings', JSON.stringify(settings));
                } else {
                    console.warn('سرور تنظیمات خالی یا نامشخص بازگرداند — از دادهٔ محلی محافظت شد');
                }
            }

            // Favorites
            if (favsRes.ok) {
                const serverFavs = await favsRes.json();
                if (Array.isArray(serverFavs) && serverFavs.length > 0) {
                    const prevF = localStorage.getItem('persianMagazineFavorites');
                    if (prevF) localStorage.setItem('persianMagazineFavorites_backup_' + Date.now(), prevF);
                    const favorites = serverFavs.map(id => String(id));
                    localStorage.setItem('persianMagazineFavorites', JSON.stringify(favorites));
                } else {
                    console.warn('سرور علاقه‌مندی‌ها را خالی بازگرداند — از دادهٔ محلی محافظت شد');
                }
            }
        } catch (e) {
            console.warn('خطا در همگام‌سازی اولیه داده‌های پنل:', e);
        }
    })();
    </script>
    <script src="js/admin.js"></script>
</body>
</html>
