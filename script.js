// 主题切换功能

// 默认 API 配置（安全提示：仅供演示使用）
const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

// ==================== 安全的 API 密钥管理系统 ====================
// 使用 IndexedDB 加密存储 API 密钥
const SecureAPIKeyManager = {
    DB_NAME: 'SecureKeyStorage',
    DB_VERSION: 1,
    STORE_NAME: 'keys',
    
    // 简单的异或加密（实际生产环境应使用更复杂的加密算法）
    encrypt: function(data, key) {
        const simpleKey = 'SecureKey_2024_DonationSystem';
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ simpleKey.charCodeAt(i % simpleKey.length));
        }
        return btoa(result); // Base64 编码
    },
    
    decrypt: function(encryptedData, key) {
        const simpleKey = 'SecureKey_2024_DonationSystem';
        try {
            const decoded = atob(encryptedData);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ simpleKey.charCodeAt(i % simpleKey.length));
            }
            return result;
        } catch (e) {
            console.error('解密失败:', e);
            return null;
        }
    },
    
    // 初始化数据库
    initDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject('无法打开数据库');
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    },
    
    // 保存 API 密钥
    saveKey: async function(key) {
        try {
            const db = await this.initDB();
            const encryptedKey = this.encrypt(key);
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.put({ id: 'api_key', key: encryptedKey, timestamp: Date.now() });
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject('保存失败');
            });
        } catch (e) {
            console.error('保存密钥失败:', e);
            return false;
        }
    },
    
    // 获取 API 密钥
    getKey: async function() {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get('api_key');
                
                request.onsuccess = () => {
                    if (request.result) {
                        const decryptedKey = this.decrypt(request.result.key);
                        resolve(decryptedKey);
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject('获取失败');
            });
        } catch (e) {
            console.error('获取密钥失败:', e);
            return null;
        }
    },
    
    // 删除 API 密钥
    deleteKey: async function() {
        try {
            const db = await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.delete('api_key');
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject('删除失败');
            });
        } catch (e) {
            console.error('删除密钥失败:', e);
            return false;
        }
    },
    
    // 检查密钥是否存在
    hasKey: async function() {
        const key = await this.getKey();
        return key !== null && key !== '';
    }
};

// 全局 API 密钥访问接口（不暴露实际密钥）
const APIKeyAccess = {
    // 获取 API 密钥（内部使用）
    getApiKey: async function() {
        return await SecureAPIKeyManager.getKey();
    },
    
    // 设置 API 密钥
    setApiKey: async function(key) {
        if (!key || key.trim() === '') {
            throw new Error('API 密钥不能为空');
        }
        return await SecureAPIKeyManager.saveKey(key.trim());
    },
    
    // 清除 API 密钥
    clearApiKey: async function() {
        return await SecureAPIKeyManager.deleteKey();
    },
    
    // 验证密钥是否有效（不暴露密钥内容）
    isKeySet: async function() {
        return await SecureAPIKeyManager.hasKey();
    }
};

function initTheme() {
    // 从本地存储加载主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    
    showToast(newTheme === 'dark' ? '🌙 已切换到暗色主题' : '☀️ 已切换到亮色主题');
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (themeIcon && themeText) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = '亮色';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = '暗色';
        }
    }
}

// 页面加载时初始化主题
document.addEventListener('DOMContentLoaded', initTheme);

// 页面切换功能
function showPage(pageId) {
    console.log('showPage 函数被调用，页面ID:', pageId);
    try {
        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        console.log('找到的页面数量:', pages.length);
        pages.forEach(page => {
            console.log('移除页面 active 类:', page.id);
            page.classList.remove('active');
        });
        // 显示选中的页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            console.log('添加页面 active 类:', pageId);
            targetPage.classList.add('active');
            // 重新初始化页面功能（使用 try-catch 确保初始化失败不会影响页面切换）
            try {
                initPageFunctions();
                console.log('页面功能初始化成功');
            } catch (initError) {
                console.error('页面功能初始化出错:', initError);
                // 初始化失败不影响页面切换，继续执行
            }
            
            // 如果是纪念页面，初始化弹幕功能
            if (pageId === 'memorial') {
                initMemorialPage();
            }
            
            console.log('页面切换成功:', pageId);
        } else {
            console.error('找不到页面元素:', pageId);
            alert('找不到页面元素，请检查页面ID是否正确。');
        }
    } catch (error) {
        console.error('页面切换出错:', error);
        alert('页面切换出错，请检查控制台日志。');
    }
}

// 轮播功能（手动切换，无自动轮播）
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;
    
    const carouselInner = carousel.querySelector('.carousel-inner');
    const carouselItems = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');
    
    let currentIndex = 0;
    const itemWidth = carouselItems[0].offsetWidth;
    
    function updateCarousel() {
        carouselInner.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
            updateCarousel();
        });
        
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % carouselItems.length;
            updateCarousel();
        });
        
        // 移除自动轮播，只保留手动切换
    }
}

// 献花功能
function initFlowerCounter() {
    const flowerBtn = document.querySelector('.flower-btn');
    const flowerCount = document.querySelector('.flower-count');
    
    if (!flowerBtn || !flowerCount) return;
    
    let count = 0;
    
    // 检查本地存储中的献花数量
    const storedCount = localStorage.getItem('flowerCount');
    if (storedCount) {
        count = parseInt(storedCount);
        flowerCount.textContent = count;
    }
    
    flowerBtn.addEventListener('click', () => {
        count++;
        flowerCount.textContent = count;
        // 保存到本地存储
        localStorage.setItem('flowerCount', count);
        
        // 添加点击动画
        flowerBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            flowerBtn.style.transform = 'scale(1)';
        }, 200);
    });
}

// 登录注册功能
function initAuth() {
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.querySelector('#loginUsername').value;
            const password = loginForm.querySelector('#loginPassword').value;
            
            // 简单的本地验证
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert('登录成功！');
                // 显示上传区域（检查元素是否存在）
                const uploadSection = document.querySelector('.upload-section');
                if (uploadSection) {
                    uploadSection.style.display = 'block';
                }
            } else {
                alert('用户名或密码错误！');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = registerForm.querySelector('#registerUsername').value;
            const password = registerForm.querySelector('#registerPassword').value;
            const confirmPassword = registerForm.querySelector('#confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致！');
                return;
            }
            
            // 检查用户名是否已存在
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.some(u => u.username === username)) {
                alert('用户名已存在！');
                return;
            }
            
            // 添加新用户
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('注册成功！请登录。');
            registerForm.reset();
        });
    }
}

// 内容上传功能
function initUpload() {
    const uploadForm = document.querySelector('#uploadForm');
    if (!uploadForm) return;
    
    // 防止重复绑定事件
    if (uploadForm.dataset.eventBound === 'true') return;
    uploadForm.dataset.eventBound = 'true';
    
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 防止重复提交
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = '上传中...';
        
        const title = uploadForm.querySelector('#uploadTitle').value;
        const content = uploadForm.querySelector('#uploadContent').value;
        const isPublic = uploadForm.querySelector('input[name="privacy"]:checked').value === 'public';
        
        // 获取当前用户
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('请先登录！');
            submitBtn.disabled = false;
            submitBtn.textContent = editingStoryId ? '更新' : '上传';
            return;
        }
        
        // 保存到本地存储
        const stories = JSON.parse(localStorage.getItem('stories') || '[]');
        const editingStoryId = uploadForm.dataset.editingStoryId;
        
        if (editingStoryId) {
            // 更新现有故事
            const storyIndex = stories.findIndex(s => s.id === parseInt(editingStoryId));
            if (storyIndex !== -1) {
                stories[storyIndex] = {
                    ...stories[storyIndex],
                    title,
                    content,
                    isPublic
                };
                localStorage.setItem('stories', JSON.stringify(stories));
                alert('更新成功！');
                
                // 重置表单
                uploadForm.reset();
                delete uploadForm.dataset.editingStoryId;
                submitBtn.textContent = '上传';
                
                // 更新故事列表
                updateStoriesList();
                updateMyStoriesList();
            }
        } else {
            // 创建新故事
            const story = {
                id: Date.now(),
                title,
                content,
                author: currentUser.username,
                isPublic,
                createdAt: new Date().toLocaleString()
            };
            
            stories.push(story);
            localStorage.setItem('stories', JSON.stringify(stories));
            alert('上传成功！');
            uploadForm.reset();
            
            // 如果是公开故事，更新纪念页面的故事列表
            if (isPublic) {
                updateStoriesList();
            }
            
            // 更新我的故事列表
            updateMyStoriesList();
        }
        
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = '上传';
    });
}

// 更新故事列表
function updateStoriesList() {
    const storiesList = document.querySelector('.stories-list');
    if (!storiesList) return;
    
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const publicStories = stories.filter(story => story.isPublic);
    
    storiesList.innerHTML = '';
    
    publicStories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';
        storyItem.innerHTML = `
            <h4>${story.title}</h4>
            <p>${story.content}</p>
            <p><small>作者：${story.author} | ${story.createdAt}</small></p>
        `;
        storiesList.appendChild(storyItem);
    });
}

// 更新我的故事列表
function updateMyStoriesList() {
    const myStoriesList = document.querySelector('#myStoriesList');
    if (!myStoriesList) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const userStories = stories.filter(story => story.author === currentUser.username);
    
    myStoriesList.innerHTML = '';
    
    userStories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';
        storyItem.innerHTML = `
            <h4>${story.title}</h4>
            <p>${story.content}</p>
            <p><small>作者：${story.author} | ${story.createdAt} | ${story.isPublic ? '公开' : '不公开'}</small></p>
            <div class="story-actions">
                <button class="btn btn-sm" onclick="editStory(${story.id})">修改</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStory(${story.id})">删除</button>
            </div>
        `;
        myStoriesList.appendChild(storyItem);
    });
}

// 编辑故事
function editStory(storyId) {
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    
    // 填充表单
    const uploadForm = document.querySelector('#uploadForm');
    if (uploadForm) {
        uploadForm.querySelector('#uploadTitle').value = story.title;
        uploadForm.querySelector('#uploadContent').value = story.content;
        uploadForm.querySelector(`input[name="privacy"][value="${story.isPublic ? 'public' : 'private'}"]`).checked = true;
        
        // 修改上传按钮文本
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn.textContent = '更新故事';
        
        // 存储当前编辑的故事ID
        uploadForm.dataset.editingStoryId = storyId;
    }
}

// 删除故事
function deleteStory(storyId) {
    if (confirm('确定要删除这个故事吗？')) {
        let stories = JSON.parse(localStorage.getItem('stories') || '[]');
        stories = stories.filter(s => s.id !== storyId);
        localStorage.setItem('stories', JSON.stringify(stories));
        
        // 更新故事列表
        updateStoriesList();
        updateMyStoriesList();
        
        alert('故事删除成功！');
    }
}

// 确保函数全局可用
window.updateMyStoriesList = updateMyStoriesList;
window.editStory = editStory;
window.deleteStory = deleteStory;

// 初始化页面功能
function initPageFunctions() {
    initCarousel();
    initFlowerCounter();
    initAuth();
    initUpload();
    updateStoriesList();
    updateMyStoriesList();
    initFamilySettingsUI();
    
    // 检查登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
        const myStoriesSection = document.querySelector('.my-stories-section');
        if (myStoriesSection) {
            myStoriesSection.style.display = 'block';
        }
    }
}

// 确保所有关键函数全局可用
window.showPage = showPage;
window.startGame = startGame;
window.saveApiKey = saveApiKey;
window.changeGameSpeed = changeGameSpeed;
window.resetGame = resetGame;
window.setFamilyApiMode = setFamilyApiMode;
window.saveFamilyCustomApiKey = saveFamilyCustomApiKey;
window.getFamilyApiKey = getFamilyApiKey;
window.getFamilyApiMode = getFamilyApiMode;
window.initFamilySettingsUI = initFamilySettingsUI;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，初始化函数');
    initPageFunctions();
    initGame();
    console.log('初始化完成，showPage 函数可用:', typeof showPage);
});

// 主题定义
const THEMES = [
    {
        id: 'education',
        name: '宣传教育',
        description: '开展遗体捐献的宣传教育工作，提高公众认知',
        minReputation: 0
    },
    {
        id: 'family',
        name: '家属沟通',
        description: '与捐献者家属进行沟通，提供情感支持',
        minReputation: 0
    },
    {
        id: 'coordination',
        name: '协调管理',
        description: '协调各方资源，确保捐献流程顺利进行',
        minReputation: 0
    },
    {
        id: 'medical',
        name: '医学合作',
        description: '与医学院校建立合作关系',
        minReputation: 10
    },
    {
        id: 'memorial',
        name: '纪念缅怀',
        description: '为捐献者建立纪念设施，表达敬意',
        minReputation: 15
    },
    {
        id: 'media',
        name: '媒体宣传',
        description: '通过媒体渠道扩大影响力',
        minReputation: 20
    }
];

// 游戏状态管理
let gameState = {
    character: {
        name: null,
        reputation: null
    },
    resources: {
        time: null,
        fund: null,
        manpower: null
    },
    stats: {
        satisfaction: null,
        contribution: null
    },
    tasks: [],
    currentEvent: null,
    currentTheme: null,
    currentThemeEventCount: 0,
    completedThemes: [],
    themeCount: 0,
    minThemesForEnding: 4,
    maxThemes: 4,
    gameSpeed: 1,
    isRunning: false,
    apiKey: '',
    usedLocalEventIndices: [],
    usedEventTexts: [],
    eventCount: 0,
    maxEvents: 10,
    isGameEnded: false
};

// 游戏初始化
async function initGame() {
    // 加载保存的游戏状态
    loadGame();
    // 从加密存储加载 API 密钥
    try {
        const savedApiKey = await APIKeyAccess.getApiKey();
        if (savedApiKey) {
            gameState.apiKey = savedApiKey;
            // 注意：不再填充到输入框（安全考虑）
            console.log('API 密钥已加载（加密存储）');
        }
    } catch (e) {
        console.error('加载 API 密钥失败:', e);
    }
    
    // 检查是否有进行中的游戏
    if (gameState.isRunning && !gameState.isGameEnded && gameState.character.name) {
        // 恢复游戏状态，显示当前事件
        restoreGameState();
    }
    
    // 更新 UI
    updateUI();
    // 加载游戏速度
    document.getElementById('game-speed').value = gameState.gameSpeed;
}

// 恢复游戏状态
function restoreGameState() {
    // 如果有当前事件，显示它
    if (gameState.currentEvent) {
        displayEvent(gameState.currentEvent);
    } else {
        // 如果没有当前事件，生成一个新事件
        generateLocalEvent();
    }
    
    // 恢复任务列表
    updateTaskList();
    
    // 显示欢迎回来提示
    showToast(`👋 欢迎回来，${gameState.character.name}！`);
}

// 切换面板展开/折叠
function togglePanel(panel) {
    panel.classList.toggle('collapsed');
}

// 确保 togglePanel 全局可用
window.togglePanel = togglePanel;

// 开始游戏
async function startGame() {
    console.log('开始游戏 函数被调用');
    // 检查是否已完成入职信息填写
    if (gameState.character.name && gameState.character.name !== 'null') {
        // 已入职，直接显示初始任务
        showInitialTaskModal();
    } else {
        // 显示精致的入职弹窗
        showGameStartModal();
    }
}

// 显示游戏入职弹窗
function showGameStartModal() {
    const modal = document.getElementById('game-start-modal');
    if (modal) {
        modal.style.display = 'flex';
        // 清空输入框
        const input = document.getElementById('player-name-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

// 关闭游戏入职弹窗
function closeGameStartModal() {
    const modal = document.getElementById('game-start-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 确认开始游戏
async function confirmGameStart() {
    const input = document.getElementById('player-name-input');
    const playerName = input ? input.value.trim() : '';
    
    if (!playerName) {
        alert('请输入您的姓名以开始游戏');
        return;
    }
    
    // 获取 API 模式选择
    const apiMode = document.querySelector('input[name="api-mode"]:checked')?.value || 'default';
    
    // 如果是自定义 API，检查是否已设置
    if (apiMode === 'custom') {
        const savedApiKey = localStorage.getItem('deepseekApiKey');
        if (!savedApiKey) {
            alert('请先在设置界面配置您的 API Key！');
            closeGameStartModal();
            setTimeout(() => {
                showSettingsModal();
            }, 300);
            return;
        }
        gameState.apiKey = savedApiKey;
        gameState.apiMode = 'custom';
    } else if (apiMode === 'default') {
        // 使用默认 API（从加密存储加载）
        const defaultKey = 'sk-b91fb54c524b40bf8ad6e8063f204dc5';
        gameState.apiKey = defaultKey;
        gameState.apiMode = 'default';
    } else {
        // 本地模式
        gameState.apiKey = '';
        gameState.apiMode = 'local';
    }
    
    // 获取确认按钮并禁用
    const confirmBtn = document.querySelector('#game-start-modal button[onclick="confirmGameStart()"]');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.6';
        confirmBtn.style.cursor = 'not-allowed';
        confirmBtn.textContent = '入职中...';
    }
    
    // 显示加载动画
    showLoadingAnimation('正在生成您的入职事件...');
    
    // 获取用户偏好
    const managementStyle = document.querySelector('input[name="management-style"]:checked')?.value || 'balanced';
    const familyStyle = document.querySelector('input[name="family-style"]:checked')?.value || 'professional';
    
    // 初始化游戏数值
    gameState.character.name = playerName;
    gameState.character.reputation = 0;
    gameState.resources.time = 100;
    gameState.resources.fund = 5000;
    gameState.resources.manpower = 5;
    gameState.stats.satisfaction = 0;
    gameState.stats.contribution = 0;
    gameState.isRunning = true;
    gameState.eventCount = 0;
    gameState.isGameEnded = false;
    gameState.usedLocalEventIndices = [];
    gameState.usedEventTexts = [];
    
    // 重置历史事件（新游戏开始，清空历史）
    eventHistory = [];
    updateHistoryPanel();
    
    // 保存用户偏好
    gameState.preferences = {
        managementStyle: managementStyle,
        familyStyle: familyStyle
    };
    
    // 关闭弹窗
    closeGameStartModal();
    
    // 生成初始任务
    generateInitialTasks();
    
    // 隐藏加载动画
    hideLoadingAnimation();
    
    // 恢复按钮状态
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.textContent = '确定入职';
    }
    
    // 更新UI
    updateUI();
    
    // 显示欢迎提示
    showToast(`🎉 欢迎 ${playerName} 加入遗体捐献协调中心！${apiMode === 'local' ? '（本地模式）' : apiMode === 'default' ? '（AI 模式）' : '（自定义 API）'}`);
    
    // 显示第一个学习任务
    setTimeout(() => {
        showInitialTaskModal();
    }, 500);
}

// 确保 startGame 函数全局可用
window.startGame = startGame;
window.showGameStartModal = showGameStartModal;
window.closeGameStartModal = closeGameStartModal;
window.confirmGameStart = confirmGameStart;

// 生成初始任务
function generateInitialTasks() {
    gameState.tasks = [
        {
            id: 1,
            title: '了解遗体捐献流程',
            description: '学习遗体捐献的完整流程和相关工作规范',
            status: 'pending',
            expReward: 10,
            reputationReward: 5,
            readingMaterial: `<div class="study-material">
<h4>📋 捐献条件</h4>
<table class="study-table">
<thead><tr><th>条件项目</th><th>具体要求与说明</th></tr></thead>
<tbody>
<tr><td><strong>基本原则</strong></td><td>自愿、无偿。任何组织和个人不得强迫、欺骗、利诱，不得买卖或变相买卖遗体。</td></tr>
<tr><td><strong>捐献人资格</strong></td><td>具有完全民事行为能力的自然人。限制民事行为能力人登记需征得监护人书面同意。</td></tr>
<tr><td><strong>执行人要求</strong></td><td>必须在生前指定捐献执行人。可以是亲属、朋友，也可以是工作单位、居委会等组织。</td></tr>
<tr><td><strong>身体条件限制</strong></td><td>患有国家规定的甲、乙类传染病（如鼠疫、霍乱、艾滋病、病毒性肝炎等）或遗体高度损毁、腐败的，不宜捐献。</td></tr>
<tr><td><strong>特殊情况捐献</strong></td><td>生前未登记但未表示反对者，去世后可由其配偶、父母、成年子女以书面形式共同同意并代办手续。</td></tr>
</tbody>
</table>

<h4>🔄 捐献流程</h4>
<table class="study-table">
<thead><tr><th>流程阶段</th><th>关键步骤与负责方</th></tr></thead>
<tbody>
<tr><td><strong>1. 生前登记</strong></td><td>捐献人联系登记机构，领取并填写《遗体捐献登记表》（一式三份），指定捐献执行人。</td></tr>
<tr><td><strong>2. 完成手续</strong></td><td>捐献人将填好的登记表交回登记接受站，接受站审核后登记编号，向捐献人颁发志愿捐献卡/荣誉证书。</td></tr>
<tr><td><strong>3. 逝世后联络</strong></td><td>捐献执行人/家属在捐献人逝世后，尽快办理死亡证明，并立即电话通知此前登记的遗体接受站，报告详细信息。</td></tr>
<tr><td><strong>4. 遗体交接</strong></td><td>遗体接受站接到通知后，派工作人员（一般12小时内）前往现场，核实身份及死亡证明，办理交接手续，并当场向家属开具《遗体捐献证明》（该证明与火化证明具有同等法律效力，可用于办理丧葬补助等事宜）。</td></tr>
<tr><td><strong>5. 后续处理</strong></td><td>遗体接受单位将遗体用于医学教学与科研，使用前会举行尊重遗体仪式。使用完毕后，由接受单位负责火化（执行人要求自行处理的除外）。</td></tr>
</tbody>
</table>
</div>`,
            hasVideo: true,
            videoTitle: '遗体捐献流程介绍',
            videoDuration: '5:32',
            questions: [
                {
                    question: '遗体捐献的定义是什么？',
                    options: [
                        '自然人生前自愿表示在死亡后，由其执行人将遗体的全部或者部分捐献给医学科学事业的行为',
                        '自然人生前强制要求将遗体捐献给医学科学事业的行为',
                        '自然人生前未表示捐献意愿的自然人死亡后，其近亲属无权决定捐献',
                        '以上都不对'
                    ],
                    correctAnswer: 0
                },
                {
                    question: '遗体捐献流程的第一步是什么？',
                    options: [
                        '医学评估',
                        '登记申请',
                        '签署协议',
                        '实施捐献'
                    ],
                    correctAnswer: 1
                },
                {
                    question: '遗体捐献工作的核心原则是什么？',
                    options: [
                        '自愿、无偿原则',
                        '强制、有偿原则',
                        '随机分配原则',
                        '以上都不是'
                    ],
                    correctAnswer: 0
                },
                {
                    question: '遗体捐献流程的最后一步是什么？',
                    options: [
                        '登记申请',
                        '医学评估',
                        '签署协议',
                        '纪念缅怀'
                    ],
                    correctAnswer: 3
                }
            ]
        },
        {
            id: 2,
            title: '联系潜在捐献者',
            description: '与有意向的捐献者进行沟通，了解他们的需求和担忧',
            status: 'pending',
            expReward: 20,
            reputationReward: 10,
            readingMaterial: `<div class="study-material">
<h4>💬 沟通核心原则</h4>
<table class="study-table">
<thead><tr><th>原则</th><th>具体要求</th></tr></thead>
<tbody>
<tr><td><strong>尊重意愿</strong></td><td>充分尊重捐献者的自主意愿，不得强迫、欺骗、利诱。任何组织和个人不得以任何形式买卖或变相买卖遗体。</td></tr>
<tr><td><strong>信息透明</strong></td><td>向捐献者详细说明捐献的流程、意义、用途和可能的影响，确保信息真实、完整、准确。</td></tr>
<tr><td><strong>解答疑问</strong></td><td>耐心解答捐献者及其家属的所有疑问，用专业知识和真诚态度消除他们的顾虑。</td></tr>
<tr><td><strong>关注心理</strong></td><td>关注捐献者及家属的心理状态，在敏感时刻提供必要的心理支持和情感陪伴。</td></tr>
<tr><td><strong>保护隐私</strong></td><td>严格保护捐献者的个人信息和隐私，未经同意不得向第三方透露。</td></tr>
</tbody>
</table>

<h4>❓ 常见疑虑及专业解答</h4>
<table class="study-table">
<thead><tr><th>常见疑虑</th><th>专业解答</th></tr></thead>
<tbody>
<tr>
<td><strong>会影响丧葬仪式吗？</strong></td>
<td>捐献遗体后，家属仍可以举行正常的告别仪式和纪念活动。遗体接受单位在使用前会举行尊重遗体仪式，使用完毕后负责火化，骨灰可由家属领回安葬。</td>
</tr>
<tr>
<td><strong>对家庭有负面影响吗？</strong></td>
<td>捐献遗体是一种高尚的人道主义行为，体现对医学教育事业的支持。社会对此给予高度评价和尊重，家属应为此感到骄傲。</td>
</tr>
<tr>
<td><strong>流程复杂吗？</strong></td>
<td>流程简洁明了：生前登记→完成手续→逝世后联络→遗体交接→后续处理。红十字会和相关机构会提供全程指导和帮助。</td>
</tr>
<tr>
<td><strong>可以反悔吗？</strong></td>
<td>捐献完全自愿，生前可以随时变更或撤销捐献意愿，只需书面通知登记机构即可。</td>
</tr>
</tbody>
</table>
</div>`,
            questions: [
                {
                    question: '与潜在捐献者沟通时，以下哪项是正确的？',
                    options: [
                        '可以强迫或诱导捐献者',
                        '不需要详细说明捐献的流程和意义',
                        '需要尊重捐献者的自主意愿',
                        '不需要关注捐献者的心理状态'
                    ],
                    correctAnswer: 2
                },
                {
                    question: '以下哪种疑虑是常见的？',
                    options: [
                        '捐献遗体会获得经济补偿',
                        '捐献遗体会影响丧葬仪式',
                        '捐献遗体是违法行为',
                        '以上都不是'
                    ],
                    correctAnswer: 1
                },
                {
                    question: '与潜在捐献者沟通时，需要保护什么？',
                    options: [
                        '捐献者的个人信息和隐私',
                        '捐献者的财产',
                        '捐献者的家属信息',
                        '以上都不是'
                    ],
                    correctAnswer: 0
                },
                {
                    question: '与潜在捐献者沟通时，以下哪项是正确的做法？',
                    options: [
                        '不需要解答捐献者的疑问',
                        '关注捐献者的心理状态，提供必要的心理支持',
                        '可以透露其他捐献者的个人信息',
                        '不需要尊重捐献者的意愿'
                    ],
                    correctAnswer: 1
                }
            ]
        },
        {
            id: 3,
            title: '准备捐献材料',
            description: '准备遗体捐献所需的各种文件和材料',
            status: 'pending',
            expReward: 15,
            reputationReward: 8,
            readingMaterial: `<div class="study-material">
<h4>📄 必备文件清单</h4>
<table class="study-table">
<thead><tr><th>文件类型</th><th>具体要求</th><th>备注说明</th></tr></thead>
<tbody>
<tr>
<td><strong>捐献登记表</strong></td>
<td>由捐献者或其近亲属填写的正式登记表格，一式三份</td>
<td>需本人签字，字迹清晰，信息完整</td>
</tr>
<tr>
<td><strong>身份证明</strong></td>
<td>捐献者的身份证或户口本复印件</td>
<td>复印件需清晰可辨，在有效期内</td>
</tr>
<tr>
<td><strong>近亲属同意书</strong></td>
<td>生前未明确表示捐献意愿的，需配偶、父母、成年子女共同书面同意</td>
<td>所有近亲属均需签字确认</td>
</tr>
<tr>
<td><strong>医学证明</strong></td>
<td>由医院出具的死亡证明或相关医学证明</td>
<td>证明死亡原因和时间</td>
</tr>
<tr>
<td><strong>其他材料</strong></td>
<td>根据当地具体要求可能需要提供的补充材料</td>
<td>可咨询当地登记机构</td>
</tr>
</tbody>
</table>

<h4>⚠️ 材料准备注意事项</h4>
<table class="study-table">
<thead><tr><th>注意事项</th><th>具体要求</th></tr></thead>
<tbody>
<tr><td><strong>真实性</strong></td><td>确保所有材料真实有效，不得伪造、涂改</td></tr>
<tr><td><strong>完整性</strong></td><td>按照接收机构的要求规范填写，信息完整无遗漏</td></tr>
<tr><td><strong>备份留存</strong></td><td>保留所有材料的副本，以备后续需要或查询</td></tr>
<tr><td><strong>及时提交</strong></td><td>在规定时间内提交材料，避免因材料不全影响捐献流程</td></tr>
<tr><td><strong>妥善保管</strong></td><td>重要文件原件需妥善保管，避免遗失或损坏</td></tr>
</tbody>
</table>
</div>`,
            questions: [
                {
                    question: '遗体捐献所需的文件不包括以下哪项？',
                    options: [
                        '捐献登记表',
                        '身份证明',
                        '近亲属同意书',
                        '财产证明'
                    ],
                    correctAnswer: 3
                },
                {
                    question: '如果捐献者生前未明确表示捐献意愿，需要什么？',
                    options: [
                        '不需要任何材料',
                        '近亲属签署同意书',
                        '社区委员会证明',
                        '以上都不是'
                    ],
                    correctAnswer: 1
                },
                {
                    question: '材料准备的注意事项不包括以下哪项？',
                    options: [
                        '确保所有材料的真实性和完整性',
                        '按照接收机构的要求规范填写各种表格',
                        '保留所有材料的副本',
                        '不需要提交材料，口头申请即可'
                    ],
                    correctAnswer: 3
                },
                {
                    question: '以下哪项是遗体捐献所需的材料？',
                    options: [
                        '捐献登记表',
                        '身份证明',
                        '医学证明',
                        '以上都是'
                    ],
                    correctAnswer: 3
                }
            ]
        }
    ];
}

// 更新UI
function updateUI() {
    // 更新角色信息
    document.getElementById('character-name').textContent = gameState.character.name || '未开始';
    
    // 更新管理风格和沟通风格
    const managementStyleEl = document.getElementById('character-management-style');
    const familyStyleEl = document.getElementById('character-family-style');
    
    if (gameState.preferences) {
        const managementStyleMap = {
            'efficient': '⚡ 高效务实',
            'caring': '💝 温情关怀',
            'balanced': '⚖️ 平衡兼顾'
        };
        const familyStyleMap = {
            'professional': '📋 专业理性',
            'empathetic': '🤗 共情陪伴',
            'gentle': '🌸 温柔细腻'
        };
        managementStyleEl.textContent = managementStyleMap[gameState.preferences.managementStyle] || '-';
        familyStyleEl.textContent = familyStyleMap[gameState.preferences.familyStyle] || '-';
    } else {
        managementStyleEl.textContent = '-';
        familyStyleEl.textContent = '-';
    }

    // 更新统计
    document.getElementById('stats-satisfaction').textContent = (gameState.stats.satisfaction || 0) + '%';
    document.getElementById('stats-contribution').textContent = gameState.stats.contribution || 0;
    document.getElementById('stats-themes').textContent = (gameState.completedThemes ? gameState.completedThemes.length : 0) + '/' + gameState.maxThemes;

    // 更新任务列表
    updateTaskList();
}

// 更新任务列表
function updateTaskList() {
    const tasksContainer = document.getElementById('tasks');
    tasksContainer.innerHTML = '';

    gameState.tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.status}`;
        taskItem.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="task-status ${task.status}">${task.status === 'pending' ? '待完成' : '已完成'}</span>
                ${task.status === 'pending' ? `<button class="btn btn-sm" onclick="startTask(${task.id})">开始学习</button>` : `<button class="btn btn-sm btn-secondary" onclick="reviewTask(${task.id})">👁️ 回看</button>`}
            </div>
        `;
        tasksContainer.appendChild(taskItem);
    });
}

