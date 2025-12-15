document.addEventListener('DOMContentLoaded', () => {
    // !!! الرابط الجديد بعد التعديل !!!
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuAKKf-g4L3c4UyV0tBfmw7ntH-FaVw_JtcUc7clbnfEkgDIuKENbONmQ_Qv5sIyIqlg/exec';
    const ADMIN_EMAIL = "msdfrrt@gmail.com";

    // عناصر DOM
    const mainNav = document.getElementById('main-nav');
    const productsView = document.getElementById('products-view');
    const authView = document.getElementById('auth-view');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const productsContainer = document.getElementById('products-container');
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');

    // حالة التطبيق
    let currentUser = null;
    let isAdmin = false;

    // --- وظائف مساعدة ---
    function showView(viewId) {
        const views = [productsView, authView, adminPanel];
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    }

    function updateNavbar() {
        mainNav.innerHTML = '';
        if (isAdmin) {
            mainNav.innerHTML = `
                <button id="admin-panel-btn">لوحة التحكم</button>
                <button id="logout-btn">تسجيل خروج المدير</button>
            `;
        } else if (currentUser) {
            const merchantBtn = currentUser.isMerchant 
                ? `<a href="#" id="post-ad-btn">نشر إعلان جديد</a>` 
                : `<a href="https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr" target="_blank">تواصل لنشر إعلانك</a>`;
            mainNav.innerHTML = `
                <span style="margin-left: 15px; color: #f1c40f;">أهلاً بك, ${currentUser.name}</span>
                ${merchantBtn}
                <button id="logout-btn">تسجيل خروج</button>
            `;
        } else {
            mainNav.innerHTML = `<button id="login-btn">تسجيل الدخول</button>`;
        }
        
        // إضافة مستمعي الأحداث للزر الجديد
        setTimeout(() => {
            const adminPanelBtn = document.getElementById('admin-panel-btn');
            const loginBtn = document.getElementById('login-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const postAdBtn = document.getElementById('post-ad-btn');
            
            if (adminPanelBtn) {
                adminPanelBtn.addEventListener('click', () => {
                    showView('admin-panel');
                    setupAdminPanel();
                });
            }
            
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    showView('auth-view');
                    showLoginBtn.click();
                });
            }
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
            
            if (postAdBtn) {
                postAdBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showMerchantPostAdForm();
                });
            }
        }, 100);
    }

    // --- وظيفة الإرسال المحسنة ---
    async function makeRequest(action, params = {}) {
        try {
            // بناء URL مع المعلمات
            let url = `${SCRIPT_URL}?action=${action}`;
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                }
            });
            
            console.log('Request URL:', url);
            
            // استخدم GET بدلاً من POST لتجنب مشاكل CORS
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            return data;
            
        } catch (error) {
            console.error('Request error:', error);
            
            // محاولة ثانية باستخدام POST
            try {
                const formData = new URLSearchParams();
                formData.append('action', action);
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        formData.append(key, params[key]);
                    }
                });
                
                const postResponse = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });
                
                return await postResponse.json();
            } catch (postError) {
                console.error('POST also failed:', postError);
                return {
                    status: 'error',
                    message: 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.'
                };
            }
        }
    }

    // --- وظائف المنتجات ---
    async function fetchAndDisplayProducts() {
        try {
            const data = await makeRequest('getAllProducts');
            if (data.status === 'success') {
                displayProducts(data.products);
            } else {
                console.error('Failed to fetch products:', data.message);
                productsContainer.innerHTML = '<p>حدث خطأ في تحميل المنتجات. يرجى المحاولة مرة أخرى.</p>';
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            productsContainer.innerHTML = '<p>لا يمكن تحميل المنتجات الآن. تحقق من اتصالك بالإنترنت.</p>';
        }
    }

    function displayProducts(products) {
        productsContainer.innerHTML = '';
        if (!products || products.length === 0) {
            productsContainer.innerHTML = '<p>لا توجد منتجات لعرضها حالياً.</p>';
            return;
        }
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = `product-card ${product.isFeatured ? 'featured' : ''}`;
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="posted-by">منشور بواسطة: ${product.postedBy || 'غير معروف'}</p>
                    ${product.isFeatured ? '<span class="featured-badge">مميز</span>' : ''}
                </div>
            `;
            productsContainer.appendChild(card);
        });
    }

    // --- معالجة تسجيل الدخول والتسجيل ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        const data = await makeRequest('login', { email, password });

        if (data.status === 'success') {
            currentUser = data.user;
            isAdmin = data.isAdmin;
            updateNavbar();
            
            if (isAdmin) {
                showView('admin-panel');
                setupAdminPanel();
                alert(`مرحباً بك يا مدير ${currentUser.name}!`);
            } else {
                showView('products-view');
                fetchAndDisplayProducts();
                alert(`مرحباً بك ${currentUser.name}!`);
            }
        } else {
            alert(`خطأ: ${data.message}`);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!name || !email || !password) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        const data = await makeRequest('register', { name, email, password });

        if (data.status === 'success') {
            alert(data.message);
            // تسجيل الدخول تلقائياً بعد التسجيل
            currentUser = data.user;
            updateNavbar();
            showView('products-view');
            fetchAndDisplayProducts();
        } else {
            alert(`خطأ: ${data.message}`);
        }
    });

    // --- تسجيل الخروج ---
    function handleLogout() {
        currentUser = null;
        isAdmin = false;
        updateNavbar();
        showView('products-view');
        fetchAndDisplayProducts();
        alert('تم تسجيل الخروج بنجاح.');
    }

    // --- تحويل الأزرار في الشريط ---
    showLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    });

    showRegisterBtn.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
    });

    // --- لوحة تحكم المدير ---
    async function setupAdminPanel() {
        await fetchAndDisplayUsers();
        await fetchAndDisplayAdminAds();
        
        // إدارة علامات التبويب
        const adminNavBtns = document.querySelectorAll('.admin-nav button');
        const adminSubViews = document.querySelectorAll('.admin-sub-view');
        
        adminNavBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const targetViewId = btn.dataset.view;
                adminSubViews.forEach(view => view.classList.add('hidden'));
                document.getElementById(targetViewId).classList.remove('hidden');
                adminNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // البحث عن المستخدمين
        document.getElementById('search-user').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#accounts-table-body tr');
            rows.forEach(row => {
                const email = row.cells[1].textContent.toLowerCase();
                const name = row.cells[0].textContent.toLowerCase();
                row.style.display = (email.includes(searchTerm) || name.includes(searchTerm)) ? '' : 'none';
            });
        });

        // نشر إعلان من قبل المدير
        document.getElementById('admin-post-ad-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-product-name').value;
            const desc = document.getElementById('admin-product-desc').value;
            const imgUrl = document.getElementById('admin-product-image').value;
            const isFeatured = document.getElementById('is-featured-ad').checked;

            if (!name || !desc || !imgUrl) {
                alert('يرجى ملء جميع الحقول');
                return;
            }

            const data = await makeRequest('addProduct', {
                productName: name,
                description: desc,
                imageUrl: imgUrl,
                postedBy: ADMIN_EMAIL,
                isFeatured: isFeatured
            });

            alert(data.message);
            if (data.status === 'success') {
                e.target.reset();
                await fetchAndDisplayAdminAds();
                await fetchAndDisplayProducts(); // تحديث العرض الرئيسي أيضاً
            }
        });
    }

    async function fetchAndDisplayUsers() {
        try {
            const data = await makeRequest('getAllUsers');
            if (data.status === 'success') {
                displayUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    function displayUsers(users) {
        const accountsTableBody = document.getElementById('accounts-table-body');
        const merchantsTableBody = document.getElementById('merchants-table-body');
        accountsTableBody.innerHTML = '';
        merchantsTableBody.innerHTML = '';

        if (!users || users.length === 0) {
            accountsTableBody.innerHTML = '<tr><td colspan="3">لا يوجد مستخدمون مسجلون</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || 'بدون اسم'}</td>
                <td>${user.email}</td>
                <td>
                    ${user.email !== ADMIN_EMAIL 
                        ? (user.isMerchant 
                            ? `<button class="revoke-btn revoke-merchant-btn" data-email="${user.email}">إلغاء صلاحية التاجر</button>`
                            : `<button class="approve-btn make-merchant-btn" data-email="${user.email}">جعله تاجراً</button>`
                          )
                        : '<span style="color: #e74c3c;">مدير النظام</span>'
                    }
                </td>
            `;
            
            if (user.isMerchant && user.email !== ADMIN_EMAIL) {
                merchantsTableBody.appendChild(row.cloneNode(true));
            }
            if (user.email !== ADMIN_EMAIL) {
                accountsTableBody.appendChild(row);
            }
        });

        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.make-merchant-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, true));
        });
        
        document.querySelectorAll('.revoke-merchant-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, false));
        });
    }

    async function toggleMerchantStatus(email, makeMerchant) {
        const action = makeMerchant ? 'ترقية' : 'إلغاء ترقية';
        if (!confirm(`هل أنت متأكد من ${action} المستخدم ${email}؟`)) return;

        const data = await makeRequest('toggleMerchantStatus', { email });

        alert(data.message);
        if (data.status === 'success') {
            await fetchAndDisplayUsers();
        }
    }
    
    async function fetchAndDisplayAdminAds() {
        try {
            const data = await makeRequest('getAllProducts');
            if (data.status === 'success') {
                displayAdminAds(data.products);
            }
        } catch (error) {
            console.error('Error fetching admin ads:', error);
        }
    }

    function displayAdminAds(products) {
        const adminAdsContainer = document.getElementById('admin-ads-container');
        adminAdsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            adminAdsContainer.innerHTML = '<p>لا توجد إعلانات منشورة حالياً.</p>';
            return;
        }
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = `product-card ${product.isFeatured ? 'featured' : ''}`;
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="posted-by">منشور بواسطة: ${product.postedBy || 'غير معروف'}</p>
                    <p class="product-id">رقم المنتج: ${product.id}</p>
                    ${product.isFeatured ? '<span class="featured-badge">مميز</span>' : ''}
                </div>
            `;
            adminAdsContainer.appendChild(card);
        });
    }

    // --- نموذج نشر إعلان للتاجر ---
    function showMerchantPostAdForm() {
        if (!currentUser || !currentUser.isMerchant) {
            alert('يجب أن تكون تاجراً لنشر إعلان');
            return;
        }

        const formHTML = `
            <div class="form-container" style="margin-top: 20px;">
                <h2>نشر إعلان جديد</h2>
                <form id="merchant-post-ad-form" class="auth-form">
                    <input type="text" id="merchant-product-name" placeholder="اسم المنتج" required>
                    <textarea id="merchant-product-desc" placeholder="وصف المنتج" rows="5" required></textarea>
                    <input type="url" id="merchant-product-image" placeholder="رابط صورة المنتج" required>
                    <div class="form-buttons">
                        <button type="submit">نشر الإعلان</button>
                        <button type="button" id="cancel-post-ad">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إنشاء نافذة منبثقة
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = formHTML;
        document.body.appendChild(modal);

        // إدارة النموذج
        document.getElementById('merchant-post-ad-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('merchant-product-name').value;
            const desc = document.getElementById('merchant-product-desc').value;
            const imgUrl = document.getElementById('merchant-product-image').value;

            if (!name || !desc || !imgUrl) {
                alert('يرجى ملء جميع الحقول');
                return;
            }

            const data = await makeRequest('addProduct', {
                productName: name,
                description: desc,
                imageUrl: imgUrl,
                postedBy: currentUser.email,
                isFeatured: false
            });

            alert(data.message);
            if (data.status === 'success') {
                document.body.removeChild(modal);
                fetchAndDisplayProducts();
            }
        });

        // زر الإلغاء
        document.getElementById('cancel-post-ad').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    // --- بدء التطبيق ---
    updateNavbar();
    fetchAndDisplayProducts();
    showLoginBtn.click();
});