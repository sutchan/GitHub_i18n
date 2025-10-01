// ==UserScript==
// @name         GitHub 网站国际化之中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.8.5
// @description  使用预定义词典实现 GitHub 全站高频 UI 中文翻译，零延迟、不破坏布局
// @author       Sut
// @match        https://github.com/*
// @grant        none
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @updateURL    https://raw.githubusercontent.com/sutchan/GitHub_i18n/refs/heads/main/GitHub_zh-CN.user.js
// @downloadURL  https://raw.githubusercontent.com/sutchan/GitHub_i18n/refs/heads/main/GitHub_zh-CN.user.js
// ==/UserScript==

/**
 * GitHub 中文翻译用户脚本
 * 主要功能：将 GitHub 网站的高频 UI 元素翻译成中文，保持页面布局不变
 */
(function () {
    'use strict';

    // 从用户脚本头部注释中提取版本号
    function getVersionFromComment() {
        // 获取当前脚本内容
        const scriptContent = document.querySelector('script[src*="GitHub_zh-CN.user.js"]')?.textContent || '';
        
        if (scriptContent) {
            // 匹配@version注释行
            const versionMatch = scriptContent.match(/\/\/\s*@version\s+([\d.]+)/);
            if (versionMatch && versionMatch[1]) {
                return versionMatch[1];
            }
        }
        
        // 如果无法从注释中读取，返回默认版本号
        return '1.8.4';
    }

    // ========== 工具函数模块 ==========
    /**
     * 工具函数集合
     */
    const utils = {
        /**
         * 节流函数，用于限制高频操作的执行频率
         * @param {Function} func - 要节流的函数
         * @param {number} limit - 限制时间（毫秒）
         * @returns {Function} 节流后的函数
         */
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * 转义正则表达式特殊字符
         * @param {string} string - 要转义的字符串
         * @returns {string} 转义后的字符串
         */
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        
        /**
         * 获取当前页面路径
         * @returns {string} 当前页面路径
         */
        getCurrentPath() {
            return window.location.pathname;
        },
        
        /**
         * 判断当前页面是否匹配某个路径模式
         * @param {RegExp} pattern - 路径模式
         * @returns {boolean} 是否匹配
         */
        isCurrentPathMatch(pattern) {
            return pattern.test(this.getCurrentPath());
        },
        
        /**
         * 收集页面中的文本节点，用于抓取新的翻译字符串
         * @param {HTMLElement} element - 要收集文本的根元素
         * @param {Set<string>} collectedTexts - 收集到的文本集合
         * @param {number} minLength - 最小文本长度
         * @param {number} maxLength - 最大文本长度
         */
        collectTextNodes(element, collectedTexts, minLength = 2, maxLength = 100) {
            if (!element || !element.childNodes) return;
            
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue.trim();
                    if (text && text.length >= minLength && text.length <= maxLength && !/^[\s\d]+$/.test(text)) {
                        collectedTexts.add(text);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    // 跳过不需要收集的元素类型
                    if (!['script', 'style', 'code', 'pre', 'textarea', 'input', 'select'].includes(tagName)) {
                        this.collectTextNodes(node, collectedTexts, minLength, maxLength);
                    }
                }
            });
        }
    };

    // ========== 配置项 ==========
    const CONFIG = {
        // 当前脚本版本号（从用户脚本头部注释中自动读取）
        version: getVersionFromComment(),
        // 翻译延迟时间（毫秒）
        debounceDelay: 200,
        // 路由变化后翻译延迟时间（毫秒）
        routeChangeDelay: 400,
        // 是否启用调试日志
        debugMode: false,
        // 更新检测配置
        updateCheck: {
            // 是否启用自动更新检测
            enabled: true,
            // 更新检测间隔（小时）
            intervalHours: 24,
            // GitHub 原始脚本 URL
            scriptUrl: 'https://github.com/sutchan/GitHub_i18n/raw/main/GitHub_zh-CN.userjs',
            // 是否启用自动版本号更新
            autoUpdateVersion: true
        },
        // 性能优化配置
        performance: {
            // 是否启用深度DOM监听
            enableDeepObserver: false,
            // 是否启用部分匹配翻译
            enablePartialMatch: false,
            // 单次加载的最大字典大小
            maxDictSize: 2000,
            // 是否使用翻译缓存
            enableTranslationCache: true,
            // 是否启用翻译词典优化
            enableDictOptimization: true,
            // 是否启用正则表达式优化
            enableRegexOptimization: true,
            // 翻译缓存最大大小
            maxCacheSize: 1000,
            // 正则表达式缓存大小限制
            regexCacheSize: 500,
            // 节流间隔
            throttleInterval: 200
        },
        // 选择器常量
        selectors: {
            // 关键区域选择器
            keyAreas: ['#header', '.application-main', '.js-repo-nav', '#repository-details-container'],
            // 翻译目标选择器
            translationTargets: [
                '#header',                          // 顶部导航栏
                '.Header-item--full',               // 中央菜单
                '.HeaderMenu',                      // 个人下拉菜单容器
                '.UnderlineNav',                    // 仓库页标签导航
                '.dropdown-menu',                   // 传统下拉菜单
                '.SelectMenu',                      // GitHub现代下拉菜单
                '.Popover-menu',                    // 弹出菜单
                '.menu',                            // 通用菜单类
                '.ActionList',                      // 操作列表菜单
                '.BorderGrid',                      // 设置页面网格
                '.Box',                             // 设置项容器
                '.menu-item',                       // 菜单项
                '.js-selected-navigation-item',     // 选中项
                '.Layout',                          // 通用布局容器
                '.application-main',                // 主内容区（保守使用）
                '.js-menu-container',               // JavaScript生成的菜单容器
                '.js-repo-nav',                     // 仓库导航栏
                '.repository-details-container'     // 仓库详情容器
            ],
            // 弹出菜单选择器
            popupMenus: [
                '[aria-label="Menu"]',            // 带标签的菜单
                '[role="menu"]',                 // 具有menu角色的元素
                '.ReactModal__Content',            // React模态框
                '.Overlay-backdrop',               // 覆盖层
                '[data-component-type="dropdown"]' // 数据组件类型标记的下拉菜单
            ]
        },
        // 页面路径模式
        pagePatterns: {
            search: /\/search/,
            repository: /\/[^/]+\/[^/]+/,
            issues: /\/[^/]+\/[^/]+\/issues/,
            pullRequests: /\/[^/]+\/[^/]+\/pull/,
            settings: /\/settings/,
            dashboard: /^\/$|\/(explore|notifications|stars|gists|codespaces|projects|organizations|dashboard)$/
        }
    };

    // ========== 翻译词典模块 ==========
    /**
     * 翻译词典模块
     * 功能：按页面类型组织翻译词典，支持按需加载
     */
    const translationModule = {
        // 核心功能翻译
        core: {
            // 基础菜单项目
            'Create new': '新建',
            'All repositories': '所有仓库',
            'Public repositories': '公开仓库',
            'Private repositories': '私有仓库',
            'Organization repositories': '组织仓库',
            'Your profile': '你的个人资料',
            'Your organizations': '你的组织',
            'Your stars': '你的标星',
            'Your gists': '你的代码片段',
            'Your followers': '你的粉丝',
            'Following': '关注中',
            'Popular repositories': '热门仓库',
            'Trending repositories': '趋势仓库',
            'All gists': '所有代码片段',
            'Public gists': '公开代码片段',
            'Secret gists': '私密代码片段',
            'Starred gists': '已标星的代码片段',
            'New repository': '新建仓库',
            'New organization': '新建组织',
            'New project': '新建项目',
            'New gist': '新建代码片段',
            'New discussion': '新建讨论',
            'New file': '新建文件',
            'New issue': '新建问题',
            'New pull request': '新建拉取请求',
            'New workflow': '新建工作流程',
            'New column': '新建列',
            // 下拉菜单项目
            'Recent projects': '最近项目',
            'Create project': '创建项目',
            'Your teams': '你的团队',
            'Create team': '创建团队',
            'Your codespaces': '你的代码空间',
            'Create codespace': '创建代码空间',
            'View all': '查看全部',
            'Recently viewed': '最近查看',
            'Change visibility': '更改可见性',
            'Make template': '设为模板',
            'View organization': '查看组织',
            // 仓库菜单项目
            'Manage repository': '管理仓库',
            'Repository activity': '仓库活动',
            'Repository settings': '仓库设置',
            'Collaborators and teams': '协作者和团队',
            'Manage access': '管理访问权限',
            'Create branch': '创建分支',
            'Create tag': '创建标签',
            'Create release': '创建发布',
            'Security alerts': '安全警报',
            'Watch repository': '关注仓库',
            'Unwatch repository': '取消关注仓库',
            // 用户菜单项目
            'Account settings': '账户设置',
            'Security': '安全',
            'Billing': '账单',
            'Applications': '应用程序',
            'Developer settings': '开发者设置',
            'Help': '帮助',
            'About GitHub': '关于 GitHub',
            'Switch user': '切换用户',
            'Sign out': '退出登录',
            // 导航菜单项
            'Dashboard': '仪表板',
            'Profile': '个人资料',
            'Projects': '项目',
            'Settings': '设置',
            'Learn Git and GitHub without any code': '无需编写代码即可学习 Git 和 GitHub',
            'Create a new repository': '创建新仓库',
            'Import a repository': '导入仓库',
            'New gist': '新建代码片段',
            'New organization': '新建组织',
            'New project': '新建项目',
            'Your repositories': '你的仓库',
            'Your stars': '你的标星',
            'Explore': '探索',
            'Help': '帮助',
            'Search GitHub': '搜索 GitHub',
            'Notifications': '通知',
            'View all notifications': '查看所有通知',
            'Create repository': '创建仓库'
            // 基础UI元素
            'Dashboard': '仪表板',
            'Profile': '个人资料',
            'Projects': '项目',
            'Settings': '设置',
            'Sign out': '退出登录',
            'Learn Git and GitHub without any code': '无需编写代码即可学习 Git 和 GitHub',
            'Create a new repository': '创建新仓库',
            'Import a repository': '导入仓库',
            'New gist': '新建代码片段',
            'New organization': '新建组织',
            'New project': '新建项目',
            'Your repositories': '你的仓库',
            'Your stars': '你的标星',
            'Explore': '探索',
            'Help': '帮助',
            'Search GitHub': '搜索 GitHub',
            'Notifications': '通知',
            'View all notifications': '查看所有通知',
            'Create repository': '创建仓库',
            'Issues': '问题',
            'Pull requests': '拉取请求',
            'Actions': '操作',
            'Wiki': '维基',
            'Security': '安全',
            'Insights': '洞察',
            'Code': '代码',
            'About': '关于',
            'Activity': '活动',
            'Repositories': '仓库',
            'Teams': '团队',
            'Packages': '包',
            'Stars': '标星',
            'Forks': '复刻',
            'Watchers': '关注者',
            'Discussions': '讨论',
            'Sponsor': '赞助',
            'Share': '分享',
            'Refresh': '刷新',
            'Clone': '克隆',
            'Download ZIP': '下载ZIP',
            'Open with': '打开方式',
            'New file': '新建文件',
            'Upload files': '上传文件',
            'Find or create a file': '查找或创建文件',
            'Find a file': '查找文件',
            'Go to file': '转到文件',
            'Add file': '添加文件',
            'Commit changes': '提交更改',
            'History': '历史',
            'Blame': '追责',
            'Raw': '原始',
            'Delete': '删除',
            'Edit': '编辑',
            'Copy': '复制',
            'Save': '保存',
            'Close': '关闭',
            'Apply': '应用',
            'Cancel': '取消',
            'Confirm': '确认',
            'Back': '返回',
            'Next': '下一步',
            'Skip': '跳过',
            'Done': '完成',
            'Filter': '筛选',
            'Sort': '排序',
            'New': '新建',
            'All': '全部',
            'Unread': '未读',
            'Read': '已读',
            'Recent': '最近',
            'Popular': '热门',
            'Trending': '趋势',
            'Following': '关注中',
            'Followers': '粉丝',
            'Public': '公开',
            'Private': '私有',
            'Internal': '内部',
            'Public repositories': '公开仓库',
            'Private repositories': '私有仓库',
            'Your organizations': '你的组织',
            'Your teams': '你的团队',
            'Your projects': '你的项目',
            'Your codespaces': '你的代码空间',
            'Your gists': '你的代码片段',
            'Your sponsors': '你的赞助商',
            'Sponsoring': '赞助中',
            'Discover': '发现',
            'Install': '安装',
            'Marketplace': '应用市场',
            'Enterprise': '企业版',
            'Pricing': '价格',
            'Documentation': '文档',
            'Community': '社区',
            'Contact us': '联系我们',
            'Terms': '条款',
            'Privacy': '隐私',
            'Security': '安全',
            'Status': '状态',
            'Blog': '博客',
            'Twitter': 'Twitter',
            'LinkedIn': 'LinkedIn',
            'YouTube': 'YouTube',
            'Facebook': 'Facebook',
            'Instagram': 'Instagram',
            // 新增GitHub功能产品
            'GitHub Copilot': 'GitHub Copilot',
            'GitHub Spark': 'GitHub Spark',
            'GitHub Models': 'GitHub Models',
            'GitHub Advanced Security': 'GitHub 高级安全',
            'Code Review': '代码审阅',
            'Code Search': '代码搜索',
            'Build and deploy intelligent apps': '构建和部署智能应用',
            'Manage and compare prompts': '管理和比较提示词',
            'Find and fix vulnerabilities': '发现并修复漏洞',
            'Automate any workflow': '自动化任何工作流程',
            'Instant dev environments': '即时开发环境',
            'Plan and track work': '规划和跟踪工作',
            'Manage code changes': '管理代码变更',
            'Collaborate outside of code': '在代码外协作',
            'Find more, search less': '查找更多，搜索更少',
            // Issues和Pull Requests页面相关
            'Welcome to pull requests!': '欢迎使用拉取请求！',
            'Pull requests help you collaborate on code with other people.': '拉取请求帮助您与他人协作开发代码。',
            'As pull requests are created, they\'ll appear here in a searchable and filterable list.': '当创建拉取请求时，它们会显示在此处的可搜索和可筛选列表中。',
            'To get started, you should create a pull request.': '要开始使用，请创建一个拉取请求。',
            'ProTip! Follow long discussions with comments:>50.': '提示！使用 comments:>50 跟踪较长的讨论。',
            // Pulse页面相关
            'Active pull requests': '活跃的拉取请求',
            'Active issues': '活跃的问题',
            'Merged pull requests': '已合并的拉取请求',
            'Open pull requests': '打开的拉取请求',
            'Closed issues': '已关闭的问题',
            'New issues': '新问题',
            'Top Committers': '顶级贡献者',
            'releases published': '已发布的版本',
            // 其他新增字符串
            'Overview': '概览',
            'Learning Pathways': '学习路径',
            'Events & Webinars': '活动与网络研讨会',
            'Ebooks & Whitepapers': '电子书与白皮书',
            'Customer Stories': '客户案例',
            'Partners': '合作伙伴',
            'Executive Insights': '高管洞察',
            'GitHub Sponsors': 'GitHub 赞助商',
            'The ReadME Project': 'README 项目',
            'Enterprise platform': '企业平台',
            'AI-powered developer platform': 'AI 驱动的开发者平台',
            'Saved searches': '已保存的搜索',
            'Use saved searches to filter your results more quickly': '使用已保存的搜索更快地筛选结果',
            // Actions页面相关
            'Actions secrets and variables': '操作密钥和变量',
            'Workflow runs': '工作流程运行',
            'Workflow files': '工作流程文件',
            'New workflow': '新建工作流程',
            'Disable Actions': '禁用操作',
            'Enable local actions only': '仅启用本地操作',
            'Enable all actions': '启用所有操作',
            // Security页面相关
            'Security overview': '安全概览',
            'Vulnerability alerts': '漏洞警报',
            'Code scanning': '代码扫描',
            'Secret scanning': '密钥扫描',
            'Dependabot': 'Dependabot',
            'Security policy': '安全策略',
            'Security advisories': '安全建议',
            // Projects页面相关
            'Project boards': '项目看板',
            'Project settings': '项目设置',
            'Project collaborators': '项目协作者',
            'New column': '新建列',
            'Add cards': '添加卡片',
            'New project board': '新建项目看板',
            // Settings页面相关
            'Repository settings': '仓库设置',
            'Organization settings': '组织设置',
            'User settings': '用户设置',
            'Billing settings': '账单设置',
            'Notifications settings': '通知设置',
            'Access management': '访问管理',
            'Integrations': '集成',
            'Webhooks': 'Web钩子',
            'Deploy keys': '部署密钥'
        },
        
        // 仪表板页面翻译
        dashboard: {
            'Overview': '概览',
            'Repositories': '仓库',
            'Activity': '活动',
            'Contributions': '贡献',
            'Popular repositories': '热门仓库',
            'Recent activity': '最近活动',
            'Starred repositories': '已标星仓库',
            'Your profile': '你的个人资料',
            'Your organizations': '你的组织',
            'Welcome to your dashboard': '欢迎来到你的仪表板',
            'Quick actions': '快速操作',
            'Jump back in': '继续工作',
            'All activity': '所有活动',
            'Following': '关注中',
            'For you': '为你推荐',
            'Discover repositories': '发现仓库',
            'Your top repositories': '你的热门仓库',
            'Popular among your followers': '你的关注者中热门',
            'Recent repositories': '最近仓库',
            'Create repository': '创建仓库',
            'Import repository': '导入仓库',
            'New organization': '新建组织',
            'New project': '新建项目',
            'New gist': '新建代码片段',
            'New workflow': '新建工作流程',
            'Recently updated': '最近更新',
            'Most active': '最活跃',
            'Top languages': '热门语言',
            'Show more': '显示更多',
            'Hide': '隐藏',
            'View all': '查看全部',
            'Last 30 days': '过去30天',
            'Last 90 days': '过去90天',
            'Last 12 months': '过去12个月',
            'Custom range': '自定义范围',
            'Monday': '星期一',
            'Tuesday': '星期二',
            'Wednesday': '星期三',
            'Thursday': '星期四',
            'Friday': '星期五',
            'Saturday': '星期六',
            'Sunday': '星期日'
        },
        
        // 通知页面翻译
        notifications: {
            'All notifications': '所有通知',
            'Unread': '未读',
            'Participating': '参与',
            'Mentioned': '被提及',
            'Pull requests': '拉取请求',
            'Issues': '问题',
            'Commits': '提交',
            'Mark all as read': '全部标记为已读',
            'Save': '保存',
            'Mute': '静音',
            'Repository': '仓库',
            'Reason': '原因',
            'Updated': '更新时间',
            'Show filters': '显示筛选器',
            'Hide filters': '隐藏筛选器',
            'Apply filters': '应用筛选器',
            'Clear filters': '清除筛选器',
            'Select repositories': '选择仓库',
            'Select reasons': '选择原因',
            'Select time period': '选择时间段',
            'Any time': '任何时间',
            'Today': '今天',
            'Yesterday': '昨天',
            'This week': '本周',
            'This month': '本月',
            'This year': '今年',
            'Subscribe': '订阅',
            'Unsubscribe': '取消订阅',
            'Read all': '全部已读',
            'Notification settings': '通知设置',
            'You have unread notifications': '你有未读通知',
            'No unread notifications': '没有未读通知',
            'No notifications': '没有通知'
        },
        
        // 代码空间页面翻译
        codespaces: {
            'Codespaces': '代码空间',
            'Start coding in seconds with Codespaces': '使用代码空间立即开始编码',
            'How does Codespaces work?': '代码空间如何工作？',
            'How do I use Codespaces?': '如何使用代码空间？',
            'Is Codespaces available for individual developers?': '个人开发者可以使用代码空间吗？',
            'Is Codespaces available for teams and companies?': '团队和公司可以使用代码空间吗？',
            'How much does Codespaces cost?': '代码空间的费用是多少？',
            'Can I self-host Codespaces?': '我可以自行托管代码空间吗？',
            'How do I access Codespaces with LinkedIn Learning?': '如何通过LinkedIn Learning访问代码空间？',
            'How do I enable Codespaces on GitHub?': '如何在GitHub上启用代码空间？',
            'Is Codespaces available for students?': '学生可以使用代码空间吗？',
            'Is Codespaces available for open source maintainers?': '开源维护者可以使用代码空间吗？',
            'There are a number of entry points to spin up a Codespaces environment, including:': '有多种方式可以启动代码空间环境，包括：',
            'Codespaces cannot be self-hosted.': '代码空间无法自行托管。',
            'enable Codespaces in an organization in our docs': '在我们的文档中了解如何在组织中启用代码空间',
            'Create codespace': '创建代码空间',
            'Your codespaces': '你的代码空间',
            'Recent codespaces': '最近的代码空间',
            'Active codespaces': '活跃的代码空间',
            'Stopped codespaces': '已停止的代码空间',
            'New codespace': '新建代码空间',
            'Settings': '设置',
            'Billing': '账单',
            'Machine type': '机器类型',
            'Region': '地区',
            'Timeout': '超时时间',
            'Edit': '编辑',
            'Delete': '删除',
            'Stop': '停止',
            'Restart': '重启',
            'Rename': '重命名',
            'Share': '分享',
            'Open in browser': '在浏览器中打开',
            'Open in VS Code': '在VS Code中打开',
            'Open in JetBrains': '在JetBrains中打开',
            'Auto-delete': '自动删除',
            'Preview': '预览',
            'Loading': '加载中',
            'Ready': '准备就绪',
            'Stopping': '停止中',
            'Starting': '启动中',
            'Failed': '失败'
        },
        
        // 搜索页面翻译
        search: {
            'Search GitHub': '搜索 GitHub',
            'Advanced search': '高级搜索',
            'No results found': '未找到结果',
            'Clear': '清除',
            'Filters': '筛选器',
            'Sort': '排序',
            'Type': '类型',
            'Language': '语言',
            'More options': '更多选项',
            'Code': '代码',
            'Commits': '提交',
            'Issues': '问题',
            'Pull requests': '拉取请求',
            'Users': '用户',
            'Repositories': '仓库',
            'Topics': '主题',
            'Wikis': '维基',
            'Projects': '项目',
            'Marketplace': '应用市场',
            'Discussions': '讨论',
            'Packages': '包',
            'Settings': '设置',
            'Saved searches': '已保存的搜索',
            'Save this search': '保存此搜索',
            'Name': '名称',
            'Description': '描述',
            'README': 'README',
            'License': '许可证',
            'Topics': '主题',
            'Size': '大小',
            'Forks': '复刻',
            'Stars': '标星',
            'Watchers': '关注者',
            'Updated': '更新时间',
            'Created': '创建时间',
            'Commits': '提交',
            'Contributors': '贡献者',
            'Language': '语言',
            'Written in': '使用',
            'Pushed': '推送时间',
            'Last commit': '最后提交',
            'In': '在',
            'By': '由',
            'With': '具有',
            'Without': '不具有',
            'From': '从',
            'To': '到',
            'Before': '之前',
            'After': '之后',
            'Between': '之间',
            'On': '在',
            'During': '期间',
            'Week': '周',
            'Month': '月',
            'Year': '年',
            'Quarter': '季度',
            'All time': '所有时间',
            'Just now': '刚刚',
            'Today': '今天',
            'Yesterday': '昨天',
            'This week': '本周',
            'Last week': '上周',
            'This month': '本月',
            'Last month': '上月',
            'This year': '今年',
            'Last year': '去年',
            'Any': '任意',
            'None': '无',
            'Greater than': '大于',
            'Less than': '小于',
            'Equal to': '等于',
            'Approximately': '大约',
            'Exact match': '精确匹配',
            'Case sensitive': '区分大小写',
            'Match all words': '匹配所有词语',
            'Match any words': '匹配任意词语',
            'Exclude words': '排除词语',
            'Match exact phrase': '匹配精确短语',
            'Include forks': '包括复刻',
            'Exclude forks': '排除复刻',
            'Archived': '已归档',
            'Not archived': '未归档',
            'Mirrored': '已镜像',
            'Not mirrored': '未镜像',
            'Template': '模板',
            'Not template': '非模板',
            'Good first issue': '良好的第一个问题',
            'Help wanted': '需要帮助',
            'Beginner friendly': '适合初学者',
            'Up for grabs': '等待认领',
            'Sponsored': '已赞助',
            'Draft': '草稿',
            'Open': '打开',
            'Closed': '关闭',
            'Merged': '已合并',
            'Reopened': '已重新打开',
            'Assigned to': '分配给',
            'Created by': '由谁创建',
            'Mentioned': '被提及',
            'Commented by': '评论者',
            'Reviewed by': '审阅者',
            'Approved by': '批准者',
            'Authored by': '作者',
            'Committed by': '提交者',
            'Parent': '父',
            'Head': '头',
            'Base': '基',
            'Branch': '分支',
            'Tag': '标签',
            'File': '文件',
            'Path': '路径',
            'Extension': '扩展名',
            'Line': '行',
            'Lines': '行',
            'Page': '页',
            'Pages': '页',
            'Result': '结果',
            'Results': '结果',
            'Showing': '显示',
            'of': '共',
            'per page': '每页',
            'Previous': '上一页',
            'Next': '下一页',
            'First': '第一页',
            'Last': '最后一页'
        },
        
        // 仓库页面翻译
        repository: {
            'Code': '代码',
            'Issues': '问题',
            'Pull requests': '拉取请求',
            'Actions': '操作',
            'Projects': '项目',
            'Wiki': '维基',
            'Security': '安全',
            'Insights': '洞察',
            'Settings': '设置',
            'Discussions': '讨论',
            'Packages': '包',
            'Sponsor': '赞助',
            'Share': '分享',
            'Star': '标星',
            'Fork': '复刻',
            'Watch': '关注',
            'Unwatch': '取消关注',
            'Starred': '已标星',
            'Watching': '关注中',
            'Unstar': '取消标星',
            'Clone': '克隆',
            'Download ZIP': '下载ZIP',
            'Open with': '打开方式',
            'About': '关于',
            'Readme': 'README',
            'License': '许可证',
            'Contributors': '贡献者',
            'Languages': '语言',
            'Commits': '提交',
            'Branches': '分支',
            'Tags': '标签',
            'Releases': '发布',
            'Packages': '包',
            'Environments': '环境',
            'Deployments': '部署',
            'Insights': '洞察',
            'Activity': '活动',
            'Network': '网络',
            'Graphs': '图表',
            'Community': '社区',
            'Health': '健康',
            'Security': '安全',
            'Vulnerabilities': '漏洞',
            'Dependabot alerts': 'Dependabot 警报',
            'Code scanning alerts': '代码扫描警报',
            'Secret scanning alerts': '密钥扫描警报',
            'Licenses': '许可证',
            'Settings': '设置',
            'General': '通用',
            'Access': '访问',
            'Branches': '分支',
            'Tags': '标签',
            'Releases': '发布',
            'Collaborators': '协作者',
            'Teams': '团队',
            'Projects': '项目',
            'Webhooks': 'Web钩子',
            'Deploy keys': '部署密钥',
            'Secrets': '密钥',
            'Variables': '变量',
            'Actions': '操作',
            'Pages': '页面',
            'Wiki': '维基',
            'Security & analysis': '安全与分析',
            'Moderation': '审核',
            'Merge': '合并',
            'Squash and merge': '压缩并合并',
            'Rebase and merge': '变基并合并',
            'Close': '关闭',
            'Reopen': '重新打开',
            'Draft': '草稿',
            'Ready for review': '准备审阅',
            'Review changes': '审阅更改',
            'View changes': '查看更改',
            'Compare': '比较',
            'Files changed': '已更改文件',
            'Commits': '提交',
            'Checks': '检查',
            'Conversation': '对话',
            'Summary': '摘要',
            'Details': '详情',
            'Timeline': '时间线',
            'Assignees': '经办人',
            'Labels': '标签',
            'Milestone': '里程碑',
            'Projects': '项目',
            'Linked pull requests': '关联的拉取请求',
            'Comment': '评论',
            'Comment as': '以...身份评论',
            'Add reaction': '添加反应',
            'Edit comment': '编辑评论',
            'Delete comment': '删除评论',
            'Copy link': '复制链接',
            'Quote reply': '引用回复',
            'Hide': '隐藏',
            'Show': '显示',
            'Resolve': '解决',
            'Unresolve': '取消解决',
            'Start a review': '开始审阅',
            'Finish your review': '完成审阅',
            'Review': '审阅',
            'Approve': '批准',
            'Request changes': '请求更改',
            'Comment': '评论',
            'Submit review': '提交审阅',
            'Outdated': '过时',
            'New': '新建',
            'Old': '旧',
            'Expand': '展开',
            'Collapse': '折叠',
            'Show whitespace': '显示空白',
            'Hide whitespace': '隐藏空白',
            'Ignore whitespace': '忽略空白',
            'Side by side': '并排',
            'Unified': '统一',
            'Previous file': '上一个文件',
            'Next file': '下一个文件',
            'Jump to': '跳转到',
            'File': '文件',
            'Line': '行',
            'Search': '搜索',
            'Find': '查找',
            'Replace': '替换',
            'Find next': '查找下一个',
            'Find previous': '查找上一个',
            'Replace all': '全部替换',
            'Case sensitive': '区分大小写',
            'Whole word': '全字匹配',
            'Regular expression': '正则表达式',
            'Selection': '选择',
            'Document': '文档',
            'All': '全部',
            'Match case': '匹配大小写',
            'Wrap around': '循环搜索',
            'Incremental search': '增量搜索',
            'New file': '新建文件',
            'Upload files': '上传文件',
            'Find or create a file': '查找或创建文件',
            'Find a file': '查找文件',
            'Go to file': '转到文件',
            'Add file': '添加文件',
            'Commit changes': '提交更改',
            'History': '历史',
            'Blame': '追责',
            'Raw': '原始',
            'Delete': '删除',
            'Edit': '编辑',
            'Copy': '复制',
            'Save': '保存',
            'Close': '关闭',
            'Apply': '应用',
            'Cancel': '取消',
            'Confirm': '确认',
            'Back': '返回',
            'Next': '下一步',
            'Skip': '跳过',
            'Done': '完成',
            'Filter': '筛选',
            'Sort': '排序',
            'New': '新建',
            'All': '全部',
            'Unread': '未读',
            'Read': '已读',
            'Recent': '最近',
            'Popular': '热门',
            'Trending': '趋势'
        },
        
        // 按需创建最终翻译词典（使用Map替代对象字面量以提高性能）
        createTranslationMap() {
            // 根据当前页面选择需要加载的词典模块
            const currentPath = utils.getCurrentPath();
            const selectedModules = ['core'];
            
            if (CONFIG.pagePatterns.search.test(currentPath)) {
                selectedModules.push('search');
            } else if (CONFIG.pagePatterns.dashboard.test(currentPath)) {
                selectedModules.push('dashboard');
                selectedModules.push('notifications');
            } else if (currentPath.includes('/notifications')) {
                selectedModules.push('notifications');
            } else if (currentPath.includes('/codespaces')) {
                selectedModules.push('codespaces');
            } else if (CONFIG.pagePatterns.repository.test(currentPath)) {
                selectedModules.push('repository');
            }
            
            // 创建合并后的翻译Map
            const translationMap = new Map();
            selectedModules.forEach(moduleName => {
                const moduleDict = this[moduleName];
                if (moduleDict) {
                    for (const [key, value] of Object.entries(moduleDict)) {
                        translationMap.set(key, value);
                    }
                }
            });
            
            return translationMap;
        },
        
        // 获取合并后的翻译词典
        getTranslationDict() {
            // 缓存翻译词典，避免重复创建
            if (!this.cachedDict) {
                this.cachedDict = this.createTranslationMap();
            }
            return this.cachedDict;
        },
        
        // 重置缓存（用于路由变化时重新加载词典）
        resetCache() {
            this.cachedDict = null;
        }
    };

    // ========== 字符串抓取模块 ==========
    /**
     * 字符串抓取工具
     * 功能：从GitHub网站不同页面收集需要翻译的字符串
     */
    const stringExtractor = {
        /**
         * 收集当前页面的可翻译字符串
         * @param {boolean} showInConsole - 是否在控制台显示收集结果
         * @returns {Set<string>} 收集到的字符串集合
         */
        collectStrings(showInConsole = false) {
            const collectedTexts = new Set();
            
            // 从关键区域收集文本
            CONFIG.selectors.keyAreas.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    utils.collectTextNodes(element, collectedTexts);
                });
            });
            
            if (showInConsole && collectedTexts.size > 0) {
                console.log(`[GitHub 中文翻译] 收集到 ${collectedTexts.size} 个字符串：`);
                console.log([...collectedTexts].sort());
                
                // 生成可直接用于翻译词典的格式
                const formattedStrings = [...collectedTexts].sort()
                    .map(text => `'${text.replace(/'/g, "\\'")}': '待翻译：${text.replace(/'/g, "\\'")}'`) 
                    .join(',\n    ');
                console.log('\n可直接复制到翻译词典的格式：\n{\n    ' + formattedStrings + '\n}');
            }
            
            return collectedTexts;
        },
        
        /**
         * 检查当前页面上未翻译的字符串
         * @param {boolean} showInConsole - 是否在控制台显示未翻译的字符串
         * @returns {Set<string>} 未翻译的字符串集合
         */
        findUntranslatedStrings(showInConsole = false) {
            const allTexts = this.collectStrings(false);
            const translationDict = translationModule.getTranslationDict();
            const untranslatedTexts = new Set();
            
            // 检查哪些文本还没有翻译
            allTexts.forEach(text => {
                if (!translationDict.has(text)) {
                    untranslatedTexts.add(text);
                }
            });
            
            if (showInConsole && untranslatedTexts.size > 0) {
                console.log(`[GitHub 中文翻译] 发现 ${untranslatedTexts.size} 个未翻译的字符串：`);
                console.log([...untranslatedTexts].sort());
                
                // 生成可直接用于翻译词典的格式
                const formattedStrings = [...untranslatedTexts].sort()
                    .map(text => `'${text.replace(/'/g, "\\'")}': '待翻译：${text.replace(/'/g, "\\'")}'`) 
                    .join(',\n    ');
                console.log('\n可直接复制到翻译词典的格式：\n{\n    ' + formattedStrings + '\n}');
            }
            
            return untranslatedTexts;
        },
        
        /**
         * 导出当前页面的翻译状态报告
         * @param {boolean} showInConsole - 是否在控制台显示报告
         * @returns {Object} 翻译状态报告
         */
        exportTranslationReport(showInConsole = false) {
            const allTexts = this.collectStrings(false);
            const translationDict = translationModule.getTranslationDict();
            const translatedTexts = new Set();
            const untranslatedTexts = new Set();
            
            allTexts.forEach(text => {
                if (translationDict.has(text)) {
                    translatedTexts.add(text);
                } else {
                    untranslatedTexts.add(text);
                }
            });
            
            const report = {
                page: window.location.href,
                totalStrings: allTexts.size,
                translatedCount: translatedTexts.size,
                untranslatedCount: untranslatedTexts.size,
                translationRate: (translatedTexts.size / allTexts.size * 100).toFixed(2) + '%',
                translatedStrings: [...translatedTexts].sort(),
                untranslatedStrings: [...untranslatedTexts].sort()
            };
            
            if (showInConsole) {
                console.log('[GitHub 中文翻译] 当前页面翻译状态报告：');
                console.log(`页面: ${report.page}`);
                console.log(`总字符串数: ${report.totalStrings}`);
                console.log(`已翻译: ${report.translatedCount}`);
                console.log(`未翻译: ${report.untranslatedCount}`);
                console.log(`翻译率: ${report.translationRate}`);
                console.log('\n未翻译的字符串：');
                console.log(report.untranslatedStrings);
            }
            
            return report;
        }
    };

    // 初始化翻译词典（按需加载）
    const TRANSLATION_DICT = translationModule.getTranslationDict();

    /**
     * 启动翻译脚本
     * 功能：实现页面翻译的核心逻辑，包括DOM元素查找和文本替换
     */
    function startScript() {
        /**
         * 翻译指定的DOM元素
         * @param {HTMLElement} element - 要翻译的DOM元素
         */
        function translateElement(element) {
            if (!element || !element.childNodes || !TRANSLATION_DICT.size) return;
            
            // 遍历子节点进行翻译
            Array.from(element.childNodes).forEach(node => {
                // 只处理文本节点
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
                    let originalText = node.nodeValue;
                    let translatedText = originalText;
                    
                    // 尝试使用翻译词典进行替换 - 仅完全匹配时才翻译
                    if (TRANSLATION_DICT.has(translatedText)) {
                        translatedText = TRANSLATION_DICT.get(translatedText);
                    } else if (TRANSLATION_DICT.has(translatedText.toLowerCase())) {
                        // 检查小写形式的完全匹配，保持原始大小写
                        const lowerCaseTranslation = TRANSLATION_DICT.get(translatedText.toLowerCase());
                        if (translatedText === translatedText.toUpperCase()) {
                            translatedText = lowerCaseTranslation.toUpperCase();
                        } else if (translatedText.charAt(0) === translatedText.charAt(0).toUpperCase()) {
                            translatedText = lowerCaseTranslation.charAt(0).toUpperCase() + lowerCaseTranslation.slice(1);
                        }
                    }
                    
                    // 如果文本被翻译了，更新节点值
                    if (translatedText !== originalText) {
                        node.nodeValue = translatedText;
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 递归处理子元素，但跳过一些不需要翻译的元素
                    const tagName = node.tagName.toLowerCase();
                    if (!['script', 'style', 'code', 'pre', 'textarea'].includes(tagName)) {
                        translateElement(node);
                    }
                }
            });
        }
        
        /**
         * 翻译整个页面
         */
        function translatePage() {
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 开始翻译页面...');
            }
            
            // 遍历关键区域进行翻译
            CONFIG.selectors.keyAreas.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => translateElement(element));
            });
            
            if (CONFIG.debugMode) {
                console.log('[GitHub 中文翻译] 页面翻译完成');
            }
        }
        
        /**
         * 设置路由变化监听
         * GitHub 使用 PJAX 实现无刷新导航，需要监听路由变化
         */
        function setupRouteChangeObserver() {
            // 监听 popstate 事件
            window.addEventListener('popstate', () => {
                setTimeout(() => {
                    translationModule.resetCache();
                    translatePage();
                }, CONFIG.routeChangeDelay);
            });
            
            // 监听 DOM 变化，处理动态加载的内容
            if (CONFIG.performance.enableDeepObserver) {
                const observer = new MutationObserver(utils.throttle((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    translateElement(node);
                                }
                            });
                        }
                    });
                }, CONFIG.performance.throttleInterval));
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        }
        
        /**
         * 初始化脚本
         */
        function init() {
            try {
                // 执行初始翻译
                translatePage();
                
                // 设置路由变化监听
                setupRouteChangeObserver();
                
                if (CONFIG.debugMode) {
                    console.log(`[GitHub 中文翻译] 脚本 v${CONFIG.version} 初始化成功`);
                    // 在调试模式下，提供字符串抓取工具到全局作用域
                    window.GitHubTranslationHelper = stringExtractor;
                    console.log('[GitHub 中文翻译] 字符串抓取工具已加载到 window.GitHubTranslationHelper');
                    console.log('使用方法:');
                    console.log('  - 收集当前页面所有字符串: GitHubTranslationHelper.collectStrings(true)');
                    console.log('  - 查找未翻译的字符串: GitHubTranslationHelper.findUntranslatedStrings(true)');
                    console.log('  - 导出翻译状态报告: GitHubTranslationHelper.exportTranslationReport(true)');
                }
            } catch (error) {
                console.error('[GitHub 中文翻译] 脚本初始化失败:', error);
            }
        }
        
        // 当DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            // 如果DOM已经加载完成，直接初始化
            init();
        }
    }

    // 🕒 启动脚本
    startScript();

})();