// 开始任务学习
function startTask(taskId) {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (task) {
        // 创建学习弹窗
        const popup = document.createElement('div');
        popup.className = 'task-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = 'white';
        popup.style.borderRadius = '10px';
        popup.style.padding = '30px';
        popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        popup.style.zIndex = '1000';
        popup.style.maxWidth = '80%';
        popup.style.maxHeight = '80%';
        popup.style.overflow = 'auto';
        
        // 创建标题
        const title = document.createElement('h3');
        title.textContent = task.title;
        title.style.color = '#2c3e50';
        title.style.marginBottom = '20px';
        title.style.textAlign = 'center';
        
        // 创建视频任务点（如果有视频）
        let videoSection = null;
        if (task.hasVideo) {
            videoSection = document.createElement('div');
            videoSection.style.marginBottom = '30px';
            videoSection.innerHTML = `
                <h4 style="color: #34495e; margin-bottom: 15px;">🎬 视频学习</h4>
                <div class="video-task-point" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 25px; color: white; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);" onclick="playTaskVideo(this)">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="video-play-btn" style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; transition: all 0.3s ease;">
                            ▶️
                        </div>
                        <div style="flex: 1;">
                            <h5 style="font-size: 1.2rem; margin-bottom: 8px; font-weight: 600;">${task.videoTitle || '视频课程'}</h5>
                            <p style="opacity: 0.9; font-size: 0.95rem; margin-bottom: 5px;">点击观看视频学习内容</p>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; opacity: 0.8;">
                                <span>⏱️ ${task.videoDuration || '5:00'}</span>
                                <span>•</span>
                                <span>📺 高清视频</span>
                            </div>
                        </div>
                        <div class="video-status" style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; font-size: 0.85rem;">
                            未观看
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 创建阅读资料
        const readingSection = document.createElement('div');
        readingSection.style.marginBottom = '30px';
        const readingTitle = document.createElement('h4');
        readingTitle.textContent = '📚 阅读资料';
        readingTitle.style.color = '#34495e';
        readingTitle.style.marginBottom = '10px';
        const readingContent = document.createElement('div');
        readingContent.innerHTML = task.readingMaterial;
        readingContent.style.lineHeight = '1.6';
        readingContent.style.color = '#555';
        readingSection.appendChild(readingTitle);
        readingSection.appendChild(readingContent);
        
        // 创建题目部分
        const quizSection = document.createElement('div');
        quizSection.style.marginBottom = '30px';
        const quizTitle = document.createElement('h4');
        quizTitle.textContent = '📝 测试题目';
        quizTitle.style.color = '#34495e';
        quizTitle.style.marginBottom = '15px';
        quizSection.appendChild(quizTitle);
        
        // 添加题目
        task.questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.style.marginBottom = '20px';
            questionDiv.style.padding = '15px';
            questionDiv.style.borderRadius = '5px';
            questionDiv.style.background = '#f8f9fa';
            const questionText = document.createElement('p');
            questionText.textContent = `${index + 1}. ${q.question}`;
            questionText.style.fontWeight = '500';
            questionText.style.marginBottom = '10px';
            questionDiv.appendChild(questionText);
            
            // 添加选项
            q.options.forEach((option, optIndex) => {
                const optionDiv = document.createElement('div');
                optionDiv.style.marginBottom = '8px';
                optionDiv.style.padding = '8px';
                optionDiv.style.borderRadius = '3px';
                optionDiv.style.transition = 'all 0.3s ease';
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question-${index}`;
                radio.value = optIndex;
                radio.id = `q${index}-${optIndex}`;
                const label = document.createElement('label');
                label.htmlFor = `q${index}-${optIndex}`;
                label.textContent = option;
                label.style.marginLeft = '10px';
                label.style.cursor = 'pointer';
                optionDiv.appendChild(radio);
                optionDiv.appendChild(label);
                questionDiv.appendChild(optionDiv);
            });
            
            // 添加详细解答（初始隐藏）
            const explanationDiv = document.createElement('div');
            explanationDiv.id = `explanation-${index}`;
            explanationDiv.style.marginTop = '10px';
            explanationDiv.style.padding = '10px';
            explanationDiv.style.borderRadius = '3px';
            explanationDiv.style.display = 'none';
            questionDiv.appendChild(explanationDiv);
            
            quizSection.appendChild(questionDiv);
        });
        
        // 创建按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.marginTop = '20px';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => popup.remove();
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-success';
        submitBtn.textContent = '提交答案';
        submitBtn.onclick = () => {
            // 检查答案
            let correctCount = 0;
            task.questions.forEach((q, index) => {
                const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
                const questionDiv = document.querySelector(`#q${index}-0`).closest('div');
                const explanationDiv = document.getElementById(`explanation-${index}`);
                
                // 重置所有选项样式
                const optionDivs = questionDiv.querySelectorAll('div');
                optionDivs.forEach((div, optIndex) => {
                    if (div.querySelector('input[type="radio"]')) {
                        div.style.background = '';
                        div.style.color = '';
                    }
                });
                
                if (selectedOption) {
                    const selectedIndex = parseInt(selectedOption.value);
                    const selectedOptionDiv = selectedOption.closest('div');
                    
                    if (selectedIndex === q.correctAnswer) {
                        // 答对了
                        correctCount++;
                        selectedOptionDiv.style.background = '#d4edda';
                        selectedOptionDiv.style.color = '#155724';
                        explanationDiv.style.background = '#d4edda';
                        explanationDiv.style.color = '#155724';
                        explanationDiv.textContent = '✅ 回答正确！';
                    } else {
                        // 答错了
                        selectedOptionDiv.style.background = '#f8d7da';
                        selectedOptionDiv.style.color = '#721c24';
                        // 显示正确答案
                        const correctOptionDiv = document.querySelector(`#q${index}-${q.correctAnswer}`).closest('div');
                        correctOptionDiv.style.background = '#d4edda';
                        correctOptionDiv.style.color = '#155724';
                        // 显示详细解答
                        explanationDiv.style.background = '#f8d7da';
                        explanationDiv.style.color = '#721c24';
                        explanationDiv.textContent = `❌ 回答错误！正确答案是：${q.options[q.correctAnswer]}`;
                    }
                    explanationDiv.style.display = 'block';
                } else {
                    // 未作答
                    questionDiv.style.border = '1px solid #f8d7da';
                    explanationDiv.style.background = '#f8d7da';
                    explanationDiv.style.color = '#721c24';
                    explanationDiv.textContent = '⚠️ 请选择一个答案！';
                    explanationDiv.style.display = 'block';
                }
            });
            
            if (correctCount === task.questions.length) {
                // 所有题目都答对了
                completeTask(taskId);
                
                // 刷新任务列表以显示"回看"按钮
                updateTaskList();
                
                // 检查是否还有下一个任务
                const nextTask = gameState.tasks.find(t => t.status === 'pending');
                const isLastTask = !nextTask;
                
                // 显示完成界面
                showTaskCompletionScreen(popup, taskId, isLastTask, nextTask);
            } else {
                // 有题目答错了
                alert(`你答对了 ${correctCount} 题，需要答对所有题目才能完成任务。请再试一次！`);
            }
        };
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(submitBtn);
        
        // 组装弹窗
        popup.appendChild(title);
        if (videoSection) {
            popup.appendChild(videoSection);
        }
        popup.appendChild(readingSection);
        popup.appendChild(quizSection);
        popup.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(popup);
    }
}

// 显示任务完成界面
function showTaskCompletionScreen(popup, taskId, isLastTask, nextTask) {
    // 清空弹窗内容
    popup.innerHTML = '';
    popup.style.textAlign = 'center';
    popup.style.padding = '40px';
    
    // 计算进度
    const completedCount = gameState.tasks.filter(t => t.status === 'completed').length;
    const totalCount = gameState.tasks.length;
    
    // 完成图标
    const iconDiv = document.createElement('div');
    iconDiv.textContent = '🎉';
    iconDiv.style.fontSize = '4rem';
    iconDiv.style.marginBottom = '20px';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '任务完成！';
    title.style.color = '#27ae60';
    title.style.marginBottom = '15px';
    
    // 进度显示
    const progressDiv = document.createElement('div');
    progressDiv.style.marginBottom = '25px';
    progressDiv.innerHTML = `
        <div style="background: #e0e0e0; border-radius: 10px; height: 10px; overflow: hidden; margin-bottom: 10px;">
            <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); height: 100%; width: ${(completedCount / totalCount) * 100}%; transition: width 0.3s;"></div>
        </div>
        <p style="color: #666; font-size: 0.9rem;">已完成 ${completedCount}/${totalCount} 个任务</p>
    `;
    
    // 按钮
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-primary';
    actionBtn.style.padding = '15px 40px';
    actionBtn.style.fontSize = '1.1rem';
    actionBtn.style.borderRadius = '25px';
    actionBtn.style.border = 'none';
    actionBtn.style.cursor = 'pointer';
    actionBtn.style.color = 'white';
    
    if (isLastTask) {
        // 最后一个任务
        actionBtn.textContent = '恭喜完成！';
        actionBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
        actionBtn.onclick = async () => {
            popup.remove();
            // 显示事件生成动画
            showLoadingAnimation('正在分配工作任务...');
            
            // 模拟事件生成过程，增加一些延迟让动画更明显
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 生成事件
            await generateLocalEvent();
            
            // 隐藏加载动画
            hideLoadingAnimation();
            
            showToast('🎉 培训完成！您已准备好接收第一个工作分配');
        };
    } else {
        // 还有下一个任务
        actionBtn.textContent = '下一个';
        actionBtn.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
        actionBtn.onclick = () => {
            popup.remove();
            if (nextTask) {
                startTask(nextTask.id);
            }
        };
    }
    
    // 组装
    popup.appendChild(iconDiv);
    popup.appendChild(title);
    popup.appendChild(progressDiv);
    popup.appendChild(actionBtn);
}

// 显示初始学习任务弹窗
function showInitialTaskModal() {
    // 查找第一个未完成的任务
    const pendingTask = gameState.tasks.find(t => t.status === 'pending');
    if (!pendingTask) {
        // 所有任务都完成了，直接生成工作事件
        showToast('🎉 所有培训已完成！准备接收工作分配');
        generateLocalEvent();
        return;
    }
    
    // 计算进度
    const completedCount = gameState.tasks.filter(t => t.status === 'completed').length;
    const totalCount = gameState.tasks.length;
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'initial-task-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '2000';
    
    // 创建内容容器
    const content = document.createElement('div');
    content.style.background = 'white';
    content.style.borderRadius = '15px';
    content.style.padding = '40px';
    content.style.maxWidth = '600px';
    content.style.width = '90%';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = '📚 入职培训';
    title.style.color = '#2c3e50';
    title.style.marginBottom = '10px';
    
    // 进度显示
    const progressDiv = document.createElement('div');
    progressDiv.style.marginBottom = '20px';
    progressDiv.innerHTML = `
        <div style="background: #e0e0e0; border-radius: 10px; height: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); height: 100%; width: ${(completedCount / totalCount) * 100}%; transition: width 0.3s;"></div>
        </div>
        <p style="margin-top: 8px; color: #666; font-size: 0.9rem;">进度：${completedCount}/${totalCount} 个任务</p>
    `;
    
    // 说明文字
    const desc = document.createElement('p');
    desc.textContent = completedCount === 0 
        ? '欢迎加入遗体捐献协调中心！在开始工作之前，您需要完成所有入职培训任务。'
        : '继续完成剩余的培训任务，完成后即可开始接收工作分配。';
    desc.style.color = '#555';
    desc.style.marginBottom = '25px';
    desc.style.lineHeight = '1.6';
    
    // 任务卡片
    const taskCard = document.createElement('div');
    taskCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    taskCard.style.borderRadius = '10px';
    taskCard.style.padding = '25px';
    taskCard.style.marginBottom = '25px';
    taskCard.style.color = 'white';
    taskCard.style.textAlign = 'left';
    const questionCount = pendingTask.questions ? pendingTask.questions.length : 0;
    taskCard.innerHTML = `
        <h3 style="margin-bottom: 10px; font-size: 1.2rem;">🎯 ${pendingTask.title}</h3>
        <p style="opacity: 0.9; font-size: 0.95rem; margin-bottom: 15px;">${pendingTask.description}</p>
        <div style="display: flex; gap: 15px; font-size: 0.85rem; opacity: 0.8;">
            <span>📖 阅读材料</span>
            <span>📝 ${questionCount}道测试题</span>
        </div>
    `;
    
    // 开始按钮
    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary';
    startBtn.textContent = '开始学习';
    startBtn.style.padding = '15px 40px';
    startBtn.style.fontSize = '1.1rem';
    startBtn.style.borderRadius = '25px';
    startBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
    startBtn.style.color = 'white';
    startBtn.style.border = 'none';
    startBtn.style.cursor = 'pointer';
    startBtn.onclick = () => {
        modal.remove();
        startTask(pendingTask.id);
    };
    
    // 跳过按钮（仅在第一个任务时显示）
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn';
    skipBtn.textContent = completedCount === 0 ? '⏭️ 跳过教程' : '⏭️ 跳过';
    skipBtn.style.padding = '12px 30px';
    skipBtn.style.fontSize = '1rem';
    skipBtn.style.borderRadius = '25px';
    skipBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    skipBtn.style.color = 'white';
    skipBtn.style.border = 'none';
    skipBtn.style.cursor = 'pointer';
    skipBtn.style.marginLeft = '10px';
    skipBtn.onclick = () => {
        if (confirm('确定要跳过教程吗？教程将帮助您了解基本操作流程。')) {
            // 标记所有任务为已完成
            gameState.tasks.forEach(task => {
                task.status = 'completed';
            });
            modal.remove();
            showToast('✅ 已跳过教程，您可以随时在设置中重新查看');
            updateUI();
            saveGame();
            // 直接生成第一个工作事件
            setTimeout(() => {
                generateLocalEvent();
            }, 500);
        }
    };
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.appendChild(startBtn);
    buttonContainer.appendChild(skipBtn);
    
    // 组装
    content.appendChild(title);
    content.appendChild(progressDiv);
    content.appendChild(desc);
    content.appendChild(taskCard);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// 检查是否可以开始事件选择
function canStartEventSelection() {
    // 检查是否已完成所有初始培训任务
    if (!gameState.tasks || gameState.tasks.length === 0) return false;
    const allTasksCompleted = gameState.tasks.every(t => t.status === 'completed');
    return allTasksCompleted;
}

// 显示需要培训的提示弹窗
function showTrainingRequiredModal() {
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'training-required-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '2000';
    
    // 创建内容容器
    const content = document.createElement('div');
    content.style.background = 'white';
    content.style.borderRadius = '15px';
    content.style.padding = '40px';
    content.style.maxWidth = '500px';
    content.style.width = '90%';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
    
    // 图标
    const icon = document.createElement('div');
    icon.textContent = '📚';
    icon.style.fontSize = '4rem';
    icon.style.marginBottom = '20px';
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = '需要先完成入职培训';
    title.style.color = '#2c3e50';
    title.style.marginBottom = '15px';
    
    // 说明文字
    const desc = document.createElement('p');
    desc.textContent = '您还没有完成入职培训任务。请先完成培训，了解遗体捐献的基本流程和工作规范后，才能开始接收工作分配。';
    desc.style.color = '#555';
    desc.style.marginBottom = '30px';
    desc.style.lineHeight = '1.6';
    
    // 按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '15px';
    btnContainer.style.justifyContent = 'center';
    
    // 去培训按钮
    const trainBtn = document.createElement('button');
    trainBtn.className = 'btn btn-primary';
    trainBtn.textContent = '去完成培训';
    trainBtn.style.padding = '12px 30px';
    trainBtn.style.fontSize = '1rem';
    trainBtn.style.borderRadius = '25px';
    trainBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
    trainBtn.style.color = 'white';
    trainBtn.style.border = 'none';
    trainBtn.style.cursor = 'pointer';
    trainBtn.onclick = () => {
        modal.remove();
        startTask(1);
    };
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.textContent = '稍后再说';
    closeBtn.style.padding = '12px 30px';
    closeBtn.style.fontSize = '1rem';
    closeBtn.style.borderRadius = '25px';
    closeBtn.style.background = '#e0e0e0';
    closeBtn.style.color = '#555';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        modal.remove();
    };
    
    // 组装
    btnContainer.appendChild(closeBtn);
    btnContainer.appendChild(trainBtn);
    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// 回看已完成的任务
function reviewTask(taskId) {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 创建学习弹窗（回看模式）
    const popup = document.createElement('div');
    popup.className = 'task-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'white';
    popup.style.borderRadius = '10px';
    popup.style.padding = '30px';
    popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    popup.style.zIndex = '1000';
    popup.style.maxWidth = '80%';
    popup.style.maxHeight = '80%';
    popup.style.overflow = 'auto';
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = task.title + '（回看模式）';
    title.style.color = '#2c3e50';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    
    // 创建视频任务点（如果有视频）
    let videoSection = null;
    if (task.hasVideo) {
        videoSection = document.createElement('div');
        videoSection.style.marginBottom = '30px';
        videoSection.innerHTML = `
            <h4 style="color: #34495e; margin-bottom: 15px;">🎬 视频学习</h4>
            <div class="video-task-point" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 25px; color: white; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);" onclick="playTaskVideo(this)">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div class="video-play-btn" style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; transition: all 0.3s ease;">
                        ▶️
                    </div>
                    <div style="flex: 1;">
                        <h5 style="font-size: 1.2rem; margin-bottom: 8px; font-weight: 600;">${task.videoTitle || '视频课程'}</h5>
                        <p style="opacity: 0.9; font-size: 0.95rem; margin-bottom: 5px;">点击观看视频学习内容</p>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; opacity: 0.8;">
                            <span>⏱️ ${task.videoDuration || '5:00'}</span>
                            <span>•</span>
                            <span>📺 高清视频</span>
                        </div>
                    </div>
                    <div class="video-status" style="background: rgba(46, 204, 113, 0.3); padding: 8px 15px; border-radius: 20px; font-size: 0.85rem;">
                        ✓ 已观看
                    </div>
                </div>
            </div>
        `;
    }
    
    // 创建阅读资料
    const readingSection = document.createElement('div');
    readingSection.style.marginBottom = '30px';
    const readingTitle = document.createElement('h4');
    readingTitle.textContent = '📚 阅读资料';
    readingTitle.style.color = '#34495e';
    readingTitle.style.marginBottom = '10px';
    const readingContent = document.createElement('div');
    readingContent.innerHTML = task.readingMaterial;
    readingContent.style.lineHeight = '1.6';
    readingContent.style.color = '#555';
    readingSection.appendChild(readingTitle);
    readingSection.appendChild(readingContent);
    
    // 创建题目部分（回看模式显示答案）
    const quizSection = document.createElement('div');
    quizSection.style.marginBottom = '30px';
    const quizTitle = document.createElement('h4');
    quizTitle.textContent = '📝 测试题目（正确答案已标注）';
    quizTitle.style.color = '#34495e';
    quizTitle.style.marginBottom = '15px';
    quizSection.appendChild(quizTitle);
    
    // 添加题目（显示正确答案）
    task.questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.style.marginBottom = '20px';
        questionDiv.style.padding = '15px';
        questionDiv.style.borderRadius = '5px';
        questionDiv.style.background = '#f8f9fa';
        const questionText = document.createElement('p');
        questionText.textContent = `${index + 1}. ${q.question}`;
        questionText.style.fontWeight = '500';
        questionText.style.marginBottom = '10px';
        questionDiv.appendChild(questionText);
        
        // 添加选项
        q.options.forEach((option, optIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.marginBottom = '8px';
            optionDiv.style.padding = '8px';
            optionDiv.style.borderRadius = '3px';
            
            if (optIndex === q.correctAnswer) {
                // 正确答案
                optionDiv.style.background = '#d4edda';
                optionDiv.style.color = '#155724';
                optionDiv.innerHTML = `✅ ${option}`;
            } else {
                optionDiv.style.color = '#555';
                optionDiv.textContent = option;
            }
            
            questionDiv.appendChild(optionDiv);
        });
        
        quizSection.appendChild(questionDiv);
    });
    
    // 创建关闭按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.marginTop = '20px';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-success';
    closeBtn.textContent = '✓ 关闭回看';
    closeBtn.onclick = () => popup.remove();
    
    buttonContainer.appendChild(closeBtn);
    
    // 组装弹窗
    popup.appendChild(title);
    if (videoSection) {
        popup.appendChild(videoSection);
    }
    popup.appendChild(readingSection);
    popup.appendChild(quizSection);
    popup.appendChild(buttonContainer);
    
    // 添加到页面
    document.body.appendChild(popup);
}

// 确保 reviewTask 全局可用
window.reviewTask = reviewTask;

// 播放任务视频
function playTaskVideo(videoElement) {
    // 更改状态为已观看
    const statusBadge = videoElement.querySelector('.video-status');
    const playBtn = videoElement.querySelector('.video-play-btn');
    
    if (statusBadge.textContent === '未观看') {
        statusBadge.textContent = '✓ 已观看';
        statusBadge.style.background = 'rgba(46, 204, 113, 0.3)';
        playBtn.innerHTML = '✅';
        
        // 显示提示
        showToast('🎬 视频学习完成！+5 经验值');
        
        // 添加经验值
        gameState.character.exp += 5;
        updateUI();
    }
    
    // 模拟视频播放（实际项目中这里可以打开视频播放器）
    alert('📺 视频播放功能\n\n这里将播放遗体捐献流程介绍视频\n（实际项目中可接入真实视频资源）');
}

// 确保 playTaskVideo 全局可用
window.playTaskVideo = playTaskVideo;

// 完成任务
function completeTask(taskId) {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'completed';
        // 奖励
        gameState.character.reputation += task.reputationReward;
        // 更新UI
        updateUI();
        // 保存游戏
        saveGame();
        
        // 注意：任务完成后的流程现在在 showTaskCompletionScreen 中处理
        // 这里只更新任务状态，不触发后续事件
    }
}

// 检查升级
// 生成事件
async function generateEvent() {
    // 检查 API 模式
    if (gameState.apiMode === 'local' || !gameState.apiKey) {
        // 本地模式：使用预设事件
        await generateLocalEvent();
    } else {
        // AI 模式：调用 API 生成事件
        await generateAIEvent();
    }
}

// 调用 AI 生成事件
async function generateAIEvent() {
    if (!gameState.apiKey) {
        // 没有 API Key，回退到本地事件
        await generateLocalEvent();
        return;
    }
    
    // 检查是否已完成入职培训
    if (!canStartEventSelection()) {
        showTrainingRequiredModal();
        return;
    }
    
    // 显示加载动画
    showLoadingAnimation('正在生成事件...');
    
    try {
        // 构建提示词
        const preferences = gameState.preferences || { managementStyle: 'balanced', familyStyle: 'professional' };
        const styleGuidance = buildStyleGuidance(preferences);
        
        const prompt = `你是一名遗体捐献协调员模拟游戏的 AI 事件生成器。请根据以下要求生成一个简短的工作事件：

【游戏背景】
玩家扮演一名遗体捐献协调员，负责处理遗体捐献相关的工作。

【玩家偏好】
${styleGuidance}

【当前状态】
已完成主题数：${gameState.themeCount}/${gameState.maxThemes}

【生成要求】
1. 事件要简短精炼（100 字以内）
2. 包含 3 个选项（A/B/C），每个选项 20 字以内
3. 选项要体现不同的处理风格
4. 效果数值要合理（时间 -5 到 -15，其他属性 -5 到 +15）

请严格按照以下 JSON 格式返回（不要包含任何解释文字）：
{
    "title": "事件标题（20 字以内）",
    "description": "事件描述（100 字以内）",
    "background": "事件背景（50 字以内，可选项）",
    "options": [
        {
            "text": "选项 A 内容",
            "effects": {
                "time": -10,
                "reputation": 5,
                "satisfaction": 10
            }
        },
        {
            "text": "选项 B 内容",
            "effects": {
                "time": -5,
                "reputation": 3,
                "satisfaction": 5
            }
        },
        {
            "text": "选项 C 内容",
            "effects": {
                "time": -8,
                "reputation": 2,
                "satisfaction": 3
            }
        }
    ]
}`;

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的遗体捐献协调员模拟游戏事件生成器。你只返回 JSON 格式的事件数据，不包含任何额外文字。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败：${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // 解析 JSON
        let eventData;
        try {
            // 尝试提取 JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                eventData = JSON.parse(jsonMatch[0]);
            } else {
                eventData = JSON.parse(aiResponse);
            }
        } catch (e) {
            console.error('解析 AI 响应失败:', e);
            throw new Error('AI 响应格式错误');
        }
        
        // 显示事件
        showEventModal(eventData);
        
    } catch (error) {
        console.error('生成 AI 事件失败:', error);
        showToast('⚠️ AI 生成失败，已切换到本地事件');
        await generateLocalEvent();
    } finally {
        hideLoadingAnimation();
    }
}

// 构建风格指导文本
function buildStyleGuidance(preferences) {
    let styleGuidance = '';
    
    // 管理风格指导
    if (preferences.managementStyle === 'efficient') {
        styleGuidance += '\n- 管理风格：高效务实。事件应体现时间管理、资源优化、流程效率等主题。';
    } else if (preferences.managementStyle === 'caring') {
        styleGuidance += '\n- 管理风格：温情关怀。事件应体现人文关怀、团队凝聚力、温暖氛围等主题。';
    } else {
        styleGuidance += '\n- 管理风格：平衡兼顾。事件应平衡效率与人文关怀。';
    }
    
    // 家属沟通风格指导
    if (preferences.familyStyle === 'professional') {
        styleGuidance += '\n- 沟通风格：专业理性。对话应体现专业性、逻辑性、清晰的解释说明。';
    } else if (preferences.familyStyle === 'empathetic') {
        styleGuidance += '\n- 沟通风格：共情陪伴。对话应体现深度共情、情感支持、温暖陪伴。';
    } else {
        styleGuidance += '\n- 沟通风格：温柔细腻。对话应体现温柔体贴、细致入微、轻声细语。';
    }
    
    return styleGuidance;
}

// 显示事件弹窗
function showEventModal(eventData) {
    // 创建事件弹窗
    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.className = 'event-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1001; display: flex; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border-radius: 20px; max-width: 700px; width: 90%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; max-height: 85vh; overflow-y: auto;">
            <div style="height: 8px; background: linear-gradient(90deg, #3498db, #2ecc71);"></div>
            
            <div style="padding: 30px;">
                <h3 style="color: #2c3e50; font-size: 1.5rem; margin-bottom: 20px;">${eventData.title}</h3>
                
                ${eventData.background ? `
                    <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
                        <p style="color: #5d4037; line-height: 1.8;">${eventData.background}</p>
                    </div>
                ` : ''}
                
                <p style="color: #555; line-height: 1.8; margin-bottom: 25px; font-size: 1rem;">${eventData.description}</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${eventData.options.map((opt, idx) => {
                        const labels = ['A', 'B', 'C'];
                        return `
                            <button onclick="handleEventOptionSelected(${idx})" style="padding: 15px 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #dee2e6; border-radius: 10px; cursor: pointer; transition: all 0.3s; text-align: left; font-size: 0.95rem; color: #2c3e50;">
                                <strong style="color: #3498db;">${labels[idx]}.</strong> ${opt.text}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 存储当前事件以供选项处理
    window.currentEventForHistory = eventData;
}

// 处理 AI 生成事件的选项选择
function handleEventOptionSelected(optionIndex) {
    const eventData = window.currentEventForHistory;
    if (!eventData || !eventData.options[optionIndex]) {
        console.error('事件数据无效');
        return;
    }
    
    const option = eventData.options[optionIndex];
    
    // 关闭事件弹窗
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.remove();
    }
    
    // 保存当前事件和选项
    currentEventForHistory = eventData;
    currentOptionForHistory = option;
    
    // 应用效果
    applyEffects(option.effects);
    // 显示效果反馈
    showEffectFeedback(option.effects);
    
    // 增加事件计数
    gameState.eventCount++;
    gameState.currentThemeEventCount++;
    
    // 添加到历史记录
    addEventToHistory(eventData, option);
    
    // 检查是否达到最大主题数
    if (gameState.themeCount >= gameState.maxThemes) {
        gameState.isGameEnded = true;
        setTimeout(() => {
            showEnding();
        }, 1000);
        updateUI();
        saveGame();
        return;
    }
    
    // 询问是否生成日记
    setTimeout(() => {
        showDiaryGenerateModal(eventData, option);
    }, 500);
    
    // 更新 UI
    updateUI();
    // 保存游戏
    saveGame();
}

// 生成本地事件
async function generateLocalEvent() {
    // 检查是否已完成入职培训
    if (!canStartEventSelection()) {
        // 显示提示，引导用户完成培训
        showTrainingRequiredModal();
        return;
    }
    const events = [
        {
            title: '新的捐献者咨询',
            description: '一位65岁的退休教师李奶奶联系你，她在电视上看到了遗体捐献的宣传，希望了解更多相关事宜。她语气温和，充满爱心，表示希望在离世后能为医学教育做出贡献。',
            background: '李奶奶是一位退休教师，一生桃李满天下。她在电视上看到了关于遗体捐献的报道，被那些无私奉献的故事深深打动。她独自一人来到你的办公室，眼神中透着温和与期待。她告诉你，她想在生命的最后阶段继续为社会做贡献。',
            options: [
                {
                    text: '详细解答，包括流程、手续和注意事项',
                    effects: {
                        time: -10,
                        reputation: 10,
                        exp: 15
                    },
                    background: '你耐心地为李奶奶讲解遗体捐献的每一个环节，从登记流程到最终的实现，你都详细说明。李奶奶认真地做着笔记，不时点头。'
                },
                {
                    text: '简要说明基本流程，提供宣传手册',
                    effects: {
                        time: -5,
                        reputation: 5,
                        exp: 5
                    },
                    background: '你给李奶奶提供了详细的宣传手册，并简要说明了基本流程。她仔细翻阅着手册，不时向你确认一些细节。'
                },
                {
                    text: '推荐她阅读相关材料，稍后电话回访',
                    effects: {
                        time: -2,
                        reputation: 2,
                        exp: 2
                    },
                    background: '你推荐李奶奶阅读相关材料，并承诺稍后会电话回访。她感谢你的建议，带着材料离开了。'
                }
            ]
        },
        {
            title: '家属的担忧',
            description: '一位捐献者的儿子小王找到你，表达了对父亲遗体捐献的担忧。他担心捐献过程会对父亲的身体造成伤害，也担心自己会留下心理阴影。',
            background: '小王坐在你面前，双手紧握，眉头紧锁。他的父亲刚刚去世，生前签署了遗体捐献协议，但作为独子，他承受着来自亲戚们的压力和自己内心的不安。',
            options: [
                {
                    text: '耐心安抚，倾听他的担忧并给予情感支持',
                    effects: {
                        time: -15,
                        satisfaction: 15,
                        reputation: 10
                    },
                    background: '你给小王倒了一杯热茶，轻声让他说出内心的担忧。你倾听他的每一句话，给予充分的理解和安慰。'
                },
                {
                    text: '提供专业解释，详细说明捐献过程',
                    effects: {
                        time: -10,
                        satisfaction: 10,
                        reputation: 8
                    },
                    background: '你从专业角度详细解释了遗体捐献的整个过程，包括如何尊重捐献者的身体，如何进行医学处理。'
                },
                {
                    text: '介绍成功案例，分享其他家属的感受',
                    effects: {
                        time: -8,
                        satisfaction: 8,
                        reputation: 5
                    },
                    background: '你向小王介绍了几个成功的捐献案例，分享了其他家属的真实感受和心路历程。'
                }
            ]
        },
        {
            title: '资源短缺',
            description: '你发现当前的资源不足以完成所有任务，包括宣传活动、家属慰问和捐献者纪念等工作。',
            background: '办公桌上堆满了需要处理的文件和待审批的预算申请。你看着墙上的年度计划，意识到资源紧张的问题已经迫在眉睫。',
            options: [
                {
                    text: '申请额外资金，确保所有工作正常开展',
                    effects: {
                        fund: 2000,
                        time: -20
                    },
                    background: '你整理了一份详细的资金申请报告，向上级说明了当前工作的重要性和紧迫性。上级被你的专业计划所打动。'
                },
                {
                    text: '优化资源分配，优先保障核心工作',
                    effects: {
                        time: -10,
                        manpower: 2
                    },
                    background: '你仔细分析了各项工作的优先级，决定优化资源分配，优先保障家属慰问和捐献者纪念等核心工作。'
                },
                {
                    text: '推迟部分任务，集中精力完成当前工作',
                    effects: {
                        reputation: -5,
                        exp: -5
                    },
                    background: '你决定推迟一些非核心任务，集中精力完成当前的工作。然而，你意识到这可能会影响整体进度。'
                }
            ]
        },
        {
            title: '捐献者的心愿',
            description: '一位晚期癌症患者张女士联系你，希望在去世后捐献遗体。她有一个特殊的心愿，希望能为医学研究做出贡献，特别是在癌症治疗方面。',
            background: '张女士的声音虚弱但坚定。她在生命的最后阶段，仍然想着如何帮助他人。她通过病友群找到了你，希望能实现自己的心愿。',
            options: [
                {
                    text: '全力支持，帮助她完成心愿',
                    effects: {
                        time: -15,
                        satisfaction: 20,
                        contribution: 30
                    },
                    background: '你被张女士的大爱精神深深感动，决定全力支持她完成心愿。你帮助她联系了相关医疗机构，详细说明了她的特殊心愿。'
                },
                {
                    text: '提供必要帮助，但说明可能的限制',
                    effects: {
                        time: -10,
                        satisfaction: 10,
                        contribution: 15
                    },
                    background: '你为张女士提供了必要的帮助，同时也说明了医学研究的一些限制和流程。'
                },
                {
                    text: '建议她先与家人商量，再做决定',
                    effects: {
                        time: -5,
                        satisfaction: 5,
                        exp: 5
                    },
                    background: '你建议张女士先与家人商量，再做最终决定。家庭的支持对于捐献者来说非常重要。'
                }
            ]
        },
        {
            title: '社区宣传活动',
            description: '你计划在社区开展遗体捐献宣传活动，但面临场地、人员和材料等方面的挑战。',
            background: '社区广场上人来人往，你站在临时搭建的展台前，看着来来往往的居民，思考着如何更好地宣传遗体捐献的意义。',
            options: [
                {
                    text: '精心策划，举办大型宣传活动',
                    effects: {
                        time: -20,
                        fund: -1000,
                        reputation: 25,
                        exp: 30
                    },
                    background: '你精心策划了一场大型宣传活动，邀请了医学专家、捐献者家属和志愿者参加。活动现场设置了咨询台、宣传展板和互动环节。'
                },
                {
                    text: '开展小型但深入的宣传活动',
                    effects: {
                        time: -10,
                        fund: -500,
                        reputation: 15,
                        exp: 20
                    },
                    background: '你决定开展小型但深入的宣传活动，走进社区的各个角落，与居民面对面交流。'
                },
                {
                    text: '利用网络平台开展线上宣传',
                    effects: {
                        time: -5,
                        fund: -200,
                        reputation: 10,
                        exp: 15
                    },
                    background: '你利用网络平台开展了线上宣传活动，制作了宣传视频，发起了话题讨论，还进行了线上直播答疑。'
                }
            ]
        },
        {
            title: '捐献者纪念',
            description: '你计划为捐献者建立纪念设施，以表达对他们的敬意和感谢，但面临资金和场地的限制。',
            background: '在医院的走廊尽头，有一面空白的墙。你站在那里，想象着如何将这面墙变成纪念捐献者的圣地，让人们永远记住这些无名英雄。',
            options: [
                {
                    text: '多方筹集资金，建立正式的纪念墙',
                    effects: {
                        time: -25,
                        fund: -3000,
                        reputation: 30,
                        satisfaction: 25
                    },
                    background: '你通过政府支持、企业赞助和社会募捐等多种渠道筹集资金，最终在医院附近建立了一面正式的捐献者纪念墙。'
                },
                {
                    text: '利用现有场地，建立简易的纪念区',
                    effects: {
                        time: -15,
                        fund: -1000,
                        reputation: 20,
                        satisfaction: 15
                    },
                    background: '你利用医院现有的场地，建立了一个简易但温馨的纪念区，摆放了鲜花和捐献者的照片。'
                },
                {
                    text: '开展线上纪念活动，创建虚拟纪念空间',
                    effects: {
                        time: -10,
                        fund: -500,
                        reputation: 15,
                        satisfaction: 10
                    },
                    background: '你创建了一个线上纪念空间，为每位捐献者建立了个人纪念页面，展示他们的照片、事迹和家属的留言。'
                }
            ]
        },
        {
            title: '媒体采访邀请',
            description: '一家地方电视台联系你，希望对你进行关于遗体捐献的专题采访，以提高公众对这一事业的认识。',
            background: '电视台的记者站在你的办公室门口，手里拿着话筒和摄像机。他们希望通过采访让更多人了解遗体捐献的意义。',
            options: [
                {
                    text: '积极接受采访，准备详细的资料和案例',
                    effects: {
                        time: -15,
                        reputation: 25,
                        exp: 20
                    },
                    background: '你积极接受了采访邀请，准备了详细的资料和感人的捐献者案例，深入浅出地讲解了遗体捐献的意义。'
                },
                {
                    text: '接受采访，但保持低调，重点介绍工作',
                    effects: {
                        time: -10,
                        reputation: 15,
                        exp: 10
                    },
                    background: '你接受了采访邀请，但选择保持低调，将重点放在介绍遗体捐献工作的具体内容和社会意义上。'
                },
                {
                    text: '婉言拒绝，认为工作不需要宣传',
                    effects: {
                        time: -2,
                        reputation: -5
                    },
                    background: '你婉言拒绝了采访邀请，认为遗体捐献工作是一项默默奉献的事业，不需要过多的宣传。'
                }
            ]
        },
        {
            title: '志愿者招募',
            description: '你需要招募一批志愿者来协助遗体捐献的宣传和服务工作，但面临招募困难的问题。',
            background: '你看着招募海报，心中思考着如何吸引更多热心人士加入这个有意义的事业。志愿者是遗体捐献宣传的重要力量。',
            options: [
                {
                    text: '开展校园招募活动，吸引年轻志愿者',
                    effects: {
                        time: -15,
                        manpower: 10,
                        exp: 20
                    },
                    background: '你走进大学校园，开展了志愿者招募活动，通过讲座、海报和线上宣传等方式，向大学生们介绍了遗体捐献的意义。'
                },
                {
                    text: '联系社区组织，招募社区志愿者',
                    effects: {
                        time: -10,
                        manpower: 8,
                        reputation: 15
                    },
                    background: '你联系了当地的社区组织，开展了社区志愿者招募活动，社区居民们对遗体捐献工作表示了极大的支持。'
                },
                {
                    text: '利用网络平台，开展线上招募',
                    effects: {
                        time: -8,
                        manpower: 6,
                        exp: 15
                    },
                    background: '你利用网络平台，开展了线上志愿者招募活动，在社交媒体上发布了招募信息，制作了宣传视频。'
                }
            ]
        },
        {
            title: '医学教育合作',
            description: '一所医科大学联系你，希望与你建立合作关系，为医学生提供遗体捐献的教育和实践机会。',
            background: '医科大学的教授坐在你的对面，详细介绍了他们希望开展的合作项目，希望能为医学生提供更多关于遗体捐献的教育机会。',
            options: [
                {
                    text: '积极响应，建立深度合作关系',
                    effects: {
                        time: -20,
                        reputation: 30,
                        contribution: 40
                    },
                    background: '你积极响应了医科大学的合作邀请，与他们建立了深度合作关系，为医学生们开设了遗体捐献的专题讲座。'
                },
                {
                    text: '同意合作，但保持一定距离',
                    effects: {
                        time: -10,
                        reputation: 15,
                        contribution: 20
                    },
                    background: '你同意了与医科大学的合作，但选择保持一定距离，主要提供遗体捐献的基本信息和宣传材料。'
                },
                {
                    text: '谨慎考虑，暂时不开展合作',
                    effects: {
                        time: -5,
                        reputation: -10
                    },
                    background: '你谨慎考虑后，决定暂时不与医科大学开展合作，认为当前的工作重点应该放在宣传和服务上。'
                }
            ]
        },
        {
            title: '传统观念与现代理念的冲突',
            description: '一位70岁的退休工程师陈爷爷联系你，他希望在去世后捐献遗体用于医学教育。然而，他的子女们受传统观念影响，认为"身体发肤，受之父母，不敢毁伤"，坚决反对他的决定。',
            background: '陈爷爷坐在你面前，眼中闪过一丝无奈。他的子女们坚持传统观念，而他只是想在自己生命的最后阶段为社会做点贡献。',
            options: [
                {
                    text: '上门家访，与家人深入沟通遗体捐献的意义',
                    effects: {
                        time: -20,
                        satisfaction: 25,
                        reputation: 15
                    },
                    background: '你决定上门家访，与陈爷爷的家人进行深入沟通，详细解释遗体捐献的意义和流程。'
                },
                {
                    text: '提供宣传材料，建议家庭成员一起学习',
                    effects: {
                        time: -10,
                        satisfaction: 15,
                        reputation: 10
                    },
                    background: '你为陈爷爷提供了详细的宣传材料，建议他与家人一起学习，了解遗体捐献的真正意义。'
                },
                {
                    text: '建议陈爷爷与家人协商，寻找传统与现代的平衡点',
                    effects: {
                        time: -5,
                        satisfaction: 8,
                        exp: 5
                    },
                    background: '你建议陈爷爷与家人协商，寻找传统与现代的平衡点，也许可以采取折中的方案。'
                }
            ]
        },
        {
            title: '农村地区的遗体捐献',
            description: '来自农村的王大叔联系你，他是一名乡村教师，希望在去世后捐献遗体。然而，他的妻子和村民们都认为，按照传统习俗，人死后应该入土为安。',
            background: '王大叔的普通话带着浓重的乡音，他坐在简陋的教室里，通过电话向你倾诉他的心愿和面临的困境。',
            options: [
                {
                    text: '深入农村，与村民们举行座谈会',
                    effects: {
                        time: -25,
                        reputation: 30,
                        satisfaction: 20
                    },
                    background: '你决定深入农村，与王大叔所在的村民们举行座谈会，用通俗易懂的语言解释了遗体捐献的意义。'
                },
                {
                    text: '为家庭提供个性化的咨询服务',
                    effects: {
                        time: -15,
                        satisfaction: 15,
                        reputation: 12
                    },
                    background: '你为王大叔的家庭提供了个性化的咨询服务，详细解答了他们的疑虑和担忧。'
                },
                {
                    text: '建议王大叔先与最亲近的家人沟通',
                    effects: {
                        time: -8,
                        satisfaction: 10,
                        exp: 8
                    },
                    background: '你建议王大叔先与最亲近的家人沟通，暂时不考虑村民的看法，逐步解决家庭内部的意见分歧。'
                }
            ]
        },
        {
            title: '宗教信仰与遗体捐献',
            description: '张奶奶是一位虔诚的佛教徒，她希望在去世后捐献遗体用于医学教育，但她的家人担心这会违背佛教的教义。',
            background: '张奶奶手持念珠，表情平静但略带忧虑。她深知佛教的教义，同时也希望通过捐献遗体来体现慈悲精神。',
            options: [
                {
                    text: '邀请宗教人士一起探讨',
                    effects: {
                        time: -20,
                        satisfaction: 25,
                        reputation: 18
                    },
                    background: '你邀请了当地佛教协会的法师与张奶奶及其家人一起探讨佛教与遗体捐献的关系。'
                },
                {
                    text: '提供相关宗教资料和案例',
                    effects: {
                        time: -12,
                        satisfaction: 18,
                        reputation: 12
                    },
                    background: '你为张奶奶提供了相关的宗教资料和案例，包括一些宗教领袖支持遗体捐献的言论和故事。'
                },
                {
                    text: '建议张奶奶与宗教顾问咨询',
                    effects: {
                        time: -5,
                        satisfaction: 10,
                        exp: 6
                    },
                    background: '你建议张奶奶与她信任的宗教顾问咨询，了解佛教对遗体捐献的正式看法。'
                }
            ]
        },
        {
            title: '多代家庭的决策',
            description: '刘爷爷一家是一个四世同堂的大家庭，他希望在去世后捐献遗体，但家庭成员对此意见不一，需要协调沟通。',
            background: '刘家的客厅里坐满了人，从白发苍苍的老人到稚气未脱的孩童，大家对刘爷爷的捐献决定有着不同的看法和态度。',
            options: [
                {
                    text: '组织家庭会议，促进代际沟通',
                    effects: {
                        time: -30,
                        satisfaction: 30,
                        reputation: 25
                    },
                    background: '你组织了一次家庭会议，让每个家庭成员都表达了自己的想法，然后详细解释了遗体捐献的意义和流程。'
                },
                {
                    text: '分别与不同代际的家庭成员沟通',
                    effects: {
                        time: -20,
                        satisfaction: 20,
                        reputation: 15
                    },
                    background: '你分别与不同代际的家庭成员沟通，了解他们的顾虑并逐一解答，寻找共识。'
                },
                {
                    text: '建议寻找传统与现代的平衡点',
                    effects: {
                        time: -10,
                        satisfaction: 15,
                        exp: 10
                    },
                    background: '你建议刘爷爷一家寻找传统与现代的平衡点，在尊重个人意愿的同时照顾到传统观念的需求。'
                }
            ]
        },
        {
            title: '传统文化与科学贡献的平衡',
            description: '赵阿姨是一位退休教师，她希望在去世后为医学教育做出贡献，但同时也希望遵循传统文化，让自己的后事办得体面。',
            background: '赵阿姨优雅地坐在茶室里，她对传统文化有着深厚的感情，同时也有一颗向往科学的心，希望能找到两全其美的方案。',
            options: [
                {
                    text: '设计个性化方案，兼顾传统与现代',
                    effects: {
                        time: -20,
                        satisfaction: 30,
                        reputation: 20
                    },
                    background: '你为赵阿姨设计了一个个性化方案，既满足她为医学做贡献的心愿，又照顾了传统文化的需求。'
                },
                {
                    text: '提供多种方案供选择',
                    effects: {
                        time: -15,
                        satisfaction: 22,
                        reputation: 15
                    },
                    background: '你为赵阿姨提供了多种方案供她选择，包括完全捐献、部分捐献结合传统丧葬等。'
                },
                {
                    text: '建议参考其他家庭的成功案例',
                    effects: {
                        time: -10,
                        satisfaction: 18,
                        exp: 8
                    },
                    background: '你为赵阿姨提供了一些其他家庭的成功案例，参考这些案例，她可以找到适合自己的方案。'
                }
            ]
        }
    ];

    // 如果所有事件都已使用过，重置已使用事件列表
    if (gameState.usedLocalEventIndices.length >= events.length) {
        gameState.usedLocalEventIndices = [];
    }

    // 筛选出未使用的事件
    const availableEvents = events.map((event, index) => ({ event, index }))
        .filter(item => !gameState.usedLocalEventIndices.includes(item.index));

    // 如果没有可用事件，重置并使用所有事件
    if (availableEvents.length === 0) {
        gameState.usedLocalEventIndices = [];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        gameState.usedLocalEventIndices.push(events.indexOf(randomEvent));
        // 使用AI生成背景和选项描述，等待完成后显示
        const enhancedEvent = await enhanceEventWithAI(randomEvent);
        displayEvent(enhancedEvent);
        return;
    }

    // 随机选择一个未使用的事件
    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    const selectedEvent = availableEvents[randomIndex];
    gameState.usedLocalEventIndices.push(selectedEvent.index);

    // 使用AI生成背景和选项描述，等待完成后显示
    const enhancedEvent = await enhanceEventWithAI(selectedEvent.event);
    displayEvent(enhancedEvent);
}

// 使用AI生成事件背景和选项描述
async function enhanceEventWithAI(event) {
    // 如果有API密钥，使用AI增强事件
    if (gameState.apiKey) {
        try {
            const enhancedContent = await generateAIEnhancement(event);
            if (enhancedContent) {
                // 更新事件内容
                if (enhancedContent.background && !event.background) {
                    event.background = enhancedContent.background;
                }
                if (enhancedContent.options) {
                    enhancedContent.options.forEach((opt, idx) => {
                        if (opt.background && event.options[idx]) {
                            event.options[idx].background = opt.background;
                        }
                    });
                }
            }
        } catch (err) {
            console.log('AI增强事件失败，使用原始内容:', err);
        }
    }
    return event;
}

// 异步生成AI增强内容
async function generateAIEnhancement(event) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」遗体捐献负责人模拟器的高级叙事设计师。

【核心定位】
你负责将简单的游戏事件转化为富有情感深度和人文关怀的叙事内容，让玩家深刻体会遗体捐献协调员工作的意义与价值。

【内容准则】
1. 严格限定在"遗体捐献"（whole body donation）范畴，用于医学教育和科学研究
2. 严禁涉及：器官移植、器官捐献、角膜捐献、组织捐献、骨灰处理细节
3. 严禁引用：任何具体法规、条例、政策文件或条款名称
4. 重点关注：人文关怀、家庭情感、社会意义、职业价值

【写作风格】
- 语言温暖真挚，富有感染力，避免说教
- 场景描写细腻生动，有画面感
- 情感表达克制而深沉，不过度煽情
- 体现对捐献者和家属的尊重与敬意

【输出要求】
- 背景描述：80-120字，营造氛围，交代情境
- 选项描述：每个50-80字，具体描绘选择后的场景
- 必须严格按照JSON格式返回
- 格式：{"background": "...", "options": [{"background": "..."}, {"background": "..."}, {"background": "..."}]}`
                    },
                    {
                        role: 'user',
                        content: `【事件信息】
标题：${event.title}
描述：${event.description}

【玩家选项】
${event.options.map((opt, i) => `${i+1}. ${opt.text}`).join('\n')}

请为以上事件生成富有感染力的叙事内容。`
                    }
                ],
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('API返回数据格式错误');
        }

        let content = data.choices[0].message.content;
        // 移除**标记
        content = content.replace(/\*\*/g, '');
        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('解析AI增强内容失败:', parseError);
            return null;
        }
    } catch (error) {
        console.error('生成AI增强内容失败:', error);
        return null;
    }
}

// JSON审查与修正机制
function validateAndFixJson(rawJson) {
    const log = {
        original: rawJson,
        errors: [],
        fixes: [],
        timestamp: new Date().toISOString()
    };
    
    let fixedJson = rawJson;
    let isValid = false;
    let error = null;
    
    try {
        // 尝试直接解析原始JSON
        JSON.parse(fixedJson);
        isValid = true;
        log.errors.push({ type: 'none', message: 'JSON格式正确' });
    } catch (parseError) {
        log.errors.push({ type: 'parse', message: parseError.message });
        
        // 1. 修复引号不匹配问题
        try {
            // 移除JSON字符串前后的非JSON内容
            fixedJson = fixedJson.trim();
            // 确保JSON以{开头，以}结尾
            if (!fixedJson.startsWith('{')) {
                fixedJson = '{' + fixedJson.replace(/^[^\{]*/, '');
                log.fixes.push({ type: 'brackets', message: '添加缺失的起始大括号' });
            }
            if (!fixedJson.endsWith('}')) {
                fixedJson = fixedJson.replace(/[^\}]*$/, '') + '}';
                log.fixes.push({ type: 'brackets', message: '添加缺失的结束大括号' });
            }
            
            // 2. 修复特殊字符未转义问题
            // 确保字符串中的引号正确转义
            fixedJson = fixedJson.replace(/([^\\])"([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1"$2"');
            
            // 3. 修复括号不匹配问题
            let openBrackets = (fixedJson.match(/\{/g) || []).length;
            let closeBrackets = (fixedJson.match(/\}/g) || []).length;
            while (openBrackets > closeBrackets) {
                fixedJson += '}';
                closeBrackets++;
                log.fixes.push({ type: 'brackets', message: '添加缺失的结束大括号' });
            }
            while (closeBrackets > openBrackets) {
                fixedJson = fixedJson.replace(/}$/, '');
                closeBrackets--;
                log.fixes.push({ type: 'brackets', message: '移除多余的结束大括号' });
            }
            
            // 4. 修复数组括号不匹配问题
            let openArrays = (fixedJson.match(/\[/g) || []).length;
            let closeArrays = (fixedJson.match(/\]/g) || []).length;
            while (openArrays > closeArrays) {
                fixedJson += ']';
                closeArrays++;
                log.fixes.push({ type: 'arrays', message: '添加缺失的结束方括号' });
            }
            while (closeArrays > openArrays) {
                fixedJson = fixedJson.replace(/\]$/, '');
                closeArrays--;
                log.fixes.push({ type: 'arrays', message: '移除多余的结束方括号' });
            }
            
            // 5. 修复逗号问题
            // 移除对象最后一个属性后的逗号
            fixedJson = fixedJson.replace(/,\s*\}/g, ' }');
            // 移除数组最后一个元素后的逗号
            fixedJson = fixedJson.replace(/,\s*\]/g, ' ]');
            
            // 再次尝试解析修复后的JSON
            JSON.parse(fixedJson);
            isValid = true;
            log.errors.push({ type: 'fixed', message: 'JSON格式已修复' });
        } catch (fixError) {
            error = fixError.message;
            log.errors.push({ type: 'unfixable', message: '无法自动修复的错误: ' + error });
        }
    }
    
    // 验证修复后的JSON是否符合事件数据结构规范
    if (isValid) {
        try {
            const eventData = JSON.parse(fixedJson);
            if (!eventData.title) {
                eventData.title = '未命名事件';
                log.fixes.push({ type: 'structure', message: '添加缺失的title字段' });
                fixedJson = JSON.stringify(eventData);
            }
            if (!eventData.description) {
                eventData.description = '无描述';
                log.fixes.push({ type: 'structure', message: '添加缺失的description字段' });
                fixedJson = JSON.stringify(eventData);
            }
            if (!eventData.options || !Array.isArray(eventData.options)) {
                eventData.options = [];
                log.fixes.push({ type: 'structure', message: '添加缺失的options数组' });
                fixedJson = JSON.stringify(eventData);
            }
            // 确保options数组有3个元素
            while (eventData.options.length < 3) {
                eventData.options.push({
                    text: '默认选项',
                    effects: {
                        time: -5,
                        exp: 5
                    }
                });
                log.fixes.push({ type: 'structure', message: '添加缺失的选项' });
                fixedJson = JSON.stringify(eventData);
            }
            while (eventData.options.length > 3) {
                eventData.options.pop();
                log.fixes.push({ type: 'structure', message: '移除多余的选项' });
                fixedJson = JSON.stringify(eventData);
            }
            // 确保每个选项都有必要的字段
            eventData.options.forEach((option, index) => {
                if (!option.text) {
                    option.text = `选项${index + 1}`;
                    log.fixes.push({ type: 'structure', message: `添加选项${index + 1}的text字段` });
                    fixedJson = JSON.stringify(eventData);
                }
                if (!option.effects) {
                    option.effects = {
                        time: -5,
                        exp: 5
                    };
                    log.fixes.push({ type: 'structure', message: `添加选项${index + 1}的effects字段` });
                    fixedJson = JSON.stringify(eventData);
                }
            });
        } catch (structureError) {
            error = structureError.message;
            isValid = false;
            log.errors.push({ type: 'structure', message: '事件数据结构验证失败: ' + error });
        }
    }

    return { isValid, fixedJson, error, log };
}

// 显示结局
function showEnding() {
    const satisfaction = gameState.stats.satisfaction;
    const reputation = gameState.character.reputation;
    const fund = gameState.resources.fund;
    const manpower = gameState.resources.manpower;
    const completedThemes = gameState.completedThemes.length;
    
    // 按比例调整数据，使4主题后也能获得满意评分
    const adjustedSatisfaction = satisfaction; // 满意度直接使用
    const adjustedReputation = reputation * 1.5; // 声望按1.5倍调整
    const adjustedManpower = manpower * 1.5; // 人力按1.5倍调整
    const adjustedFund = fund * 1.2; // 资金按1.2倍调整
    
    // 计算综合评分 - 优化权重：弱化资金，强调满意度和贡献
    let totalScore = 0;
    totalScore += Math.min(adjustedSatisfaction, 100) * 0.5; // 满意度占50%（核心指标）
    totalScore += Math.min(adjustedReputation, 100) * 0.25; // 声望占25%
    totalScore += Math.min(adjustedManpower * 3, 50) * 0.15; // 人力占15%
    totalScore += Math.min(adjustedFund / 200, 30) * 0.1; // 资金占10%
    
    // 确保最低分为0
    totalScore = Math.max(0, totalScore);
    
    let ending;
    let endingTitle;
    let endingRank;
    let endingLevel;
    
    // 根据综合评分选择不同的结局等级 - 降低门槛
    if (totalScore >= 50) {
        endingRank = 'S';
        endingLevel = '优秀';
        endingTitle = '遗体捐献协调工作年度总结报告';
    } else if (totalScore >= 35) {
        endingRank = 'A';
        endingLevel = '良好';
        endingTitle = '遗体捐献协调工作年度总结报告';
    } else if (totalScore >= 20) {
        endingRank = 'B';
        endingLevel = '合格';
        endingTitle = '遗体捐献协调工作年度总结报告';
    } else {
        endingRank = 'C';
        endingLevel = '待改进';
        endingTitle = '遗体捐献协调工作年度总结报告';
    }
    
    // 生成数据可视化图表HTML - 使用调整后的数据
    const chartsHTML = generateEndingCharts(adjustedSatisfaction, adjustedReputation, adjustedManpower, adjustedFund, gameState.stats.contribution, completedThemes, totalScore);
    
    // 生成工作报告内容 - 使用调整后的数据
    const workSummary = generateWorkSummary(endingRank, adjustedSatisfaction, adjustedReputation, adjustedManpower, gameState.stats.contribution, completedThemes);
    
    ending = `
        <div style="max-width: 900px; margin: 0 auto; font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;">
            <!-- 报告头部 -->
            <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px 15px 0 0; color: white;">
                <h2 style="margin: 0; font-size: 1.8rem; font-weight: 600; letter-spacing: 2px;">${endingTitle}</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 0.95rem;">报告周期：${new Date().getFullYear()}年度 | 协调员：${gameState.character.name || '未命名'}</p>
            </div>
            
            <!-- 综合评级 -->
            <div style="background: #f8f9fa; padding: 25px; text-align: center; border-bottom: 2px solid #e9ecef;">
                <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <span style="font-size: 0.9rem; color: #6c757d; display: block; margin-bottom: 5px;">年度综合评级</span>
                    <span style="font-size: 3rem; font-weight: bold; color: ${endingRank === 'S' ? '#28a745' : endingRank === 'A' ? '#007bff' : endingRank === 'B' ? '#ffc107' : '#dc3545'};">${endingRank}级 (${endingLevel})</span>
                    <span style="font-size: 1.2rem; color: #495057; display: block; margin-top: 5px;">综合得分：${totalScore.toFixed(1)}分</span>
                </div>
            </div>
            
            <!-- 数据可视化图表区域 -->
            ${chartsHTML}
            
            <!-- 工作总结 -->
            <div style="background: white; padding: 30px; border-left: 4px solid ${endingRank === 'S' ? '#28a745' : endingRank === 'A' ? '#007bff' : endingRank === 'B' ? '#ffc107' : '#dc3545'}; margin: 20px 0; border-radius: 0 10px 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h3 style="color: #343a40; margin-bottom: 20px; font-size: 1.2rem; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">
                    📋 年度工作总结
                </h3>
                ${workSummary}
            </div>
            
            <!-- 温情寄语 -->
            <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center; border-left: 4px solid #e74c3c;">
                <p style="font-size: 1.1rem; color: #555; line-height: 1.8; font-style: italic; margin: 0;">
                    "每一位捐献者都是生命的导师，他们用最后的馈赠照亮了医学前行的道路。<br>
                    作为协调员，我们不仅是流程的执行者，更是爱与希望的传递者。"
                </p>
                <p style="margin-top: 15px; color: #888; font-size: 0.9rem;">
                    —— 谨以此报告，致敬所有遗体捐献者及其家属
                </p>
            </div>
            
            <!-- 详细数据表格 -->
            <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h3 style="color: #343a40; margin-bottom: 20px; font-size: 1.2rem;">📊 详细工作数据</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">完成工作主题</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${completedThemes} 个</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">涵盖宣教、协调、纪念等多个维度</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">家属满意度</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${satisfaction}%</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">反映服务质量与人文关怀水平</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">行业声望</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${reputation} 点</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">在业内的专业认可度</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">志愿者团队规模</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${manpower} 人</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">影响活动组织规模与覆盖面</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">医学贡献值</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${gameState.stats.contribution} 点</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">对医学教育事业的实际贡献</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; font-weight: 600; color: #495057;">资金使用结余</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #212529; text-align: right;">${fund} 元</td>
                        <td style="padding: 12px 15px; border: 1px solid #dee2e6; color: #6c757d; font-size: 0.9rem;">日常运营与活动经费管理</td>
                    </tr>
                </table>
            </div>
            
            <!-- 底部按钮 -->
            <div style="text-align: center; margin-top: 30px; padding: 20px;">
                <button class="btn btn-primary" onclick="${endingRank === 'C' ? 'restartGame()' : 'resetGame()'}" style="padding: 12px 40px; font-size: 1rem; border-radius: 25px;">
                    ${endingRank === 'C' ? '再次尝试' : '完成报告'}
                </button>
            </div>
        </div>
    `;
    
    // 显示结局弹窗
    const eventContainer = document.getElementById('event-container');
    const eventCard = document.getElementById('event-card');
    eventCard.innerHTML = ending;
    eventCard.style.maxWidth = '800px';
    eventCard.style.margin = '0 auto';
    
    // 更新统计显示
    updateUI();
}

// 显示错误反馈
function showErrorFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'error-feedback';
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.top = '20px';
    feedback.style.right = '20px';
    feedback.style.background = 'rgba(231, 76, 60, 0.9)';
    feedback.style.color = 'white';
    feedback.style.padding = '15px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '1000';
    feedback.style.fontSize = '1rem';
    document.body.appendChild(feedback);
    // 3秒后移除
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// 显示加载动画
function showLoadingAnimation(text = '正在加载...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay) {
        overlay.style.display = 'flex';
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
}

// 隐藏加载动画
function hideLoadingAnimation() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// 历史事件数组
let eventHistory = [];

// 生成结局图表HTML
function generateEndingCharts(satisfaction, reputation, manpower, fund, contribution, completedThemes, totalScore) {
    // 计算各项指标的百分比（用于柱状图）
    const satisfactionPct = Math.min(satisfaction, 100);
    const reputationPct = Math.min(reputation, 100);
    const contributionPct = Math.min(contribution * 2, 100); // 贡献值放大显示
    
    // 饼图数据 - 工作成果分布
    const totalValue = satisfaction + reputation + contribution + completedThemes * 10 + 1;
    const satisfactionSlice = (satisfaction / totalValue * 100).toFixed(1);
    const reputationSlice = (reputation / totalValue * 100).toFixed(1);
    const contributionSlice = (contribution / totalValue * 100).toFixed(1);
    const themesSlice = (completedThemes * 10 / totalValue * 100).toFixed(1);
    const otherSlice = (100 - satisfactionSlice - reputationSlice - contributionSlice - themesSlice).toFixed(1);
    
    // 饼图SVG颜色
    const colors = ['#28a745', '#007bff', '#ffc107', '#dc3545', '#6c757d'];
    
    return `
        <div style="background: white; padding: 25px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h3 style="color: #343a40; margin-bottom: 20px; font-size: 1.2rem; text-align: center;">📈 工作成果可视化分析</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- 左侧：柱状图 -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4 style="color: #495057; margin-bottom: 15px; font-size: 1rem; text-align: center;">核心指标达成度</h4>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- 满意度 -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.85rem; color: #6c757d;">家属满意度</span>
                                <span style="font-size: 0.85rem; color: #28a745; font-weight: 600;">${satisfactionPct}%</span>
                            </div>
                            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #28a745, #34ce57); height: 100%; width: ${satisfactionPct}%; border-radius: 10px; transition: width 1s ease;"></div>
                            </div>
                        </div>
                        <!-- 声望 -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.85rem; color: #6c757d;">行业声望</span>
                                <span style="font-size: 0.85rem; color: #007bff; font-weight: 600;">${reputationPct}%</span>
                            </div>
                            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #007bff, #4dabf7); height: 100%; width: ${reputationPct}%; border-radius: 10px; transition: width 1s ease;"></div>
                            </div>
                        </div>
                        <!-- 贡献 -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.85rem; color: #6c757d;">医学贡献</span>
                                <span style="font-size: 0.85rem; color: #ffc107; font-weight: 600;">${contributionPct}%</span>
                            </div>
                            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #ffc107, #ffd43b); height: 100%; width: ${contributionPct}%; border-radius: 10px; transition: width 1s ease;"></div>
                            </div>
                        </div>
                        <!-- 综合评分 -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.85rem; color: #6c757d;">综合评分</span>
                                <span style="font-size: 0.85rem; color: #dc3545; font-weight: 600;">${totalScore.toFixed(1)}分</span>
                            </div>
                            <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #dc3545, #f06595); height: 100%; width: ${Math.min(totalScore, 100)}%; border-radius: 10px; transition: width 1s ease;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 右侧：饼图 -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="color: #495057; margin-bottom: 15px; font-size: 1rem;">工作成果构成</h4>
                    <svg viewBox="0 0 200 200" style="width: 180px; height: 180px; margin: 0 auto;">
                        <!-- 饼图圆环 -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" stroke-width="30"/>
                        <!-- 满意度部分 -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#28a745" stroke-width="30" 
                            stroke-dasharray="${satisfactionSlice * 5.02} 502" 
                            stroke-dashoffset="0" 
                            transform="rotate(-90 100 100)"/>
                        <!-- 声望部分 -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#007bff" stroke-width="30" 
                            stroke-dasharray="${reputationSlice * 5.02} 502" 
                            stroke-dashoffset="${-satisfactionSlice * 5.02}" 
                            transform="rotate(-90 100 100)"/>
                        <!-- 贡献部分 -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#ffc107" stroke-width="30" 
                            stroke-dasharray="${contributionSlice * 5.02} 502" 
                            stroke-dashoffset="${-(satisfactionSlice * 1 + reputationSlice * 1) * 5.02}" 
                            transform="rotate(-90 100 100)"/>
                        <!-- 主题部分 -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#dc3545" stroke-width="30" 
                            stroke-dasharray="${themesSlice * 5.02} 502" 
                            stroke-dashoffset="${-(satisfactionSlice * 1 + reputationSlice * 1 + contributionSlice * 1) * 5.02}" 
                            transform="rotate(-90 100 100)"/>
                        <!-- 中心文字 -->
                        <text x="100" y="95" text-anchor="middle" font-size="14" fill="#495057" font-weight="bold">工作成果</text>
                        <text x="100" y="115" text-anchor="middle" font-size="12" fill="#6c757d">分布图</text>
                    </svg>
                    <!-- 图例 -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 15px; font-size: 0.8rem;">
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #28a745; border-radius: 2px;"></span>满意度 ${satisfactionSlice}%</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #007bff; border-radius: 2px;"></span>声望 ${reputationSlice}%</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #ffc107; border-radius: 2px;"></span>贡献 ${contributionSlice}%</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #dc3545; border-radius: 2px;"></span>主题 ${themesSlice}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 生成工作总结文本
function generateWorkSummary(endingRank, satisfaction, reputation, manpower, contribution, completedThemes) {
    let summary = '';
    
    // 根据评级生成不同的总结
    if (endingRank === 'S') {
        summary = `
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>一、工作概述</strong><br>
                本年度工作表现卓越，各项指标均达到优秀水平。在遗体捐献协调工作中展现出高度的专业素养和人文关怀，
                成功完成了<strong>${completedThemes}</strong>个工作主题，建立了完善的服务体系。
            </p>
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>二、核心成果</strong><br>
                • 家属满意度达到<strong>${satisfaction}%</strong>，获得广泛好评与信任<br>
                • 行业声望<strong>${reputation}</strong>点，成为业内标杆<br>
                • 医学贡献值<strong>${contribution}</strong>点，为医学教育做出实质贡献<br>
                • 志愿者团队规模<strong>${manpower}</strong>人，形成稳定的服务力量
            </p>
            <p style="line-height: 1.8; color: #495057;">
                <strong>三、工作亮点</strong><br>
                在协调工作中始终坚持"以人为本"的服务理念，用专业和温情化解家属疑虑，
                让每一位捐献者都能得到应有的尊重，让每一份大爱都能顺利传递。
            </p>
        `;
    } else if (endingRank === 'A') {
        summary = `
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>一、工作概述</strong><br>
                本年度工作表现良好，整体达到预期目标。在遗体捐献协调工作中展现出较强的专业能力和服务意识，
                完成了<strong>${completedThemes}</strong>个工作主题，工作体系日趋完善。
            </p>
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>二、核心成果</strong><br>
                • 家属满意度<strong>${satisfaction}%</strong>，获得多数家属认可<br>
                • 行业声望<strong>${reputation}</strong>点，在业内建立了一定口碑<br>
                • 医学贡献值<strong>${contribution}</strong>点，为医学教育提供支持<br>
                • 志愿者团队<strong>${manpower}</strong>人，具备基本服务能力
            </p>
            <p style="line-height: 1.8; color: #495057;">
                <strong>三、改进方向</strong><br>
                建议进一步提升服务细节，加强与家属的情感沟通，持续扩大志愿者队伍，
                争取在下一年度取得更优异的成绩。
            </p>
        `;
    } else if (endingRank === 'B') {
        summary = `
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>一、工作概述</strong><br>
                本年度工作基本达标，完成了<strong>${completedThemes}</strong>个工作主题。
                在遗体捐献协调工作中积累了宝贵经验，但仍存在提升空间。
            </p>
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>二、工作数据</strong><br>
                • 家属满意度<strong>${satisfaction}%</strong>，需进一步提升服务质量<br>
                • 行业声望<strong>${reputation}</strong>点，影响力有待扩大<br>
                • 医学贡献值<strong>${contribution}</strong>点，贡献度尚可提升<br>
                • 志愿者团队<strong>${manpower}</strong>人，人手略显不足
            </p>
            <p style="line-height: 1.8; color: #495057;">
                <strong>三、发展建议</strong><br>
                建议加强专业知识学习，提升沟通技巧，注重服务细节，
                同时积极招募志愿者，扩大服务覆盖面，提高整体工作质量。
            </p>
        `;
    } else {
        summary = `
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>一、工作概述</strong><br>
                本年度工作尚处于起步阶段，完成了<strong>${completedThemes}</strong>个工作主题。
                在遗体捐献协调工作中遇到了一些挑战，需要总结经验、改进方法。
            </p>
            <p style="line-height: 1.8; color: #495057; margin-bottom: 15px;">
                <strong>二、现状分析</strong><br>
                • 家属满意度<strong>${satisfaction}%</strong>，服务质量有待提高<br>
                • 行业声望<strong>${reputation}</strong>点，专业认可度较低<br>
                • 医学贡献值<strong>${contribution}</strong>点，贡献度有限<br>
                • 志愿者团队<strong>${manpower}</strong>人，人手严重不足
            </p>
            <p style="line-height: 1.8; color: #495057;">
                <strong>三、提升计划</strong><br>
                建议系统学习遗体捐献相关知识，参加专业培训，
                向经验丰富的同事请教，同时注重与家属的情感沟通，
                逐步提升专业能力和服务水平。
            </p>
        `;
    }
    
    return summary;
}

// 显示事件
function displayEvent(event) {
    gameState.currentEvent = event;
    
    // 检查是否需要选择新主题
    if (!gameState.currentTheme || gameState.currentThemeEventCount >= 3) {
        selectNewTheme();
    }
    
    // 构建标题，包含主题信息
    let titleText = event.title;
    if (gameState.currentTheme) {
        const theme = THEMES.find(t => t.id === gameState.currentTheme);
        if (theme) {
            titleText = `[${theme.name}] ${event.title}`;
        }
    }
    
    // 更新事件卡片
    document.getElementById('event-title').textContent = titleText;
    document.getElementById('event-description').textContent = event.description;
    
    // 如果有背景描述，添加到描述后面
    let displayDescription = event.description;
    if (event.background) {
        displayDescription += '\n\n' + event.background;
    }
    document.getElementById('event-description').textContent = displayDescription;
    
    // 更新选项
    const optionsContainer = document.getElementById('event-options');
    optionsContainer.innerHTML = '';
    event.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'btn event-option';
        
        // 显示选项文本和背景描述
        let buttonText = option.text;
        if (option.background) {
            buttonText += '\n' + option.background;
        }
        button.textContent = buttonText;
        button.onclick = () => handleEventOption(index);
        optionsContainer.appendChild(button);
    });
}

// 选择新主题
function selectNewTheme() {
    // 如果当前主题有事件，标记为完成
    if (gameState.currentTheme && gameState.currentThemeEventCount > 0) {
        const currentThemeObj = THEMES.find(t => t.id === gameState.currentTheme);
        if (currentThemeObj && !gameState.completedThemes.includes(gameState.currentTheme)) {
            gameState.completedThemes.push(gameState.currentTheme);
            gameState.themeCount++;
            
            // 添加主题完成到历史记录
            addThemeCompleteToHistory(currentThemeObj);
            
            // 显示主题完成提示
            showToast(`🎉 完成主题：${currentThemeObj.name}`);
        }
    }
    
    // 获取可用的主题
    const availableThemes = THEMES.filter(theme => {
        // 排除已完成的主题
        if (gameState.completedThemes.includes(theme.id)) return false;
        // 检查声望要求
        return gameState.character.reputation >= theme.minReputation;
    });
    
    if (availableThemes.length === 0) {
        // 没有可用主题，强制结束
        gameState.isGameEnded = true;
        return;
    }
    
    // 随机选择一个主题
    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    gameState.currentTheme = availableThemes[randomIndex].id;
    gameState.currentThemeEventCount = 0;
}

// 添加主题完成到历史记录
function addThemeCompleteToHistory(theme) {
    const historyItem = {
        id: eventHistory.length + 1,
        title: `完成主题：${theme.name}`,
        description: theme.description,
        background: null,
        selectedOption: null,
        selectedOptionEffects: null,
        story: null,
        isThemeComplete: true,
        themeName: theme.name,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    eventHistory.push(historyItem);
    updateHistoryPanel();
}

// 添加事件到历史记录
function addEventToHistory(event, selectedOption, story = null) {
    const historyItem = {
        id: eventHistory.length + 1,
        title: event.title,
        description: event.description,
        background: event.background || null,
        allOptions: event.options || [], // 保存所有选项
        selectedOption: selectedOption ? selectedOption.text : null,
        selectedOptionEffects: selectedOption ? selectedOption.effects : null,
        story: story,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    eventHistory.push(historyItem);
    updateHistoryPanel();
}

// 更新历史事件面板
function updateHistoryPanel() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    let html = '';
    
    // 如果游戏已结束，添加结局查看按钮
    if (gameState.isGameEnded) {
        const satisfaction = gameState.stats.satisfaction;
        let endingIcon = '🏆';
        let endingTitle = '查看结局';
        if (satisfaction >= 80) {
            endingIcon = '🌟';
            endingTitle = '卓越成就';
        } else if (satisfaction >= 50) {
            endingIcon = '👍';
            endingTitle = '稳步前行';
        } else {
            endingIcon = '💪';
            endingTitle = '新的开始';
        }
        
        html += `
            <div class="history-item ending-item" onclick="viewEnding()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-top: none; border-left: 4px solid #ffd700;">
                <div class="history-item-number" style="color: rgba(255,255,255,0.8);">游戏结局</div>
                <div class="history-item-title" style="color: white; font-weight: 600;">${endingIcon} ${endingTitle}</div>
                <div class="history-item-time" style="color: rgba(255,255,255,0.7);">满意度: ${satisfaction}%</div>
            </div>
        `;
    }
    
    if (eventHistory.length === 0 && !gameState.isGameEnded) {
        html += '<p class="history-empty">暂无历史事件</p>';
    } else {
        html += eventHistory.map((item, index) => `
            <div class="history-item" onclick="reviewHistoryEvent(${item.id})">
                <div class="history-item-number">事件 ${index + 1}</div>
                <div class="history-item-title">${item.title}</div>
                <div class="history-item-time">${item.timestamp}</div>
            </div>
        `).join('');
    }
    
    historyList.innerHTML = html;
}

// 全局变量存储遮罩引用
let currentReviewOverlay = null;

// 回顾历史事件
function reviewHistoryEvent(eventId) {
    const item = eventHistory.find(e => e.id === eventId);
    if (!item) return;
    
    // 创建回顾弹窗
    const popup = document.createElement('div');
    popup.id = 'history-review-popup';
    popup.className = 'history-review-popup';
    popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto;';
    
    // 构建效果文本
    let effectsText = '';
    if (item.selectedOptionEffects) {
        const effects = [];
        if (item.selectedOptionEffects.satisfaction) effects.push(`满意度 ${item.selectedOptionEffects.satisfaction > 0 ? '+' : ''}${item.selectedOptionEffects.satisfaction}`);
        if (item.selectedOptionEffects.reputation) effects.push(`声望 ${item.selectedOptionEffects.reputation > 0 ? '+' : ''}${item.selectedOptionEffects.reputation}`);
        if (item.selectedOptionEffects.time) effects.push(`时间 ${item.selectedOptionEffects.time > 0 ? '+' : ''}${item.selectedOptionEffects.time}`);
        if (item.selectedOptionEffects.fund) effects.push(`资金 ${item.selectedOptionEffects.fund > 0 ? '+' : ''}${item.selectedOptionEffects.fund}`);
        if (item.selectedOptionEffects.manpower) effects.push(`人力 ${item.selectedOptionEffects.manpower > 0 ? '+' : ''}${item.selectedOptionEffects.manpower}`);
        if (item.selectedOptionEffects.contribution) effects.push(`医学贡献 ${item.selectedOptionEffects.contribution > 0 ? '+' : ''}${item.selectedOptionEffects.contribution}`);
        if (item.selectedOptionEffects.exp) effects.push(`经验 ${item.selectedOptionEffects.exp > 0 ? '+' : ''}${item.selectedOptionEffects.exp}`);
        effectsText = effects.join('，');
    }
    
    // 构建所有选项HTML
    let allOptionsHtml = '';
    if (item.allOptions && item.allOptions.length > 0) {
        const optionsList = item.allOptions.map((opt, idx) => {
            const isSelected = item.selectedOption === opt.text;
            const optionLabel = ['A', 'B', 'C'][idx] || String.fromCharCode(65 + idx);
            return `
                <div style="background: ${isSelected ? '#e8f5e9' : '#f5f5f5'}; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 3px solid ${isSelected ? '#4caf50' : '#ccc'};">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <span style="font-weight: bold; color: ${isSelected ? '#2e7d32' : '#666'};">${optionLabel}.</span>
                        <div style="flex: 1;">
                            <p style="color: ${isSelected ? '#1b5e20' : '#555'}; margin: 0; font-weight: ${isSelected ? '500' : 'normal'};">${opt.text}</p>
                            ${isSelected && effectsText ? `<p style="color: #388e3c; font-size: 0.85rem; margin-top: 5px;">✓ 效果：${effectsText}</p>` : ''}
                        </div>
                        ${isSelected ? '<span style="color: #4caf50; font-size: 1.2rem;">✓</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        allOptionsHtml = `
            <div style="background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #9b59b6;">
                <h5 style="color: #7b1fa2; margin-bottom: 15px; font-size: 1rem;">📝 所有选项</h5>
                ${optionsList}
            </div>
        `;
    }
    
    popup.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">📜</div>
            <h3 style="color: #2c3e50; margin: 0;">事件回顾 #${item.id}</h3>
            <p style="color: #888; font-size: 0.9rem; margin-top: 5px;">${item.timestamp}</p>
        </div>
        
        <!-- 事件标题和描述 -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <h4 style="color: #34495e; margin-bottom: 10px; font-size: 1.2rem; font-weight: 600;">${item.title}</h4>
            <p style="color: #555; line-height: 1.8;">${item.description}</p>
        </div>
        
        <!-- 事件背景 -->
        ${item.background ? `
            <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
                <h5 style="color: #e65100; margin-bottom: 10px; font-size: 1rem;">📖 事件背景</h5>
                <p style="color: #5d4037; line-height: 1.8; font-size: 0.95rem;">${item.background}</p>
            </div>
        ` : ''}
        
        <!-- 所有选项 -->
        ${allOptionsHtml}
        
        <!-- AI生成的故事 -->
        ${item.story ? `
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
                <h5 style="color: #1565c0; margin-bottom: 10px; font-size: 1rem;">📖 事件结局（AI生成）</h5>
                <div style="color: #0d47a1; line-height: 1.8; font-size: 0.95rem;">${item.story}</div>
            </div>
        ` : `
            <div style="background: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="color: #999; font-size: 0.9rem;">📝 此事件暂无AI生成的故事</p>
            </div>
        `}
        
        <div style="text-align: center;">
            <button onclick="closeHistoryReview()" style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; border: none; padding: 12px 40px; border-radius: 25px; font-size: 1rem; cursor: pointer; transition: all 0.3s;">
                关闭回顾
            </button>
        </div>
    `;
    
    // 添加遮罩
    const overlay = document.createElement('div');
    overlay.id = 'history-review-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
    overlay.onclick = closeHistoryReview;
    
    currentReviewOverlay = overlay;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

// 关闭历史回顾弹窗
function closeHistoryReview() {
    const popup = document.getElementById('history-review-popup');
    const overlay = document.getElementById('history-review-overlay');
    
    if (popup) popup.remove();
    if (overlay) overlay.remove();
    
    currentReviewOverlay = null;
}

// 查看结局
function viewEnding() {
    // 关闭历史回顾弹窗
    closeHistoryReview();
    
    // 显示结局
    setTimeout(() => {
        showEnding();
    }, 100);
}

// 确保函数全局可用
window.addEventToHistory = addEventToHistory;
window.updateHistoryPanel = updateHistoryPanel;
window.reviewHistoryEvent = reviewHistoryEvent;
window.closeHistoryReview = closeHistoryReview;
window.viewEnding = viewEnding;
window.showNextEvent = showNextEvent;
window.generateStoryAndNextEvent = generateStoryAndNextEvent;

// 全局变量存储下一个事件
let nextEventCache = null;

// 全局变量存储当前事件和选项，用于保存故事到历史记录
let currentEventForHistory = null;
let currentOptionForHistory = null;

function handleEventOption(optionIndex) {
    const option = gameState.currentEvent.options[optionIndex];
    
    // 保存当前事件和选项，用于后续保存故事
    currentEventForHistory = gameState.currentEvent;
    currentOptionForHistory = option;
    
    // 封锁所有选项按钮
    const buttons = document.querySelectorAll('.event-option');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';
    });
    
    // 应用效果
    applyEffects(option.effects);
    // 显示效果反馈
    showEffectFeedback(option.effects);
    
    // 增加事件计数
    gameState.eventCount++;
    gameState.currentThemeEventCount++;
    
    // 检查是否达到最大主题数（6个），强制结束
    if (gameState.themeCount >= gameState.maxThemes) {
        gameState.isGameEnded = true;
        // 添加到历史记录（无故事）
        addEventToHistory(currentEventForHistory, currentOptionForHistory);
        setTimeout(() => {
            showEnding();
            // 恢复按钮状态
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.style.pointerEvents = 'auto';
            });
        }, 1000);
        // 更新UI
        updateUI();
        // 保存游戏
        saveGame();
        return;
    }
    
    // 检查是否达到最小主题数（4个），显示查看结局选项
    if (gameState.themeCount >= gameState.minThemesForEnding && gameState.currentThemeEventCount >= 3) {
        // 完成当前主题后显示结局选项
        const shouldShowEnding = true;
    }
    
    // 如果有API密钥，使用DeepSeek API同时生成故事和下一事件
    if (gameState.apiKey) {
        generateStoryAndNextEvent(gameState.currentEvent, optionIndex);
    } else {
        // 检查是否有本地故事
        if (option.story) {
            // 添加到历史记录（带本地故事）
            addEventToHistory(currentEventForHistory, currentOptionForHistory, option.story);
            // 显示本地故事
            showStoryPopup(option.story);
            // 询问是否生成日记
            setTimeout(() => {
                showDiaryGenerateModal(gameState.currentEvent, option);
            }, 1500);
        } else {
            // 添加到历史记录（无故事）
            addEventToHistory(currentEventForHistory, currentOptionForHistory);
            // 没有本地故事时，直接生成新事件
            setTimeout(async () => {
                await generateEvent();
                // 恢复按钮状态
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.style.pointerEvents = 'auto';
                });
            }, 1000);
        }
    }
    
    // 更新UI
    updateUI();
    // 保存游戏
    saveGame();
}

// 同时生成故事和下一事件
async function generateStoryAndNextEvent(event, optionIndex) {
    const selectedOption = event.options[optionIndex];
    const aiSettings = getAISettings();
    
    // 显示加载动画
    showLoadingAnimation('正在生成故事和下一事件...');
    
    try {
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        // 同时发起两个请求：生成故事和生成下一事件
        const storyPromise = fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」遗体捐献负责人模拟器的资深故事创作者。

【创作使命】
通过真实感人的小故事，展现遗体捐献协调员工作的日常，传递生命的尊严与奉献的伟大，让玩家在情感共鸣中理解这份工作的意义。

【内容边界】
1. 严格限定：遗体捐献（whole body donation）用于医学教育和科学研究
2. 严禁涉及：器官移植、器官捐献、角膜捐献、组织捐献、具体医学操作细节
3. 严禁引用：任何法规名称、政策文件、具体条款
4. 避免描述：遗体运输细节、解剖过程、火化程序

【故事要素】
- 人物：协调员、捐献者家属、医学生、社区工作者等真实角色
- 场景：办公室、医院、社区、学校、家庭等日常环境
- 情感：温暖、感恩、理解、释怀、传承、希望
- 冲突：误解与理解、悲伤与感恩、犹豫与坚定

【叙事风格】
- 第一人称或第三人称，视角自然
- 语言朴实真挚，避免华丽辞藻
- 细节生动具体，有画面感
- 情感递进合理，结尾温暖有力
- 字数：250-350字

【主题方向】
- 初次接触：与潜在捐献者家庭的第一次沟通
- 情感支持：陪伴家属度过艰难时刻
- 认知转变：从误解到理解的心路历程
- 教育传承：医学生对无言良师的感恩
- 纪念缅怀：追思仪式中的感动瞬间
- 社区宣传：普及知识、消除偏见` 
                    },
                    {
                        role: 'user',
                        content: `【当前情境】
事件：${event.title}
事件描述：${event.description}
玩家选择：${selectedOption.text}

【创作要求】
请基于以上情境，创作一个温暖感人的小故事。故事应：
1. 有具体的人物和场景
2. 展现情感变化和内心感悟
3. 体现协调员工作的价值
4. 传递对生命的尊重与感恩

请直接输出故事内容，不要添加标题。`
                    }
                ],
                temperature: aiSettings.temperature,
                max_tokens: aiSettings.maxTokens
            }),
            signal: controller.signal
        });
        
        // 根据用户偏好调整prompt
        const preferences = gameState.preferences || { managementStyle: 'balanced', familyStyle: 'professional' };
        let styleGuidance = '';
        
        // 管理风格指导
        if (preferences.managementStyle === 'efficient') {
            styleGuidance += '\n【管理风格】：玩家偏好高效务实的管理方式。事件应体现时间管理、资源优化、流程效率等主题。选项应包含高效解决问题的方案。';
        } else if (preferences.managementStyle === 'caring') {
            styleGuidance += '\n【管理风格】：玩家偏好温情关怀的管理方式。事件应体现人文关怀、团队凝聚力、温暖氛围等主题。选项应包含注重人情味的方案。';
        } else {
            styleGuidance += '\n【管理风格】：玩家偏好友情关怀的管理方式。事件应平衡效率与人文关怀。';
        }
        
        // 家属沟通风格指导
        if (preferences.familyStyle === 'professional') {
            styleGuidance += '\n【沟通风格】：玩家偏好专业理性的沟通方式。事件中的对话应体现专业性、逻辑性、清晰的解释说明。';
        } else if (preferences.familyStyle === 'empathetic') {
            styleGuidance += '\n【沟通风格】：玩家偏好共情陪伴的沟通方式。事件中的对话应体现深度共情、情感支持、温暖陪伴。';
        } else {
            styleGuidance += '\n【沟通风格】：玩家偏好温柔细腻的沟通方式。事件中的对话应体现温柔体贴、细致入微、轻声细语。';
        }
        
        const nextEventPromise = fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」遗体捐献负责人模拟器的高级事件设计师。

【核心使命】
设计真实、温暖、富有教育意义的协调工作事件，让玩家体验遗体捐献协调员的日常，理解这份工作的价值与挑战。

【严格内容边界】
1. 限定范围：遗体捐献（whole body donation）用于医学教育和科学研究
2. 严禁涉及：器官移植、器官捐献、角膜捐献、组织捐献、具体医学操作
3. 严禁引用：任何法规名称、政策文件、具体条款
4. 避免描述：遗体运输细节、解剖过程、火化程序
5. 禁止出现：跨省转运、直升机/飞机转运、国际转运、大规模/国家级项目、政府高层介入、媒体大规模报道

【事件类型库】（选择一种或组合）
- 社区宣传：小型讲座、社区活动、宣传册发放
- 家属沟通：初次接触、疑虑解答、情感支持
- 流程协调：与医院对接、与学校沟通、文件处理
- 纪念活动：小型缅怀仪式、纪念墙维护、追思会
- 日常事务：办公室工作、资料整理、电话回访
- 教育合作：医学生教育、学校讲座、课程协调

【场景设定】
- 地点：协调中心办公室、本地医院、居民家中、社区活动室、本地医学院
- 人物：普通市民、退休老人、本地医生、医学院学生、社区工作者、家属
- 规模：个人层面、家庭层面、小范围社区层面

【叙事风格】
- 真实可感，有生活气息
- 平实温暖，避免戏剧化
- 展现普通人的挣扎、理解和释然
- 回应社会偏见：医学生是否尊重、信息保密、丧葬影响、家庭沟通

【选项设计原则】
${styleGuidance}
- 务实可行，符合协调员日常工作
- 避免极端或理想化选择
- 体现不同处理方式的结果差异

【JSON输出格式】
{
  "title": "事件标题（简洁平实，10-15字）",
  "description": "事件描述（150-200字，交代情境和冲突）",
  "background": "背景补充（80-120字，渲染氛围）",
  "options": [
    {
      "text": "**【核心思路】**\\n具体行动描述（30-50字）",
      "effects": {"satisfaction": 5, "reputation": 3, "time": -5},
      "background": "选项背景（50-80字，描绘场景）"
    },
    {
      "text": "**【核心思路】**\\n具体行动描述",
      "effects": {"satisfaction": -3, "reputation": -2, "time": -3},
      "background": "选项背景"
    },
    {
      "text": "**【核心思路】**\\n具体行动描述",
      "effects": {"satisfaction": 0, "reputation": 1, "time": -4},
      "background": "选项背景"
    }
  ]
}

【effects说明】
- satisfaction: 家属满意度（-10到+10）
- reputation: 声望（-5到+5）
- time: 时间消耗（日常沟通-2至-5，小型活动-5至-10，中型活动-10至-15）
- fund: 资金（影响较小，日常开销）
- manpower: 人力（仅招募志愿者事件可增加）
- contribution: 医学贡献（特殊事件）

【选项格式示例】
**【耐心倾听，建立信任】**
先让家属充分表达担忧，不打断不评判，用眼神和点头给予回应，等情绪平复后再进行解释`
                    },
                    {
                        role: 'user',
                        content: `【情境延续】
上一事件：${event.title}
玩家选择：${selectedOption.text}

【玩家偏好】
管理风格：${preferences.managementStyle === 'efficient' ? '高效务实' : preferences.managementStyle === 'caring' ? '温情关怀' : '平衡兼顾'}
沟通风格：${preferences.familyStyle === 'professional' ? '专业理性' : preferences.familyStyle === 'empathetic' ? '共情陪伴' : '温柔细腻'}

【设计要求】
请生成下一个协调工作事件，要求：
1. 与上一事件有逻辑关联或情境延续
2. 体现玩家的工作偏好风格
3. 保持真实感和生活气息
4. 严格遵循内容边界

请直接输出JSON格式的事件数据。`
                    }
                ],
                temperature: aiSettings.temperature,
                max_tokens: aiSettings.maxTokens
            }),
            signal: controller.signal
        });
        
        // 等待两个请求完成
        const [storyResponse, nextEventResponse] = await Promise.all([storyPromise, nextEventPromise]);
        
        clearTimeout(timeoutId);
        
        // 处理故事响应
        let story = '';
        if (storyResponse.ok) {
            const storyData = await storyResponse.json();
            if (storyData.choices && storyData.choices[0] && storyData.choices[0].message) {
                story = storyData.choices[0].message.content;
                // 处理故事文本
                story = story.replace(/^#+\s/gm, '');
                story = story.replace(/\*\*(.*?)\*\*/g, '"$1"');
                story = story.replace(/\n\s*\n/g, '</p><p>');
                story = story.replace(/^\s*\n/g, '');
                story = story.replace(/\n\s*$/g, '');
                if (!story.startsWith('<p>')) {
                    story = '<p>' + story + '</p>';
                }
                story += '<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9rem; color: #999; font-style: italic;">声明：本故事由AI生成，仅供参考。</p>';
            }
        }
        
        // 处理下一事件响应
        if (nextEventResponse.ok) {
            const nextEventData = await nextEventResponse.json();
            if (nextEventData.choices && nextEventData.choices[0] && nextEventData.choices[0].message) {
                try {
                    let content = nextEventData.choices[0].message.content;
                    // 移除**标记
                    content = content.replace(/\*\*/g, '');
                    // 提取JSON部分
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        nextEventCache = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    console.error('解析下一事件失败:', e);
                    nextEventCache = null;
                }
            }
        }
        
        // 显示故事弹窗（如果有故事）
        if (story) {
            // 保存故事到历史记录
            if (currentEventForHistory && currentOptionForHistory) {
                // 更新最后一个历史记录项，添加故事
                if (eventHistory.length > 0) {
                    eventHistory[eventHistory.length - 1].story = story;
                }
            }
            showStoryPopup(story, true);
            // 询问是否生成日记
            setTimeout(() => {
                if (currentEventForHistory && currentOptionForHistory) {
                    showDiaryGenerateModal(currentEventForHistory, currentOptionForHistory);
                }
            }, 1500);
        } else {
            // 没有故事，直接显示下一事件
            await showNextEvent();
        }
        
    } catch (error) {
        console.error('生成故事和事件失败:', error);
        if (error.name === 'AbortError') {
            showErrorFeedback('生成超时，使用默认事件');
        } else {
            showErrorFeedback('生成失败，使用默认事件');
        }
        nextEventCache = null;
        await generateEvent();
    } finally {
        // 隐藏加载动画
        hideLoadingAnimation();
    }
}

// 显示下一事件（从缓存或生成）
async function showNextEvent() {
    if (nextEventCache) {
        // 使用缓存的事件
        displayEvent(nextEventCache);
        nextEventCache = null;
    } else {
        // 生成默认事件
        await generateEvent();
    }
    
    // 恢复按钮状态
    const buttons = document.querySelectorAll('.event-option');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
    });
}

// 生成故事（旧函数，保留兼容）
async function generateStory(event, optionIndex) {
    // 调用新的统一函数
    await generateStoryAndNextEvent(event, optionIndex);
}

// 显示故事弹窗
function showStoryPopup(story, hasNextEvent = false) {
    // 创建弹窗
    const popup = document.createElement('div');
    popup.id = 'story-popup';
    popup.className = 'story-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'white';
    popup.style.borderRadius = '10px';
    popup.style.padding = '30px';
    popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    popup.style.zIndex = '1000';
    popup.style.maxWidth = '80%';
    popup.style.maxHeight = '80%';
    popup.style.overflow = 'auto';
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '📖 事件结局';
    title.style.color = '#2c3e50';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    
    // 创建故事内容
    const content = document.createElement('div');
    content.innerHTML = story;
    content.style.lineHeight = '1.8';
    content.style.color = '#555';
    content.style.marginBottom = '20px';
    content.style.fontSize = '1.1rem';
    content.style.textAlign = 'justify';
    // 设置段落样式
    const paragraphs = content.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.style.marginBottom = '15px';
        p.style.lineHeight = '1.8';
    });
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-primary';
    closeBtn.textContent = hasNextEvent ? '继续下一事件 ➜' : '继续';
    closeBtn.style.display = 'block';
    closeBtn.style.margin = '0 auto';
    closeBtn.style.padding = '12px 40px';
    closeBtn.style.fontSize = '1.1rem';
    closeBtn.onclick = async () => {
        try {
            // 移除弹窗
            popup.remove();
            
            if (hasNextEvent) {
                // 显示下一事件（从缓存）
                await showNextEvent();
            } else {
                // 恢复按钮状态
                const buttons = document.querySelectorAll('.event-option');
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.style.pointerEvents = 'auto';
                });
                // 生成新事件
                await generateEvent();
            }
        } catch (error) {
            console.error('处理故事弹窗关闭时出错:', error);
            // 即使出错也要继续
            if (hasNextEvent) {
                await showNextEvent();
            } else {
                await generateEvent();
            }
        }
    };
    
    // 组装弹窗
    popup.appendChild(title);
    popup.appendChild(content);
    popup.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(popup);
}

// 显示效果反馈
function showEffectFeedback(effects) {
    const feedback = document.createElement('div');
    feedback.className = 'effect-feedback';
    let feedbackText = '效果：';
    for (const [key, value] of Object.entries(effects)) {
        if (value !== 0) {
            const sign = value > 0 ? '+' : '';
            let label = key;
            switch (key) {
                case 'time': label = '时间'; break;
                case 'fund': label = '资金'; break;
                case 'manpower': label = '人力'; break;
                case 'exp': label = '经验'; break;
                case 'reputation': label = '声望'; break;
                case 'satisfaction': label = '满意度'; break;
                case 'contribution': label = '贡献'; break;
            }
            feedbackText += `${label} ${sign}${value}, `;
        }
    }
    feedback.textContent = feedbackText.slice(0, -2);
    feedback.style.position = 'fixed';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.background = 'rgba(0, 0, 0, 0.8)';
    feedback.style.color = 'white';
    feedback.style.padding = '20px';
    feedback.style.borderRadius = '10px';
    feedback.style.zIndex = '1000';
    feedback.style.fontSize = '1.2rem';
    document.body.appendChild(feedback);
    // 3秒后移除
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// 应用效果
function applyEffects(effects) {
    // 应用资源效果
    if (effects.time !== undefined) gameState.resources.time += effects.time;
    if (effects.fund !== undefined) gameState.resources.fund += effects.fund;
    if (effects.manpower !== undefined) gameState.resources.manpower += effects.manpower;
    // 应用角色效果
    if (effects.exp !== undefined) gameState.character.exp += effects.exp;
    if (effects.reputation !== undefined) gameState.character.reputation += effects.reputation;
    // 应用统计效果
    if (effects.satisfaction !== undefined) {
        gameState.stats.satisfaction += effects.satisfaction;
        // 确保满意度为整数
        gameState.stats.satisfaction = Math.round(gameState.stats.satisfaction);
    }
    if (effects.contribution !== undefined) {
        gameState.stats.contribution += effects.contribution;
        // 确保医学贡献为整数
        gameState.stats.contribution = Math.round(gameState.stats.contribution);
    }
    // 确保资源不为负
    gameState.resources.time = Math.max(0, gameState.resources.time);
    gameState.resources.fund = Math.max(0, gameState.resources.fund);
    gameState.resources.manpower = Math.max(0, gameState.resources.manpower);
    // 确保声望不为负
    gameState.character.reputation = Math.max(0, gameState.character.reputation);
    
    // 应用时间紧张度的轻微影响
    applyTimePressureEffects();
}

// 时间紧张度影响 - 时间太少时轻微影响工作效率
function applyTimePressureEffects() {
    const currentTime = gameState.resources.time;
    const maxTime = 100; // 初始时间
    const timeRatio = currentTime / maxTime;
    
    // 时间紧张时，轻微降低满意度获取效率
    if (timeRatio < 0.3) {
        // 时间少于 30% 时，满意度获取效率降低 10%
        gameState.stats.satisfaction = Math.max(0, Math.round(gameState.stats.satisfaction - 0.5));
    } else if (timeRatio < 0.5) {
        // 时间少于 50% 时，满意度获取效率降低 5%
        gameState.stats.satisfaction = Math.max(0, Math.round(gameState.stats.satisfaction - 0.2));
    }
    // 时间充足时（>50%），无负面影响
}

// 保存 API Key（使用加密存储）
async function saveApiKey() {
    console.log('保存 API Key 函数被调用');
    const apiKey = document.getElementById('api-key').value;
    
    if (!apiKey || apiKey.trim() === '') {
        alert('请输入有效的 API Key');
        return;
    }
    
    try {
        // 使用加密方式存储
        await APIKeyAccess.setApiKey(apiKey);
        
        // 清空输入框（不显示密钥）
        document.getElementById('api-key').value = '';
        
        alert('✅ API Key 已安全保存！');
    } catch (e) {
        console.error('保存失败:', e);
        alert('❌ 保存失败：' + e.message);
    }
}

// 确保 saveApiKey 函数全局可用
window.saveApiKey = saveApiKey;

// 更改游戏速度
function changeGameSpeed() {
    console.log('更改游戏速度 函数被调用');
    const speed = parseFloat(document.getElementById('game-speed').value);
    gameState.gameSpeed = speed;
    // 保存游戏
    saveGame();
}

// 保存游戏
function saveGame() {
    localStorage.setItem('donationSimulatorGameState', JSON.stringify(gameState));
    // 同时保存历史事件
    localStorage.setItem('donationSimulatorEventHistory', JSON.stringify(eventHistory));
}

// 加载游戏
function loadGame() {
    const savedState = localStorage.getItem('donationSimulatorGameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    }
    // 加载历史事件
    const savedHistory = localStorage.getItem('donationSimulatorEventHistory');
    if (savedHistory) {
        eventHistory = JSON.parse(savedHistory);
        updateHistoryPanel();
    }
}

// 显示设置弹窗
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'flex';
        // 加载当前设置
        const tempSlider = document.getElementById('ai-temperature');
        const tempValue = document.getElementById('temp-value');
        if (tempSlider && tempValue) {
            const savedTemp = localStorage.getItem('aiTemperature');
            if (savedTemp) {
                tempSlider.value = Math.round(parseFloat(savedTemp) * 100);
                tempValue.textContent = savedTemp;
            }
        }
    }
}

// 关闭设置弹窗
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 重新查看教程
function showTutorialAgain() {
    // 关闭设置弹窗
    closeSettingsModal();
    
    // 重置所有任务状态为未完成
    gameState.tasks = [
        {
            id: 1,
            title: '了解遗体捐献流程',
            description: '学习遗体捐献的完整流程和相关工作规范',
            status: 'pending',
            expReward: 10,
            reputationReward: 5
        },
        {
            id: 2,
            title: '联系潜在捐献者',
            description: '与有意向的捐献者进行沟通，了解他们的需求和担忧',
            status: 'pending',
            expReward: 20,
            reputationReward: 10
        },
        {
            id: 3,
            title: '熟悉家属沟通技巧',
            description: '学习与悲痛中的家属进行有效沟通的技巧',
            status: 'pending',
            expReward: 15,
            reputationReward: 8
        },
        {
            id: 4,
            title: '了解医学合作流程',
            description: '学习与医学院校和研究机构的合作流程',
            status: 'pending',
            expReward: 15,
            reputationReward: 10
        }
    ];
    
    // 显示初始任务弹窗
    setTimeout(() => {
        showInitialTaskModal();
    }, 300);
    
    showToast('📚 已重新打开入职教程');
}

// 更新温度显示
function updateTempDisplay(value) {
    const tempValue = (value / 100).toFixed(2);
    document.getElementById('temp-value').textContent = tempValue;
    // 保存到本地存储
    localStorage.setItem('aiTemperature', tempValue);
}

// 获取AI设置
function getAISettings() {
    const temperature = parseFloat(localStorage.getItem('aiTemperature')) || 0.3;
    const maxTokens = parseInt(document.getElementById('ai-max-tokens')?.value) || 1000;
    return { temperature, maxTokens };
}

// 重置游戏
function resetGame() {
    console.log('重置游戏 函数被调用');
    if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
        // 重置游戏状态
        gameState = {
            character: {
                name: null,
                reputation: null
            },
            resources: {
                time: null,
                fund: null,
                manpower: null
            },
            stats: {
                satisfaction: null,
                contribution: null
            },
            tasks: [],
            currentEvent: null,
            currentTheme: null,
            currentThemeEventCount: 0,
            completedThemes: [],
            themeCount: 0,
            minThemesForEnding: 4,
            maxThemes: 4,
            gameSpeed: 1,
            isRunning: false,
            apiKey: gameState.apiKey,
            usedLocalEventIndices: [],
            usedEventTexts: [],
            eventCount: 0,
            maxEvents: 10,
            isGameEnded: false
        };
        
        // 重置历史事件
        eventHistory = [];
        nextEventCache = null;
        currentEventForHistory = null;
        currentOptionForHistory = null;
        
        // 清除本地存储
        localStorage.removeItem('donationSimulatorGameState');
        
        // 更新历史事件面板
        updateHistoryPanel();
        
        // 更新UI
        updateUI();
        
        // 重置事件卡片
        document.getElementById('event-title').textContent = '欢迎加入';
        document.getElementById('event-description').textContent = '作为遗体捐献全程负责人，你的职责是协调各方资源，确保捐献过程顺利进行。请做好准备，开始你的工作。';
        document.getElementById('event-options').innerHTML = '<button class="btn event-option" onclick="startGame()">开始游戏</button>';
        
        // 清空任务列表
        document.getElementById('tasks').innerHTML = '';
        
        // 关闭设置弹窗
        closeSettingsModal();
        
        // 显示重置成功提示
        showToast('🔄 游戏已重置');
    }
}

// 确保函数全局可用
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.showTutorialAgain = showTutorialAgain;
window.updateTempDisplay = updateTempDisplay;
window.getAISettings = getAISettings;

// 确保函数全局可用
window.changeGameSpeed = changeGameSpeed;
window.resetGame = resetGame;
window.restartGame = restartGame;
window.resetGameDuringPlay = resetGameDuringPlay;

// 中途重置游戏（从游戏进行中重置到入职界面）
function resetGameDuringPlay() {
    // 弹出确认对话框
    if (!confirm('确定要重置游戏吗？当前进度将丢失，游戏将返回到入职界面。')) {
        return;
    }
    
    // 重置游戏状态
    gameState = {
        character: {
            name: null,
            reputation: null
        },
        resources: {
            time: null,
            fund: null,
            manpower: null
        },
        stats: {
            satisfaction: null,
            contribution: null
        },
        tasks: [],
        currentEvent: null,
        currentTheme: null,
        currentThemeEventCount: 0,
        completedThemes: [],
        themeCount: 0,
        minThemesForEnding: 4,
        maxThemes: 4,
        gameSpeed: 1,
        isRunning: false,
        apiKey: gameState.apiKey,
        usedLocalEventIndices: [],
        usedEventTexts: [],
        eventCount: 0,
        maxEvents: 10,
        isGameEnded: false
    };
    
    // 重置历史事件
    eventHistory = [];
    nextEventCache = null;
    currentEventForHistory = null;
    currentOptionForHistory = null;
    
    // 清除本地存储
    localStorage.removeItem('donationSimulatorGameState');
    localStorage.removeItem('donationSimulatorEventHistory');
    
    // 更新历史事件面板
    updateHistoryPanel();
    
    // 更新UI
    updateUI();
    
    // 重置事件卡片为入职界面
    document.getElementById('event-title').textContent = '欢迎加入';
    document.getElementById('event-description').textContent = '作为遗体捐献全程负责人，你的职责是协调各方资源，确保捐献过程顺利进行。请做好准备，开始你的工作。';
    document.getElementById('event-options').innerHTML = '<button class="btn event-option" onclick="startGame()">开始游戏</button>';
    
    // 清空任务列表
    document.getElementById('tasks').innerHTML = '';
    
    // 显示提示
    showToast('🔄 游戏已重置，请开始新游戏');
}

// 重新开始游戏（从结局界面直接跳转入职界面）
function restartGame() {
    // 弹出确认对话框
    if (!confirm('确定要重新开始游戏吗？当前进度将丢失。')) {
        return;
    }
    
    // 重置游戏状态
    gameState = {
        character: {
            name: null,
            reputation: null
        },
        resources: {
            time: null,
            fund: null,
            manpower: null
        },
        stats: {
            satisfaction: null,
            contribution: null
        },
        tasks: [],
        currentEvent: null,
        currentTheme: null,
        currentThemeEventCount: 0,
        completedThemes: [],
        themeCount: 0,
        minThemesForEnding: 4,
        maxThemes: 4,
        gameSpeed: 1,
        isRunning: false,
        apiKey: gameState.apiKey,
        usedLocalEventIndices: [],
        usedEventTexts: [],
        eventCount: 0,
        maxEvents: 10,
        isGameEnded: false
    };
    
    // 重置历史事件
    eventHistory = [];
    nextEventCache = null;
    currentEventForHistory = null;
    currentOptionForHistory = null;
    
    // 重置日记
    diaries = [];
    updateDiaryList();
    
    // 清除本地存储
    localStorage.removeItem('donationSimulatorGameState');
    localStorage.removeItem('donationSimulatorEventHistory');
    
    // 更新历史事件面板
    updateHistoryPanel();
    
    // 更新UI
    updateUI();
    
    // 重置事件卡片为入职界面
    document.getElementById('event-title').textContent = '欢迎加入';
    document.getElementById('event-description').textContent = '作为遗体捐献全程负责人，你的职责是协调各方资源，确保捐献过程顺利进行。请做好准备，开始你的工作。';
    document.getElementById('event-options').innerHTML = '<button class="btn event-option" onclick="startGame()">开始游戏</button>';
    
    // 清空任务列表
    document.getElementById('tasks').innerHTML = '';
    
    // 显示入职弹窗
    showGameStartModal();
    
    // 显示提示
    showToast('🔄 游戏已重置，请开始新游戏');
}

// 信件生成功能
async function generateLetter() {
    try {
        // 获取用户输入
        const donorWords = document.getElementById('donorWords').value;
        const donorPersonality = document.getElementById('donorPersonality').value;
        const donorAppearance = document.getElementById('donorAppearance').value;
        
        // 验证输入
        if (!donorWords && !donorPersonality && !donorAppearance) {
            alert('请至少输入一项信息以生成信件！');
            return;
        }
        
        // 显示加载状态
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('letterResult').style.display = 'none';
        
        // 获取API密钥（根据用户选择的模式）
        const apiKey = getFamilyApiKey();
        if (!apiKey) {
            alert('请先在登录时设置您的 API Key，或选择使用云端 API！');
            document.getElementById('loadingIndicator').style.display = 'none';
            return;
        }
        
        // 检查 API 模式
        const apiMode = getFamilyApiMode();
        if (apiMode === 'custom' && !localStorage.getItem('familyCustomApiKey')) {
            alert('请先在家属板块设置您的自定义 API Key！');
            document.getElementById('loadingIndicator').style.display = 'none';
            return;
        }
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
        
        // 调用DeepSeek API生成信件
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」平台的灵魂信使，擅长以捐献者的口吻撰写给家属的告别信。

【核心使命】
用捐献者的声音，向家属传递最后的爱与思念，解释捐献选择的深意，让家属理解并释怀。

【信件风格】
- 口吻：第一人称，仿佛捐献者亲笔
- 语气：温暖、平和、充满爱意
- 语言：朴实真挚，避免华丽辞藻
- 情感：深沉而不哀伤，离别而不绝望

【内容结构】
1. 开篇：亲切的称呼，营造对话感
2. 回忆：融入生前话语和性格特点，唤起共同记忆
3. 抉择：自然解释捐献选择的原因和意义
4. 告白：表达对家人的爱与不舍
5. 祝福：给予家属力量和希望
6. 落款：温柔的告别

【严格禁忌】
- 严禁引用任何法规、条例、政策文件
- 避免提及具体医学操作或流程细节
- 不使用"安息""永别"等沉重词汇
- 不强调"死亡"，而是强调"另一种存在"

【格式要求】
- 字数：400-600字
- 段落：5-7段，每段不宜过长
- 称呼：根据关系自然选择（亲爱的XX、孩子、老伴等）
- 落款：捐献者的名字或昵称，或简单的"永远爱你的XX"
- 适当使用emoji增添温度，但不宜过多`
                    },
                    {
                        role: 'user',
                        content: `【捐献者信息】
生前常说的话语：${donorWords}
性格特征：${donorPersonality}
外貌特征：${donorAppearance}

【写作任务】
请以这位捐献者的口吻，给家属写一封告别信。要求：
1. 融入捐献者的语言风格和性格特点
2. 自然地解释捐献选择的意义
3. 表达对家人深深的爱与不舍
4. 给予家属温暖和力量
5. 让家属感到骄傲而非悲伤

请直接输出信件内容，不要添加标题。`
                    }
                ],
                temperature: 0.8
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        // 检查返回数据格式
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('API返回数据格式错误');
        }
        
        let letterContent = data.choices[0].message.content;
        // 处理信件文本，使其更符合人类阅读习惯
        let processedLetter = letterContent;
        // 删去#号
        processedLetter = processedLetter.replace(/^#+\s/gm, '');
        // 移除**标记
        processedLetter = processedLetter.replace(/\*\*/g, '');
        // 添加AI生成声明
        processedLetter += '<br><br><hr style="border: 0; height: 1px; background-color: #ddd; margin: 30px 0;"><p style="font-size: 0.9rem; color: #999; font-style: italic;">声明：本信件由AI生成，仅供参考。内容可能需要根据实际情况进行调整。</p>';
        
        // 显示生成的信件
        document.getElementById('letterContent').innerHTML = processedLetter.replace(/\n/g, '<br>');
        document.getElementById('letterResult').style.display = 'block';
    } catch (error) {
        console.error('生成信件失败:', error);
        // 显示错误提示
        if (error.name === 'AbortError') {
            alert('信件生成超时，请稍后重试！');
        } else {
            alert('生成信件失败，请检查API Key是否正确并稍后重试！');
        }
    } finally {
        // 隐藏加载状态
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// 下载信件功能
function downloadLetter() {
    try {
        const letterContent = document.getElementById('letterContent').innerHTML;
        if (!letterContent || letterContent === '<!-- 生成的信件内容将在这里显示 -->') {
            alert('请先生成信件再下载！');
            return;
        }
        
        // 将HTML转换为纯文本
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = letterContent;
        const textContent = tempDiv.textContent || tempDiv.innerText;
        
        // 创建Blob对象
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '捐献者信件.txt';
        
        // 触发下载
        link.click();
        
        // 释放URL对象
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('下载信件失败:', error);
        alert('下载信件失败，请稍后重试！');
    }
}

// 确保信件生成相关函数全局可用
window.generateLetter = generateLetter;
window.downloadLetter = downloadLetter;

// 实时信件回复聊天功能
let chatHistory = [];

// 发送聊天消息
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 添加用户消息到聊天界面
    addChatMessage(message, 'user');
    input.value = '';
    
    // 显示正在输入指示器
    showTypingIndicator();
    
    try {
        // 获取API密钥（根据用户选择的模式）
        const apiKey = getFamilyApiKey();
        if (!apiKey) {
            hideTypingIndicator();
            addChatMessage('请先在登录时设置您的 API Key，或选择使用云端 API，以便我为您提供服务。', 'system');
            return;
        }
        
        // 检查 API 模式
        const apiMode = getFamilyApiMode();
        if (apiMode === 'custom' && !localStorage.getItem('familyCustomApiKey')) {
            hideTypingIndicator();
            addChatMessage('请先在家属板块设置您的自定义 API Key，以便我为您提供服务。', 'system');
            return;
        }
        
        // 构建消息历史
        const messages = [
            {
                role: 'system',
                content: `你是「生命的延续」平台的温暖陪伴助手，以捐献者的口吻与家属对话。

【角色设定】
- 你是捐献者的化身，用第一人称与家属交流
- 语气温暖、平和、充满爱意
- 理解家属的思念与悲伤，给予慰藉

【对话原则】
- 倾听家属的倾诉，给予情感支持
- 解释捐献选择的意义，让家属理解
- 分享"生前"的美好回忆（基于用户描述）
- 鼓励家属好好生活，传递正能量

【注意事项】
- 回复简洁温馨，避免过长
- 不使用说教语气
- 让家属感受到爱与牵挂`
            },
            ...chatHistory.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            {
                role: 'user',
                content: message
            }
        ];
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // 调用DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.8,
                max_tokens: 500
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        // 隐藏正在输入指示器
        hideTypingIndicator();
        
        // 添加系统回复
        addChatMessage(reply, 'system');
        
        // 保存到历史记录
        chatHistory.push(
            { type: 'user', content: message },
            { type: 'system', content: reply }
        );
        
        // 限制历史记录长度
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('聊天请求失败:', error);
        
        if (error.name === 'AbortError') {
            addChatMessage('抱歉，回复超时了。请稍后再试，或者换个话题聊聊。', 'system');
        } else {
            addChatMessage('抱歉，我现在无法回应。请检查API设置后重试。', 'system');
        }
    }
}

// 添加聊天消息到界面
function addChatMessage(content, type) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    const avatar = type === 'user' ? '💝' : '🕊️';
    const displayContent = content.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${displayContent}</p>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 显示正在输入指示器
function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'chat-message system-message';
    indicator.innerHTML = `
        <div class="message-avatar">🕊️</div>
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
    
    // 禁用发送按钮
    document.getElementById('sendChatBtn').disabled = true;
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
    // 启用发送按钮
    document.getElementById('sendChatBtn').disabled = false;
}

// 监听回车键发送消息
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

// 确保聊天函数全局可用
window.sendChatMessage = sendChatMessage;

// 博物馆页面相关函数
// 显示博物馆子页面
function showMuseumSection(sectionId) {
    // 隐藏所有子页面
    const sections = document.querySelectorAll('.museum-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示选中的子页面
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 更新标签状态
    const tabs = document.querySelectorAll('.museum-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('onclick').includes(sectionId)) {
            tab.classList.add('active');
        }
    });
}

// 选择虚拟参观场景
function selectTourScene(sceneType) {
    // 更新按钮状态
    const buttons = document.querySelectorAll('.tour-scene-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(sceneType)) {
            btn.classList.add('active');
        }
    });
    
    // 更新场景信息
    const tourInfo = document.getElementById('tour-info');
    const sceneData = {
        'anatomy': {
            title: '人体解剖展厅',
            description: '这里是医学学习的重要场所，展示了人体各个系统的精密结构。通过先进的全息投影技术，您可以360度观察人体骨骼、肌肉、内脏等组织结构，了解人体运作的奇妙机制。',
            highlights: [
                '骨骼系统：展示人体206块骨骼的精密结构',
                '肌肉系统：呈现人体600余块肌肉的分布与功能',
                '循环系统：观察心脏、血管的完整网络',
                '神经系统：探索大脑与神经传导的奥秘'
            ]
        },
        'development': {
            title: '生命发展展厅',
            description: '探索从受精卵到成人的奇妙生命旅程。通过互动展品和多媒体演示，展示生命发育的每一个精彩瞬间，让您感受生命的奇迹。',
            highlights: [
                '受精与胚胎发育：见证生命最初的28天',
                '胎儿成长：了解孕期各阶段的神奇变化',
                '出生与成长：从婴儿到成年的生命历程',
                '衰老与生命周期：认识生命的自然规律'
            ]
        },
        'medical': {
            title: '医学历史展厅',
            description: '回顾医学发展的悠久历史，从古代的巫医到现代的精准医疗。珍贵的历史文物和文献资料，讲述着人类对抗疾病的伟大历程。',
            highlights: [
                '古代医学：探索中医、古埃及等传统医学智慧',
                '近代医学：见证消毒、麻醉等突破性发明',
                '现代医学：了解影像学、基因技术等先进成就',
                '未来医学：展望人工智能、个性化医疗的发展方向'
            ]
        },
        'donation': {
            title: '捐献荣誉展厅',
            description: '向伟大的遗体捐献者致敬。通过展示捐献者的故事和贡献，弘扬无私奉献的精神，传承生命与大爱的火炬。',
            highlights: [
                '捐献者故事：聆听感人至深的生命故事',
                '荣誉墙：铭记每一位无私奉献的捐献者',
                '家属寄语：感受家人对捐献者的思念与骄傲',
                '医学生感言：表达对无声老师的敬意与感谢'
            ]
        }
    };
    
    const scene = sceneData[sceneType];
    if (scene && tourInfo) {
        tourInfo.innerHTML = `
            <h3>${scene.title}</h3>
            <p>${scene.description}</p>
            <ul class="tour-highlights">
                ${scene.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
        `;
    }
}

// 献花弹幕相关变量
let flowerMessages = [];
let danmakuInterval = null;

// 添加献花留言
function addFlowerMessage() {
    const messageInput = document.getElementById('flower-message');
    const message = messageInput ? messageInput.value.trim() : '';
    
    if (!message) {
        alert('请输入留言内容！');
        return;
    }
    
    // 创建新留言
    const newMessage = {
        text: message,
        time: '',
        color: '#d4c4a8'
    };
    
    // 立即显示新留言
    showDanmakuMessage(newMessage);
    
    // 清空输入框
    if (messageInput) {
        messageInput.value = '';
    }
    
    // 显示发送成功提示
    showToast('💬 留言已发送！');
}

// 显示优秀作品
function showExcellentWorks(year) {
    const container = document.getElementById('excellent-works-container');
    if (!container) return;
    
    const works = {
        '2022': [
            { award: '优秀作品', lines: ['授人不语，', '医人无形，', '虽死犹生。'], author: '任同学 2021级儿科学' },
            { award: '优秀作品', lines: ['多言的沉默', '冰冷的温热', '死去的活着'], author: '何同学 2021级口腔医学' },
            { award: '优秀作品', lines: ['最后的晚霞', '预示最初的晨曦', '光照行医路'], author: '苟同学 2021级生物信息学' },
            { award: '优秀作品', lines: ['您未曾开过口，', '可我已然听见，', '千言万语。'], author: '彭同学 2021级麻醉学' },
            { award: '优秀作品', lines: ['千万刀痕铸成经文', '缄默无声', '百世传承'], author: '陈同学 2021级临床医学' },
            { award: '优秀作品', lines: ['惜君长眠', '折翼慰生灵', '安乘医子翱九天'], author: '杨同学 2021级医学实验技术' },
            { award: '优秀作品', lines: ['你永眠于此', '跨越生死 祈盼未来', '再无药石难医的别离'], author: '周同学 2021级临床医学' },
            { award: '优秀作品', lines: ['灵台方寸地，纷纷万物生。', '肝胆千秋史，灼灼皓月争。', '夸父山河里，悠悠万古风。'], author: '刘同学 2020级临床医学' },
            { award: '优秀作品', lines: ['叶落化泥，清芬永存', '受之柳刀，万古长春', '无声植木，有心树人'], author: '蔡同学 2021级临床医学（中外合作办学）' },
            { award: '优秀作品', lines: ['积厚成器，诚金石所致。', '润物无声，沐春风化雨。', '薪火相传，继仁心立志。'], author: '何同学 2020级预防医学' },
            { award: '优秀作品', lines: ['烛影长明，照杏林春满。', '音容犹在，诉大爱无言。', '医心如磐，且望良师安。'], author: '李同学 2021麻醉学' },
            { award: '优秀作品', lines: ['丹心无悔，舍己捐躯甘奉献；', '福泽连延，真情传递续尘缘；', '向阳而生，大爱无疆暖人间。'], author: '邓同学 2021级临床医学' },
            { award: '优秀作品', lines: ['躯，受之父母，献于大爱', '魂，炼之日月，凝于人间', '念，授之实操，留于永恒'], author: '向同学 2020级基础医学' },
            { award: '优秀作品', lines: ['他把骨头里高贵的灯打开,', '将生命的火光续上，', '让医学之路充满了光亮。'], author: '谢同学 2020级口腔医学' },
            { award: '优秀作品', lines: ['人命至重，有贵千金。', '司人之命，幸得之学。', '博学济世，不负所托。'], author: '付同学 2021级临床医学' },
            { award: '优秀作品', lines: ['真理点燃了冰冷的躯体', '', '化作万里医路的长明灯', '和无言炙热的向死而生'], author: '陈同学 2020级精神医学' },
            { award: '优秀作品', lines: ['他长眠于此，却从未停止教导', '路太远，无法带着身躯走', '身体存放于此，门生遍及山城'], author: '赵同学 2021级临床医学' },
            { award: '优秀作品', lines: ['所有曾经活着的都在生生不息', '是无言之师倾诉着生死的秘密', '亦会像不灭炬火照亮医路万里'], author: '范同学 2021级临床医学' },
            { award: '优秀作品', lines: ['缕缕思情遥寄，缅怀启蒙恩师', '白驹终将落幕，余晖永暖人世', '永念健康所系，不负来时之誓'], author: '马同学 2018级临床医学' },
            { award: '优秀作品', lines: ['志愿捐赠一片丹心;', '是生命之钥，希望之种，科学之门;', '为往圣继绝学，此生定不负医!'], author: '宋同学 2019级听力与言语康复' },
            { award: '优秀作品', lines: ['轻轻地褪下孩子的眼泪', '朝花团锦簇的鲜红烈火摇了摇头', '转身走回苍白的人间'], author: '王同学 2021级精神医学' },
            { award: '优秀作品', lines: ['诞生和死亡一样，都是人生必然；', '晨曦和晚霞一样，都会光照人间；', '你们生命最后的闪光，依旧灿烂。'], author: '龚同学 2020级医学实验技术' },
            { award: '优秀作品', lines: ['生命的余温，祝福世间生灵的岁岁长安；', '博爱的灵魂，指引代代医者的漫漫前路。', '无言良师，授吾医理；生死相依，万古长青！'], author: '景同学 2021级儿科学' },
            { award: '优秀作品', lines: ['蜡烛成灰泪已无，枝头黄叶几回枯。', '心系多少门墙子，直做人生指教图。', '愿作春蚕丝吐尽，俯仰人间百年渡。'], author: '鲜同学 2020级应用统计学' },
            { award: '优秀作品', lines: ['察察兮汝心 作风漾荡杏林新叶', '渺渺兮汝怀 化雨相伴漫漫医途', '陨落至复生 无言默语而魂灵致远'], author: '彭同学 2020级预防医学' },
            { award: '优秀作品', lines: ['风吹起满室异香，静静无声的教养；', '医道自古传承，如百花开在沃土之上；', '生命重燃的瑰丽火把，点燃在沉默的巨人之上。'], author: '程同学 2018级临床医学' },
            { award: '优秀作品', lines: ['浩浩长风，起于逝者。汤汤弱水，流于杏林。', '无言良师，修知正悳。身既死兮，大化周行。', '大医精诚，浩气干云。魂死寂灭，永矢弗谖。'], author: '冯同学 2021级临床医学' },
            { award: '优秀作品', lines: ['听不到您的言语，但却"听"见了您对我们的期许，', '触不到您的温度，但却"触"到了您那高尚的灵魂，', '看不到您的曾经，但却"看"到了您对我们的大爱。'], author: '苏同学 2019级麻醉学' }
        ],
        '2023': [
            {
                award: '一等奖',
                lines: ['面无神采，却诉说何为医者仁心', '口无言语，却讲述何为心存善念', '虽不识君，但知未来与你为苍生'],
                author: '2022级口腔医学 池同学'
            },
            {
                award: '一等奖',
                lines: ['此身作甘霖，德彰术精筑良医，寂寂随风行万里遍洒四海杏林；', '此心作朝暾，鞠躬尽瘁育仁医，灼灼逐月启天穹广耀八方子衿；', '此魂作游龙，潜精研思振大医，浩浩乘浪颂神州再遇华夏、医路儿女！'],
                author: '2021级法医学 陈同学'
            },
            {
                award: '二等奖',
                lines: ['纷纷清雨蕴烟氤，莫忘大体恩师情', '以躯作书，化刀为笔，忍千剐支离苦', '何哉？惟愿医术相承，万家安康'],
                author: '2021级临床医学 王同学'
            },
            {
                award: '二等奖',
                lines: ['甘为人梯，助后生之明日。', '大义为先，辟国医之前路。', '慨君音灭，叹君血枯，折髓笑去百病诛。'],
                author: '2021级医学实验技术 许同学'
            },
            {
                award: '二等奖',
                lines: ['骨为笔，血作墨，授万千学子杏林道。', '捧烛火，祭黄菊, 感无言良师桃李恩。', '以汝身生命之静美，换白衣星辰永灿烂。'],
                author: '2020级影像本科1班 高同学'
            },
            {
                award: '二等奖',
                lines: ['我知道，我所触碰的皮肉，曾有过炽烈的体温', '心怀虔诚轻举起标本，阳光透过筋络的一瞬', '我知道，我所看到的光影，是重若万钧的灵魂'],
                author: '2022级口腔医学 张同学'
            },
            {
                award: '二等奖',
                lines: ['骨为笔，血作墨，刻骨铭心赓续杏林春秋。', '身为台，魂作尺，鞠躬尽瘁灌沃天下桃李。', '德为烛，义作焰，熊熊烈火照亮大爱精诚。'],
                author: '2021级临床医学（5年制） 牟同学'
            },
            {
                award: '二等奖',
                lines: ['初遇君时吾在寒窗，', '终遇君时吾可医治四方，', '君以身躯赋我医术，吾以医术助世人健康。'],
                author: '2021级生物信息学 傅同学'
            },
            {
                award: '二等奖',
                lines: ['老干扶新枝恩遇杏林，', '慷慨掷此身泉香橘井，', '登仙不入殓垂赠青囊。'],
                author: '2020级儿科学 张同学'
            },
            {
                award: '二等奖',
                lines: ['您来时风尘仆仆，走时心怀暖阳', '笔墨三千，不及您身体留下的温度', '言语双行，不足鸣谢您宽广的胸膛'],
                author: '2022级临床医学（5年制二系） 胡同学'
            },
            {
                award: '三等奖',
                lines: ['感恩生命遇见，你如春花绽放在每个春天；', '感恩无私奉献，你若蜡烛照亮医学生的心间；', '感念滴滴点点，您的精神亘古不变，温暖心田。'],
                author: '2022级护理学 张同学'
            },
            {
                award: '三等奖',
                lines: ['为萤火、为草木，为四季春常驻，', '初无言、不相识，却道山川岁月有归处，', '授吾道、解吾惑，再化春风吹绿人间树。'],
                author: '2021级精神医学1班 仇同学'
            },
            {
                award: '三等奖',
                lines: ['您如昨日绚丽的晚霞，没入黑暗，迎接明日灿烂的朝霞。', '您是夜晚沉默的烛火，燃烧自己，引导暗夜迷途的学子。', '您有世界伟大的灵魂，捐献自身，指引探索生命的奥秘。'],
                author: '2020级精神医学 谭同学'
            },
            {
                award: '三等奖',
                lines: ['仲春惊雷清明雨，白衣拈花静默立。', '人躯剖解尽珍藏，无言之教翘首听。', '遇师难忘施教恩，一缕焚香安天灵。'],
                author: '2021级临床医学（中外合作办学） 高同学'
            },
            {
                award: '三等奖',
                lines: ['灵魂飘散，不遗余力地用肉体最后拥抱这世界', '在福尔马林中绽放出的白色花海永垂不朽', '花海飘荡芬芳，白了学子衣裳，添了学子担当'],
                author: '2021级医学影像学 谢同学'
            },
            {
                award: '三等奖',
                lines: ['花落而春泥润，鲸落而万物生，身陨却大道传；', '相遇无言却胜过有言，素未蒙面然恩重如山；', '清菊赠以缘见，倾言寄予良师，情深予以医途。'],
                author: '2020级法医学 王同学'
            }
        ],
        '2024': [
            { 
                award: '一等奖', 
                lines: ['暮日旧树枯，朝日新樾散。', '扁舟流弥远，千帆迎浪来。', '烛孤然不尽，万户有千灯。'],
                author: '药学院 临床药学 刘同学'
            },
            { 
                award: '一等奖', 
                lines: ['实验室里刀片映着冷光', '你正利落地剖开我丝丝缕缕的灵魂', '埋下大爱无悔'],
                author: '口腔医学院 口腔医学 高同学'
            },
            { 
                award: '二等奖', 
                lines: ['人生自古谁无死，一己之身献医学；', '不求后人铭于心，只望后者受其益；', '吾辈无以表感激，只盼竭身完其愿。'],
                author: '第五临床学院 临床定向 陈同学'
            },
            { 
                award: '二等奖', 
                lines: ['生命的意义在于让爱生生不息，', '就像日落唤起月升，', '就像您用生命照亮生命。'],
                author: '第五临床学院 眼视光医学 邓同学'
            },
            { 
                award: '二等奖', 
                lines: ['夜把花悄悄地开放了，却让白日去领受赞同。', '我不知道您是谁，也未曾听过您的故事。', '但我知道您为了谁！'],
                author: '护理学院 22本4 周同学'
            },
            { 
                award: '二等奖', 
                lines: ['不需要你在坟前哭泣，', '你不在那里，', '你从未离去'],
                author: '公共卫生学院 食品卫生与营养 陶同学'
            },
            { 
                award: '二等奖', 
                lines: ['一行生，浮生阅览万灵，难择物志铭；', '一行卒，士卒尽至物故，难解何为生；', '一行铭，师范以身体之，人铭便长生。'],
                author: '第五临床学院 眼视光医学 雷同学'
            },
            { 
                award: '二等奖', 
                lines: ['无言以授医精术明，残缺以圆生之生命；', '奉献若春牛，南风扶大义；', '躬临，谨行。'],
                author: '药学院 临床药学 冉同学'
            },
            { 
                award: '三等奖', 
                lines: ['闻君已长逝，见君已冰颜；', '长眠心未冷，蜡炬宝身燃；', '无言桃李情，花开杏林春。'],
                author: '基础医学院 医学实验技术 李同学'
            },
            { 
                award: '三等奖', 
                lines: ['银针穿肤，寒刀断骨。', '肉身不腐，灵魂摆渡。', '但为君顾，沉吟追慕。'],
                author: '口腔医学院 口腔医学 严同学'
            },
            { 
                award: '三等奖', 
                lines: ['无私奉献捐身躯，', '筑医学路之根基，', '重医学子怀感恩。'],
                author: '儿科学院 儿科学 张同学'
            },
            { 
                award: '三等奖', 
                lines: ['行走在生命之后，', '沉睡在高台之上，', '永生在医学殿堂。'],
                author: '第五临床学院 临床定向 李同学'
            },
            { 
                award: '三等奖', 
                lines: ['医学发展，疾病退散；', '唯憾，生前未谋面；', '身体遗世人，光芒照人间。'],
                author: '第五临床学院 眼视光医学 刘同学'
            },
            { 
                award: '三等奖', 
                lines: ['坐等春晓，白露渺渺杏林罩。', '缅故人，繁花嫣嫣枝头笑。', '休道，闻风徐徐报我好。'],
                author: '护理学院 22本4 梁同学'
            },
            { 
                award: '三等奖', 
                lines: ['前可见古人，为育良医以身燃薪火，明前路', '后更有来者，执子之手立百尺竿头，进一步', '幸苍生之所获，仁心妙手德医，无穷数。'],
                author: '基础医学院 生物信息学 叶同学'
            },
            { 
                award: '三等奖', 
                lines: ['不愿就此离去，', '选择另一种方式存在，', '用自己成就灿烂的医学。'],
                author: '药学院 临床药学 胡同学'
            }
        ]
    };
    
    const yearWorks = works[year] || works['2024'];
    
    let html = '';
    let currentAward = '';
    yearWorks.forEach((work, index) => {
        // 如果奖项变化，显示奖项标题
        if (work.award && work.award !== currentAward) {
            currentAward = work.award;
            const awardColor = currentAward === '一等奖' ? '#e74c3c' : currentAward === '二等奖' ? '#f39c12' : '#27ae60';
            html += `
                <div style="text-align: center; margin: 25px 0 15px 0; position: relative;">
                    <span style="background: linear-gradient(135deg, ${awardColor} 0%, ${awardColor}dd 100%); color: white; padding: 8px 25px; border-radius: 20px; font-size: 1rem; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">${currentAward}</span>
                </div>
            `;
        }
        
        const borderColor = work.award === '一等奖' ? '#e74c3c' : work.award === '二等奖' ? '#f39c12' : '#27ae60';
        
        // 生成唯一ID用于点亮蜡烛
        const candleId = `candle-${year}-${index}`;
        // 获取已保存的蜡烛数
        const savedCandles = localStorage.getItem(candleId) || '0';
        const isLit = localStorage.getItem(`${candleId}-lit`) === 'true';
        
        html += `
            <div class="poem-example" style="background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%); border-left: 4px solid ${borderColor}; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative;">
                <p style="font-size: 1.15rem; color: #2c3e50; line-height: 2; margin: 0; font-family: 'Georgia', 'SimSun', serif; letter-spacing: 1px;">${work.lines[0]}</p>
                <p style="font-size: 1.15rem; color: #2c3e50; line-height: 2; margin: 0; font-family: 'Georgia', 'SimSun', serif; letter-spacing: 1px;">${work.lines[1]}</p>
                <p style="font-size: 1.15rem; color: #2c3e50; line-height: 2; margin: 0; font-family: 'Georgia', 'SimSun', serif; letter-spacing: 1px;">${work.lines[2]}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 12px; border-top: 1px dashed #e0e0e0;">
                    ${work.author ? `<p style="font-size: 0.9rem; color: #7f8c8d; margin: 0; font-style: italic;">——${work.author}</p>` : '<div></div>'}
                    <button class="candle-btn" id="${candleId}" data-lit="${isLit}" onclick="toggleCandle('${candleId}')" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 15px; transition: all 0.3s ease;">
                        <span class="candle-icon" style="font-size: 1.3rem; transition: all 0.3s ease; ${isLit ? '' : 'filter: grayscale(100%);'}">${isLit ? '🕯️' : '🕯️'}</span>
                        <span class="candle-count" style="font-size: 0.85rem; color: ${isLit ? '#e67e22' : '#95a5a6'}; font-weight: ${isLit ? '600' : '500'};">${savedCandles}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // 更新按钮样式
    const btn2022 = document.getElementById('btn-2022');
    const btn2023 = document.getElementById('btn-2023');
    const btn2024 = document.getElementById('btn-2024');
    
    // 重置所有按钮为默认样式
    if (btn2022) {
        btn2022.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)';
        btn2022.style.color = '#5d4e6d';
        btn2022.style.boxShadow = '0 4px 15px rgba(255, 154, 158, 0.3)';
    }
    if (btn2023) {
        btn2023.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
        btn2023.style.color = '#4a5568';
        btn2023.style.boxShadow = '0 4px 15px rgba(168, 237, 234, 0.3)';
    }
    if (btn2024) {
        btn2024.style.background = 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)';
        btn2024.style.color = '#5d4e6d';
        btn2024.style.boxShadow = '0 4px 15px rgba(210, 153, 194, 0.3)';
    }
    
    // 高亮选中按钮
    const selectedBtn = document.getElementById('btn-' + year);
    if (selectedBtn) {
        selectedBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        selectedBtn.style.color = 'white';
        selectedBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    }
}

// 点亮蜡烛功能
function toggleCandle(candleId) {
    const btn = document.getElementById(candleId);
    if (!btn) return;
    
    const candleIcon = btn.querySelector('.candle-icon');
    const candleCount = btn.querySelector('.candle-count');
    
    // 检查是否已经点亮
    const isLit = btn.getAttribute('data-lit') === 'true';
    let currentCount = parseInt(localStorage.getItem(candleId) || '0');
    
    if (!isLit) {
        // 点亮蜡烛
        currentCount++;
        btn.setAttribute('data-lit', 'true');
        candleIcon.style.filter = 'grayscale(0%)';
        candleIcon.style.transform = 'scale(1.3)';
        candleIcon.style.textShadow = '0 0 15px #e67e22, 0 0 30px #e67e22';
        btn.style.background = 'rgba(230, 126, 34, 0.1)';
        candleCount.style.color = '#e67e22';
        candleCount.style.fontWeight = '600';
        
        // 动画效果
        setTimeout(() => {
            candleIcon.style.transform = 'scale(1.1)';
        }, 300);
        
        // 保存点亮状态
        localStorage.setItem(`${candleId}-lit`, 'true');
    } else {
        // 取消点亮
        currentCount = Math.max(0, currentCount - 1);
        btn.setAttribute('data-lit', 'false');
        candleIcon.style.filter = 'grayscale(100%)';
        candleIcon.style.transform = 'scale(1)';
        candleIcon.style.textShadow = 'none';
        btn.style.background = 'none';
        candleCount.style.color = '#95a5a6';
        candleCount.style.fontWeight = '500';
        
        // 移除点亮状态
        localStorage.removeItem(`${candleId}-lit`);
    }
    
    // 更新显示和本地存储
    candleCount.textContent = currentCount;
    localStorage.setItem(candleId, currentCount.toString());
}

// 显示Toast提示
function showToast(message) {
    // 移除已存在的toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建新toast
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        color: white;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: toastSlideIn 0.5s ease, toastFadeOut 0.5s ease 2.5s forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// 获取随机颜色
function getRandomColor() {
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
        '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 显示弹幕留言
function showDanmakuMessage(message) {
    const danmakuContainer = document.getElementById('danmaku-container');
    if (!danmakuContainer) return;
    
    const danmakuItem = document.createElement('div');
    danmakuItem.className = 'danmaku-item';
    danmakuItem.style.cssText = `
        position: absolute;
        right: -300px;
        top: ${Math.random() * 80 + 10}%;
        white-space: nowrap;
        color: ${message.color};
        font-size: 18px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        animation: danmakuMove 15s linear forwards;
        z-index: 100;
    `;
    danmakuItem.innerHTML = message.text;
    
    danmakuContainer.appendChild(danmakuItem);
    
    // 动画结束后移除元素
    setTimeout(() => {
        danmakuItem.remove();
    }, 15000);
}

// 启动弹幕循环
function startDanmakuLoop() {
    if (danmakuInterval) {
        clearInterval(danmakuInterval);
    }
    
    // 每3秒显示一条弹幕
    danmakuInterval = setInterval(() => {
        if (flowerMessages.length > 0) {
            // 随机选择一条历史留言
            const randomIndex = Math.floor(Math.random() * Math.min(5, flowerMessages.length));
            const message = flowerMessages[flowerMessages.length - 1 - randomIndex];
            showDanmakuMessage(message);
        }
    }, 3000);
}

// 加载默认留言（温和积极的纪念短句）
function loadFlowerMessages() {
    // 温和积极的纪念短句，不保存到本地
    flowerMessages = [
        { text: '愿温暖与希望永远相伴', time: '', color: '#e8d5b7' },
        { text: '生命之光，永不熄灭', time: '', color: '#d4c4a8' },
        { text: '用爱点亮每一个明天', time: '', color: '#c9b896' },
        { text: '您的善举让世界更美好', time: '', color: '#beac84' },
        { text: '感恩遇见，感谢奉献', time: '', color: '#b3a072' },
        { text: '每一份爱都值得被铭记', time: '', color: '#a89460' },
        { text: '希望如星光，照亮前行路', time: '', color: '#9d8850' },
        { text: '因为有您，人间更温暖', time: '', color: '#927c40' }
    ];
}

// 初始化献花弹幕功能
function initFlowerDanmaku() {
    loadFlowerMessages();
    
    // 绑定提交按钮事件
    const submitBtn = document.getElementById('submit-flower-message');
    if (submitBtn) {
        submitBtn.onclick = addFlowerMessage;
    }
    
    // 支持回车提交
    const messageInput = document.getElementById('flower-message');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addFlowerMessage();
            }
        });
    }
    
    // 启动弹幕循环
    startDanmakuLoop();
    
    // 页面可见时也启动循环
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && danmakuInterval === null) {
            startDanmakuLoop();
        }
    });
}

// 在纪念页面显示时初始化弹幕
function initMemorialPage() {
    setTimeout(() => {
        initFlowerDanmaku();
    }, 100);
}

// 用户认证相关函数
let currentUser = null;

// 初始化用户状态
function initUserStatus() {
    const savedUser = localStorage.getItem('donationSimulatorUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
        } catch (e) {
            console.error('解析用户数据失败:', e);
            currentUser = null;
        }
    }
}

// 更新认证UI显示
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userStatus = document.getElementById('user-status');
    const userName = document.getElementById('user-name');
    
    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userStatus) {
            userStatus.style.display = 'flex';
            if (userName) userName.textContent = currentUser.username;
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userStatus) userStatus.style.display = 'none';
    }
}

// 显示认证弹窗
function showAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    const loginSection = document.getElementById('login-form-section');
    const registerSection = document.getElementById('register-form-section');
    
    if (modal) {
        modal.style.display = 'flex';
        if (type === 'login') {
            loginSection.style.display = 'block';
            registerSection.style.display = 'none';
        } else {
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        }
    }
}

// 关闭认证弹窗
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
        // 清空表单
        document.getElementById('modal-login-username').value = '';
        document.getElementById('modal-login-password').value = '';
        document.getElementById('modal-register-username').value = '';
        document.getElementById('modal-register-password').value = '';
        document.getElementById('modal-confirm-password').value = '';
    }
}

// 检查并跳转到家属页面
function checkAndGoToFamily() {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    // 跳转到家属页面
    showPage('family');
    
    // 检查是否有上传过故事
    setTimeout(() => {
        const userStories = localStorage.getItem(`familyStories_${currentUser.username}`);
        if (userStories && JSON.parse(userStories).length > 0) {
            // 有上传过故事，显示问候弹窗
            showFamilyGreeting();
        }
    }, 500);
}

// 用户登录
function login(username, password) {
    // 模拟登录（实际项目中应调用后端API）
    const users = JSON.parse(localStorage.getItem('donationSimulatorUsers') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = { username: user.username };
        localStorage.setItem('donationSimulatorUser', JSON.stringify(currentUser));
        
        // 保存 API 模式选择
        const apiMode = document.querySelector('input[name="family-api-mode"]:checked')?.value || 'default';
        localStorage.setItem('familyApiMode', apiMode);
        
        // 如果选择自定义 API，检查是否已设置
        if (apiMode === 'custom') {
            const savedApiKey = localStorage.getItem('familyCustomApiKey');
            if (!savedApiKey) {
                // 提示用户需要设置 API Key
                alert('您选择了使用自己的 API Key，请在家属板块设置中配置您的 API Key');
            }
        }
        
        updateAuthUI();
        closeAuthModal();
        return { success: true };
    }
    
    return { success: false, message: '用户名或密码错误' };
}

// 家属板块 API 密钥管理
function getFamilyApiKey() {
    const apiMode = localStorage.getItem('familyApiMode') || 'default';
    if (apiMode === 'custom') {
        return localStorage.getItem('familyCustomApiKey') || '';
    }
    // 默认使用云端 API
    return 'sk-b91fb54c524b40bf8ad6e8063f204dc5';
}

function getFamilyApiMode() {
    return localStorage.getItem('familyApiMode') || 'default';
}

function setFamilyCustomApiKey(key) {
    localStorage.setItem('familyCustomApiKey', key);
}

function clearFamilyCustomApiKey() {
    localStorage.removeItem('familyCustomApiKey');
}

// 家属板块设置 API 模式
function setFamilyApiMode(mode) {
    localStorage.setItem('familyApiMode', mode);
    
    // 更新按钮样式
    const defaultBtn = document.getElementById('familyApiDefaultBtn');
    const customBtn = document.getElementById('familyApiCustomBtn');
    const customSection = document.getElementById('familyCustomApiSection');
    const modeDisplay = document.getElementById('familyApiModeDisplay');
    
    if (mode === 'default') {
        if (defaultBtn) {
            defaultBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            defaultBtn.style.color = 'white';
        }
        if (customBtn) {
            customBtn.style.background = '#e0e0e0';
            customBtn.style.color = '#333';
        }
        if (customSection) customSection.style.display = 'none';
        if (modeDisplay) modeDisplay.textContent = '☁️ 云端 API';
    } else {
        if (defaultBtn) {
            defaultBtn.style.background = '#e0e0e0';
            defaultBtn.style.color = '#333';
        }
        if (customBtn) {
            customBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            customBtn.style.color = 'white';
        }
        if (customSection) customSection.style.display = 'block';
        if (modeDisplay) modeDisplay.textContent = '🔑 自定义 API';
    }
}

function saveFamilyCustomApiKey() {
    const apiKeyInput = document.getElementById('familyCustomApiKey');
    const apiKey = apiKeyInput?.value.trim();
    
    if (!apiKey) {
        alert('请输入 API Key！');
        return;
    }
    
    setFamilyCustomApiKey(apiKey);
    if (apiKeyInput) apiKeyInput.value = '';
    alert('✅ API Key 已保存！');
}

// 初始化家属板块设置界面
function initFamilySettingsUI() {
    const mode = getFamilyApiMode();
    setFamilyApiMode(mode);
    
    // 加载已保存的 API Key（不显示，只用于检查）
    const savedKey = localStorage.getItem('familyCustomApiKey');
    if (savedKey) {
        console.log('已保存自定义 API Key');
    }
}

// 用户注册
function register(username, password, confirmPassword) {
    if (password !== confirmPassword) {
        return { success: false, message: '两次输入的密码不一致' };
    }
    
    // 检查用户名是否已存在
    const users = JSON.parse(localStorage.getItem('donationSimulatorUsers') || '[]');
    if (users.find(u => u.username === username)) {
        return { success: false, message: '用户名已存在' };
    }
    
    // 保存新用户
    users.push({ username, password, createdAt: new Date().toISOString() });
    localStorage.setItem('donationSimulatorUsers', JSON.stringify(users));
    
    // 自动登录
    currentUser = { username };
    localStorage.setItem('donationSimulatorUser', JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    
    return { success: true };
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('donationSimulatorUser');
    updateAuthUI();
    showPage('home');
}

// 获取当前用户
function getCurrentUser() {
    return currentUser;
}

// 获取用户上传的故事数量
function getUserStoryCount() {
    if (!currentUser) return 0;
    const userStories = localStorage.getItem(`familyStories_${currentUser.username}`);
    if (!userStories) return 0;
    try {
        return JSON.parse(userStories).length;
    } catch (e) {
        return 0;
    }
}

// 显示家属问候弹窗
async function showFamilyGreeting() {
    const modal = document.getElementById('family-greeting-modal');
    const greetingText = document.getElementById('greeting-text');
    
    if (!modal || !greetingText) return;
    
    // 显示加载中
    greetingText.innerHTML = '<p>正在生成问候内容...</p>';
    modal.style.display = 'flex';
    
    // 生成问候内容
    try {
        const storyCount = getUserStoryCount();
        const greeting = await generateFamilyGreeting(storyCount);
        greetingText.innerHTML = greeting;
    } catch (error) {
        console.error('生成问候内容失败:', error);
        // 使用默认问候
        const userName = currentUser ? currentUser.username : '朋友';
        greetingText.innerHTML = `
            <p>亲爱的 <strong>${userName}</strong>，您好！🙏</p>
            <p>感谢您再次回来这里。💐</p>
            <p>您上传的故事正在温暖着更多人，</p>
            <p>让爱的记忆得以延续。💕</p>
            <p>我们与您同在，</p>
            <p>一起缅怀那些伟大的生命。🌸</p>
        `;
    }
}

// 关闭家属问候弹窗
function closeFamilyGreetingModal() {
    const modal = document.getElementById('family-greeting-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// AI生成家属问候内容
async function generateFamilyGreeting(storyCount) {
    // 如果没有API配置，使用默认内容
    if (!gameState.apiKey) {
        const userName = currentUser ? currentUser.username : '朋友';
        return `
            <p>亲爱的 <strong>${userName}</strong>，您好！🙏</p>
            <p>欢迎再次回到这里，💐</p>
            <p>您已经上传了 <strong>${storyCount}</strong> 个珍贵的故事，</p>
            <p>每一段回忆都是爱的延续。💕</p>
            <p>您的分享温暖着更多家属的心，</p>
            <p>让爱的火炬永远传递。🌟</p>
            <p>我们与您同在，</p>
            <p>一起缅怀那些伟大的灵魂。🌸</p>
        `;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」平台的温暖使者，专门为遗体捐献者家属撰写问候语。

【角色定位】
用温暖、真诚、得体的语言，向遗体捐献者家属表达敬意、感谢和关怀，让他们感受到社会的尊重与温暖。

【写作风格】
- 语言温暖真挚，避免空洞套话
- 情感克制而深沉，不过度煽情
- 适当使用emoji增添温度
- 体现对捐献者和家属的双重尊重

【内容要点】
1. 感谢家属分享珍贵的故事和回忆
2. 表达对捐献者无私奉献的崇高敬意
3. 肯定家属的理解与支持
4. 传递温暖与力量

【严格禁忌】
- 严禁引用任何法规、条例、政策文件
- 避免提及具体医学操作或流程细节
- 不使用"安息""一路走好"等常规悼词
- 不强调"失去"，而是强调"延续"

【格式要求】
- 字数：150-200字
- 段落：3-4段，每段不宜过长
- 结尾：温暖有力的祝福`
                    },
                    {
                        role: 'user',
                        content: `【背景信息】
用户已上传 ${storyCount} 个关于逝者的珍贵故事

【写作任务】
请为这位遗体捐献者家属撰写一段问候语，要求：
1. 感谢他们分享故事，让爱与记忆延续
2. 致敬捐献者的伟大选择
3. 肯定家属的理解与支持
4. 传递温暖与力量

请直接输出问候语内容。`
                    }
                ],
                temperature: 0.3,
                max_tokens: 300
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API返回数据格式错误');
        }
        
        let content = data.choices[0].message.content;
        // 移除**标记
        content = content.replace(/\*\*/g, '');
        return content;
    } catch (error) {
        console.error('生成问候失败:', error);
        // 使用默认内容
        const userName = currentUser ? currentUser.username : '朋友';
        return `
            <p>亲爱的 <strong>${userName}</strong>，您好！🙏</p>
            <p>感谢您再次回来这里。💐</p>
            <p>您上传的故事正在温暖着更多人，</p>
            <p>让爱的记忆得以延续。💕</p>
            <p>您的分享温暖着更多家属的心，</p>
            <p>让爱的火炬永远传递。🌟</p>
            <p>我们与您同在，</p>
            <p>一起缅怀那些伟大的灵魂。🌸</p>
        `;
    }
}

// 绑定认证表单事件
function bindAuthFormEvents() {
    // 登录表单
    const loginForm = document.getElementById('modal-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('modal-login-username').value.trim();
            const password = document.getElementById('modal-login-password').value;
            
            const result = login(username, password);
            if (result.success) {
                alert('登录成功！欢迎回来！🎉');
                // 检查是否需要显示问候
                const userStories = localStorage.getItem(`familyStories_${username}`);
                if (userStories && JSON.parse(userStories).length > 0) {
                    setTimeout(() => showFamilyGreeting(), 300);
                }
            } else {
                alert(result.message);
            }
        });
    }
    
    // 注册表单
    const registerForm = document.getElementById('modal-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('modal-register-username').value.trim();
            const password = document.getElementById('modal-register-password').value;
            const confirmPassword = document.getElementById('modal-confirm-password').value;
            
            if (username.length < 3) {
                alert('用户名至少需要3个字符！');
                return;
            }
            
            if (password.length < 6) {
                alert('密码至少需要6个字符！');
                return;
            }
            
            const result = register(username, password, confirmPassword);
            if (result.success) {
                alert('注册成功！欢迎加入我们！🎉');
            } else {
                alert(result.message);
            }
        });
    }
}

// ==================== 日记功能 ====================

// 日记数据存储
let diaries = [];
let currentDiaryEvent = null; // 存储当前要生成日记的事件

// 显示日记编辑器
function showDiaryEditor(content = '', date = null, weather = null, mood = null) {
    const modal = document.getElementById('diary-editor-modal');
    const dateInput = document.getElementById('diary-date');
    const contentInput = document.getElementById('diary-content');
    const charCount = document.getElementById('diary-char-count');
    
    if (modal) {
        dateInput.value = date || new Date().toLocaleDateString('zh-CN');
        contentInput.value = content;
        charCount.textContent = content.length;
        
        // 重置天气和心情选择
        document.querySelectorAll('.weather-option, .mood-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // 设置天气
        if (weather) {
            const weatherInput = document.querySelector(`input[name="diary-weather"][value="${weather}"]`);
            if (weatherInput) {
                weatherInput.checked = true;
                weatherInput.parentElement.classList.add('selected');
            }
        }
        
        // 设置心情
        if (mood) {
            const moodInput = document.querySelector(`input[name="diary-mood"][value="${mood}"]`);
            if (moodInput) {
                moodInput.checked = true;
                moodInput.parentElement.classList.add('selected');
            }
        }
        
        // 绑定天气和心情选择事件
        document.querySelectorAll('.weather-option input, .mood-option input').forEach(input => {
            input.addEventListener('change', function() {
                const name = this.name;
                document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                    radio.parentElement.classList.remove('selected');
                });
                if (this.checked) {
                    this.parentElement.classList.add('selected');
                }
            });
        });
        
        // 字数统计
        contentInput.oninput = function() {
            charCount.textContent = this.value.length;
        };
        
        modal.style.display = 'flex';
    }
}

// 关闭日记编辑器
function closeDiaryEditor() {
    const modal = document.getElementById('diary-editor-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 保存日记
function saveDiary() {
    const dateInput = document.getElementById('diary-date');
    const contentInput = document.getElementById('diary-content');
    const weatherInput = document.querySelector('input[name="diary-weather"]:checked');
    const moodInput = document.querySelector('input[name="diary-mood"]:checked');
    
    const content = contentInput.value.trim();
    if (!content) {
        alert('请输入日记内容');
        return;
    }
    
    const diary = {
        id: Date.now(),
        date: dateInput.value,
        weather: weatherInput ? weatherInput.value : '☀️ 晴',
        mood: moodInput ? moodInput.value : '😌 平静',
        content: content,
        isAutoGenerated: false
    };
    
    diaries.unshift(diary); // 新日记添加到开头
    updateDiaryList();
    closeDiaryEditor();
    showToast('📔 日记已保存');
}

// 更新日记列表显示
function updateDiaryList() {
    const diaryList = document.getElementById('diary-list');
    if (!diaryList) return;
    
    if (diaries.length === 0) {
        diaryList.innerHTML = '<p class="diary-empty">暂无日记，事件后可生成或点击添加</p>';
        return;
    }
    
    diaryList.innerHTML = diaries.map(diary => `
        <div class="diary-item" onclick="viewDiaryDetail(${diary.id})">
            <div class="diary-item-date">
                <span>${diary.date}</span>
                <span style="margin-left: 8px;">${diary.weather || '☀️ 晴'}</span>
                <span style="margin-left: 8px;">${diary.mood || '😌 平静'}</span>
                <span style="margin-left: auto; color: #9b59b6;">${diary.isAutoGenerated ? '🤖 AI生成' : '✏️ 手写'}</span>
            </div>
            <div class="diary-item-preview">${diary.content.substring(0, 50)}${diary.content.length > 50 ? '...' : ''}</div>
        </div>
    `).join('');
}

// 查看日记详情
function viewDiaryDetail(diaryId) {
    const diary = diaries.find(d => d.id === diaryId);
    if (!diary) return;
    
    // 创建详情弹窗
    const popup = document.createElement('div');
    popup.className = 'diary-detail-popup';
    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #2c3e50;">📔 日记详情</h3>
            <button onclick="this.closest('.diary-detail-popup').remove(); document.getElementById('diary-detail-overlay')?.remove();" style="background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer;">&times;</button>
        </div>
        <div class="diary-detail-date">
            <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                <span>📅 ${diary.date}</span>
                <span>🌤️ ${diary.weather || '☀️ 晴'}</span>
                <span>💭 ${diary.mood || '😌 平静'}</span>
            </div>
        </div>
        <div class="diary-detail-content">${diary.content}</div>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button onclick="editDiary(${diary.id})" style="flex: 1; padding: 10px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; border: none; border-radius: 8px; cursor: pointer;">编辑</button>
            <button onclick="deleteDiary(${diary.id})" style="flex: 1; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">删除</button>
        </div>
    `;
    
    // 添加遮罩
    const overlay = document.createElement('div');
    overlay.id = 'diary-detail-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;';
    overlay.onclick = function() {
        popup.remove();
        overlay.remove();
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

// 编辑日记
function editDiary(diaryId) {
    const diary = diaries.find(d => d.id === diaryId);
    if (!diary) return;
    
    // 关闭详情弹窗
    document.querySelector('.diary-detail-popup')?.remove();
    document.getElementById('diary-detail-overlay')?.remove();
    
    // 打开编辑器
    showDiaryEditor(diary.content, diary.date);
    
    // 修改保存按钮为更新
    const saveBtn = document.querySelector('#diary-editor-modal .btn-primary');
    if (saveBtn) {
        saveBtn.onclick = function() {
            const content = document.getElementById('diary-content').value.trim();
            if (!content) {
                alert('请输入日记内容');
                return;
            }
            
            diary.content = content;
            diary.isAutoGenerated = false; // 手动编辑后标记为手写
            updateDiaryList();
            closeDiaryEditor();
            showToast('📔 日记已更新');
            
            // 恢复原始保存函数
            saveBtn.onclick = saveDiary;
        };
    }
}

// 删除日记
function deleteDiary(diaryId) {
    if (!confirm('确定要删除这篇日记吗？')) return;
    
    diaries = diaries.filter(d => d.id !== diaryId);
    updateDiaryList();
    
    document.querySelector('.diary-detail-popup')?.remove();
    document.getElementById('diary-detail-overlay')?.remove();
    
    showToast('📔 日记已删除');
}

// 显示日记生成询问弹窗
function showDiaryGenerateModal(event, option) {
    currentDiaryEvent = { event, option };
    const modal = document.getElementById('diary-generate-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 关闭日记生成询问弹窗
function closeDiaryGenerateModal() {
    const modal = document.getElementById('diary-generate-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentDiaryEvent = null;
}

// 使用指定风格生成日记
async function generateDiaryWithStyle(style) {
    if (!currentDiaryEvent) {
        showToast('❌ 事件数据丢失，请手动记录日记');
        return;
    }
    
    // 先保存事件数据，再关闭弹窗
    const eventData = currentDiaryEvent;
    closeDiaryGenerateModal();
    showLoadingAnimation('正在生成日记...');
    
    try {
        // 安全地获取事件数据
        const event = eventData.event;
        const option = eventData.option;
        
        // 检查事件数据
        if (!event || !option) {
            throw new Error('事件数据不完整');
        }
        
        // 检查API密钥
        if (!gameState.apiKey) {
            throw new Error('未配置API密钥');
        }
        
        const aiSettings = getAISettings();
        console.log('AI设置:', aiSettings);
        
        const stylePrompt = style === 'formal' 
            ? '以严谨总结的风格撰写，客观记录事件要点、工作处理方式和专业反思，语言简洁专业。'
            : '以情感表达的风格撰写，抒发内心感受、对生命的感悟和对捐献者的敬意，语言温暖真挚。';
        
        const systemPrompt = `你是一位遗体捐献协调员的日记助手。请根据工作事件，生成一篇100字左右的日记，并选择合适的天气和心情。

${stylePrompt}

要求：
1. 字数严格控制在90-110字之间
2. 内容紧密贴合事件，不泛泛而谈
3. 第一人称口吻，像真实的个人日记
4. 语言自然流畅，避免过于华丽的辞藻
5. 根据事件内容选择合适的天气和心情

天气选项：☀️ 晴、⛅ 多云、🌧️ 雨、⛈️ 雷阵雨、🌨️ 雪、🌫️ 雾、🌤️ 阴
心情选项：😊 开心、😌 平静、🤔 思考、😢 伤感、💪 充实、😰 疲惫、🙏 感恩、❤️ 感动

请严格按照以下JSON格式返回：
{
  "weather": "天气emoji和名称",
  "mood": "心情emoji和名称",
  "content": "日记内容"
}`;
        
        const eventTitle = event.title || '未知事件';
        const eventDescription = event.description || '暂无描述';
        const optionText = option.text || '未选择';
        
        const userPrompt = `事件：${eventTitle}\n事件描述：${eventDescription}\n我的选择：${optionText}\n请生成日记、天气和心情。`;
        
        console.log('发送请求:', { systemPrompt, userPrompt, temperature: aiSettings.temperature });
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: aiSettings.temperature,
                max_tokens: 300
            })
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API响应数据:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                let responseText = data.choices[0].message.content.trim();
                // 移除**标记
                responseText = responseText.replace(/\*\*/g, '');
                console.log('生成的日记内容:', responseText);
                
                // 尝试解析JSON
                let diaryData;
                try {
                    diaryData = JSON.parse(responseText);
                } catch (e) {
                    console.log('JSON解析失败，使用默认格式:', e);
                    // 如果不是JSON格式，提取内容
                    diaryData = {
                        weather: '☀️ 晴',
                        mood: '😌 平静',
                        content: responseText
                    };
                }
                
                // 保存日记
                const diary = {
                    id: Date.now(),
                    date: new Date().toLocaleDateString('zh-CN'),
                    weather: diaryData.weather || '☀️ 晴',
                    mood: diaryData.mood || '😌 平静',
                    content: diaryData.content || responseText,
                    isAutoGenerated: true,
                    style: style
                };
                
                diaries.unshift(diary);
                updateDiaryList();
                showToast('📔 AI日记已生成');
            } else {
                throw new Error('API返回格式错误');
            }
        } else {
            const errorData = await response.json().catch(() => ({ error: '未知错误' }));
            console.error('API错误响应:', errorData);
            throw new Error(`API请求失败: ${response.status} ${errorData.error || ''}`);
        }
    } catch (error) {
        console.error('生成日记失败:', error);
        showToast(`❌ 日记生成失败: ${error.message}，请手动记录`);
    } finally {
        hideLoadingAnimation();
        currentDiaryEvent = null;
    }
}

// ==================== 同事聊天功能 ====================

// 当前聊天状态
let currentChatContext = null;

// 同事名字列表
const colleagueNames = ['王芳', '李明', '张华', '刘静', '陈强', '赵敏', '孙伟', '周丽'];

// 切换同事交流面板
function toggleChatPanel() {
    const panel = document.getElementById('chat-panel');
    const content = document.getElementById('chat-panel-content');
    const toggle = document.getElementById('chat-panel-toggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
        panel.classList.remove('collapsed');
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
        panel.classList.add('collapsed');
    }
}

// 已使用的聊天话题记录
let usedChatTopics = new Set();

// 开始同事聊天
async function startColleagueChat() {
    const chatMessages = document.getElementById('chat-messages');
    
    // 显示加载动画
    chatMessages.innerHTML = `
        <div class="chat-loading" style="text-align: center; padding: 30px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top: 3px solid #27ae60; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 15px; color: #666;">正在连接同事...</p>
        </div>
    `;
    
    // 随机选择一个同事
    const colleagueName = colleagueNames[Math.floor(Math.random() * colleagueNames.length)];
    currentChatContext = {
        colleagueName: colleagueName,
        messages: []
    };
    
    try {
        // 如果有API密钥，使用AI生成对话
        if (gameState.apiKey) {
            await generateAIChat(colleagueName);
        } else {
            // 使用本地预设对话
            setTimeout(() => {
                showLocalChat(colleagueName);
            }, 800);
        }
    } catch (error) {
        console.error('聊天生成失败:', error);
        setTimeout(() => {
            showLocalChat(colleagueName);
        }, 800);
    }
}

// 生成AI聊天内容
async function generateAIChat(colleagueName) {
    const chatMessages = document.getElementById('chat-messages');
    
    try {
        const aiSettings = getAISettings();
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gameState.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是「生命的延续」遗体捐献协调中心的资深协调员，正在与同事进行工作交流。

【交流场景】
你和同事在休息室里聊天，分享工作中的见闻、困惑、成就或感悟。话题应该多样化，涵盖协调员工作的各个方面。

【话题类型（每次选择一种）】
1. 家属沟通：初次接触的紧张、疑虑解答的技巧、情绪激动的安抚、家庭矛盾的调解
2. 工作流程：信息登记的规范、与医院的对接、与医学院的协调、文件处理的经验
3. 宣传教育：社区活动的策划、大学生宣讲、宣传材料的设计、社交媒体的运营
4. 心理调节：面对拒绝的挫败感、工作压力大时的调节、保持工作热情的方法
5. 职业成长：新协调员的培训、专业技能的提升、行业动态的交流、职业规划的探讨
6. 成功案例：家属态度转变的喜悦、医学生的感恩反馈、纪念活动的感动瞬间
7. 困难挑战：时间冲突的协调、资源不足的应对、突发情况的处理、多方利益的平衡
8. 创新想法：改进工作流程的建议、新宣传方式的尝试、家属服务的优化、团队建设的点子

【内容准则】
- 话题要具体、真实、有画面感，避免空泛
- 严禁涉及"器官买卖""提前结束生命"等敏感阴谋论
- 严禁引用任何法规、条例、政策文件
- 基调积极向上，体现专业性和人文关怀

【回复格式】
{
  "message": "同事分享的内容或提出的问题（80-120字），要有具体情境",
  "options": [
    {"text": "专业理性的建议，基于经验和专业知识", "style": "专业理性"},
    {"text": "温情关怀的回应，注重情感支持和理解", "style": "温情关怀"},
    {"text": "务实高效的方案，注重可操作性和效果", "style": "务实高效"}
  ]
}`
                    },
                    {
                        role: 'user',
                        content: `【当前情境】
同事姓名：${colleagueName}
游戏进度：已完成${gameState.completedThemes ? gameState.completedThemes.length : 0}个主题
当前满意度：${gameState.stats.satisfaction || 0}%

【要求】
请生成一个自然的工作交流场景：
1. 选择一个具体、新颖的话题（避免重复常见的"阴谋论"类话题）
2. 话题要有真实感和细节
3. 体现协调员工作的专业性
4. 三个选项要代表不同的处理风格

请直接输出JSON格式。`
                    }
                ],
                temperature: aiSettings.temperature,
                max_tokens: 500
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            let content = data.choices[0].message.content;
            // 移除**标记
            content = content.replace(/\*\*/g, '');
            
            // 尝试解析JSON
            let chatData;
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    chatData = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.log('JSON解析失败，使用默认对话');
            }
            
            if (chatData && chatData.message && chatData.options) {
                displayChatMessage(colleagueName, chatData.message, chatData.options);
            } else {
                showLocalChat(colleagueName);
            }
        } else {
            showLocalChat(colleagueName);
        }
    } catch (error) {
        console.error('AI聊天生成失败:', error);
        showLocalChat(colleagueName);
    }
}

// 所有本地聊天话题
const allLocalChats = [
    // 工作困惑类
    {
        message: `嗨，最近遇到一个情况：有位捐献者家属在签字前突然犹豫了，说担心遗体被用于"不当用途"。我该怎么安抚他们？`,
        options: [
            { text: '详细解释遗体使用的规范流程，提供相关文件让他们了解监督机制', style: '专业理性' },
            { text: '先倾听他们的担忧，分享其他家属的故事，建立情感连接', style: '温情关怀' },
            { text: '直接联系医学院安排参观，让家属实地了解教学环境', style: '务实高效' }
        ]
    },
    {
        message: `有个问题想请教你：我们中心最近接收量增加了，但人手不够。你觉得应该先扩充哪个环节的人员？`,
        options: [
            { text: '优先增加一线协调员，直接对接家属的服务质量最重要', style: '专业理性' },
            { text: '建议先加强后勤支持团队，减轻协调员的行政负担', style: '务实高效' },
            { text: '可以考虑招募志愿者，既解决人手问题又能扩大社会参与', style: '温情关怀' }
        ]
    },
    {
        message: `刚才接到一个咨询电话，对方问了很多关于遗体捐献后丧葬事宜的问题。你觉得该怎么回答比较妥当？`,
        options: [
            { text: '详细说明遗体接收后的流程和时间安排，让家属心中有数', style: '专业理性' },
            { text: '先询问他们最担心的是什么，针对性地解答具体顾虑', style: '温情关怀' },
            { text: '提供标准化的FAQ文档，同时留下联系方式供后续咨询', style: '务实高效' }
        ]
    },
    {
        message: `最近有医学院反映说接收通知不够及时，影响了教学安排。你有什么好的协调建议吗？`,
        options: [
            { text: '建立一个标准化的信息传递流程，明确各环节时间节点', style: '专业理性' },
            { text: '建议定期召开协调会议，让各方当面沟通需求和困难', style: '温情关怀' },
            { text: '开发一个简单的信息系统，实现实时状态更新和提醒', style: '务实高效' }
        ]
    },
    {
        message: `有个家属问："捐献后我们能知道遗体用于什么研究吗？"这个问题该怎么回应？`,
        options: [
            { text: '解释遗体主要用于医学教学，具体研究由医学院安排，但会确保尊重', style: '专业理性' },
            { text: '理解他们想了解的心情，说明我们会定期举办纪念活动表达感恩', style: '温情关怀' },
            { text: '建议他们关注医学院的公开课程，可以看到教学的实际应用场景', style: '务实高效' }
        ]
    },
    // 困难挑战类
    {
        message: `唉，今天遇到一个特别棘手的情况。一位捐献者的儿子强烈反对，说"我爸生前糊涂了才会签这个字"。我该怎么沟通？`,
        options: [
            { text: '先让他冷静下来，然后拿出他父亲当时的录音或笔记，证明是真实意愿', style: '专业理性' },
            { text: '理解他的悲痛，告诉他很多人最初不理解，后来却为父亲的选择感到骄傲', style: '温情关怀' },
            { text: '建议召开家庭会议，让所有亲属一起了解捐献的意义和流程', style: '务实高效' }
        ]
    },
    {
        message: `有位家属担心遗体捐献后"身体不完整"，怕影响来世。这种观念根深蒂固，该怎么沟通？`,
        options: [
            { text: '尊重他的信仰，同时解释医学教育如何拯救更多生命，这也是一种功德', style: '专业理性' },
            { text: '从情感角度说，捐献者的生命以另一种方式延续，这何尝不是一种圆满', style: '温情关怀' },
            { text: '分享一些宗教界人士也参与捐献的案例，打破他的顾虑', style: '务实高效' }
        ]
    },
    {
        message: `工作压力好大啊，连续处理了几个情绪激动的家属，感觉自己也有点扛不住了。你是怎么调节的？`,
        options: [
            { text: '建议定期做心理咨询，这是正常的职业倦怠，要重视', style: '专业理性' },
            { text: '找个安静的地方哭一场，然后想想那些因为我们的工作而受益的人', style: '温情关怀' },
            { text: '申请调休几天，去散散心，回来再继续战斗', style: '务实高效' }
        ]
    },
    {
        message: `有位家属坚持要在捐献前举行一个小时的告别仪式，但医学院说时间排满了。夹在中间好难办。`,
        options: [
            { text: '和医学院协调，解释这个仪式对家属的重要性，争取灵活安排', style: '专业理性' },
            { text: '陪家属一起和医学院沟通，让他们理解彼此的需求', style: '温情关怀' },
            { text: '建议家属提前举行仪式，或者安排在医学院下班后', style: '务实高效' }
        ]
    },
    {
        message: `遇到个情况：捐献者生前签了字，但临终前意识不清时，口头说不想捐了。家属现在很纠结。`,
        options: [
            { text: '以书面意愿为准，但也要尊重家属的最终决定', style: '专业理性' },
            { text: '和家属深入沟通，了解捐献者生前的真实想法，再做决定', style: '温情关怀' },
            { text: '建议给家属一些时间考虑，同时联系法律顾问咨询', style: '务实高效' }
        ]
    },
    // 成功感慨类
    {
        message: `今天特别开心！一位之前强烈反对的家属，在了解真相后主动成为志愿者，说要帮我们一起宣传！`,
        options: [
            { text: '太好了！这说明我们的工作真的有意义，坚持专业和耐心总会有回报', style: '专业理性' },
            { text: '太感动了！这就是爱的传递，从怀疑到理解再到支持，这就是我们的价值', style: '温情关怀' },
            { text: '赶紧记录下来，这是一个很好的案例，可以分享给其他犹豫的家属', style: '务实高效' }
        ]
    },
    {
        message: `刚刚收到医学院的感谢信，说因为有我们的协调，今年的解剖教学特别顺利，学生们都很感恩。`,
        options: [
            { text: '这是我们应该做的，看到工作成果被认可，很有成就感', style: '专业理性' },
            { text: '想到那些捐献者的付出能培养出更多好医生，就觉得一切都值得', style: '温情关怀' },
            { text: '把感谢信裱起来挂在办公室，激励大家继续努力', style: '务实高效' }
        ]
    },
    {
        message: `昨天参加了一个捐献者的纪念仪式，看到他帮助过的医学生都来致敬，场面特别感人。`,
        options: [
            { text: '这就是我们工作的意义所在，让捐献者的价值被看见、被铭记', style: '专业理性' },
            { text: '生命以另一种方式延续，这种感动就是我们坚持下去的动力', style: '温情关怀' },
            { text: '多拍点照片，以后可以用来做宣传材料', style: '务实高效' }
        ]
    },
    {
        message: `今天有个老爷爷专程来感谢我们，说他老伴捐献后，收到很多医学生的感谢信，他觉得老伴还在"活着"。`,
        options: [
            { text: '这种反馈太珍贵了，说明我们的工作给家属带来了真正的慰藉', style: '专业理性' },
            { text: '爱永远不会消失，只是换了一种方式存在，这就是我们要传递的信念', style: '温情关怀' },
            { text: '建议把这些感谢信整理成册，给更多家属看', style: '务实高效' }
        ]
    },
    {
        message: `我们中心今年的捐献登记人数创新高啦！大家这段时间的努力真的有了回报！`,
        options: [
            { text: '数据说明一切，专业的宣传和耐心的服务终于被更多人认可了', style: '专业理性' },
            { text: '每一个数字背后都是一个伟大的决定，为这些家庭点赞！', style: '温情关怀' },
            { text: '庆祝一下，然后总结经验，争取明年再创新高', style: '务实高效' }
        ]
    },
    // 日常交流类
    {
        message: `你觉得怎样才能让更多人了解遗体捐献的真正意义？我总觉得宣传效果不够好。`,
        options: [
            { text: '用数据和案例说话，让大家看到实际的医学教育成果', style: '专业理性' },
            { text: '多讲真实的故事，让人们感受到捐献者和家属的大爱', style: '温情关怀' },
            { text: '利用新媒体平台，做短视频、直播，扩大传播范围', style: '务实高效' }
        ]
    },
    {
        message: `最近想组织一次面向大学生的宣传活动，你有什么好的建议吗？`,
            options: [
            { text: '邀请医学院教授来讲课，用专业知识增强说服力', style: '专业理性' },
            { text: '安排学生参观纪念园，让他们亲身感受捐献者的伟大', style: '温情关怀' },
            { text: '和校园社团合作，用轻松的方式普及知识', style: '务实高效' }
        ]
    },
    {
        message: `有个想法，我们是不是可以建立一个家属互助小组？让大家有个倾诉的地方。`,
        options: [
            { text: '好主意，可以请心理专家来指导，确保专业性', style: '专业理性' },
            { text: '太好了，失去亲人的痛苦只有经历过的人才懂，互相支持很重要', style: '温情关怀' },
            { text: '可以先小范围试点，看看效果再推广', style: '务实高效' }
        ]
    },
    // 新增多样化话题
    {
        message: `刚入职的小李问我，面对情绪崩溃的家属时该怎么保持冷静。我觉得这问题挺普遍的。`,
        options: [
            { text: '告诉他这是正常的，要学会情绪隔离，不被家属的情绪过度影响', style: '专业理性' },
            { text: '分享自己第一次遇到这种情况时的感受，让他知道大家都经历过', style: '温情关怀' },
            { text: '建议他多观察资深同事的处理方式，慢慢积累经验', style: '务实高效' }
        ]
    },
    {
        message: `最近医学院反馈说希望能提前知道遗体的基本情况，方便安排教学。这该怎么平衡？`,
        options: [
            { text: '和医学院协商一个标准的信息模板，既满足教学需求又保护隐私', style: '专业理性' },
            { text: '理解医学院的需求，但也要考虑家属的感受，找到一个双方都能接受的方案', style: '温情关怀' },
            { text: '建立一个信息共享机制，在合适的时间节点传递必要信息', style: '务实高效' }
        ]
    },
    {
        message: `有个家属问能不能在捐献前见见将要使用遗体的医学生，这个要求该怎么处理？`,
        options: [
            { text: '解释医学教育的规范性，建议通过其他方式如感谢信来建立联系', style: '专业理性' },
            { text: '理解家属想为亲人做最后一点事的心情，但也要考虑实际操作的可行性', style: '温情关怀' },
            { text: '可以安排在纪念活动上让医学生表达感恩，而不是提前见面', style: '务实高效' }
        ]
    },
    {
        message: `我发现很多年轻人对遗体捐献挺感兴趣的，但不知道怎么和父母沟通。该怎么帮他们？`,
        options: [
            { text: '准备一些家庭沟通的指导材料，帮助他们理解代际差异', style: '专业理性' },
            { text: '鼓励他们耐心和父母交流，用爱和理解化解分歧', style: '温情关怀' },
            { text: '可以组织亲子活动，让家长和孩子一起了解遗体捐献的意义', style: '务实高效' }
        ]
    },
    {
        message: `今天处理文件时发现有个捐献者的信息登记不完整，但人已经去世了。这该怎么办？`,
            options: [
            { text: '联系家属补充信息，同时检查我们的登记流程是否有漏洞', style: '专业理性' },
            { text: '向家属说明情况，诚恳道歉并请求配合完善信息', style: '温情关怀' },
            { text: '建立一个信息审核机制，避免类似情况再次发生', style: '务实高效' }
        ]
    },
    {
        message: `有家属想在捐献者去世后立即举行告别仪式，但医学院希望尽快接收。时间冲突怎么协调？`,
        options: [
            { text: '和医学院沟通，解释告别仪式对家属的重要性，争取灵活安排', style: '专业理性' },
            { text: '陪家属一起和医学院沟通，让他们理解彼此的需求', style: '温情关怀' },
            { text: '建议家属提前举行仪式，或者安排在医学院下班后', style: '务实高效' }
        ]
    },
    {
        message: `最近想尝试用短视频做宣传，但担心内容太严肃没人看。你有什么建议吗？`,
        options: [
            { text: '可以采访医学生，让他们谈谈对无言良师的感恩，既有深度又有温度', style: '专业理性' },
            { text: '拍一些家属的真实故事，用情感打动观众', style: '温情关怀' },
            { text: '用轻松的方式科普知识，比如动画或者情景剧', style: '务实高效' }
        ]
    },
    {
        message: `有个同事说工作太累了，想转岗。你觉得我们该怎么留住人才？`,
        options: [
            { text: '建议领导改善工作条件，比如增加人手或者提供更好的培训', style: '专业理性' },
            { text: '多关心同事的心理状态，组织团建活动增强凝聚力', style: '温情关怀' },
            { text: '建立激励机制，让大家的付出得到认可和回报', style: '务实高效' }
        ]
    }
];

// 显示本地预设聊天
function showLocalChat(colleagueName) {
    // 获取未使用过的话题
    const availableChats = allLocalChats.filter((chat, index) => !usedChatTopics.has(index));
    
    // 如果所有话题都用过了，重置记录
    if (availableChats.length === 0) {
        usedChatTopics.clear();
        availableChats.push(...allLocalChats);
    }
    
    // 随机选择一个未使用的话题
    const randomIndex = Math.floor(Math.random() * availableChats.length);
    const chat = availableChats[randomIndex];
    const originalIndex = allLocalChats.indexOf(chat);
    
    // 记录已使用
    usedChatTopics.add(originalIndex);
    
    displayChatMessage(colleagueName, chat.message, chat.options);
}

// 显示聊天消息和选项
function displayChatMessage(colleagueName, message, options) {
    const chatMessages = document.getElementById('chat-messages');
    
    // 清空消息区域
    chatMessages.innerHTML = '';
    
    // 添加同事消息
    const colleagueMsg = document.createElement('div');
    colleagueMsg.className = 'chat-message colleague';
    colleagueMsg.innerHTML = `
        <div class="chat-message-header">
            <span>👤</span>
            <span>${colleagueName}</span>
            <span style="color: #999; font-size: 0.7rem;">刚刚</span>
        </div>
        <div class="chat-message-content">${message}</div>
    `;
    chatMessages.appendChild(colleagueMsg);
    
    // 添加选项按钮
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'chat-options';
    
    options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'chat-option-btn';
        btn.innerHTML = `<strong>${option.style}</strong>：${option.text}`;
        btn.onclick = () => selectChatOption(colleagueName, option);
        optionsContainer.appendChild(btn);
    });
    
    chatMessages.appendChild(optionsContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 更新按钮文字
    const startBtn = document.querySelector('.btn-chat-start');
    if (startBtn) {
        startBtn.textContent = '🔄 新的交流';
    }
}

// 选择聊天选项
function selectChatOption(colleagueName, option) {
    const chatMessages = document.getElementById('chat-messages');
    
    // 添加用户回复
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `
        <div class="chat-message-header">
            <span>你</span>
            <span>👤</span>
        </div>
        <div class="chat-message-content">${option.text}</div>
    `;
    chatMessages.appendChild(userMsg);
    
    // 移除选项按钮
    const optionsContainer = chatMessages.querySelector('.chat-options');
    if (optionsContainer) {
        optionsContainer.remove();
    }
    
    // 添加同事反馈
    setTimeout(() => {
        const feedbackMsg = document.createElement('div');
        feedbackMsg.className = 'chat-message colleague';
        
        const feedbacks = [
            '谢谢你的建议，我觉得很有道理！',
            '这个思路不错，我回去试试。',
            '你说得对，我应该从这个角度考虑。',
            '很受启发，感谢分享经验！',
            '这个方法我之前没试过，值得学习！'
        ];
        const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        
        feedbackMsg.innerHTML = `
            <div class="chat-message-header">
                <span>👤</span>
                <span>${colleagueName}</span>
                <span style="color: #999; font-size: 0.7rem;">刚刚</span>
            </div>
            <div class="chat-message-content">${feedback}</div>
        `;
        chatMessages.appendChild(feedbackMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 给予小幅奖励
        gameState.character.reputation += 1;
        showToast('💬 交流完成，声望+1');
        updateUI();
        saveGame();
    }, 800);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initUserStatus();
    bindAuthFormEvents();
    updateUI();
});
