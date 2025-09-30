// ==UserScript==
// @name         GitHub 网站国际化之中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version      1.7.6
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
        }
    };

    // ========== 配置项 ==========
    const CONFIG = {
        // 当前脚本版本号（用于统一管理）
        version: '1.7.7',
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
            keyAreas: ['#header', '.application-main'],
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
                '.js-menu-container'                // JavaScript生成的菜单容器
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
            dashboard: /^\/$|\/(explore|notifications|stars|gists|codespaces|projects|organizations)$/
        }
    };

    // ========== 翻译词典模块 ==========
    /**
     * 翻译词典模块
     * 功能：按页面类型组织翻译词典，支持按需加载
     */
    const translationModule = {
        // 核心翻译词典（全局通用翻译项）
        core: {
            'Pull requests': '拉取请求',
            'Issues': '问题',
            'Skip to content': '跳转到内容',
            'Search GitHub': '搜索 GitHub',
            'New': '新建',
            'Help': '帮助',
            'Your profile': '个人资料',
            'Sign out': '退出登录',
            'Toggle navigation': '切换导航',
            'Create': '创建',
            'Explore': '探索',
            'Marketplace': '市场',
            'Notifications': '通知',
            'Sponsor': '赞助',
            'View all notifications': '查看所有通知',
            'You have unread notifications': '你有未读通知',
            'You have no unread notifications': '你没有未读通知',
            'Expand all': '全部展开',
            'Collapse all': '全部折叠',
            'Read more': '阅读更多',
            'GitHub': 'GitHub',
            'GitHub Home': 'GitHub 首页',
            'Enterprise': '企业版',
            'Create repository': '创建仓库',
            'Import repository': '导入仓库',
            'New gist': '新建代码片段',
            'New organization': '新建组织',
            'New codespace': '新建 Codespace',
            'Your repositories': '你的仓库',
            'Your stars': '你的标星',
            'Your gists': '你的代码片段',
            'Your codespaces': '你的 Codespaces',
            'Your projects': '你的项目',
            'Your organizations': '你的组织',
            'Your notifications': '你的通知',
            'Feature preview': '功能预览',
            'Accessibility': '无障碍',
            'Skip to main content': '跳转到主内容',
            'Skip to search': '跳转到搜索',
            'Skip to footer': '跳转到页脚',
            'Back to top': '回到顶部',
            'Settings': '设置',
            'Security': '安全',
            'Billing': '账单',
            'Support': '支持',
            'Documentation': '文档',
            'About': '关于',
            'Privacy': '隐私',
            'Terms': '条款',
            'Contact': '联系',
            'Feedback': '反馈',
            'Report': '报告',
            'Share': '分享',
            'Copy': '复制',
            'Download': '下载',
            'Print': '打印',
            'Refresh': '刷新',
            'Reload': '重新加载',
            'Reset': '重置'
        },
        
        // Dashboard 页面翻译
        dashboard: {
            'At a glance': '概览',
            'Activity overview': '活动概览',
            'Active projects': '活跃项目',
            'Recently closed projects': '最近关闭的项目',
            'Your packages': '你的包',
            'Recent packages': '最近的包',
            'Dependency graph': '依赖图',
            'Security alerts': '安全警报',
            'Vulnerabilities': '漏洞',
            'Dependabot alerts': '依赖机器人警报',
            'Code scanning alerts': '代码扫描警报',
            'Secret scanning alerts': '密钥扫描警报',
            'Issues assigned to you': '分配给你的问题',
            'Pull requests awaiting your review': '等待你审查的拉取请求',
            'Your watchlist': '你的监视列表',
            'Recently starred repositories': '最近标星的仓库',
            'Popular repositories for you': '为你推荐的热门仓库',
            'Similar to your starred repositories': '类似你标星的仓库',
            'Recently discovered': '最近发现',
            'Sort options': '排序选项',
            'Filter options': '筛选选项',
            'Display options': '显示选项',
            'Compact view': '紧凑视图',
            'Expanded view': '展开视图',
            'Grid view': '网格视图',
            'List view': '列表视图',
            'Card view': '卡片视图',
            'Time range': '时间范围',
            'Last 24 hours': '过去24小时',
            'Last 7 days': '过去7天',
            'Last 30 days': '过去30天',
            'Last 90 days': '过去90天',
            'Last year': '过去一年',
            'All contributions': '所有贡献',
            'Code contributions': '代码贡献',
            'Documentation contributions': '文档贡献',
            'Community contributions': '社区贡献',
            'Your contributions': '你的贡献',
            'Top contributors': '顶级贡献者',
            'Repository contributors': '仓库贡献者',
            'Team contributors': '团队贡献者',
            'Organization contributors': '组织贡献者',
            'Contribution insights': '贡献洞察',
            'Activity patterns': '活动模式',
            'Peak activity times': '活动高峰时间',
            'Productivity insights': '生产力洞察',
            'Most active days': '最活跃日',
            'Most active times': '最活跃时间',
            'Recent achievements': '最近成就',
            'Upcoming milestones': '即将到来的里程碑',
            'Milestone progress': '里程碑进度',
            'Completion rate': '完成率',
            'On track': '按计划进行',
            'At risk': '存在风险',
            'Off track': '偏离计划',
            'Completed': '已完成',
            'In progress': '进行中',
            'Not started': '未开始',
            'Blocked': '已阻塞',
            'Critical': '严重',
            'High': '高',
            'Medium': '中',
            'Low': '低',
            'Very low': '很低',
            'Due today': '今天到期',
            'Due tomorrow': '明天到期',
            'Due this week': '本周到期',
            'Overdue': '已逾期',
            'No due date': '无截止日期',
            'Assigned to': '分配给',
            'Created by': '创建者',
            'Updated by': '更新者',
            'Labels': '标签',
            'Milestone': '里程碑',
            'Project': '项目',
            'Reviewer': '审查者',
            'Author': '作者',
            'Commenter': '评论者',
            'Mentioned': '被提及',
            'Subscribed': '已订阅',
            'Unsubscribed': '未订阅',
            'Ignore': '忽略',
            'Track': '跟踪',
            'All labels': '所有标签',
            'All milestones': '所有里程碑',
            'All projects': '所有项目',
            'All assignees': '所有经办人',
            'All reviewers': '所有审查者',
            'All authors': '所有作者',
            'All statuses': '所有状态',
            'All priorities': '所有优先级',
            'All due dates': '所有截止日期',
            'All activity types': '所有活动类型',
            'All repositories': '所有仓库',
            'All teams': '所有团队',
            'All organizations': '所有组织',
            'Public repositories': '公共仓库',
            'Private repositories': '私有仓库',
            'Internal repositories': '内部仓库',
            'Public gists': '公共代码片段',
            'Secret gists': '私密代码片段',
            'Public discussions': '公共讨论',
            'Team discussions': '团队讨论',
            'Organization discussions': '组织讨论',
            'Public projects': '公共项目',
            'Private projects': '私有项目',
            'Internal projects': '内部项目'
        },
        
        // 通知页面翻译
        notifications: {
            'Notifications are being fetched': '正在获取通知',
            'No matching notifications': '没有匹配的通知',
            'Notifications marked as read': '通知已标记为已读',
            'Notifications saved': '通知已保存',
            'Notifications unsaved': '通知已取消保存',
            'Notifications muted': '通知已静音',
            'Notifications unmuted': '通知已取消静音',
            'Notifications settings updated': '通知设置已更新',
            'Notification preferences saved': '通知偏好设置已保存',
            'Notification delivery settings': '通知送达设置',
            'Notification sound': '通知声音',
            'Notification badges': '通知标记',
            'Desktop notifications': '桌面通知',
            'Mobile push notifications': '移动推送通知',
            'Email notifications': '邮件通知',
            'Web notifications': '网页通知',
            'Notification digest': '通知摘要',
            'Daily digest': '每日摘要',
            'Weekly digest': '每周摘要',
            'Skip digest': '跳过摘要',
            'Notification frequency': '通知频率',
            'Immediate': '立即',
            'Hourly': '每小时',
            'Daily': '每日',
            'Weekly': '每周',
            'Monthly': '每月',
            'Never': '从不',
            'Notification filters': '通知筛选器',
            'Custom filters': '自定义筛选器',
            'Create custom filter': '创建自定义筛选器',
            'Edit filter': '编辑筛选器',
            'Delete filter': '删除筛选器',
            'Filter by repository': '按仓库筛选',
            'Filter by type': '按类型筛选',
            'Filter by status': '按状态筛选',
            'Filter by date': '按日期筛选',
            'Filter by author': '按作者筛选',
            'Filter by assignee': '按经办人筛选',
            'Filter by label': '按标签筛选',
            'Filter by milestone': '按里程碑筛选',
            'Filter by project': '按项目筛选',
            'Filter by language': '按语言筛选',
            'Filter by topic': '按主题筛选',
            'Filter by license': '按许可证筛选',
            'Filter by star count': '按标星数量筛选',
            'Filter by fork count': '按复刻数量筛选',
            'Filter by last updated': '按最后更新时间筛选',
            'Filter by created': '按创建时间筛选',
            'Filter by size': '按大小筛选',
            'Filter by activity': '按活动筛选',
            'Filter by contributions': '按贡献筛选',
            'Filter by involvement': '按参与度筛选',
            'Filter by reaction': '按反应筛选',
            'Filter by comment': '按评论筛选',
            'Filter by review': '按审查筛选',
            'Filter by mention': '按提及筛选',
            'Filter by assignment': '按分配筛选',
            'Filter by subscription': '按订阅筛选',
            'Filter by watching': '按关注筛选',
            'Filter by starring': '按标星筛选',
            'Filter by forking': '按复刻筛选',
            'Filter by following': '按关注用户筛选',
            'Filter by collaborator': '按协作者筛选',
            'Filter by member': '按成员筛选',
            'Filter by owner': '按所有者筛选',
            'Filter by admin': '按管理员筛选',
            'Filter by maintainer': '按维护者筛选',
            'Filter by contributor': '按贡献者筛选',
            'Filter by guest': '按访客筛选',
            'Filter by role': '按角色筛选',
            'Filter by permission': '按权限筛选',
            'Filter by access': '按访问权限筛选',
            'Filter by visibility': '按可见性筛选',
            'Filter by branch': '按分支筛选',
            'Filter by tag': '按标签筛选',
            'Filter by commit': '按提交筛选',
            'Filter by pull request': '按拉取请求筛选',
            'Filter by issue': '按问题筛选',
            'Filter by discussion': '按讨论筛选',
            'Filter by wiki': '按维基筛选',
            'Filter by action': '按操作筛选',
            'Filter by package': '按包筛选',
            'Filter by security': '按安全筛选',
            'Filter by insight': '按洞察筛选',
            'Filter by page': '按页面筛选',
            'Filter by codespace': '按代码空间筛选',
            'Filter by gist': '按代码片段筛选',
            'Filter by marketplace': '按市场筛选',
            'Filter by sponsor': '按赞助筛选',
            'Filter by sponsorship': '按赞助关系筛选',
            'Filter by organization': '按组织筛选',
            'Filter by team': '按团队筛选',
            'Filter by user': '按用户筛选'
        },
        
        // Codespaces 相关翻译
        codespaces: {
            'Codespace': '代码空间',
            'Codespaces': '代码空间',
            'Create a codespace': '创建代码空间',
            'Open in codespace': '在代码空间中打开',
            'Develop in a codespace': '在代码空间中开发',
            'Default codespace': '默认代码空间',
            'Active codespaces': '活跃的代码空间',
            'Stop codespace': '停止代码空间',
            'Restart codespace': '重启代码空间',
            'Delete codespace': '删除代码空间',
            'Codespace configuration': '代码空间配置',
            'Codespace settings': '代码空间设置',
            'Codespace lifecycle': '代码空间生命周期',
            'Codespace machine type': '代码空间机器类型',
            'Codespace storage': '代码空间存储',
            'Codespace region': '代码空间区域',
            'Codespace editor': '代码空间编辑器',
            'Dev container': '开发容器',
            'Dev container configuration': '开发容器配置'
        },
        
        // GitHub 搜索页面翻译
        search: {
            'Advanced search': '高级搜索',
            'No results found': '未找到结果',
            'We couldn\'t find any repositories matching your search': '我们没有找到匹配你搜索的任何仓库',
            'We couldn\'t find any issues matching your search': '我们没有找到匹配你搜索的任何问题',
            'We couldn\'t find any pull requests matching your search': '我们没有找到匹配你搜索的任何拉取请求',
            'We couldn\'t find any code matching your search': '我们没有找到匹配你搜索的任何代码',
            'We couldn\'t find any commits matching your search': '我们没有找到匹配你搜索的任何提交',
            'We couldn\'t find any users matching your search': '我们没有找到匹配你搜索的任何用户',
            'We couldn\'t find any organizations matching your search': '我们没有找到匹配你搜索的任何组织',
            'We couldn\'t find any discussions matching your search': '我们没有找到匹配你搜索的任何讨论',
            'We couldn\'t find any packages matching your search': '我们没有找到匹配你搜索的任何包',
            'We couldn\'t find any topics matching your search': '我们没有找到匹配你搜索的任何主题',
            'We couldn\'t find any wikis matching your search': '我们没有找到匹配你搜索的任何维基',
            'Try adjusting your search or filter to find what you\'re looking for': '尝试调整搜索条件或筛选器以找到您想要的内容',
            'Sort': '排序',
            'Best match': '最佳匹配',
            'Most stars': '最多标星',
            'Most forks': '最多复刻',
            'Recently updated': '最近更新',
            'Recently added': '最近添加',
            'Newest': '最新',
            'Oldest': '最旧',
            'A-Z': 'A-Z',
            'Z-A': 'Z-A',
            'Most discussed': '讨论最多',
            'Fewest discussed': '讨论最少',
            'Most commented': '评论最多',
            'Fewest commented': '评论最少',
            'First submitted': '最早提交',
            'Last submitted': '最晚提交',
            'First merged': '最早合并',
            'Last merged': '最晚合并',
            'Most reviewed': '审查最多',
            'Fewest reviewed': '审查最少',
            'File match': '文件匹配',
            'Line match': '行匹配',
            'Search language': '搜索语言',
            'Any language': '任何语言',
            'Type': '类型',
            'Any type': '任何类型',
            'Repository': '仓库',
            'Issue': '问题',
            'Pull request': '拉取请求',
            'Code': '代码',
            'Commit': '提交',
            'User': '用户',
            'Organization': '组织',
            'Discussion': '讨论',
            'Package': '包',
            'Topic': '主题',
            'Wiki': '维基',
            'Marketplace': '市场',
            'Event': '事件',
            'Saved searches': '已保存的搜索',
            'Save this search': '保存此搜索',
            'Delete this saved search': '删除此已保存的搜索',
            'Clear all filters': '清除所有筛选器',
            'Apply filters': '应用筛选器',
            'Filter by': '按...筛选',
            'Search in': '在...中搜索',
            'All GitHub': '整个 GitHub',
            'This repository': '此仓库',
            'This organization': '此组织',
            'With': '包含',
            'Without': '不包含',
            'Followers': '关注者',
            'Following': '关注',
            'Repositories': '仓库',
            'Public': '公开',
            'Private': '私有',
            'Internal': '内部',
            'Fork': '复刻',
            'Mirror': '镜像',
            'Template': '模板',
            'Archived': '已归档',
            'Disabled': '已禁用',
            'Included forks': '包含复刻',
            'Exclude forks': '排除复刻',
            'Language': '语言',
            'License': '许可证',
            'Topic': '主题',
            'Size': '大小',
            'Stars': '标星',
            'Forks': '复刻',
            'Watchers': '监视者',
            'Created': '创建于',
            'Updated': '更新于',
            'Pushed': '推送于',
            'Path': '路径',
            'Filename': '文件名',
            'Extension': '扩展名',
            'Content': '内容',
            'Message': '消息',
            'Author': '作者',
            'Committer': '提交者',
            'Assignee': '经办人',
            'Reviewer': '审查者',
            'Mentions': '提及',
            'Labels': '标签',
            'Milestone': '里程碑',
            'Project': '项目',
            'Status': '状态',
            'Open': '打开',
            'Closed': '关闭',
            'Merged': '已合并',
            'Draft': '草稿',
            'Conflicting': '冲突',
            'Approved': '已批准',
            'Changes requested': '需要修改',
            'Commented': '已评论',
            'Waiting': '等待中',
            'Ready for review': '准备审查',
            'Needs review': '需要审查',
            'Needs revision': '需要修订',
            'Team': '团队',
            'Member': '成员',
            'Role': '角色',
            'Admin': '管理员',
            'Maintainer': '维护者',
            'Contributor': '贡献者',
            'Guest': '访客',
            'Visibility': '可见性',
            'Access': '访问',
            'Permission': '权限',
            'Security': '安全',
            'Vulnerabilities': '漏洞',
            'Dependabot': '依赖机器人',
            'Code scanning': '代码扫描',
            'Secret scanning': '密钥扫描',
            'Insights': '洞察',
            'Activity': '活动',
            'Contributions': '贡献',
            'Involvement': '参与度',
            'Reactions': '反应',
            'Comments': '评论',
            'Reviews': '审查',
            'Mentions': '提及',
            'Assignments': '分配',
            'Subscriptions': '订阅',
            'Watching': '监视',
            'Starring': '标星',
            'Forking': '复刻',
            'Following': '关注',
            'Collaborating': '协作',
            'Contributing': '贡献',
            'Sponsoring': '赞助',
            'Sponsored': '被赞助',
            'Team discussions': '团队讨论',
            'Organization discussions': '组织讨论',
            'Public discussions': '公开讨论',
            'Page': '页面',
            'Codespace': '代码空间',
            'Gist': '代码片段',
            'Order': '顺序',
            'Direction': '方向',
            'Ascending': '升序',
            'Descending': '降序',
            'Results per page': '每页结果数',
            'Show': '显示',
            'View': '视图',
            'Grid': '网格',
            'List': '列表',
            'Card': '卡片',
            'Compact': '紧凑',
            'Expanded': '展开',
            'Search tips': '搜索提示',
            'For example': '例如',
            'Learn more': '了解更多',
            'Keyboard shortcuts': '键盘快捷键',
            'Escape': '退出',
            'Enter': '进入',
            'Arrow keys': '方向键',
            'Tab': 'Tab键',
            'Shift + Tab': 'Shift + Tab键',
            'Ctrl + F': 'Ctrl + F',
            'Command + F': 'Command + F',
            'Search settings': '搜索设置',
            'Preferences': '偏好设置',
            'Save preferences': '保存偏好设置',
            'Search history': '搜索历史',
            'Clear history': '清除历史',
            'Recent searches': '最近搜索',
            'Popular searches': '热门搜索',
            'Related searches': '相关搜索',
            'Trending searches': '趋势搜索',
            'Search suggestions': '搜索建议',
            'Did you mean': '你是不是想找',
            'Showing': '显示',
            'to': '至',
            'of': '共',
            'results': '条结果',
            'Previous': '上一页',
            'Next': '下一页',
            'Go to page': '前往页',
            'First page': '首页',
            'Last page': '末页',
            'Page': '页',
            'Jump to': '跳转到',
            'No more results': '没有更多结果',
            'Loading more results': '正在加载更多结果',
            'Load more': '加载更多',
            'Search again': '再次搜索',
            'Refine search': '优化搜索',
            'Modify search': '修改搜索',
            'Adjust filters': '调整筛选器',
            'Remove filter': '移除筛选器',
            'Selected filters': '已选筛选器',
            'Filter summary': '筛选摘要',
            'Match case': '区分大小写',
            'Whole words only': '全词匹配',
            'Regular expression': '正则表达式',
            'Wildcard': '通配符',
            'Case sensitive': '区分大小写',
            'Exact match': '精确匹配',
            'Starts with': '以...开头',
            'Ends with': '以...结尾',
            'Contains': '包含',
            'Does not contain': '不包含',
            'Greater than': '大于',
            'Greater than or equal': '大于或等于',
            'Less than': '小于',
            'Less than or equal': '小于或等于',
            'Equal to': '等于',
            'Not equal to': '不等于',
            'Between': '介于',
            'Not between': '不介于',
            'In': '在...中',
            'Not in': '不在...中',
            'Is': '是',
            'Is not': '不是',
            'Has': '有',
            'Has not': '没有',
            'Before': '之前',
            'After': '之后',
            'On': '在',
            'Within': '在...内',
            'Last': '最近',
            'Today': '今天',
            'Yesterday': '昨天',
            'This week': '本周',
            'Last week': '上周',
            'This month': '本月',
            'Last month': '上月',
            'This year': '今年',
            'Last year': '去年',
            'All time': '所有时间'
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
            
            // 对于不在特定页面模块的其他页面，加载常用的通用翻译
            if (selectedModules.length === 1) { // 只加载了core模块
                // 可以添加一些额外的常用翻译项
                if (CONFIG.pagePatterns.repository.test(currentPath)) {
                    // 仓库页面的一些通用翻译
                    translationMap.set('Code', '代码');
                    translationMap.set('Issues', '问题');
                    translationMap.set('Pull requests', '拉取请求');
                    translationMap.set('Actions', '操作');
                    translationMap.set('Projects', '项目');
                    translationMap.set('Wiki', '维基');
                    translationMap.set('Security', '安全');
                    translationMap.set('Insights', '洞察');
                    translationMap.set('Settings', '设置');
                }
            }
            
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
    
    // 初始化翻译词典（按需加载）
    const TRANSLATION_DICT = translationModule.getTranslationDict();
        'Codespaces': 'Codespaces',
        'Copilot': 'Copilot',
        'Pages': 'Pages',
        'Actions': '操作',
        'Packages': '包',
        'Security log': '安全日志',

        // ========== 组织设置菜单 ==========
        'Organization settings': '组织设置',
        'Profile': '资料',
        'People': '成员',
        'Teams': '团队',
        'Billing': '账单',
        'SAML SSO': 'SAML SSO',
        'Audit log': '审计日志',
        'Actions': '操作',
        'Packages': '包',
        'Secrets and variables': '密钥与变量',
        'Codespaces': 'Codespaces',
        'Pages': 'Pages',
        'Webhooks': 'Webhooks',
        'OAuth Apps': 'OAuth 应用',
        'GitHub Apps': 'GitHub 应用',
        'Installed GitHub Apps': '已安装的 GitHub 应用',
        'Custom properties': '自定义属性',
        'Member privileges': '成员权限',
        'Third-party access': '第三方访问',
        'Moderation settings': '审核设置',
        'Repository defaults': '仓库默认设置',
        'Repository roles': '仓库角色',
        'Code security': '代码安全',
        'Dependabot': 'Dependabot',
        'Code scanning': '代码扫描',
        'Secret scanning': '密钥扫描',
        'Advanced security': '高级安全',
        'Migration': '迁移',
        'Blocked users': '被屏蔽用户',
        'Domain settings': '域名设置',
        'Enterprise': '企业',

        // ========== 通知中心 ==========
        'Unread': '未读',
        'Participating': '参与的',
        'All': '全部',
        'Custom': '自定义',
        'Mark all as read': '全部标记为已读',
        'Mute thread': '静音此会话',
        'Unmute thread': '取消静音',
        'Save': '保存',
        'Notifications are updating': '通知正在更新',
        'Notifications updated': '通知已更新',
        'No notifications': '暂无通知',
        'Forked the repository': '复刻了仓库',
        'Starred the repository': '标星了仓库',
        'Watched the repository': '关注了仓库',
        'Unstarred the repository': '取消标星仓库',
        'Unwatched the repository': '取消关注仓库',
        
        // ========== GitHub 主页特定翻译项 ==========
        'Join the world’s most widely adopted AI-powered developer platform': '加入世界上采用最广泛的AI驱动开发者平台',
        'Build and ship software on a single, collaborative platform': '在单一协作平台上构建和发布软件',
        'Code quickly and more securely with GitHub Copilot embedded throughout your workflows': '通过嵌入工作流的GitHub Copilot快速且更安全地编写代码',
        'Accelerate performance': '提升性能',
        'With GitHub Copilot embedded throughout the platform, you can simplify your toolchain, automate tasks, and improve the developer experience': '通过整个平台嵌入的GitHub Copilot，您可以简化工具链，自动化任务并改善开发者体验',
        'Built-in application security where found means fixed': '内置应用安全，发现即修复',
        'Use AI to find and fix vulnerabilities—freeing your teams to ship more secure software faster': '使用AI查找和修复漏洞，让您的团队更快地发布更安全的软件',
        'Work together, achieve more': '协作共赢',
        'Collaborate with your teams, use management tools that sync with your projects, and code from anywhere—all on a single, integrated platform': '与团队协作，使用与项目同步的管理工具，随时随地编写代码——全部在一个集成平台上',
        'From startups to enterprises, GitHub scales with teams of any size in any industry': '从初创公司到企业，GitHub可随任何行业任何规模的团队扩展',
        'Survey: The AI wave continues to grow on software development teams, 2024': '调查：2024年软件开发团队中的AI浪潮持续增长',
        'Saved': '已保存',

        // ========== 邮箱与密钥 ==========
        'Email address': '邮箱地址',
        'Primary email address': '主邮箱地址',
        'Add email address': '添加邮箱地址',
        'Verified': '已验证',
        'Unverified': '未验证',
        'Set as primary': '设为主邮箱',
        'Make private': '设为私有',
        'Make public': '设为公开',
        'Resend email': '重新发送邮件',
        'Remove': '移除',

        'SSH keys': 'SSH 密钥',
        'New SSH key': '新建 SSH 密钥',
        'Title': '标题',
        'Key': '密钥',
        'Add SSH key': '添加 SSH 密钥',
        'GPG keys': 'GPG 密钥',
        'New GPG key': '新建 GPG 密钥',
        'Add GPG key': '添加 GPG 密钥',
        'Public key': '公钥',

        // ========== 令牌 ==========
        'Personal access tokens': '个人访问令牌',
        'Fine-grained tokens': '精细令牌',
        'Tokens (classic)': '经典令牌',
        'Generate new token': '生成新令牌',
        'Note': '备注',
        'Expires': '过期时间',
        'Token': '令牌',
        'Configure': '配置',
        'Regenerate': '重新生成',
        'Revoke': '撤销',

        // ========== 代码空间 (Codespaces) ==========
        'Codespaces': '代码空间',
        'New codespace': '新建代码空间',
        'Recent codespaces': '最近的代码空间',
        'Dev containers': '开发容器',
        'Settings': '设置',
        'Preferences': '偏好设置',
        'Features': '功能',
        'Port forwarding': '端口转发',
        'Visual Studio Code': 'Visual Studio Code',
        'Browser': '浏览器',
        'Start': '启动',
        'Stop': '停止',
        'Restart': '重启',
        'Export': '导出',
        'Delete codespace': '删除代码空间',
        'Create codespace': '创建代码空间',
        'View codespaces': '查看代码空间',
        'Your codespaces': '你的代码空间',
        'Open with Codespaces': '使用代码空间打开',
        'Codespace name': '代码空间名称',
        'Repository': '仓库',
        'Branch': '分支',
        'Machine type': '机器类型',
        'Region': '区域',
        'Timeout': '超时时间',
        'Dotfiles': '点文件',
        'Editor': '编辑器',
        'Extensions': '扩展',
        'Environment variables': '环境变量',
        'Git config': 'Git配置',
        'Prebuilds': '预构建',
        'Billing': '账单',
        'Usage': '使用情况',
        'Limits': '限制',
        'Access controls': '访问控制',

        // ========== 其他通用 UI ==========
        'Public': '公开',
        'Private': '私有',
        'Internal': '内部',
        'Visibility': '可见性',
        'Description': '描述',
        'Homepage': '主页',
        'Website': '网站',
        'Location': '位置',
        'Company': '公司',
        'Twitter username': 'Twitter 用户名',
        'Pronouns': '代词',
        'Bio': '简介',
        'Update profile': '更新资料',
        'Change your avatar': '更换头像',
        'Upload a new photo': '上传新照片',
        'Save changes': '保存更改',
        'Cancel': '取消',
        'Close': '关闭',
        'Delete': '删除',
        'Edit': '编辑',
        'Rename': '重命名',
        'Transfer': '转移',
        'Danger Zone': '危险区域',
        'Permanently delete': '永久删除',
        'Are you sure?': '你确定吗？',
        'Confirm': '确认',
        'Search': '搜索',
        'Filter': '筛选',
        'Sort': '排序',
        'Loading': '加载中',
        'No results found': '未找到结果',
        'Write': '撰写',
        'Preview': '预览',
        'Quote reply': '引用回复',
        'React': '反应',
        'View source': '查看源码',
        'Jump to': '跳转到',
        'Quickly navigate files': '快速导航文件',
        'Recent activity': '最近活动',
        'Popular repositories': '热门仓库',
        'Topics': '主题',
        'Collections': '合集',
        'Templates': '模板',
        'Archived': '已归档',
        'Forked from': '复刻自',
        'Mirror': '镜像',
        'Template': '模板仓库',
        'Sponsor': '赞助',
        'Sponsor this project': '赞助此项目',
        'Back this project': '支持此项目',
        'Learn more': '了解更多',
        'Documentation': '文档',
        'API': 'API',
        'Community': '社区',
        'Support': '支持',
        'Report abuse': '举报滥用',
        'Contact GitHub': '联系 GitHub',
        'Status': '状态',
        'Training': '培训',
        'Blog': '博客',
        'About': '关于',
        'Terms': '条款',
        'Privacy': '隐私',
        'Security': '安全',
        'Team': '团队',
        'Enterprise': '企业版',

        // ========== 仓库操作（扩展）==========
        'Create repository': '创建仓库',
        'Fork': '复刻',
        'Watch': '关注',
        'Star': '标星',
        'Discard changes': '放弃更改',
        'Commit changes': '提交更改',
        'Sync fork': '同步复刻',
        'Create new file': '创建新文件',
        'Upload files': '上传文件',
        'Find file': '查找文件',
        'Go to file': '转到文件',
        'Raw': '原始',
        'Blame': '代码归属',
        'History': '历史',
        'Download': '下载',
        'Copy': '复制',
        'Permalink': '永久链接',
        
        // ========== Pull Request（扩展）==========
        'Create pull request': '创建拉取请求',
        'Merge pull request': '合并拉取请求',
        'Squash and merge': '压缩并合并',
        'Rebase and merge': '变基并合并',
        'Resolve conflicts': '解决冲突',
        'Review changes': '审查更改',
        'Approved': '已批准',
        'Changes requested': '请求更改',
        
        // ========== Issues（扩展）==========
        'Comment': '评论',
        'Close with comment': '带评论关闭',
        'Assign yourself': '分配给自己',
        'Lock conversation': '锁定会话',
        'Unlock conversation': '解锁会话',
        
        // ========== 搜索与筛选（扩展）==========
        'This repository': '当前仓库',
        'All repositories': '所有仓库',
        'In this organization': '在此组织中',
        'Search in': '搜索范围',
        'Sort by': '排序方式',
        'Filter by': '筛选条件',
        'Most stars': '最多标星',
        'Most forks': '最多复刻',
        'Recently updated': '最近更新',
        'Language': '语言',
        
        // ========== 代码审查（扩展）==========
        'Approve': '批准',
        'Request changes': '请求更改',
        'Comment': '评论',
        'Viewed': '已查看',
        'Hide whitespace': '隐藏空白',
        'Show whitespace': '显示空白',
        'Start review': '开始审查',
        'Finish your review': '完成审查',
        
        // ========== 其他常用UI（扩展）==========
        'Collaborators': '协作者',
        'Invite a collaborator': '邀请协作者',
        'Manage access': '管理访问权限',
        'Compare': '比较',
        'Insights': '洞察',
        'Marketplace': '市场',
        'Sponsor': '赞助',
        'Settings': '设置',
        'Toggle dark mode': '切换深色模式',
        'Toggle light mode': '切换浅色模式',
        'Default branch': '默认分支',
        'Switch branches/tags': '切换分支/标签',
        'Create branch': '创建分支',
        'Create tag': '创建标签',
        'Delete branch': '删除分支',
        'Delete tag': '删除标签',
        'Gitpod': 'Gitpod',
        'Open in Visual Studio Code': '在 Visual Studio Code 中打开',
        'Open in Visual Studio': '在 Visual Studio 中打开',
        'Open with': '使用...打开',
        'Print': '打印',
        'Keyboard shortcuts': '键盘快捷键',
        'Log out': '登出',
        
        // ========== 新增菜单翻译 ==========
        // 仓库页面菜单
        'Code': '代码',
        'Issues': '问题',
        'Pull requests': '拉取请求',
        'Projects': '项目',
        'Wiki': '维基',
        'Security': '安全',
        'Actions': '操作',
        'Packages': '包',
        'Environments': '环境',
        
        // Issues页面菜单
        'Open': '开放',
        'Closed': '已关闭',
        'Labels': '标签',
        'Milestones': '里程碑',
        'Assignees': '经办人',
        
        // Pull Requests页面菜单
        'All': '全部',
        'Your pull requests': '您的拉取请求',
        'Merged': '已合并',
        
        // 克隆菜单
        'Clone': '克隆',
        'HTTPS': 'HTTPS',
        'SSH': 'SSH',
        'GitHub CLI': 'GitHub 命令行',
        'Open with GitHub Desktop': '用 GitHub Desktop 打开',
        'Download ZIP': '下载 ZIP',
        
        // 分支/标签菜单
        'Recent branches': '最近分支',
        'Recent tags': '最近标签',
        
        // 文件操作菜单
        'Delete file': '删除文件',
        'Move file': '移动文件',
        'Rename file': '重命名文件',
        'View blame': '查看代码归属',
        'View history': '查看历史',
        
        // 设置页面菜单
        'General': '通用',
        'Account': '账户',
        'Notifications': '通知',
        'Emails': '邮箱',
        'Security': '安全',
        'SSH and GPG keys': 'SSH和GPG密钥',
        'Developer settings': '开发者设置',
        'Billing': '账单',
        'Plan': '计划',
        
        // 开发者设置
        'Personal access tokens': '个人访问令牌',
        'OAuth apps': 'OAuth应用',
        'GitHub Apps': 'GitHub应用',
        'Fine-grained tokens': '细粒度令牌',
        
        // 代码审查菜单
        'Reviewers': '审查者',
        'Assignees': '经办人',
        'Labels': '标签',
        'Projects': '项目',
        'Milestone': '里程碑',
        
        // 洞察页面菜单
        'Overview': '概览',
        'Contributors': '贡献者',
        'Traffic': '流量',
        'Commits': '提交',
        'Code frequency': '代码频率',
        'Network': '网络',
        'Dependency graph': '依赖图',
        'Dependabot alerts': 'Dependabot提醒',
        'Security insights': '安全洞察',
        
        // 其他常用术语
        'Save': '保存',
        'Cancel': '取消',
        'Apply': '应用',
        'Update': '更新',
        'Delete': '删除',
        'Create': '创建',
        'Edit': '编辑',
        'Preview': '预览',
        'Commit message': '提交信息',
        'Add file': '添加文件',
        'Commit directly to the': '直接提交到',
        'branch': '分支',
        'Create a new branch for this commit and start a pull request': '为此提交创建新分支并开始拉取请求',
        'Submit new issue': '提交新问题',
        'Submit new pull request': '提交新拉取请求',
        'Write': '编写',
        'Preview': '预览',
        'Attach files by dragging & dropping, uploading from your computer, or pasting from the clipboard.': '通过拖放、从计算机上传或从剪贴板粘贴附加文件。',
        'Close issue': '关闭问题',
        'Reopen issue': '重新打开问题',
        'Close pull request': '关闭拉取请求',
        'Reopen pull request': '重新打开拉取请求',
        'Merge pull request': '合并拉取请求',
        'Confirm merge': '确认合并',
        'Delete branch': '删除分支',
        'Delete branch after merge': '合并后删除分支',
        'View pull request': '查看拉取请求',
        'View commit': '查看提交',
        'View issue': '查看问题',
        'View file': '查看文件',
        'View directory': '查看目录',
        'Copy link': '复制链接',
        'Copy raw content': '复制原始内容',
        'Open raw': '打开原始内容',
        'Open in new window': '在新窗口打开',
        'Open in new tab': '在新标签页打开',
        
        // ========== ActionList 相关翻译 ==========
        'ActionList': '操作列表',
        'prc-ActionList-ActionList-X4RiC': '操作列表组件',
        
        // ========== 新增翻译项 ==========
        // 侧边栏相关
        'Explore': '探索',
        'Mentions': '提及',
        'Bookmarks': '书签',
        'All activity': '所有活动',
        'Custom feeds': '自定义动态',
        'For you': '为你推荐',
        
        // 团队与项目
        'Team': '团队',
        'Team settings': '团队设置',
        'Team members': '团队成员',
        'Team repositories': '团队仓库',
        'Team discussions': '团队讨论',
        'Team projects': '团队项目',
        
        // 代码审查与协作
        'Start a review': '开始审查',
        'Review summary': '审查摘要',
        'File changes': '文件变更',
        'Outdated': '已过时',
        'Resolve conversation': '解决会话',
        'Reopen conversation': '重新开启会话',
        
        // 仓库管理
        'Repository': '仓库',
        'Manage repository': '管理仓库',
        'Repository settings': '仓库设置',
        'Collaborative development': '协作开发',
        'Repository insights': '仓库洞察',
        'Repository security': '仓库安全',
        
        // 项目与任务管理
        'Add task': '添加任务',
        'Task list': '任务列表',
        'Project board': '项目看板',
        'Automation': '自动化',
        
        // 讨论区
        'Start discussion': '开始讨论',
        'Discussion categories': '讨论分类',
        'Unanswered discussions': '未回复讨论',
        'Popular discussions': '热门讨论',
        
        // 包管理
        'Package registry': '包注册表',
        'Package settings': '包设置',
        'Package versions': '包版本',
        'Package usage': '包使用情况',
        
        // 安全相关
        'Security overview': '安全概览',
        'Vulnerability alerts': '漏洞提醒',
        'Security policy': '安全策略',
        'Security advisories': '安全公告',
        
        // 高级功能
        'Advanced settings': '高级设置',
        'Experimental features': '实验性功能',
        'Developer preview': '开发者预览',
        'Early access': '抢先体验',
        
        // 其他常用术语
        'Unassigned': '未分配',
        'Unlabeled': '未标记',
        'Draft': '草稿',
        'Ready': '准备就绪',
        'Waiting for review': '等待审查',
        'In progress': '进行中',
        'Needs work': '需要改进',
        
        // ========== 新增翻译项 - 搜索与筛选 ==========
        'Clear all filters': '清除所有筛选条件',
        'Showing': '显示',
        'of': '共',
        'results for': '个结果，搜索',
        'Search code': '搜索代码',
        'Search issues': '搜索问题',
        'Search discussions': '搜索讨论',
        'Search projects': '搜索项目',
        'Search wiki': '搜索维基',
        'Search commits': '搜索提交',
        'Search users': '搜索用户',
        'Search topics': '搜索主题',
        
        // ========== 新增翻译项 - 文件查看器 ==========
        'Copy path': '复制路径',
        'Copy permalink': '复制永久链接',
        'Filename': '文件名',
        'Size': '大小',
        'Last commit': '最后提交',
        
        // ========== 新增翻译项 - 代码差异与合并 ==========
        'Files changed': '已更改文件',
        'Commits': '提交',
        'Conversation': '对话',
        'Merge conflict': '合并冲突',
        'Conflicting files': '冲突文件',
        'Resolve conflicts': '解决冲突',
        'This branch is': '此分支',
        'commits ahead': '领先提交',
        'commits behind': '落后提交',
        'base:': '基准:',
        'compare:': '比较:',
        'Load diff': '加载差异',
        'Show all changes': '显示所有更改',
        'Show whitespace changes': '显示空白字符更改',
        'Hide whitespace changes': '隐藏空白字符更改',
        'Code owners': '代码所有者',
        'Suggested reviewers': '推荐审查者',
        
        // ========== 新增翻译项 - 通知中心 ==========

        
        // ========== 新增翻译项 - 仓库设置 ==========
        'Options': '选项',
        'Deploy keys': '部署密钥',
        'Templates': '模板',
        'Code security': '代码安全',
        'Code scanning': '代码扫描',
        'Secret scanning': '密钥扫描',
        'Dependabot security updates': 'Dependabot安全更新',
        'Dependabot version updates': 'Dependabot版本更新',
        'Advanced security': '高级安全',
        'Environments': '环境',
        'Teams': '团队',
        
        // ========== 新增翻译项 - 用户与个人资料 ==========
        'User': '用户',
        'Activity': '活动',
        'Public contributions': '公开贡献',
        'Private contributions': '私有贡献',
        'Contribution settings': '贡献设置',
        'Edit bio': '编辑简介',
        'Update bio': '更新简介',
        'View gists': '查看代码片段',
        
        // ========== 新增翻译项 - 市场与扩展 ==========
        'GitHub Marketplace': 'GitHub市场',
        'Featured': '精选',
        'Categories': '分类',
        'All categories': '所有分类',
        'Recommended': '推荐',
        'Install': '安装',
        'Uninstall': '卸载',
        'Configure': '配置',
        'App settings': '应用设置',
        'Apps': '应用',
        'Browse categories': '浏览分类',
        'Search GitHub Marketplace': '搜索GitHub市场',
        'Learn more about': '了解更多关于',
        'Made by': '由...制作',
        'Installed on': '已安装在',
        'Installs': '安装次数',
        'Reviews': '评价',
        'Average rating': '平均评分',
        'Star rating': '星级评分',
        'Pricing plans': '价格方案',
        'Monthly': '月付',
        'Annual': '年付',
        'Contact developer': '联系开发者',
        'Documentation': '文档',
        'Changelog': '更新日志',
        'Terms of service': '服务条款',
        'Privacy policy': '隐私政策',
        'Report abuse': '举报滥用',
        'Manage app': '管理应用',
        'Grant access': '授予访问权限',
        'Revoke access': '撤销访问权限',
        'Permissions': '权限',
        'Requested permissions': '请求的权限',
        'OAuth scopes': 'OAuth作用域',
        'App status': '应用状态',
        'Suspended': '已暂停',
        'Marketplace publisher': '市场发布者',
        'Verification status': '验证状态',
        'App description': '应用描述',
        'Usage examples': '使用示例',
        'Screenshots': '截图',
        'Video demo': '视频演示',
        'FAQ': '常见问题',
        'Community forum': '社区论坛',
        'Twitter': 'Twitter',
        'LinkedIn': 'LinkedIn',
        'GitHub repository': 'GitHub仓库',
        'Release date': '发布日期',
        'Last updated': '最后更新',
        'Compatibility': '兼容性',
        'Supported languages': '支持的语言',
        'License': '许可证',
        'Similar apps': '类似应用',
        'You might also like': '你可能还喜欢',
        'Recently viewed': '最近查看',
        'Staff picks': '编辑推荐',
        'Enterprise ready': '企业就绪',
        'Security reviewed': '已安全审核',
        'Built for GitHub': '为GitHub打造',
        'Installed by': '已被以下用户安装',
        'Featured in': '被收录于',
        'Case studies': '案例研究',
        'Success stories': '成功案例',
        'Request a demo': '申请演示',
        'Get started': '开始使用',
        'Renew subscription': '续订',
        'Cancel subscription': '取消订阅',
        'Subscription details': '订阅详情',
        'Billing information': '账单信息',
        'Payment method': '付款方式',
        'Invoice history': '发票历史',
        'Refund policy': '退款政策',
        'Renewal date': '续订日期',
        'Trial period': '试用期',
        'Trial ends on': '试用期结束于',
        'Extend trial': '延长试用期',
        'Activate account': '激活账户',
        'Upgrade plan': '升级方案',
        'Downgrade plan': '降级方案',
        'Switch plan': '切换方案',
        'Compare plans': '比较方案',
        'Plan features': '方案功能',
        'Feature comparison': '功能比较',
        'API limits': 'API限制',
        'Storage limits': '存储限制',
        'Support level': '支持级别',
        'Response time': '响应时间',
        'Uptime guarantee': '正常运行时间保证',
        'Service level agreement': '服务级别协议',
        'Technical specifications': '技术规格',
        'System requirements': '系统要求',
        'Installation guide': '安装指南',
        'Setup wizard': '设置向导',
        'Quick start': '快速入门',
        'Tutorial': '教程',
        'API documentation': 'API文档',
        'SDK': 'SDK',
        'Sample code': '示例代码',
        'Development resources': '开发资源',
        'Integration guides': '集成指南',
        'Events': '事件',
        'Payload examples': '载荷示例',
        'Authentication': '认证',
        'Authorization': '授权',
        'Rate limiting': '速率限制',
        'Caching': '缓存',
        'Pagination': '分页',
        'Error handling': '错误处理',
        'Logging': '日志记录',
        'Monitoring': '监控',
        'Analytics': '分析',
        'Performance metrics': '性能指标',
        'Usage statistics': '使用统计',
        'Debugging tools': '调试工具',
        'Troubleshooting': '故障排除',
        'Known issues': '已知问题',
        'Roadmap': '路线图',
        'Future features': '未来功能',
        'Feedback': '反馈',
        'Suggest a feature': '建议功能',
        'Vote on features': '对功能投票',
        'Beta testing': 'Beta测试',
        'Release notes': '发布说明',
        
        // ========== 新增翻译项 - 活动日志与报告 ==========
        'Activity log': '活动日志',
        'Security log': '安全日志',
        'Audit log': '审计日志',
        'Contributors': '贡献者',
        'Traffic': '流量',
        'Code frequency': '代码频率',
        'Network': '网络',
        'Forks': '复刻',
        'Stars': '标星',
        'Watchers': '关注者',
        
        // ========== 新增翻译项 - GitHub Actions ==========
        'Workflows': '工作流',
        'Runs': '运行记录',
        'Jobs': '任务',
        'Artifacts': '产物',
        'Caches': '缓存',
        'Create workflow': '创建工作流',
        'New workflow': '新建工作流',
        'Set up a workflow yourself': '自己设置工作流',
        'Browse workflows': '浏览工作流',
        'Commit workflow file': '提交工作流文件',
        'Run workflow': '运行工作流',
        'Re-run workflow': '重新运行工作流',
        'Cancel run': '取消运行',
        'View runs': '查看运行记录',
        'View jobs': '查看任务',
        'View logs': '查看日志',
        'Download logs': '下载日志',
        'Download artifact': '下载产物',
        'Delete run': '删除运行记录',
        'Run name': '运行名称',
        'Workflow file': '工作流文件',
        'Triggered by': '触发者',
        'Duration': '持续时间',
        'Status': '状态',
        
        // ========== 新增翻译项 - 讨论与协作 ==========
        'Discussions': '讨论',
        'New discussion': '新建讨论',
        'Category': '分类',
        'Choose a category': '选择分类',
        'Post discussion': '发布讨论',
        'Comment on discussion': '评论讨论',
        'Lock discussion': '锁定讨论',
        'Unlock discussion': '解锁讨论',
        'Pin discussion': '置顶讨论',
        'Unpin discussion': '取消置顶',
        'Archive discussion': '归档讨论',
        'Unarchive discussion': '取消归档',
        'Subscribe to discussion': '订阅讨论',
        'Unsubscribe from discussion': '取消订阅讨论',
        
        // ========== 新增翻译项 - 项目管理 ==========
        'Projects': '项目',
        'New project': '新建项目',
        'Create project': '创建项目',
        'Board': '看板',
        'Table': '表格',
        'Roadmap': '路线图',
        'Create column': '创建列',
        'Add card': '添加卡片',
        'Move column': '移动列',
        'Delete column': '删除列',
        'Filter cards': '筛选卡片',
        'Sort cards': '排序卡片',
        'Group cards': '分组卡片',
        'Automate': '自动化',
        'Project settings': '项目设置',
        
        // ========== 新增翻译项 - 其他常用术语 ==========
        'Open': '开放',
        'Closed': '已关闭',
        'Pending': '待处理',
        'Success': '成功',
        'Failed': '失败',
        'Cancelled': '已取消',
        'Skipped': '已跳过',
        'Warning': '警告',
        'Error': '错误',
        'Info': '信息',
        'Debug': '调试',
        'Notice': '通知',
        'Alert': '警报',
        'Confirmation': '确认',
        'Cancel': '取消',
        'OK': '确定',
        'Yes': '是',
        'No': '否',
        'No results': '没有结果',
        'Submit': '提交',
        'Apply': '应用',
        'Reset': '重置',
        'Reload': '重新加载',
        'Refresh': '刷新',
        'Continue': '继续',
        'Skip': '跳过',
        'Next': '下一步',
        'Previous': '上一步',
        'Back': '返回',
        'Forward': '前进',
        'First': '第一页',
        'Last': '最后一页',
        'Enable': '启用',
        'Disable': '禁用',
        'Activate': '激活',
        'Deactivate': '停用',
        'Install': '安装',
        'Uninstall': '卸载',
        'Import': '导入',
        'Export': '导出',
        'Upload': '上传',
        'Download': '下载',
        'Copy': '复制',
        'Paste': '粘贴',
        'Cut': '剪切',
        'Delete': '删除',
        'Rename': '重命名',
        'Move': '移动',
        'Duplicate': '复制',
        'Share': '分享',
        'Publish': '发布',
        'Unpublish': '取消发布',
        'Save': '保存',
        'Discard': '放弃',
        'Undo': '撤销',
        'Redo': '重做',
        'Search': '搜索',
        'Filter': '筛选',
        'Sort': '排序',
        'View': '查看',
        'List view': '列表视图',
        'Grid view': '网格视图',
        'Table view': '表格视图',
        'Tree view': '树状视图',
        'Compact view': '紧凑视图',
        'Expanded view': '展开视图',
        'Default view': '默认视图',
        'Custom view': '自定义视图',
        'Loading': '加载中',
        'Loaded': '已加载',
        'Processing': '处理中',
        'Complete': '已完成',
        'Incomplete': '未完成',
        'Pending': '待处理',
        'Approved': '已批准',
        'Rejected': '已拒绝',
        'Accepted': '已接受',
        'Declined': '已拒绝',
        'Active': '活跃',
        'Inactive': '不活跃',
        'Online': '在线',
        'Offline': '离线',
        'Available': '可用',
        'Unavailable': '不可用',
        'Enabled': '已启用',
        'Disabled': '已禁用',
        'Visible': '可见',
        'Hidden': '隐藏',
        'Public': '公开',
        'Private': '私有',
        'Internal': '内部',
        'Restricted': '受限',
        'Unrestricted': '不受限',
        'Limited': '有限',
        'Unlimited': '无限',
        'Default': '默认',
        'Custom': '自定义',
        'Standard': '标准',
        'Premium': '高级',
        'Basic': '基础',
        'Advanced': '高级',
        'Professional': '专业',
        'Enterprise': '企业',
        'Free': '免费',
        'Paid': '付费',
        'Trial': '试用',
        'Subscription': '订阅',
        'License': '许可证',
        'Terms': '条款',
        'Privacy': '隐私',
        'Security': '安全',
        'Help': '帮助',
        'Support': '支持',
        'Documentation': '文档',
        'Tutorial': '教程',
        'Guide': '指南',
        'FAQ': '常见问题',
        'Contact': '联系',
        'Feedback': '反馈',
        'Report': '报告',
        'Bug': '缺陷',
        'Issue': '问题',
        'Feature': '功能',
        'Suggestion': '建议',
        'Idea': '想法',
        'Request': '请求',
        'Problem': '问题',
        'Solution': '解决方案',
        'Tip': '提示',
        'Trick': '技巧',
        'Best practice': '最佳实践',
        'Example': '示例',
        'Demo': '演示',
        'Template': '模板',
        'Sample': '样例',
        'Pattern': '模式',
        'Guide': '指南',
        'Manual': '手册',
        'Reference': '参考',
        'API': 'API',
        'SDK': 'SDK',
        'CLI': '命令行工具',
        'GUI': '图形界面',
        'UI': '用户界面',
        'UX': '用户体验',
        'Frontend': '前端',
        'Backend': '后端',
        'Database': '数据库',
        'Server': '服务器',
        'Client': '客户端',
        'Local': '本地',
        'Remote': '远程',
        'Cloud': '云',
        'On-premises': '本地部署',
        'Hybrid': '混合',
        'Dev': '开发',
        'Test': '测试',
        'Staging': '预发布',
        'Production': '生产',
        'Environment': '环境',
        'Deployment': '部署',
        'Release': '发布',
        'Build': '构建',
        'CI': '持续集成',
        'CD': '持续部署',
        'Pipeline': '流水线',
        'Workflow': '工作流',
        'Job': '任务',
        'Step': '步骤',
        'Action': '操作',
        'Command': '命令',
        'Script': '脚本',
        'Code': '代码',
        'Commit': '提交',
        'Branch': '分支',
        'Tag': '标签',
        'Merge': '合并',
        'Rebase': '变基',
        'Squash': '压缩',
        'Cherry-pick': '挑选',
        'Push': '推送',
        'Pull': '拉取',
        'Fetch': '获取',
        'Clone': '克隆',
        'Fork': '复刻',
        'Init': '初始化',
        'Add': '添加',
        'Remove': '移除',
        'Commit message': '提交信息',
        'Author': '作者',
        'Committer': '提交者',
        'Date': '日期',
        'Time': '时间',
        'Message': '消息',
        'Description': '描述',
        'Summary': '摘要',
        'Details': '详情',
        'Notes': '注释',
        'Comments': '评论',
        'Reactions': '反应',
        'Emoji': '表情',
        'Star': '标星',
        'Watch': '关注',
        'Fork': '复刻',
        'Follow': '关注',
        'Unfollow': '取消关注',
        'Like': '点赞',
        'Unlike': '取消点赞',
        'Upvote': '赞成',
        'Downvote': '反对',
        'Subscribe': '订阅',
        'Unsubscribe': '取消订阅',
        'Mute': '静音',
        'Unmute': '取消静音',
        'Save': '保存',
        'Unsave': '取消保存',
        'Bookmark': '书签',
        'Unbookmark': '取消书签',
        'Pin': '置顶',
        'Unpin': '取消置顶',
        'Lock': '锁定',
        'Unlock': '解锁',
        'Archive': '归档',
        'Unarchive': '取消归档',
        'Delete': '删除',
        'Restore': '恢复',
        'Permanently delete': '永久删除',
        'Confirm deletion': '确认删除',
        'Are you sure?': '你确定吗？',
        'This action cannot be undone.': '此操作无法撤销。',
        'Delete anyway': '仍然删除',
        'Cancel': '取消',
        
        // ========== 新增翻译项 - 个人资料设置页面 ==========
        'Edit profile': '编辑资料',
        'Profile picture': '头像',
        'Name': '姓名',
        'Bio': '简介',
        'Twitter username': 'Twitter用户名',
        'Company': '公司',
        'Location': '位置',
        'Website': '网站',
        'Pronouns': '代词',
        'Email preferences': '邮箱偏好设置',
        'Update preferences': '更新偏好设置',
        'Set status': '设置状态',
        'Status message': '状态消息',
        'Clear status': '清除状态',
        'Save status': '保存状态',
        
        // ========== 新增翻译项 - 外观设置页面 ==========
        'Theme': '主题',
        'Color mode': '颜色模式',
        'Dark mode': '深色模式',
        'Light mode': '浅色模式',
        'System preference': '系统偏好',
        'Default theme': '默认主题',
        'High contrast': '高对比度',
        'Page zoom': '页面缩放',
        'Interface density': '界面密度',
        'Show profile photo': '显示个人资料照片',
        'Navigation style': '导航样式',
        'Contextual spacing': '上下文间距',
        'Tab size': '制表符大小',
        'Simplified navigation': '简化导航',
        'Show navigation icons': '显示导航图标',
        'Show tooltips': '显示工具提示',
        'Focus mode': '专注模式',
        'Font size': '字体大小',
        'Default font': '默认字体',
        'Monospace font': '等宽字体',
        'Custom font': '自定义字体',
        'Font weight': '字体粗细',
        'Line height': '行高',
        'Code font size': '代码字体大小',
        'Code line height': '代码行高',
        'Code tab size': '代码制表符大小',
        'Scrollbar style': '滚动条样式',
        'Render whitespace': '显示空白字符',
        'Render line endings': '显示行结束符',
        // 外观设置页面补充项
        'Appearance settings': '外观设置',
        'Interface preferences': '界面偏好',
        'Display options': '显示选项',
        'Personalization': '个性化',
        'Sidebar position': '侧边栏位置',
        'Sidebar width': '侧边栏宽度',
        'Main content width': '主内容宽度',
        'Content layout': '内容布局',
        'Show borders': '显示边框',
        'Show shadows': '显示阴影',
        'Accent color': '强调色',
        'Link color': '链接颜色',
        'Button style': '按钮样式',
        'Corner radius': '圆角半径',
        'Animation speed': '动画速度',
        'Enable animations': '启用动画',
        'Accessibility options': '辅助功能选项',
        'Keyboard navigation': '键盘导航',
        'Screen reader support': '屏幕阅读器支持',
        'Custom CSS': '自定义CSS',
        'Apply custom styles': '应用自定义样式',
        // 外观设置页面补充项2
        'Navigation layout': '导航布局',
        'Compact mode': '紧凑模式',
        'Comfortable mode': '舒适模式',
        'Text contrast': '文本对比度',
        'Background contrast': '背景对比度',
        'Selection color': '选择颜色',
        'Highlight color': '高亮颜色',
        'Tooltip style': '工具提示样式',
        'Context menu style': '上下文菜单样式',
        'Dropdown style': '下拉菜单样式',
        'Table style': '表格样式',
        'Scrollbar width': '滚动条宽度',
        'Mouse cursor style': '鼠标光标样式',
        'Touch mode': '触摸模式',
        'Mobile optimization': '移动端优化',
        'Responsive layout': '响应式布局',
        'Print styles': '打印样式',
        'Export settings': '导出设置',
        'Import settings': '导入设置',
        'Reset to defaults': '重置为默认值',
        'Custom theme': '自定义主题',
        'Theme editor': '主题编辑器',
        'Preview changes': '预览更改',
        'Save theme': '保存主题',
        'Share theme': '分享主题',
        
        // ========== 新增翻译项 - Copilot功能设置 ==========
        'Copilot features': 'Copilot功能',
        'Copilot settings': 'Copilot设置',
        'Copilot for Individuals': '个人版Copilot',
        'Copilot for Business': '企业版Copilot',
        'Copilot Chat': 'Copilot聊天',
        'Copilot Labs': 'Copilot实验室',
        'Copilot suggestions': 'Copilot建议',
        'Inline suggestions': '行内建议',
        'Editor integrations': '编辑器集成',
        'Language models': '语言模型',
        'Model selection': '模型选择',
        'Code completion': '代码补全',
        'Code explanations': '代码解释',
        'Code generation': '代码生成',
        'Security scanning': '安全扫描',
        'Usage statistics': '使用统计',
        'Enable Copilot': '启用Copilot',
        'Disable Copilot': '禁用Copilot',
        'Agent Mode': '自主编码模式',
        'Free plan': '免费计划',
        'Chat messages': '聊天消息',
        'Edit with GitHub Copilot': '使用GitHub Copilot编辑',
        'Cross-file editing': '跨文件编辑',
        'AI model': 'AI模型',
        'GPT-4o': 'GPT-4o',
        'Claude 3.5 Sonnet': 'Claude 3.5 Sonnet',
        'Gemini': 'Gemini',
        'Extensions ecosystem': '扩展生态系统',
        'Network settings': '网络设置',
        'Permissions': '权限',
        'Access management': '访问管理',
        'Policy settings': '策略设置',
        'Code suggestions': '代码建议',
        'Monthly limit': '每月限制',
        'Per month': '每月',
        'Code edits': '代码编辑',
        'External models': '外部模型',
        'Network search': '网络搜索',
        'Stack Overflow integration': 'Stack Overflow集成',
        'Plugin installation': '插件安装',
        'Sign in to GitHub': '登录GitHub',
        'Start using Copilot Free': '开始使用免费Copilot',
        'Monthly code suggestions': '每月代码建议',
        'Monthly chat messages': '每月聊天消息',
        'Customize AI model': '自定义AI模型',
        'Integrated development environment': '集成开发环境',
        'IDE integration': 'IDE集成',
        'Visual Studio Code': 'Visual Studio Code',
        'JetBrains IDEs': 'JetBrains IDEs',
        'Vim/Neovim': 'Vim/Neovim',
        'Xcode': 'Xcode',
        'Azure Data Studio': 'Azure Data Studio',
        
        // ========== 新增翻译项 - Issues页面 ==========
        'Assigned to you': '分配给你',
        'Created by you': '由你创建',
        'Mentioned you': '提及你',
        'Subscribed': '已订阅',
        'Labels': '标签',
        // ========== Issues页面 - 分配的问题 ==========
        'Issues assigned to you': '分配给你的问题',
        'All issues': '所有问题',
        'Open issues': '打开的问题',
        'Closed issues': '关闭的问题',
        'Your issues': '你的问题',
        'Team issues': '团队问题',
        'Organization issues': '组织问题',
        'Recently updated': '最近更新',
        'Recently created': '最近创建',
        'Recently closed': '最近关闭',
        'No issues assigned to you': '没有分配给你的问题',
        'Issue filters': '问题筛选器',
        'Filter by': '按以下筛选',
        'State': '状态',
        'Author': '作者',
        'Assignee': '经办人',
        'Mention': '提及',
        'Label': '标签',
        'Milestone': '里程碑',
        'Project': '项目',
        'Sort': '排序',
        'Direction': '方向',
        'Apply filters': '应用筛选器',
        'Clear filters': '清除筛选器',
        'Save filters': '保存筛选器',
        'Share filters': '分享筛选器',
        'Loading issues': '加载问题中',
        'No issues found': '未找到问题',
        'Issue': '问题',
        'Bug': '缺陷',
        'Feature': '功能',
        'Task': '任务',
        'Question': '问题',
        'Help wanted': '需要帮助',
        'Good first issue': '新手友好',
        'Open issue': '开放的问题',
        'Closed issue': '已关闭的问题',
        'New issue': '新建问题',
        'Create issue': '创建问题',
        'Submit new issue': '提交新问题',
        'View issue': '查看问题',
        'Close issue': '关闭问题',
        'Reopen issue': '重新打开问题',
        'Convert to issue': '转换为问题',
        'Assign yourself': '分配给自己',
        'Assign to': '分配给',
        'Unassign': '取消分配',
        'Assigned': '已分配',
        'Unassigned': '未分配',
        'All assignees': '所有经办人',
        'All labels': '所有标签',
        'All milestones': '所有里程碑',
        'All projects': '所有项目',
        'All states': '所有状态',
        'All authors': '所有作者',
        'All mentions': '所有提及',
        'Within': '在',
        'days': '天内',
        'weeks': '周内',
        'months': '月内',
        'years': '年内',
        'Any time': '任何时间',
        'Today': '今天',
        'Yesterday': '昨天',
        'This week': '本周',
        'Last week': '上周',
        'This month': '本月',
        'Last month': '上月',
        'This quarter': '本季度',
        'Last quarter': '上季度',
        'This year': '今年',
        'Last year': '去年',
        'Recently updated': '最近更新',
        'Least recently updated': '最早更新',
        'Recently created': '最近创建',
        'Least recently created': '最早创建',
        'Most commented': '最多评论',
        'Least commented': '最少评论',
        'Most discussed': '讨论最多',
        'Least discussed': '讨论最少',
        'Most active': '最活跃',
        'Least active': '最不活跃',
        'Alphabetically': '按字母顺序',
        'Reverse alphabetically': '按反向字母顺序',
        'Refresh': '刷新',
        'Issue details': '问题详情',
        'Issue timeline': '问题时间线',
        'Issue comments': '问题评论',
        'Issue activity': '问题活动',
        'Issue metadata': '问题元数据',
        'Issue metrics': '问题指标',
        'Issue statistics': '问题统计',
        'Issue history': '问题历史',
        'Issue notifications': '问题通知',
        'Issue subscriptions': '问题订阅',
        'Subscribe': '订阅',
        'Unsubscribe': '取消订阅',
        'Watch': '关注',
        'Unwatch': '取消关注',
        'Ignore': '忽略',
        'Participate': '参与',
        'Issue settings': '问题设置',
        'Settings': '设置',
        'Issue templates': '问题模板',
        'Templates': '模板',
        'Use template': '使用模板',
        'Create template': '创建模板',
        'Edit template': '编辑模板',
        'Delete template': '删除模板',
        'Template name': '模板名称',
        'Template description': '模板描述',
        'Apply template': '应用模板',
        'Issue guidelines': '问题指南',
        'Guidelines': '指南',
        'View guidelines': '查看指南',
        'Edit guidelines': '编辑指南',
        'Issue tips': '问题提示',
        'Tips': '提示',
        'Show tips': '显示提示',
        'Hide tips': '隐藏提示',
        'Issue help': '问题帮助',
        'Help': '帮助',
        'Get help': '获取帮助',
        'Issue documentation': '问题文档',
        'Documentation': '文档',
        'Read documentation': '阅读文档',
        'Issue examples': '问题示例',
        'Examples': '示例',
        'View examples': '查看示例',
        'Issue title': '问题标题',
        'Issue description': '问题描述',
        'Linked issues': '关联的问题',
        'Link an issue': '关联问题',
        'Close linked issues': '关闭关联的问题',
        'Fixes': '修复',
        'Closes': '关闭',
        'Resolves': '解决',
        'Relates to': '与...相关',
        'Add labels': '添加标签',
        'Remove label': '移除标签',
        'Add milestone': '添加里程碑',
        'Remove milestone': '移除里程碑',
        'Add projects': '添加项目',
        'Remove project': '移除项目',
        'Add assignees': '添加经办人',
        'Remove assignee': '移除经办人',
        'Add comments': '添加评论',
        'Comment': '评论',
        'Edit comment': '编辑评论',
        'Delete comment': '删除评论',
        'Close issue': '关闭问题',
        'Reopen issue': '重新打开问题',
        'Lock conversation': '锁定对话',
        'Unlock conversation': '解锁对话',
        'Mark as duplicate': '标记为重复',
        'Mark as spam': '标记为垃圾内容',
        'Report abuse': '报告滥用',
        'Issue assigned': '问题已分配',
        'Issue unassigned': '问题已取消分配',
        'Issue labeled': '问题已添加标签',
        'Issue unlabeled': '问题已移除标签',
        'Issue milestone added': '问题已添加里程碑',
        'Issue milestone removed': '问题已移除里程碑',
        'Issue project added': '问题已添加项目',
        'Issue project removed': '问题已移除项目',
        'Issue comment added': '问题已添加评论',
        'Issue comment edited': '问题评论已编辑',
        'Issue comment deleted': '问题评论已删除',
        'Issue closed': '问题已关闭',
        'Issue reopened': '问题已重新打开',
        'Issue locked': '问题已锁定',
        'Issue unlocked': '问题已解锁',
        'Issue marked as duplicate': '问题已标记为重复',
        'Issue marked as spam': '问题已标记为垃圾内容',
        'Issue reported': '问题已报告',
        'Team issues': '团队问题',
        'Organization issues': '组织问题',
        'All teams': '所有团队',
        'All organizations': '所有组织',
        'Select team': '选择团队',
        'Select organization': '选择组织',
        'My teams': '我的团队',
        'My organizations': '我的组织',
        'Team assignments': '团队分配',
        'Organization assignments': '组织分配',
        'Team contributions': '团队贡献',
        'Organization contributions': '组织贡献',
        'Issue dashboard': '问题仪表盘',
        'Dashboard': '仪表盘',
        'My dashboard': '我的仪表盘',
        'Team dashboard': '团队仪表盘',
        'Organization dashboard': '组织仪表盘',
        'Filter dashboard': '筛选仪表盘',
        'Customize dashboard': '自定义仪表盘',
        'Save dashboard': '保存仪表盘',
        'Share dashboard': '分享仪表盘',
        'Export issues': '导出问题',
        'Import issues': '导入问题',
        'Print issues': '打印问题',
        'Download issues': '下载问题',
        'CSV format': 'CSV格式',
        'JSON format': 'JSON格式',
        'Excel format': 'Excel格式',
        'Issue export': '问题导出',
        'Issue import': '问题导入',
        'Issue import template': '问题导入模板',
        'Download template': '下载模板',
        'Upload file': '上传文件',
        'Start import': '开始导入',
        'Import progress': '导入进度',
        'Import completed': '导入完成',
        'Import failed': '导入失败',
        'Export completed': '导出完成',
        'Export failed': '导出失败',
        'Issue statistics': '问题统计',
        'Open issues count': '开放问题数量',
        'Closed issues count': '关闭问题数量',
        'Total issues count': '问题总数',
        'Average time to close': '平均关闭时间',
        'Issue completion rate': '问题完成率',
        'Issue age': '问题存在时间',
        'Issue velocity': '问题处理速度',
        'Issue priority': '问题优先级',
        'High priority': '高优先级',
        'Medium priority': '中优先级',
        'Low priority': '低优先级',
        'Critical': '严重',
        'Blocker': '阻塞',
        'Urgent': '紧急',
        'Normal': '正常',
        'Minor': '次要',
        'Trivial': '微小',
        'Priority': '优先级',
        'Severity': '严重性',
        'Complexity': '复杂度',
        'Effort': '工作量',
        'Time estimate': '时间预估',
        'Time spent': '已花费时间',
        'Remaining time': '剩余时间',
        'Hours': '小时',
        'Days': '天',
        'Weeks': '周',
        'Months': '月',
        'Set priority': '设置优先级',
        'Set severity': '设置严重性',
        'Set complexity': '设置复杂度',
        'Set effort': '设置工作量',
        'Set time estimate': '设置时间预估',
        'Log time spent': '记录已花费时间',
        'Log remaining time': '记录剩余时间',
        'Issue dependencies': '问题依赖关系',
        'Depends on': '依赖于',
        'Blocks': '阻塞',
        'Add dependency': '添加依赖',
        'Remove dependency': '移除依赖',
        'Issue relations': '问题关系',
        'Related to': '相关于',
        'Duplicate of': '重复于',
        'Parent of': '父问题',
        'Child of': '子问题',
        'Add relation': '添加关系',
        'Remove relation': '移除关系',
        'Issue links': '问题链接',
        'Add link': '添加链接',
        'Remove link': '移除链接',
        'External link': '外部链接',
        'Internal link': '内部链接',
        'Link type': '链接类型',
        'Link URL': '链接URL',
        'Link description': '链接描述',
        'Issue attachments': '问题附件',
        'Attach files': '附加文件',
        'Drag and drop files here': '拖放文件到此处',
        'Maximum file size': '最大文件大小',
        'Supported file types': '支持的文件类型',
        'Upload attachments': '上传附件',
        'Remove attachment': '移除附件',
        'Issue reactions': '问题反应',
        'Add reaction': '添加反应',
        'Remove reaction': '移除反应',
        'Reaction count': '反应数量',
        'Issue voting': '问题投票',
        'Upvote': '赞同',
        'Downvote': '反对',
        'Vote count': '投票数量',
        'Voters': '投票者',
        'Issue watching': '问题关注',
        'Watchers': '关注者',
        'Start watching': '开始关注',
        'Stop watching': '停止关注',
        'Issue activity log': '问题活动日志',
        'Activity log': '活动日志',
        'View activity log': '查看活动日志',
        'Filter activity': '筛选活动',
        'Activity type': '活动类型',
        'Date range': '日期范围',
        'Issue automation': '问题自动化',
        'Automate issue': '自动化问题',
        'Create automation': '创建自动化',
        'Edit automation': '编辑自动化',
        'Delete automation': '删除自动化',
        'Automation rules': '自动化规则',
        'Automation triggers': '自动化触发器',
        'Automation actions': '自动化操作',
        'Run automation': '运行自动化',
        'Automation history': '自动化历史',
        'Issue bots': '问题机器人',
        'Bots': '机器人',
        'Configure bots': '配置机器人',
        'Add bot': '添加机器人',
        'Remove bot': '移除机器人',
        'Bot settings': '机器人设置',
        'Issue analytics': '问题分析',
        'Analytics': '分析',
        'View analytics': '查看分析',
        'Generate report': '生成报告',
        'Export report': '导出报告',
        'Report period': '报告期间',
        'Report format': '报告格式',
        'Issue integrations': '问题集成',
        'Integrations': '集成',
        'Configure integrations': '配置集成',
        'Add integration': '添加集成',
        'Remove integration': '移除集成',
        'Integration settings': '集成设置',
        'Issue API': '问题API',
        'API': 'API',
        'View API docs': '查看API文档',
        'Generate API token': '生成API令牌',
        'Revoke API token': '撤销API令牌',
        'API endpoints': 'API端点',
        'Issue CLI': '问题命令行工具',
        'CLI': '命令行工具',
        'View CLI docs': '查看CLI文档',
        'CLI commands': 'CLI命令',
        'Install CLI': '安装CLI',
        'Update CLI': '更新CLI',
        'Issue extensions': '问题扩展',
        'Extensions': '扩展',
        'Browse extensions': '浏览扩展',
        'Install extension': '安装扩展',
        'Uninstall extension': '卸载扩展',
        'Extension settings': '扩展设置',
        'Issue themes': '问题主题',
        'Themes': '主题',
        'Change theme': '更改主题',
        'Custom theme': '自定义主题',
        'Dark mode': '深色模式',
        'Light mode': '浅色模式',
        'System theme': '系统主题',
        'Issue preferences': '问题偏好设置',
        'Preferences': '偏好设置',
        'Edit preferences': '编辑偏好设置',
        'Save preferences': '保存偏好设置',
        'Reset preferences': '重置偏好设置',
        'Issue accessibility': '问题可访问性',
        'Accessibility': '可访问性',
        'Enable accessibility features': '启用可访问性功能',
        'Accessibility settings': '可访问性设置',
        'Issue keyboard shortcuts': '问题键盘快捷键',
        'Keyboard shortcuts': '键盘快捷键',
        'Show keyboard shortcuts': '显示键盘快捷键',
        'Customize keyboard shortcuts': '自定义键盘快捷键',
        'Issue search': '问题搜索',
        'Search issues': '搜索问题',
        'Advanced search': '高级搜索',
        'Saved searches': '已保存的搜索',
        'Save search': '保存搜索',
        'Edit saved search': '编辑已保存的搜索',
        'Delete saved search': '删除已保存的搜索',
        'Search filters': '搜索筛选器',
        'Search operators': '搜索运算符',
        'Search syntax': '搜索语法',
        'Search tips': '搜索提示',
        'Search results': '搜索结果',
        'No search results': '未找到搜索结果',
        'Issue pagination': '问题分页',
        'Page': '页',
        'of': '共',
        'Next page': '下一页',
        'Previous page': '上一页',
        'First page': '第一页',
        'Last page': '最后一页',
        'Items per page': '每页项数',
        'Jump to page': '跳转到页',
        'Issue sorting': '问题排序',
        'Sort by': '按以下排序',
        'Sort order': '排序顺序',
        'Ascending': '升序',
        'Descending': '降序',
        'Issue grouping': '问题分组',
        'Group by': '按以下分组',
        'Ungroup': '取消分组',
        'Grouped by': '已按以下分组',
        'Issue filtering': '问题筛选',
        'Filter options': '筛选选项',
        'Filter criteria': '筛选条件',
        'Filter results': '筛选结果',
        'Clear all filters': '清除所有筛选器',
        'Saved filters': '已保存的筛选器',
        'Save current filters': '保存当前筛选器',
        'Edit saved filter': '编辑已保存的筛选器',
        'Delete saved filter': '删除已保存的筛选器',
        'Apply saved filter': '应用已保存的筛选器',
        'Issue views': '问题视图',
        'Views': '视图',
        'List view': '列表视图',
        'Board view': '看板视图',
        'Calendar view': '日历视图',
        'Gantt view': '甘特图视图',
        'Timeline view': '时间线视图',
        'Kanban view': '看板视图',
        'Switch view': '切换视图',
        'Custom view': '自定义视图',
        'Save view': '保存视图',
        'Edit view': '编辑视图',
        'Delete view': '删除视图',
        'Issue columns': '问题列',
        'Columns': '列',
        'Customize columns': '自定义列',
        'Add column': '添加列',
        'Remove column': '移除列',
        'Resize column': '调整列大小',
        'Reorder columns': '重新排序列',
        'Issue fields': '问题字段',
        'Fields': '字段',
        'Custom fields': '自定义字段',
        'Create custom field': '创建自定义字段',
        'Edit custom field': '编辑自定义字段',
        'Delete custom field': '删除自定义字段',
        'Field type': '字段类型',
        'Field name': '字段名称',
        'Field description': '字段描述',
        'Field options': '字段选项',
        'Required field': '必填字段',
        'Issue forms': '问题表单',
        'Forms': '表单',
        'Create form': '创建表单',
        'Edit form': '编辑表单',
        'Delete form': '删除表单',
        'Form fields': '表单字段',
        'Form settings': '表单设置',
        'Form preview': '表单预览',
        'Issue templates': '问题模板',
        'Templates': '模板',
        'Create template': '创建模板',
        'Edit template': '编辑模板',
        'Delete template': '删除模板',
        'Template content': '模板内容',
        'Template variables': '模板变量',
        'Apply template': '应用模板',
        'Issue bulk operations': '问题批量操作',
        'Bulk operations': '批量操作',
        'Select all': '全选',
        'Select none': '全不选',
        'Select visible': '选择可见项',
        'Inverse selection': '反选',
        'Bulk assign': '批量分配',
        'Bulk unassign': '批量取消分配',
        'Bulk label': '批量添加标签',
        'Bulk unlabel': '批量移除标签',
        'Bulk milestone': '批量添加里程碑',
        'Bulk remove milestone': '批量移除里程碑',
        'Bulk project': '批量添加项目',
        'Bulk remove project': '批量移除项目',
        'Bulk close': '批量关闭',
        'Bulk reopen': '批量重新打开',
        'Bulk lock': '批量锁定',
        'Bulk unlock': '批量解锁',
        'Bulk delete': '批量删除',
        'Bulk export': '批量导出',
        'Bulk archive': '批量归档',
        'Bulk restore': '批量恢复',
        'Bulk mark as spam': '批量标记为垃圾内容',
        'Bulk report': '批量报告',
        'Issue permissions': '问题权限',
        'Permissions': '权限',
        'Manage permissions': '管理权限',
        'User permissions': '用户权限',
        'Team permissions': '团队权限',
        'Organization permissions': '组织权限',
        'Permission levels': '权限级别',
        'Admin': '管理员',
        'Maintainer': '维护者',
        'Writer': '写入者',
        'Reader': '读取者',
        'Guest': '访客',
        'No access': '无访问权限',
        'Issue security': '问题安全',
        'Security': '安全',
        'Manage security': '管理安全',
        'Security settings': '安全设置',
        'Privacy settings': '隐私设置',
        'Confidential issues': '机密问题',
        'Enable confidentiality': '启用机密性',
        'Mark as confidential': '标记为机密',
        'Remove confidentiality': '移除机密性',
        'Issue compliance': '问题合规性',
        'Compliance': '合规性',
        'Compliance settings': '合规性设置',
        'Audit log': '审计日志',
        'View audit log': '查看审计日志',
        'Export audit log': '导出审计日志',
        'Issue backup': '问题备份',
        'Backup': '备份',
        'Create backup': '创建备份',
        'Restore backup': '恢复备份',
        'Backup history': '备份历史',
        'Scheduled backups': '计划备份',
        'Issue recovery': '问题恢复',
        'Recovery': '恢复',
        'Recover deleted issues': '恢复已删除的问题',
        'Recycle bin': '回收站',
        'Permanently delete': '永久删除',
        'Restore': '恢复',
        'Issue archiving': '问题归档',
        'Archive': '归档',
        'Archive issues': '归档问题',
        'Restore from archive': '从归档恢复',
        'Archived issues': '已归档的问题',
        'Issue cleanup': '问题清理',
        'Cleanup': '清理',
        'Cleanup old issues': '清理旧问题',
        'Auto-close inactive issues': '自动关闭不活跃的问题',
        'Inactivity period': '不活跃期间',
        'Issue notifications': '问题通知',
        'Notifications': '通知',
        'Notification settings': '通知设置',
        'Manage notifications': '管理通知',
        'Notification preferences': '通知偏好设置',
        'Email notifications': '电子邮件通知',
        'Web notifications': '网页通知',
        'Mobile notifications': '移动通知',
        'Push notifications': '推送通知',
        'Notification channels': '通知渠道',
        'Mute notifications': '静音通知',
        'Unmute notifications': '取消静音通知',
        'Mark all as read': '标记全部为已读',
        'Mark as read': '标记为已读',
        'Mark as unread': '标记为未读',
        'Issue comments': '问题评论',
        'Comments': '评论',
        'Add comment': '添加评论',
        'Edit comment': '编辑评论',
        'Delete comment': '删除评论',
        'Reply to comment': '回复评论',
        'Comment history': '评论历史',
        'Comment reactions': '评论反应',
        'Comment attachments': '评论附件',
        'Comment formatting': '评论格式化',
        'Rich text editor': '富文本编辑器',
        'Markdown editor': 'Markdown编辑器',
        'Switch editor': '切换编辑器',
        'Preview': '预览',
        'Issue mentions': '问题提及',
        'Mentions': '提及',
        'Mention users': '提及用户',
        'Mention teams': '提及团队',
        'Mention issues': '提及问题',
        'Mention pull requests': '提及拉取请求',
        'Mention repositories': '提及仓库',
        'Mention labels': '提及标签',
        'Mention milestones': '提及里程碑',
        'Mention projects': '提及项目',
        'Issue linking': '问题链接',
        'Linking': '链接',
        'Link issues': '链接问题',
        'Link pull requests': '链接拉取请求',
        'Link repositories': '链接仓库',
        'Link external resources': '链接外部资源',
        'Automatic linking': '自动链接',
        'Issue tracking': '问题跟踪',
        'Tracking': '跟踪',
        'Track issues': '跟踪问题',
        'Untrack issues': '取消跟踪问题',
        'Tracking status': '跟踪状态',
        'Tracked issues': '已跟踪的问题',
        'Issue status': '问题状态',
        'Status': '状态',
        'To do': '待办',
        'In progress': '进行中',
        'In review': '审查中',
        'Done': '已完成',
        'Blocked': '已阻塞',
        'Deferred': '已推迟',
        'Canceled': '已取消',
        'Wont fix': '不会修复',
        'Duplicate': '重复',
        'Invalid': '无效',
        'Spam': '垃圾内容',
        'Set status': '设置状态',
        'Status change': '状态变更',
        'Status history': '状态历史',
        'Issue workflow': '问题工作流',
        'Workflow': '工作流',
        'Manage workflows': '管理工作流',
        'Create workflow': '创建工作流',
        'Edit workflow': '编辑工作流',
        'Delete workflow': '删除工作流',
        'Workflow stages': '工作流阶段',
        'Workflow transitions': '工作流转换',
        'Apply workflow': '应用工作流',
        'Issue boards': '问题看板',
        'Boards': '看板',
        'Create board': '创建看板',
        'Edit board': '编辑看板',
        'Delete board': '删除看板',
        'Board columns': '看板列',
        'Add column': '添加列',
        'Edit column': '编辑列',
        'Delete column': '删除列',
        'Reorder columns': '重新排序列',
        'Board swimlanes': '看板泳道',
        'Add swimlane': '添加泳道',
        'Edit swimlane': '编辑泳道',
        'Delete swimlane': '删除泳道',
        'Board filters': '看板筛选器',
        'Board settings': '看板设置',
        'Issue priorities': '问题优先级',
        'Priorities': '优先级',
        'Manage priorities': '管理优先级',
        'Create priority': '创建优先级',
        'Edit priority': '编辑优先级',
        'Delete priority': '删除优先级',
        'Priority levels': '优先级级别',
        'Priority colors': '优先级颜色',
        'Issue severities': '问题严重性',
        'Severities': '严重性',
        'Manage severities': '管理严重性',
        'Create severity': '创建严重性',
        'Edit severity': '编辑严重性',
        'Delete severity': '删除严重性',
        'Severity levels': '严重性级别',
        'Severity colors': '严重性颜色',
        'Issue labels': '问题标签',
        'Labels': '标签',
        'Manage labels': '管理标签',
        'Create label': '创建标签',
        'Edit label': '编辑标签',
        'Delete label': '删除标签',
        'Label colors': '标签颜色',
        'Label search': '标签搜索',
        'Label filters': '标签筛选器',
        'Popular labels': '热门标签',
        'Recent labels': '最近使用的标签',
        'Issue milestones': '问题里程碑',
        'Milestones': '里程碑',
        'Manage milestones': '管理里程碑',
        'Create milestone': '创建里程碑',
        'Edit milestone': '编辑里程碑',
        'Delete milestone': '删除里程碑',
        'Milestone progress': '里程碑进度',
        'Milestone due date': '里程碑截止日期',
        'Milestone start date': '里程碑开始日期',
        'Upcoming milestones': '即将到来的里程碑',
        'Past milestones': '过去的里程碑',
        'Completed milestones': '已完成的里程碑',
        'Active milestones': '活跃的里程碑',
        'Issue projects': '问题项目',
        'Projects': '项目',
        'Manage projects': '管理项目',
        'Create project': '创建项目',
        'Edit project': '编辑项目',
        'Delete project': '删除项目',
        'Project boards': '项目看板',
        'Project timeline': '项目时间线',
        'Project roadmap': '项目路线图',
        'Project progress': '项目进度',
        'Project members': '项目成员',
        'Add project member': '添加项目成员',
        'Remove project member': '移除项目成员',
        'Project permissions': '项目权限',
        'Project settings': '项目设置',
        'Issue teams': '问题团队',
        'Teams': '团队',
        'Manage teams': '管理团队',
        'Create team': '创建团队',
        'Edit team': '编辑团队',
        'Delete team': '删除团队',
        'Team members': '团队成员',
        'Add team member': '添加团队成员',
        'Remove team member': '移除团队成员',
        'Team permissions': '团队权限',
        'Team settings': '团队设置',
        'Issue organizations': '问题组织',
        'Organizations': '组织',
        'Manage organizations': '管理组织',
        'Create organization': '创建组织',
        'Edit organization': '编辑组织',
        'Delete organization': '删除组织',
        'Organization members': '组织成员',
        'Add organization member': '添加组织成员',
        'Remove organization member': '移除组织成员',
        'Organization teams': '组织团队',
        'Organization permissions': '组织权限',
        'Organization settings': '组织设置',
        // 组织设置页面补充项
        'Your organizations': '你的组织',
        'Organization profile': '组织资料',
        'Organization dashboard': '组织仪表盘',
        'Organization repositories': '组织仓库',
        'Organization projects': '组织项目',
        'Organization packages': '组织包',
        'Organization billing': '组织账单',
        'Organization security': '组织安全',
        'Organization insights': '组织洞察',
        'Organization hooks': '组织钩子',
        'Organization integrations': '组织集成',
        'Organization apps': '组织应用',
        'Organization policies': '组织策略',
        'Organization secrets': '组织密钥',
        'Organization variables': '组织变量',
        'Organization audit log': '组织审计日志',
        'Organization access settings': '组织访问设置',
        'Organization visibility': '组织可见性',
        'Organization collaboration': '组织协作',
        'Organization notifications': '组织通知',
        'Organization email settings': '组织邮箱设置',
        'Organization webhooks': '组织Webhooks',
        'Organization rules': '组织规则',
        'Organization templates': '组织模板',
        'Organization governance': '组织治理',
        'Issue users': '问题用户',
        'Users': '用户',
        'Manage users': '管理用户',
        'Add user': '添加用户',
        'Remove user': '移除用户',
        'User profile': '用户资料',
        'User activity': '用户活动',
        'User contributions': '用户贡献',
        'User permissions': '用户权限',
        'User settings': '用户设置',
        'Oldest': '最早',
        'Most commented': '评论最多',
        'Least commented': '评论最少',
        'Recently updated': '最近更新',
        'Least recently updated': '最久未更新',
        'Filter by author': '按作者筛选',
        'Filter by assignee': '按经办人筛选',
        'Filter by label': '按标签筛选',
        'Filter by milestone': '按里程碑筛选',
        'Filter by project': '按项目筛选',
        'Filter by state': '按状态筛选',
        'Filter by language': '按语言筛选',
        
        // ========== 新增翻译项 - Pull Requests页面 ==========
        'Your pull requests': '你的拉取请求',
        'Created by you': '由你创建',
        'Assigned to you': '分配给你',
        'Mentioned you': '提及你',
        'Review requested': '请求你审查',
        'Draft': '草稿',
        'Merged': '已合并',
        'All pull requests': '所有拉取请求',
        'Show all activity': '显示所有活动',
        'Show only comments': '仅显示评论',
        'Show only commits': '仅显示提交',
        'Show only file changes': '仅显示文件变更',
        'Compare changes': '比较更改',
        'Create a pull request': '创建拉取请求',
        'Compare & pull request': '比较并拉取请求',
        // ========== 拉取请求页面 - 筛选器选项 ==========
        'Filters': '筛选器',
        'Filter by': '按以下筛选',
        'State': '状态',
        'Author': '作者',
        'Assignee': '经办人',
        'Reviewer': '审查者',
        'Mentions': '提及',
        'Team': '团队',
        'Label': '标签',
        'Milestone': '里程碑',
        'Project': '项目',
        'Base branch': '基准分支',
        'Head branch': '目标分支',
        'Review status': '审查状态',
        'Changed files': '已更改文件',
        'Commits': '提交',
        'Age': '存在时间',
        'Last updated': '最后更新',
        'Created': '创建时间',
        'Direction': '方向',
        // ========== 拉取请求页面 - 筛选器值 ==========
        'No reviews': '无审查',
        'Review required': '需要审查',
        'Approved': '已批准',
        'Changes requested': '需要更改',
        'All reviewers': '所有审查者',
        'All assignees': '所有经办人',
        'All labels': '所有标签',
        'All milestones': '所有里程碑',
        'All projects': '所有项目',
        'All branches': '所有分支',
        'All statuses': '所有状态',
        'All authors': '所有作者',
        'All teams': '所有团队',
        'All mentions': '所有提及',
        'Within': '在',
        'days': '天内',
        'weeks': '周内',
        'months': '月内',
        'years': '年内',
        'Any time': '任何时间',
        'Today': '今天',
        'Yesterday': '昨天',
        'This week': '本周',
        'Last week': '上周',
        'This month': '本月',
        'Last month': '上月',
        'This quarter': '本季度',
        'Last quarter': '上季度',
        'This year': '今年',
        'Last year': '去年',
        // ========== 拉取请求页面 - 排序选项 ==========
        'Recently updated': '最近更新',
        'Least recently updated': '最早更新',
        'Recently created': '最近创建',
        'Least recently created': '最早创建',
        'Most commented': '最多评论',
        'Least commented': '最少评论',
        'Most commits': '最多提交',
        'Least commits': '最少提交',
        'Most changed files': '最多更改文件',
        'Least changed files': '最少更改文件',
        'Alphabetically': '按字母顺序',
        'Reverse alphabetically': '按反向字母顺序',
        'Most discussed': '讨论最多',
        'Least discussed': '讨论最少',
        'Most active': '最活跃',
        'Least active': '最不活跃',
        // ========== 拉取请求页面 - 操作和状态 ==========
        'Refresh': '刷新',
        'Clear filters': '清除筛选器',
        'Save filters': '保存筛选器',
        'Apply filters': '应用筛选器',
        'Share filters': '分享筛选器',
        'Custom filters': '自定义筛选器',
        'Save as new filter': '另存为新筛选器',
        'Edit filter': '编辑筛选器',
        'Delete filter': '删除筛选器',
        'Filter name': '筛选器名称',
        'Confirm delete': '确认删除',
        'Loading pull requests': '加载拉取请求中',
        'No pull requests found': '未找到拉取请求',
        'Pull requests': '拉取请求',
        'Pull request': '拉取请求',
        'Draft pull request': '草稿拉取请求',
        'Open pull request': '开放的拉取请求',
        'Closed pull request': '已关闭的拉取请求',
        'Merged pull request': '已合并的拉取请求',
        'Review pull request': '审查拉取请求',
        'View pull request': '查看拉取请求',
        'Close pull request': '关闭拉取请求',
        'Reopen pull request': '重新打开拉取请求',
        'Merge pull request': '合并拉取请求',
        'Squash and merge': '压缩并合并',
        'Rebase and merge': '变基并合并',
        'Create a merge commit': '创建合并提交',
        'Merge options': '合并选项',
        'Automatically delete branch': '自动删除分支',
        'Delete branch': '删除分支',
        'Restore branch': '恢复分支',
        'Resolve conflicts': '解决冲突',
        'Pull request conflicts': '拉取请求冲突',
        'Cannot automatically merge': '无法自动合并',
        'Ready for review': '准备好审查',
        'Convert to draft': '转换为草稿',
        'Still in progress': '仍在进行中',
        'Waiting for my review': '等待我的审查',
        'Waiting for others': '等待他人',
        'Needs work': '需要工作',
        'Approved': '已批准',
        'Changes requested': '需要更改',
        'Commented': '已评论',
        'Review required': '需要审查',
        'Required reviewers': '必需的审查者',
        'Reviewers': '审查者',
        'Add reviewers': '添加审查者',
        'Remove reviewer': '移除审查者',
        'Reviewer status': '审查者状态',
        'Review summary': '审查摘要',
        'Start a review': '开始审查',
        'Finish your review': '完成你的审查',
        'Submit review': '提交审查',
        'Comment': '评论',
        'Approve': '批准',
        'Request changes': '请求更改',
        'Review changes': '审查更改',
        'Show changes': '显示更改',
        'Hide changes': '隐藏更改',
        'Compare branches': '比较分支',
        'Compare across forks': '跨复刻比较',
        'New pull request': '新建拉取请求',
        'Create pull request': '创建拉取请求',
        'Compare & pull request': '比较并拉取请求',
        'From': '从',
        'To': '到',
        'Branch': '分支',
        'Repository': '仓库',
        'Owner': '所有者',
        'Source': '源',
        'Destination': '目标',
        'Title': '标题',
        'Description': '描述',
        'Linked issues': '关联的问题',
        'Close issues': '关闭问题',
        'Fixes': '修复',
        'Closes': '关闭',
        'Resolves': '解决',
        'Relates to': '与...相关',
        'Add assignees': '添加经办人',
        'Assignees': '经办人',
        'Add labels': '添加标签',
        'Labels': '标签',
        'Add milestone': '添加里程碑',
        'Milestone': '里程碑',
        'Add projects': '添加项目',
        'Projects': '项目',
        'Link a pull request': '关联拉取请求',
        'Linked pull requests': '关联的拉取请求',
        'Rebase and merge': '变基并合并',
        'Squash and merge': '压缩并合并',
        'Create a merge commit': '创建合并提交',
        'Delete head branch after merge': '合并后删除源分支',
        'Confirm merge': '确认合并',
        'Merge completed': '合并完成',
        'Pull request merged': '拉取请求已合并',
        'Pull request closed': '拉取请求已关闭',
        'Pull request reopened': '拉取请求已重新打开',
        'Pull request converted to draft': '拉取请求已转换为草稿',
        'Pull request marked as ready for review': '拉取请求已标记为准备好审查',
        'Pull request review submitted': '拉取请求审查已提交',
        'Pull request approved': '拉取请求已批准',
        'Pull request changes requested': '拉取请求需要更改',
        'Pull request commented': '拉取请求已评论',
        'Pull request assignee added': '拉取请求已添加经办人',
        'Pull request assignee removed': '拉取请求已移除经办人',
        'Pull request label added': '拉取请求已添加标签',
        'Pull request label removed': '拉取请求已移除标签',
        'Pull request milestone added': '拉取请求已添加里程碑',
        'Pull request milestone removed': '拉取请求已移除里程碑',
        'Pull request project added': '拉取请求已添加项目',
        'Pull request project removed': '拉取请求已移除项目',
        'Pull request reviewer added': '拉取请求已添加审查者',
        'Pull request reviewer removed': '拉取请求已移除审查者',
        // ========== 拉取请求页面 - 团队和组织选项 ==========
        'Team pull requests': '团队拉取请求',
        'Organization pull requests': '组织拉取请求',
        'All teams': '所有团队',
        'All organizations': '所有组织',
        'Select team': '选择团队',
        'Select organization': '选择组织',
        'My teams': '我的团队',
        'My organizations': '我的组织',
        'Team reviews': '团队审查',
        'Organization reviews': '组织审查',
        'Team review requests': '团队审查请求',
        'Organization review requests': '组织审查请求',
        'Team contributions': '团队贡献',
        'Organization contributions': '组织贡献',
        // ========== 拉取请求页面 - 其他UI元素 ==========
        'Pull request details': '拉取请求详情',
        'Pull request timeline': '拉取请求时间线',
        'Pull request files': '拉取请求文件',
        'Pull request commits': '拉取请求提交',
        'Pull request checks': '拉取请求检查',
        'Pull request discussions': '拉取请求讨论',
        'Pull request activity': '拉取请求活动',
        'Pull request metadata': '拉取请求元数据',
        'Pull request metrics': '拉取请求指标',
        'Pull request statistics': '拉取请求统计',
        'Pull request history': '拉取请求历史',
        'Pull request notifications': '拉取请求通知',
        'Pull request subscriptions': '拉取请求订阅',
        'Subscribe': '订阅',
        'Unsubscribe': '取消订阅',
        'Watch': '关注',
        'Unwatch': '取消关注',
        'Ignore': '忽略',
        'Participate': '参与',
        'Pull request settings': '拉取请求设置',
        'Settings': '设置',
        'Pull request templates': '拉取请求模板',
        'Templates': '模板',
        'Use template': '使用模板',
        'Create template': '创建模板',
        'Edit template': '编辑模板',
        'Delete template': '删除模板',
        'Template name': '模板名称',
        'Template description': '模板描述',
        'Apply template': '应用模板',
        'Pull request guidelines': '拉取请求指南',
        'Guidelines': '指南',
        'View guidelines': '查看指南',
        'Edit guidelines': '编辑指南',
        'Pull request tips': '拉取请求提示',
        'Tips': '提示',
        'Show tips': '显示提示',
        'Hide tips': '隐藏提示',
        'Pull request help': '拉取请求帮助',
        'Help': '帮助',
        'Get help': '获取帮助',
        'Pull request documentation': '拉取请求文档',
        'Documentation': '文档',
        'Read documentation': '阅读文档',
        'Pull request examples': '拉取请求示例',
        'Examples': '示例',
        'View examples': '查看示例',
        
        // ========== 新增翻译项 - Explore页面 ==========
        'Explore GitHub': '探索GitHub',
        'Trending repositories': '热门仓库',
        'Trending developers': '热门开发者',
        'Topics': '主题',
        'Collections': '合集',
        'Learn Git and GitHub': '学习Git和GitHub',
        'Recommended for you': '为你推荐',
        'Based on your stars': '基于你的标星',
        'Based on your activity': '基于你的活动',
        'Popular this week': '本周热门',
        'Popular this month': '本月热门',
        'Popular this year': '今年热门',
        'Show more': '显示更多',
        'Browse categories': '浏览分类',
        'Featured projects': '精选项目',
        'Staff picks': '官方推荐',
        'Recently added': '最近添加',
        'Most starred': '最多标星',
        'Discover projects': '发现项目',
        'Discover topics': '发现主题',
        'Discover collections': '发现合集',
        'Trending': '趋势',
        'Daily': '每日',
        'Weekly': '每周',
        'Monthly': '每月',
        'Language': '语言',
        'All languages': '所有语言',
        'Recommended topics': '推荐主题',
        'Popular topics': '热门主题',
        'Recently trending': '最近趋势',
        'Explore repositories': '探索仓库',
        'Repository results': '仓库结果',
        'Sort by': '排序方式',
        'Last updated': '最近更新',
        'Stars': '星标数',
        'Forks': '复刻数',
        'Helpful community': '互助社区',
        'Popular collections': '热门合集',
        'Curated by': '由...策划',
        'Community curated': '社区策划',
        'Official': '官方',
        'Recommended collections': '推荐合集',
        
        // ========== 新增翻译项 - 通用交互元素 ==========
        'Create': '创建',
        'Edit': '编辑',
        'Delete': '删除',
        'Save': '保存',
        'Cancel': '取消',
        'Apply': '应用',
        'Update': '更新',
        'Confirm': '确认',
        'Close': '关闭',
        'Open': '打开',
        'Select': '选择',
        'Deselect': '取消选择',
        'View': '查看',
        'Hide': '隐藏',
        'Show': '显示',
        'Expand': '展开',
        'Collapse': '折叠',
        'Refresh': '刷新',
        'Reload': '重新加载',
        'Reset': '重置',
        'Search': '搜索',
        'Filter': '筛选',
        'Sort': '排序',
        'Filter results': '筛选结果',
        'Sort by': '排序方式',
        'Group by': '分组方式',
        'View options': '查看选项',
        'Display options': '显示选项',
        'Preferences': '偏好设置',
        'Settings': '设置',
        'Help': '帮助',
        'Support': '支持',
        'Documentation': '文档',
        'About': '关于',
        'Privacy': '隐私',
        'Terms': '条款',
        'Security': '安全',
        'Contact': '联系',
        'Feedback': '反馈',
        'Report': '报告',
        'Share': '分享',
        'Copy': '复制',
        'Paste': '粘贴',
        'Cut': '剪切',
        'Undo': '撤销',
        'Redo': '重做',
        'Download': '下载',
        'Upload': '上传',
        'Import': '导入',
        'Export': '导出',
        'Print': '打印',
        'Save as': '另存为',
        'Open with': '使用...打开',
        'Rename': '重命名',
        'Move': '移动',
        'Duplicate': '复制',
        'Archive': '归档',
        'Unarchive': '取消归档',
        'Restore': '恢复',
        'Permanently delete': '永久删除',
        'Confirm deletion': '确认删除',
        
        // ========== 新增翻译项 - 状态和标签 ==========
        'Trial': '试用',
        'Subscription': '订阅',
        'License': '许可证',
        
        // ========== 设置页面相关翻译项 ==========
        // 组织设置页面
        'New organization': '新建组织',
        // 组织设置页面补充项
        'Organization name': '组织名称',
        'Organization description': '组织描述',
        'Organization website': '组织网站',
        'Organization location': '组织位置',
        'Organization email': '组织邮箱',
        'Organization avatar': '组织头像',
        'Organization default repository permission': '组织默认仓库权限',
        'Organization base permissions': '组织基础权限',
        'Organization member can create repositories': '组织成员可创建仓库',
        'Organization member can create teams': '组织成员可创建团队',
        'Organization member can create projects': '组织成员可创建项目',
        'Organization member can create pages': '组织成员可创建页面',
        'Organization member can create apps': '组织成员可创建应用',
        'Organization outside collaborators': '组织外部协作者',
        'Organization pending members': '组织待处理成员',
        'Organization invitations': '组织邀请',
        'Organization owners': '组织所有者',
        'Organization moderators': '组织审核者',
        'Organization general settings': '组织一般设置',
        'Organization member settings': '组织成员设置',
        'Organization repository settings': '组织仓库设置',
        'Organization team settings': '组织团队设置',
        'Organization notifications': '组织通知',
        'Organization activity': '组织活动',
        'Organization insights': '组织洞察',
        'Organization analytics': '组织分析',
        'Organization compliance': '组织合规',
        'Organization data': '组织数据',
        'Organization export': '组织导出',
        'Organization deletion': '组织删除',
        'Organization transfer': '组织转移',
        'Organization archive': '组织归档',
        
        // 企业设置页面
        'Enterprises': '企业',
        // 企业设置页面补充项
        'Your enterprises': '你的企业',
        'Enterprise dashboard': '企业仪表盘',
        'Enterprise organizations': '企业组织',
        'Enterprise repositories': '企业仓库',
        'Enterprise projects': '企业项目',
        'Enterprise packages': '企业包',
        'Enterprise billing': '企业账单',
        'Enterprise security': '企业安全',
        'Enterprise compliance': '企业合规',
        'Enterprise insights': '企业洞察',
        'Enterprise hooks': '企业钩子',
        'Enterprise integrations': '企业集成',
        'Enterprise apps': '企业应用',
        'Enterprise policies': '企业策略',
        'Enterprise secrets': '企业密钥',
        'Enterprise variables': '企业变量',
        'Enterprise audit log': '企业审计日志',
        'Enterprise access settings': '企业访问设置',
        'Enterprise SAML': '企业SAML',
        'Enterprise SCIM': '企业SCIM',
        'Enterprise identity provider': '企业身份提供商',
        'Enterprise permissions': '企业权限',
        'Enterprise roles': '企业角色',
        'Enterprise teams': '企业团队',
        'Enterprise user management': '企业用户管理',
        'Enterprise license': '企业许可证',
        'Enterprise usage': '企业使用情况',
        'Enterprise reporting': '企业报告',
        'Enterprise webhooks': '企业Webhooks',
        'Enterprise API': '企业API',
        'Enterprise support': '企业支持',
        'Enterprise contact': '企业联系人',
        'Enterprise plan': '企业计划',
        'Enterprise members': '企业成员',
        // 企业设置页面额外补充项
        'Enterprise default organization settings': '企业默认组织设置',
        'Enterprise organization policies': '企业组织策略',
        'Enterprise repository policies': '企业仓库策略',
        'Enterprise user policies': '企业用户策略',
        'Enterprise security policies': '企业安全策略',
        'Enterprise compliance policies': '企业合规策略',
        'Enterprise retention policies': '企业保留策略',
        'Enterprise deletion policies': '企业删除策略',
        'Enterprise backup policies': '企业备份策略',
        'Enterprise recovery policies': '企业恢复策略',
        'Enterprise migration policies': '企业迁移策略',
        'Enterprise onboarding': '企业入职',
        'Enterprise offboarding': '企业离职',
        'Enterprise user lifecycle': '企业用户生命周期',
        'Enterprise identity governance': '企业身份治理',
        'Enterprise access control': '企业访问控制',
        'Enterprise RBAC': '企业角色权限控制',
        'Enterprise groups': '企业群组',
        'Enterprise subgroups': '企业子群组',
        'Enterprise nested groups': '企业嵌套群组',
        'Enterprise group policies': '企业群组策略',
        'Enterprise group management': '企业群组管理',
        'Enterprise resource management': '企业资源管理',
        'Enterprise budget management': '企业预算管理',
        'Enterprise cost tracking': '企业成本跟踪',
        'Enterprise usage analytics': '企业使用分析',
        'Enterprise performance metrics': '企业性能指标',
        'Enterprise productivity metrics': '企业生产力指标',
        'Enterprise collaboration metrics': '企业协作指标',
        'Enterprise developer velocity': '企业开发者速度',
        'Enterprise code quality': '企业代码质量',
        'Enterprise security posture': '企业安全态势',
        'Enterprise compliance status': '企业合规状态',
        'Enterprise reporting dashboard': '企业报告仪表盘',
        'Enterprise custom reports': '企业自定义报告',
        'Enterprise scheduled reports': '企业定期报告',
        'Enterprise report sharing': '企业报告共享',
        'Enterprise data export': '企业数据导出',
        'Enterprise data retention': '企业数据保留',
        'Enterprise data backup': '企业数据备份',
        'Enterprise data recovery': '企业数据恢复',
        'Enterprise disaster recovery': '企业灾难恢复',
        'Enterprise business continuity': '企业业务连续性',
        'Enterprise support tickets': '企业支持工单',
        'Enterprise priority support': '企业优先支持',
        'Enterprise dedicated support': '企业专属支持',
        'Enterprise technical account manager': '企业技术客户经理',
        'Enterprise success manager': '企业成功经理',
        'Enterprise training': '企业培训',
        'Enterprise documentation': '企业文档',
        'Enterprise knowledge base': '企业知识库',
        'Enterprise best practices': '企业最佳实践',
        'Enterprise templates': '企业模板',
        'Enterprise playbooks': '企业手册',
        'Enterprise governance': '企业治理',
        'Enterprise compliance audits': '企业合规审计',
        'Enterprise security audits': '企业安全审计',
        'Enterprise internal audits': '企业内部审计',
        'Enterprise external audits': '企业外部审计',
        'Enterprise audit reports': '企业审计报告',
        'Enterprise audit trails': '企业审计轨迹',
        'Enterprise audit logs management': '企业审计日志管理',
        'Enterprise audit retention': '企业审计保留',
        'Enterprise audit access': '企业审计访问',
        'Enterprise audit permissions': '企业审计权限',
        'Enterprise audit configuration': '企业审计配置',
        'Enterprise audit settings': '企业审计设置',
        
        // 企业创建页面
        'Create an enterprise account': '创建企业账户',
        'Enterprise name': '企业名称',
        'Contact email': '联系邮箱',
        'Enterprise URL slug': '企业URL标识符',
        'Company or organization': '公司或组织',
        'Enterprise size': '企业规模',
        'Industry': '行业',
        'Terms of Service': '服务条款',
        'Privacy Policy': '隐私政策',
        'Create enterprise': '创建企业',
        'Already have an enterprise account': '已有企业账户',
        'Enterprise owners': '企业所有者',
        'Enterprise profile': '企业资料',
        
        // 企业设置页面 (原内容继续)
        
        // 交互限制设置页面
        'Interaction limits': '交互限制',
        'Temporary interaction limits': '临时交互限制',
        'Limit interactions': '限制交互',
        'Interaction expiry': '交互过期时间',
        'Restrict to collaborators': '仅限协作者',
        'Restrict to organization members': '仅限组织成员',
        
        // 代码审查限制设置页面
        'Code review limits': '代码审查限制',
        'Pull request review limits': '拉取请求审查限制',
        'Review time limit': '审查时间限制',
        'Reviewer assignment': '审查者分配',
        'Auto-approve after': '自动批准时间',
        
        // Codespaces 设置页面
        'Codespaces': '代码空间',
        'Codespace configurations': '代码空间配置',
        'Default machine type': '默认机器类型',
        'Retention period': '保留期',
        'Idle timeout': '空闲超时',
        'Prebuild settings': '预构建设置',
        'Codespace secrets': '代码空间密钥',
        
        // 模型设置页面
        'Models': '模型',
        'AI models': 'AI模型',
        'Model configuration': '模型配置',
        'Default model': '默认模型',
        'Model permissions': '模型权限',
        'Model usage': '模型使用情况',
        
        // 包设置页面
        'Packages': '包',
        'Package management': '包管理',
        'Package visibility': '包可见性',
        'Package deletion': '包删除',
        'Package settings': '包设置',
        
        // Copilot 功能设置页面
        'GitHub Copilot': 'GitHub Copilot',
        'Copilot': 'Copilot',
        'Copilot features': 'Copilot功能',
        'Copilot settings': 'Copilot设置',
        'Copilot coding agent': 'Copilot编码代理',
        'Agent mode': '代理模式',
        'Copilot Chat': 'Copilot聊天',
        'Copilot Enterprise': 'Copilot企业版',
        'Copilot for Business': 'Copilot商业版',
        'Copilot for Individuals': 'Copilot个人版',
        'Copilot autocomplete': 'Copilot自动完成',
        'Copilot suggestions': 'Copilot建议',
        'Copilot customization': 'Copilot自定义',
        'Copilot language models': 'Copilot语言模型',
        'Copilot response formatting': 'Copilot响应格式',
        'Copilot context awareness': 'Copilot上下文感知',
        'Copilot code explanations': 'Copilot代码解释',
        'Copilot code generation': 'Copilot代码生成',
        'Copilot code refactoring': 'Copilot代码重构',
        'Copilot code completion': 'Copilot代码补全',
        'Copilot test generation': 'Copilot测试生成',
        'Copilot documentation generation': 'Copilot文档生成',
        'Copilot inline suggestions': 'Copilot内联建议',
        'Copilot tab completion': 'CopilotTab补全',
        'Copilot keyboard shortcuts': 'Copilot键盘快捷键',
        'Copilot privacy settings': 'Copilot隐私设置',
        'Copilot usage data': 'Copilot使用数据',
        'Copilot code matching': 'Copilot代码匹配',
        'Copilot language support': 'Copilot语言支持',
        'Copilot editor integration': 'Copilot编辑器集成',
        'Copilot plugins': 'Copilot插件',
        'Copilot custom models': 'Copilot自定义模型',
        'Copilot for Teams': 'Copilot团队版',
        'Copilot team settings': 'Copilot团队设置',
        'Copilot organization settings': 'Copilot组织设置',
        'Copilot enterprise settings': 'Copilot企业设置',
        'Copilot billing': 'Copilot账单',
        'Copilot subscription': 'Copilot订阅',
        'Copilot trial': 'Copilot试用',
        'Copilot plan': 'Copilot计划',
        'Copilot feedback': 'Copilot反馈',
        'Copilot help': 'Copilot帮助',
        'Copilot documentation': 'Copilot文档',
        'Copilot learning resources': 'Copilot学习资源',
        // Copilot功能设置页面特定项
        'Copilot Features': 'Copilot功能设置',
        'Feature settings': '功能设置',
        'Code suggestions': '代码建议',
        'Completion settings': '补全设置',
        'Inline chat': '内联聊天',
        'Chat interface': '聊天界面',
        'Code intelligence': '代码智能',
        'Code explanations': '代码解释',
        'Refactoring assistance': '重构辅助',
        'Test generation': '测试生成',
        'Documentation generation': '文档生成',
        'Terminal assistance': '终端辅助',
        'Pull request review': '拉取请求审查',
        'Security scanning': '安全扫描',
        'Model selection': '模型选择',
        'Advanced settings': '高级设置',
        'Editor integration': '编辑器集成',
        'IDE integration': 'IDE集成',
        'Integration settings': '集成设置',
        'Team preferences': '团队偏好',
        'Organization preferences': '组织偏好',
        'Enterprise preferences': '企业偏好',
        'Beta features': '测试功能',
        'Experimental features': '实验性功能',
        'Feature flags': '功能标志',
        'Usage analytics': '使用分析',
        'Performance metrics': '性能指标',
        'Latency optimization': '延迟优化',
        'Response quality': '响应质量',
        'Context window': '上下文窗口',
        'Prompt customization': '提示自定义',
        'Custom instructions': '自定义指令',
        'Knowledge base': '知识库',
        'Repository context': '仓库上下文',
        'Personalization settings': '个性化设置',
        'Inline suggestions': '行内建议',
        
        // Pages 设置页面
        'Pages': 'Pages',
        'GitHub Pages': 'GitHub Pages',
        'Build and deployment': '构建与部署',
        'Custom domains': '自定义域名',
        'HTTPS enforcement': '强制HTTPS',
        'Branch': '分支',
        'Folder': '文件夹',
        
        // 回复设置页面
        'Replies': '回复',
        'Saved replies': '已保存回复',
        'New saved reply': '新建已保存回复',
        'Reply templates': '回复模板',
        'Delete saved reply': '删除已保存回复',
        
        // 安全分析设置页面
        'Security analysis': '安全分析',
        'Code security': '代码安全',
        'Security features': '安全功能',
        'Dependabot alerts': 'Dependabot提醒',
        'Code scanning': '代码扫描',
        'Secret scanning': '密钥扫描',
        'Security policy': '安全策略',
        
        // 安装设置页面
        'Installations': '安装',
        'GitHub Apps installations': 'GitHub应用安装',
        'Manage installations': '管理安装',
        'Installed apps': '已安装应用',
        
        // 安全日志设置页面
        'Security log': '安全日志',
        'Security events': '安全事件',
        'Log search': '日志搜索',
        'Log export': '日志导出',
        'Event type': '事件类型',
        'Actor': '操作人',
        'Date range': '日期范围',
        
        // 赞助日志设置页面
        'Sponsors log': '赞助日志',
        'Sponsorship events': '赞助事件',
        'Sponsor payments': '赞助付款',
        'Sponsorship history': '赞助历史',
        
        // 应用设置页面
        'Apps': '应用',
        'GitHub Apps': 'GitHub应用',
        'OAuth Apps': 'OAuth应用',
        'Authorized apps': '已授权应用',
        'Developer apps': '开发者应用',
        'App permissions': '应用权限',
        'App webhooks': '应用webhooks',
        
        // ========== 新增翻译项 - 开发相关术语 ==========
        'Repository': '仓库',
        'Organization': '组织',
        'User': '用户',
        'Team': '团队',
        'Member': '成员',
        'Collaborator': '协作者',
        'Contributor': '贡献者',
        'Maintainer': '维护者',
        'Owner': '所有者',
        'Admin': '管理员',
        'Moderator': '审核者',
        'Guest': '访客',
        'Role': '角色',
        'Permission': '权限',
        'Access': '访问',
        'Visibility': '可见性',
        'Branches': '分支',
        'Tags': '标签',
        'Commits': '提交',
        'Pull requests': '拉取请求',
        'Issues': '问题',
        'Discussions': '讨论',
        'Projects': '项目',
        'Wiki': '维基',
        'Actions': '操作',
        'Packages': '包',
        'Security': '安全',
        'Insights': '洞察',
        'Pages': 'Pages',
        'Codespaces': 'Codespaces',
        'Gists': '代码片段',
        'Marketplace': '市场',
        'Sponsors': '赞助者',
        'Sponsoring': '赞助中',
        
        // ========== 新增翻译项 - 工作流相关术语 ==========
        'Workflow': '工作流',
        'Run': '运行',
        'Job': '任务',
        'Step': '步骤',
        'Action': '操作',
        'Artifact': '产物',
        'Cache': '缓存',
        'Runner': '运行器',
        'Self-hosted': '自托管',
        'Status': '状态',
        'Duration': '持续时间',
        'Trigger': '触发',
        'Branch': '分支',
        'Tag': '标签',
        'Commit': '提交',
        'Pull request': '拉取请求',
        'Schedule': '计划',
        'Manual': '手动',
        'Event': '事件',
        'Workflow file': '工作流文件',
        'Workflow runs': '工作流运行记录',
        'Workflow history': '工作流历史',
        'Workflow logs': '工作流日志',
        'Download logs': '下载日志',
        'Rerun workflow': '重新运行工作流',
        'Cancel workflow': '取消工作流',
        
        // ========== 新增翻译项 - 通知相关术语 ==========
        'Notifications': '通知',
        'Inbox': '收件箱',
        'Unread notifications': '未读通知',
        'All notifications': '所有通知',
        'Participating': '参与的',
        'Saved': '已保存',
        'Muted': '已静音',
        'Notification settings': '通知设置',
        
        'Email notifications': '邮件通知',
        'Web notifications': '网页通知',
        'Mobile notifications': '移动通知',
        'Desktop notifications': '桌面通知',
        'Notification preferences': '通知偏好设置',
        
        // ========== 通知类型 ==========
        'Pull request review': '拉取请求审查',
        'Issue comment': '问题评论',
        'Commit comment': '提交评论',
        'Pull request comment': '拉取请求评论',
        'Mention': '提及',
        'Assignment': '任务分配',
        'Review requested': '请求审查',
        'Status change': '状态变更',
        'Repository activity': '仓库活动',
        
        // ========== 通知过滤选项 ==========
        'Filter notifications': '筛选通知',
        'Search notifications': '搜索通知',
        'Reason': '原因',
        'Type': '类型',
        'Repository': '仓库',
        'All repositories': '所有仓库',
        'Mentioned': '提及',
        'Team mentioned': '团队提及',
        'Assigned': '已分配',
        'Reviewed': '已审查',
        'Security alert': '安全警报',
        'Pull request': '拉取请求',
        'Issue': '问题',
        'Commit': '提交',
        'Release': '发布',
        'Branch': '分支',
        'Tag': '标签',
        'Discussion': '讨论',
        'Star': '标星',
        'Watch': '关注',
        'Fork': '复刻',
        'Collaborator': '协作者',
        'Member': '成员',
        'Owner': '所有者',
        
        // ========== 通知状态和显示选项 ==========
        'Read': '已读',
        'Unread': '未读',
        'Older notifications': '更早的通知',
        'Earlier': '更早',
        'Today': '今天',
        'Yesterday': '昨天',
        'This week': '本周',
        'Last week': '上周',
        'This month': '本月',
        'Last month': '上月',
        'This year': '今年',
        
        // ========== 通知内容动词和短语 ==========
        'commented on': '评论了',
        'reviewed': '审查了',
        'mentioned you in': '在...中提到了你',
        'assigned you to': '将你分配到',
        'requested your review on': '请求你审查',
        'opened': '开启了',
        'closed': '关闭了',
        'merged': '合并了',
        'pushed to': '推送到',
        'created branch': '创建了分支',
        'created tag': '创建了标签',
        'released': '发布了',
        'published': '发布了',
        'forked': '复刻了',
        'starred': '标星了',
        'watched': '关注了',
        'unstarred': '取消标星',
        'unwatched': '取消关注',
        'renamed': '重命名了',
        'deleted': '删除了',
        'archived': '归档了',
        'unarchived': '取消归档',
        'transferred': '转移了',
        'made public': '设为公开',
        'made private': '设为私有',
        'invited you to': '邀请你加入',
        'approved your': '批准了你的',
        'requested changes to your': '请求修改你的',
        'commented on your': '评论了你的',
        'liked your comment': '赞了你的评论',
        'started following you': '开始关注你',
        'created a team': '创建了团队',
        'added you to team': '将你添加到团队',
        'removed you from team': '将你从团队中移除',
        'changed repository visibility': '更改了仓库可见性',
        'closed and locked': '关闭并锁定了',
        'reopened': '重新开启了',
        'labeled': '添加了标签',
        'unlabeled': '移除了标签',
        'milestoned': '添加了里程碑',
        'demilestoned': '移除了里程碑',
        'referenced in': '在...中引用了',
        'cross-referenced in': '在...中交叉引用了',
        'merged into': '合并到',
        'synchronized with': '与...同步',
        'auto-merged': '自动合并了',
        // ========== 通知页面专用术语和功能 ==========
        'Mark as read': '标记为已读',
        'Mark as unread': '标记为未读',
        'Save': '保存',
        'Unsave': '取消保存',
        'Mute': '静音',
        'Unmute': '取消静音',
        'Reply': '回复',
        'View thread': '查看线程',
        'Filter by': '按...筛选',
        'Sort by': '按...排序',
        'Newest first': '最新优先',
        'Oldest first': '最早优先',
        'Most relevant': '最相关',
        'All threads': '所有线程',
        'Unread threads': '未读线程',
        'No notifications': '没有通知',
        'Notifications are disabled': '通知已禁用',
        'Manage your notification settings': '管理你的通知设置',
        'Mark all notifications as read': '将所有通知标记为已读',
        'You have no unread notifications': '你没有未读通知',
        'Notifications from GitHub': '来自 GitHub 的通知',
        'Notification thread unread': '通知线程未读',
        'Notification thread read': '通知线程已读',
        'Notification thread saved': '通知线程已保存',
        'Notification thread muted': '通知线程已静音',
        'Notification thread details': '通知线程详情',
        'Notification thread participants': '通知线程参与者',
        'Notification thread timestamp': '通知线程时间戳',
        'Notification thread actions': '通知线程操作',
        'Notification thread context': '通知线程上下文',
        'Notification thread content': '通知线程内容',
        'Notification thread metadata': '通知线程元数据',
        'Notification thread navigation': '通知线程导航',
        'Notification thread pagination': '通知线程分页',
        'Notification thread history': '通知线程历史',
        'Notification thread preview': '通知线程预览',
        'Notification thread summary': '通知线程摘要',
        'Notification thread status': '通知线程状态',
        'Notification thread type': '通知线程类型',
        'Notification thread priority': '通知线程优先级',
        'Notification thread source': '通知线程来源',
        'Notification thread subject': '通知线程主题',
        'Notification thread title': '通知线程标题',
        'Notification thread body': '通知线程正文',
        'Notification thread footer': '通知线程页脚',
        'Notification thread attachments': '通知线程附件',
        'Notification thread links': '通知线程链接',
        'Notification thread buttons': '通知线程按钮',
        'Notification thread badges': '通知线程标记',
        'Notification thread labels': '通知线程标签',
        'Notification thread mentions': '通知线程提及',
        'Notification thread reactions': '通知线程反应',
        'Notification thread comments': '通知线程评论',
        'Notification thread likes': '通知线程点赞',
        'Notification thread dislikes': '通知线程点踩',
        'Notification thread shares': '通知线程分享',
        'Notification thread forwards': '通知线程转发',
        'Notification thread copies': '通知线程复制',
        'Notification thread deletions': '通知线程删除',
        'Notification thread archives': '通知线程归档',
        'Notification thread restores': '通知线程恢复',
        'Notification thread exports': '通知线程导出',
        'Notification thread imports': '通知线程导入',
        'Notification thread prints': '通知线程打印',
        'Notification thread downloads': '通知线程下载',
        'Notification thread uploads': '通知线程上传',
        'Notification thread syncs': '通知线程同步',
        'Notification thread updates': '通知线程更新',
        'Notification thread refreshes': '通知线程刷新',
        'Notification thread reloads': '通知线程重载',
        'Notification thread clears': '通知线程清除',
        'Notification thread resets': '通知线程重置',
        'Notification thread expands': '通知线程展开',
        'Notification thread collapses': '通知线程折叠',
        'Notification thread shows': '通知线程显示',
        'Notification thread hides': '通知线程隐藏',
        'Notification thread filters': '通知线程筛选器',
        'Notification thread sorters': '通知线程排序器',
        'Notification thread searchers': '通知线程搜索器',
        'Notification thread selectors': '通知线程选择器',
        'Notification thread navigators': '通知线程导航器',
        'Notification thread paginators': '通知线程分页器',
        'Notification thread loaders': '通知线程加载器',
        'Notification thread savers': '通知线程保存器',
        'Notification thread muters': '通知线程静音器',
        'Notification thread markers': '通知线程标记器',
        'Notification thread replyers': '通知线程回复器',
        'Notification thread viewers': '通知线程查看器',
        'Notification thread managers': '通知线程管理器',
        'Notification thread handlers': '通知线程处理器',
        'Notification thread processors': '通知线程处理器',
        'Notification thread generators': '通知线程生成器',
        'Notification thread renderers': '通知线程渲染器',
        'Notification thread validators': '通知线程验证器',
        'Notification thread transformers': '通知线程转换器',
        'Notification thread formatters': '通知线程格式化器',
        'Notification thread parsers': '通知线程解析器',
        'Notification thread encoders': '通知线程编码器',
        'Notification thread decoders': '通知线程解码器',
        'Notification thread compressors': '通知线程压缩器',
        'Notification thread decompressors': '通知线程解压器',
        'Notification thread encryptors': '通知线程加密器',
        'Notification thread decryptors': '通知线程解密器',
        'Notification thread hashers': '通知线程哈希器',
        'Notification thread signers': '通知线程签名器',
        'Notification thread verifiers': '通知线程验证器',
        'Notification thread authenticators': '通知线程认证器',
        'Notification thread authorizers': '通知线程授权器',
        'Notification thread permissions': '通知线程权限',
        'Notification thread roles': '通知线程角色',
        'Notification thread policies': '通知线程策略',
        'Notification thread rules': '通知线程规则',
        'Notification thread constraints': '通知线程约束',
        'Notification thread limits': '通知线程限制',
        'Notification thread quotas': '通知线程配额',
        'Notification thread thresholds': '通知线程阈值',
        'Notification thread metrics': '通知线程指标',
        'Notification thread statistics': '通知线程统计',
        'Notification thread analytics': '通知线程分析',
        'Notification thread insights': '通知线程洞察',
        'Notification thread trends': '通知线程趋势',
        'Notification thread patterns': '通知线程模式',
        'Notification thread anomalies': '通知线程异常',
        'Notification thread alerts': '通知线程警报',
        'Notification thread warnings': '通知线程警告',
        'Notification thread errors': '通知线程错误',
        'Notification thread issues': '通知线程问题',
        'Notification thread bugs': '通知线程缺陷',
        'Notification thread features': '通知线程功能',
        'Notification thread improvements': '通知线程改进',
        'Notification thread optimizations': '通知线程优化',
        'Notification thread fixes': '通知线程修复',
        'Notification thread patches': '通知线程补丁',
        'Notification thread updates': '通知线程更新',
        'Notification thread upgrades': '通知线程升级',
        'Notification thread downgrades': '通知线程降级',
        'Notification thread rollbacks': '通知线程回滚',
        'Notification thread migrations': '通知线程迁移',
        'Notification thread deployments': '通知线程部署',
        'Notification thread releases': '通知线程发布',
        'Notification thread versions': '通知线程版本',
        'Notification thread builds': '通知线程构建',
        'Notification thread tests': '通知线程测试',
        'Notification thread results': '通知线程结果',
        'Notification thread statuses': '通知线程状态',
        'Notification thread progress': '通知线程进度',
        'Notification thread completion': '通知线程完成',
        'Notification thread success': '通知线程成功',
        'Notification thread failure': '通知线程失败',
        'Notification thread pending': '通知线程待处理',
        'Notification thread running': '通知线程运行中',
        'Notification thread stopped': '通知线程已停止',
        'Notification thread paused': '通知线程已暂停',
        'Notification thread resumed': '通知线程已恢复',
        'Notification thread canceled': '通知线程已取消',
        'Notification thread aborted': '通知线程已中止',
        'Notification thread timeout': '通知线程超时',
        'Notification thread retry': '通知线程重试',
        'Notification thread restart': '通知线程重启',
        'Notification thread continue': '通知线程继续',
        'Notification thread skip': '通知线程跳过',
        'Notification thread ignore': '通知线程忽略',
        'Notification thread acknowledge': '通知线程确认',
        'Notification thread resolve': '通知线程解决',
        'Notification thread close': '通知线程关闭',
        'Notification thread reopen': '通知线程重新开启',
        'Notification thread lock': '通知线程锁定',
        'Notification thread unlock': '通知线程解锁',
        'Notification thread pin': '通知线程固定',
        'Notification thread unpin': '通知线程取消固定',
        'Notification thread star': '通知线程标星',
        'Notification thread unstar': '通知线程取消标星',
        'Notification thread watch': '通知线程关注',
        'Notification thread unwatch': '通知线程取消关注',
        'Notification thread fork': '通知线程复刻',
        'Notification thread merge': '通知线程合并',
        'Notification thread split': '通知线程拆分',
        'Notification thread join': '通知线程合并',
        'Notification thread link': '通知线程链接',
        'Notification thread unlink': '通知线程取消链接',
        'Notification thread attach': '通知线程附加',
        'Notification thread detach': '通知线程分离',
        'Notification thread import': '通知线程导入',
        'Notification thread export': '通知线程导出',
        'Notification thread backup': '通知线程备份',
        'Notification thread restore': '通知线程恢复',
        'Notification thread archive': '通知线程归档',
        'Notification thread unarchive': '通知线程取消归档',
        'Notification thread delete': '通知线程删除',
        'Notification thread undelete': '通知线程恢复删除',
        'Notification thread move': '通知线程移动',
        'Notification thread copy': '通知线程复制',
        'Notification thread rename': '通知线程重命名',
        'Notification thread duplicate': '通知线程复制',
        'Notification thread edit': '通知线程编辑',
        'Notification thread update': '通知线程更新',
        'Notification thread modify': '通知线程修改',
        'Notification thread correct': '通知线程修正',
        'Notification thread fix': '通知线程修复',
        'Notification thread improve': '通知线程改进',
        'Notification thread optimize': '通知线程优化',
        'Notification thread refactor': '通知线程重构',
        'Notification thread reorganize': '通知线程重组',
        'Notification thread reformat': '通知线程重新格式化',
        'Notification thread restructure': '通知线程重组',
        'Notification thread reorder': '通知线程重排序',
        'Notification thread rearrange': '通知线程重新排列',
        'Notification thread reset': '通知线程重置',
        'Notification thread clear': '通知线程清除',
        'Notification thread empty': '通知线程清空',
        'Notification thread initialize': '通知线程初始化',
        'Notification thread create': '通知线程创建',
        'Notification thread add': '通知线程添加',
        'Notification thread insert': '通知线程插入',
        'Notification thread remove': '通知线程移除',
        'Notification thread delete': '通知线程删除',
        'Notification thread select': '通知线程选择',
        'Notification thread deselect': '通知线程取消选择',
        'Notification thread highlight': '通知线程高亮显示',
        'Notification thread lowlight': '通知线程低亮度显示',
        'Notification thread filter': '通知线程筛选',
        'Notification thread sort': '通知线程排序',
        'Notification thread search': '通知线程搜索',
        'Notification thread find': '通知线程查找',
        'Notification thread locate': '通知线程定位',
        'Notification thread navigate': '通知线程导航',
        'Notification thread scroll': '通知线程滚动',
        'Notification thread page': '通知线程翻页',
        'Notification thread load': '通知线程加载',
        'Notification thread reload': '通知线程重载',
        'Notification thread refresh': '通知线程刷新',
        'Notification thread save': '通知线程保存',
        'Notification thread unsave': '通知线程取消保存',
        'Notification thread mute': '通知线程静音',
        'Notification thread unmute': '通知线程取消静音',
        'Notification thread mark': '通知线程标记',
        'Notification thread unmark': '通知线程取消标记',
        'Notification thread reply': '通知线程回复',
        'Notification thread view': '通知线程查看',
        'Notification thread manage': '通知线程管理',
        'Notification thread handle': '通知线程处理',
        'Notification thread process': '通知线程处理',
        'Notification thread generate': '通知线程生成',
        'Notification thread render': '通知线程渲染',
        'Notification thread validate': '通知线程验证',
        'Notification thread transform': '通知线程转换',
        'Notification thread format': '通知线程格式化',
        'Notification thread parse': '通知线程解析',
        'Notification thread encode': '通知线程编码',
        'Notification thread decode': '通知线程解码',
        'Notification thread compress': '通知线程压缩',
        'Notification thread decompress': '通知线程解压',
        'Notification thread encrypt': '通知线程加密',
        'Notification thread decrypt': '通知线程解密',
        'Notification thread hash': '通知线程哈希',
        'Notification thread sign': '通知线程签名',
        'Notification thread verify': '通知线程验证',
        'Notification thread authenticate': '通知线程认证',
        'Notification thread authorize': '通知线程授权',
        'Notification thread permit': '通知线程许可',
        'Notification thread allow': '通知线程允许',
        'Notification thread deny': '通知线程拒绝',
        'Notification thread block': '通知线程阻止',
        'Notification thread restrict': '通知线程限制',
        'Notification thread limit': '通知线程限制',
        'Notification thread quota': '通知线程配额',
        'Notification thread threshold': '通知线程阈值',
        'Notification thread measure': '通知线程测量',
        'Notification thread track': '通知线程跟踪',
        'Notification thread monitor': '通知线程监控',
        'Notification thread observe': '通知线程观察',
        'Notification thread analyze': '通知线程分析',
        'Notification thread report': '通知线程报告',
        'Notification thread alert': '通知线程警报',
        'Notification thread warn': '通知线程警告',
        'Notification thread error': '通知线程错误',
        'Notification thread debug': '通知线程调试',
        'Notification thread log': '通知线程日志',
        'Notification thread trace': '通知线程追踪',
        'Notification thread audit': '通知线程审计',
        'Notification thread inspect': '通知线程检查',
        'Notification thread diagnose': '通知线程诊断',
        'Notification thread troubleshoot': '通知线程故障排除',
        'Notification thread fix': '通知线程修复',
        'Notification thread resolve': '通知线程解决',
        'Notification thread recover': '通知线程恢复',
        'Notification thread repair': '通知线程修复',
        'Notification thread restore': '通知线程恢复',
        'Notification thread restart': '通知线程重启',
        'Notification thread retry': '通知线程重试',
        'Notification thread rollback': '通知线程回滚',
        'Notification thread deploy': '通知线程部署',
        'Notification thread release': '通知线程发布',
        'Notification thread version': '通知线程版本',
        'Notification thread build': '通知线程构建',
        'Notification thread test': '通知线程测试',
        'Notification thread result': '通知线程结果',
        'Notification thread status': '通知线程状态',
        'Notification thread progress': '通知线程进度',
        'Notification thread complete': '通知线程完成',
        'Notification thread success': '通知线程成功',
        'Notification thread failure': '通知线程失败',
        'Notification thread pending': '通知线程待处理',
        'Notification thread running': '通知线程运行中',
        'Notification thread stopped': '通知线程已停止',
        'Notification thread paused': '通知线程已暂停',
        'Notification thread resumed': '通知线程已恢复',
        'Notification thread canceled': '通知线程已取消',
        'Notification thread aborted': '通知线程已中止',
        'Notification thread timeout': '通知线程超时',
        'Notification thread retry': '通知线程重试',
        'Notification thread restart': '通知线程重启',
        'Notification thread continue': '通知线程继续',
        'Notification thread skip': '通知线程跳过',
        'Notification thread ignore': '通知线程忽略',
        'Notification thread acknowledge': '通知线程确认',
        'Notification thread resolve': '通知线程解决',
        'Notification thread close': '通知线程关闭',
        'Notification thread reopen': '通知线程重新开启',
        'Notification thread lock': '通知线程锁定',
        'Notification thread unlock': '通知线程解锁',
        'Notification thread pin': '通知线程固定',
        'Notification thread unpin': '通知线程取消固定',
        'Notification thread star': '通知线程标星',
        'Notification thread unstar': '通知线程取消标星',
        'Notification thread watch': '通知线程关注',
        'Notification thread unwatch': '通知线程取消关注',
        'Notification thread fork': '通知线程复刻',
        'Notification thread merge': '通知线程合并',
        'Notification thread split': '通知线程拆分',
        'Notification thread join': '通知线程合并',
        'Notification thread link': '通知线程链接',
        'Notification thread unlink': '通知线程取消链接',
        'Notification thread attach': '通知线程附加',
        'Notification thread detach': '通知线程分离',
        'Notification thread import': '通知线程导入',
        'Notification thread export': '通知线程导出',
        'Notification thread backup': '通知线程备份',
        'Notification thread restore': '通知线程恢复',
        'Notification thread archive': '通知线程归档',
        'Notification thread unarchive': '通知线程取消归档',
        'Notification thread delete': '通知线程删除',
        'Notification thread undelete': '通知线程恢复删除',
        'Notification thread move': '通知线程移动',
        'Notification thread copy': '通知线程复制',
        'Notification thread rename': '通知线程重命名',
        'Notification thread duplicate': '通知线程复制',
        'Notification thread edit': '通知线程编辑',
        'Notification thread update': '通知线程更新',
        'Notification thread modify': '通知线程修改',
        'Notification thread correct': '通知线程修正',
        'Notification thread fix': '通知线程修复',
        'Notification thread improve': '通知线程改进',
        'Notification thread optimize': '通知线程优化',
        'Notification thread refactor': '通知线程重构',
        'Notification thread reorganize': '通知线程重组',
        'Notification thread reformat': '通知线程重新格式化',
        'Notification thread restructure': '通知线程重组',
        'Notification thread reorder': '通知线程重排序',
        'Notification thread rearrange': '通知线程重新排列',
        'Notification thread reset': '通知线程重置',
        'Notification thread clear': '通知线程清除',
        'Notification thread empty': '通知线程清空',
        'Notification thread initialize': '通知线程初始化',
        'Notification thread create': '通知线程创建',
        'Notification thread add': '通知线程添加',
        'Notification thread insert': '通知线程插入',
        'Notification thread remove': '通知线程移除',
        'Notification thread delete': '通知线程删除',
        'Notification thread select': '通知线程选择',
        'Notification thread deselect': '通知线程取消选择',
        'Notification thread highlight': '通知线程高亮显示',
        'Notification thread lowlight': '通知线程低亮度显示',
        'Notification thread filter': '通知线程筛选',
        'Notification thread sort': '通知线程排序',
        'Notification thread search': '通知线程搜索',
        'Notification thread find': '通知线程查找',
        'Notification thread locate': '通知线程定位',
        'Notification thread navigate': '通知线程导航',
        'Notification thread scroll': '通知线程滚动',
        'Notification thread page': '通知线程翻页',
        'Notification thread load': '通知线程加载',
        'Notification thread reload': '通知线程重载',
        'Notification thread refresh': '通知线程刷新',
        'Notification thread save': '通知线程保存',
        'Notification thread unsave': '通知线程取消保存',
        'Notification thread mute': '通知线程静音',
        'Notification thread unmute': '通知线程取消静音',
        'Notification thread mark': '通知线程标记',
        'Notification thread unmark': '通知线程取消标记',
        'Notification thread reply': '通知线程回复',
        'Notification thread view': '通知线程查看',
        'Notification thread manage': '通知线程管理',
        'Notification thread handle': '通知线程处理',
        'Notification thread process': '通知线程处理',
        'Notification thread generate': '通知线程生成',
        'Notification thread render': '通知线程渲染',
        'Notification thread validate': '通知线程验证',
        'Notification thread transform': '通知线程转换',
        'Notification thread format': '通知线程格式化',
        'Notification thread parse': '通知线程解析',
        'Notification thread encode': '通知线程编码',
        'Notification thread decode': '通知线程解码',
        'Notification thread compress': '通知线程压缩',
        'Notification thread decompress': '通知线程解压',
        'Notification thread encrypt': '通知线程加密',
        'Notification thread decrypt': '通知线程解密',
        'Notification thread hash': '通知线程哈希',
        'Notification thread sign': '通知线程签名',
        'Notification thread verify': '通知线程验证',
        'Notification thread authenticate': '通知线程认证',
        'Notification thread authorize': '通知线程授权',
        'Notification thread permit': '通知线程许可',
        'Notification thread allow': '通知线程允许',
        'Notification thread deny': '通知线程拒绝',
        'Notification thread block': '通知线程阻止',
        'Notification thread restrict': '通知线程限制',
        'Notification thread limit': '通知线程限制',
        'Notification thread quota': '通知线程配额',
        'Notification thread threshold': '通知线程阈值',
        'Notification thread measure': '通知线程测量',
        'Notification thread track': '通知线程跟踪',
        'Notification thread monitor': '通知线程监控',
        'Notification thread observe': '通知线程观察',
        'Notification thread analyze': '通知线程分析',
        'Notification thread report': '通知线程报告',
        'Notification thread alert': '通知线程警报',
        'Notification thread warn': '通知线程警告',
        'Notification thread error': '通知线程错误',
        'Notification thread debug': '通知线程调试',
        'Notification thread log': '通知线程日志',
        'Notification thread trace': '通知线程追踪',
        'Notification thread audit': '通知线程审计',
        'Notification thread inspect': '通知线程检查',
        'Notification thread diagnose': '通知线程诊断',
        'Notification thread troubleshoot': '通知线程故障排除',
        'Notification thread fix': '通知线程修复',
        'Notification thread resolve': '通知线程解决',
        'Notification thread recover': '通知线程恢复',
        'Notification thread repair': '通知线程修复',
        'Notification thread restore': '通知线程恢复',
        'Notification thread restart': '通知线程重启',
        'Notification thread retry': '通知线程重试',
        'Notification thread rollback': '通知线程回滚',
        'Notification thread deploy': '通知线程部署',
        'Notification thread release': '通知线程发布',
        'Notification thread version': '通知线程版本',
        'Notification thread build': '通知线程构建',
        'Notification thread test': '通知线程测试',
        'Notification thread result': '通知线程结果',
        'Notification thread status': '通知线程状态',
        'Notification thread progress': '通知线程进度',
        'Notification thread complete': '通知线程完成',
        'Notification thread success': '通知线程成功',
        'Notification thread failure': '通知线程失败',
        'Notification thread pending': '通知线程待处理',
        'Notification thread running': '通知线程运行中',
        'Notification thread stopped': '通知线程已停止',
        'Notification thread paused': '通知线程已暂停',
        'Notification thread resumed': '通知线程已恢复',
        'Notification thread canceled': '通知线程已取消',
        'Notification thread aborted': '通知线程已中止',
        'Notification thread timeout': '通知线程超时',
        'Notification thread retry': '通知线程重试',
        'Notification thread restart': '通知线程重启',
        'Notification thread continue': '通知线程继续',
        'Notification thread skip': '通知线程跳过',
        'Notification thread ignore': '通知线程忽略',
        'Notification thread acknowledge': '通知线程确认',
        'Notification thread resolve': '通知线程解决',
        'Notification thread close': '通知线程关闭',
        'Notification thread reopen': '通知线程重新开启',
        'Notification thread lock': '通知线程锁定',
        'Notification thread unlock': '通知线程解锁',
        'Notification thread pin': '通知线程固定',
        'Notification thread unpin': '通知线程取消固定',
        'Notification thread star': '通知线程标星',
        'Notification thread unstar': '通知线程取消标星',
        'Notification thread watch': '通知线程关注',
        'Notification thread unwatch': '通知线程取消关注',
        'Notification thread fork': '通知线程复刻',
        'Notification thread merge': '通知线程合并',
        'Notification thread split': '通知线程拆分',
        'Notification thread join': '通知线程合并',
        'Notification thread link': '通知线程链接',
        'Notification thread unlink': '通知线程取消链接',
        'Notification thread attach': '通知线程附加',
        'Notification thread detach': '通知线程分离',
        'Notification thread import': '通知线程导入',
        'Notification thread export': '通知线程导出',
        'Notification thread backup': '通知线程备份',
        'Notification thread restore': '通知线程恢复',
        'Notification thread archive': '通知线程归档',
        'Notification thread unarchive': '通知线程取消归档',
        'Notification thread delete': '通知线程删除',
        'Notification thread undelete': '通知线程恢复删除',
        'Notification thread move': '通知线程移动',
        'Notification thread copy': '通知线程复制',
        'Notification thread rename': '通知线程重命名',
        'Notification thread duplicate': '通知线程复制',
        'Notification thread edit': '通知线程编辑',
        'Notification thread update': '通知线程更新',
        'Notification thread modify': '通知线程修改',
        'Notification thread correct': '通知线程修正',
        'Notification thread fix': '通知线程修复',
        'Notification thread improve': '通知线程改进',
        'Notification thread optimize': '通知线程优化',
        'Notification thread refactor': '通知线程重构',
        'Notification thread reorganize': '通知线程重组',
        'Notification thread reformat': '通知线程重新格式化',
        'Notification thread restructure': '通知线程重组',
        'Notification thread reorder': '通知线程重排序',
        'Notification thread rearrange': '通知线程重新排列',
        'Notification thread reset': '通知线程重置',
        'Notification thread clear': '通知线程清除',
        'Notification thread empty': '通知线程清空',
        'Notification thread initialize': '通知线程初始化',
        'Notification thread create': '通知线程创建',
        'Notification thread add': '通知线程添加',
        'Notification thread insert': '通知线程插入',
        'Notification thread remove': '通知线程移除',
        'Notification thread delete': '通知线程删除',
        'Notification thread select': '通知线程选择',
        'Notification thread deselect': '通知线程取消选择',
        'Notification thread highlight': '通知线程高亮显示',
        'Notification thread lowlight': '通知线程低亮度显示',
        'Notification thread filter': '通知线程筛选',
        'Notification thread sort': '通知线程排序',
        'Notification thread search': '通知线程搜索',
        'Notification thread find': '通知线程查找',
        'Notification thread locate': '通知线程定位',
        'Notification thread navigate': '通知线程导航',
        'Notification thread scroll': '通知线程滚动',
        'Notification thread page': '通知线程翻页',
        'Notification thread load': '通知线程加载',
        'Notification thread reload': '通知线程重载',
        'Notification thread refresh': '通知线程刷新',
        'Notification thread save': '通知线程保存',
        'Notification thread unsave': '通知线程取消保存',
        'Notification thread mute': '通知线程静音',
        'Notification thread unmute': '通知线程取消静音',
        'Notification thread mark': '通知线程标记',
        'Notification thread unmark': '通知线程取消标记',
        'Notification thread reply': '通知线程回复',
        'Notification thread view': '通知线程查看',
        'Notification thread manage': '通知线程管理',
        'Notification thread handle': '通知线程处理',
        'Notification thread process': '通知线程处理',
        'Notification thread generate': '通知线程生成',
        'Notification thread render': '通知线程渲染',
        'Notification thread validate': '通知线程验证',
        'Notification thread transform': '通知线程转换',
        'Notification thread format': '通知线程格式化',
        'Notification thread parse': '通知线程解析',
        'Notification thread encode': '通知线程编码',
        'Notification thread decode': '通知线程解码',
        'Notification thread compress': '通知线程压缩',
        'Notification thread decompress': '通知线程解压',
        'Notification thread encrypt': '通知线程加密',
        'Notification thread decrypt': '通知线程解密',
        'Notification thread hash': '通知线程哈希',
        'Notification thread sign': '通知线程签名',
        'Notification thread verify': '通知线程验证',
        'Notification thread authenticate': '通知线程认证',
        'Notification thread authorize': '通知线程授权',
        'Notification performance': '通知性能',
        'Notification reliability': '通知可靠性',
        'Notification troubleshooting': '通知故障排除',
        'Notification help': '通知帮助',
        'Notification documentation': '通知文档',
        'Notification feedback': '通知反馈',
        'Report notification issue': '报告通知问题',
        'Notification improvements': '通知改进',
        'Notification suggestions': '通知建议',
        'Notification experiments': '通知实验',
        'Notification features': '通知功能',
        'New notification features': '新通知功能',
        'Notification roadmap': '通知路线图',
        'Notification updates': '通知更新',
        'Notification changelog': '通知更新日志',
        'Notification status page': '通知状态页面',
        'Notification API': '通知 API',
        'Notification webhooks': '通知 Webhooks',
        'Notification integrations': '通知集成',
        'Notification apps': '通知应用',
        'Third-party notifications': '第三方通知',
        'Notification partners': '通知合作伙伴',
        'Notification ecosystem': '通知生态系统',
        'Notification community': '通知社区',
        'Notification best practices': '通知最佳实践',
        'Notification guidelines': '通知指南',
        'Notification policy': '通知政策',
        'Notification terms': '通知条款',
        'Notification privacy': '通知隐私',
        'Notification security': '通知安全',
        'Notification compliance': '通知合规性',
        'Notification audits': '通知审计',
        'Notification logs': '通知日志',
        'Notification metrics': '通知指标',
        'Notification reporting': '通知报告',
        'Notification dashboard': '通知仪表盘',
        'Notification center': '通知中心',
        'Notification panel': '通知面板',
        'Notification drawer': '通知抽屉',
        'Notification sidebar': '通知侧边栏',
        'Notification list': '通知列表',
        'Notification grid': '通知网格',
        'Notification cards': '通知卡片',
        'Notification previews': '通知预览',
        'Notification snippets': '通知片段',
        'Notification details expanded': '通知详情已展开',
        'Notification details collapsed': '通知详情已折叠',
        'created tag': '创建了标签',
        'published': '发布了',
        'released': '发行了',
        'forked': '复刻了',
        
        // ========== Dashboard页面 ==========
        'Dashboard': '仪表盘',
        'Top repositories': '常用仓库',
        'Find a repository...': '查找仓库...',
        'New': '新建',
        'Latest changed': '最近修改',
        'For you': '为你推荐',
        'All activity': '所有活动',
        'Following': '关注中',
        'Starred': '已标星',
        'Pinned': '置顶',
        'Your repositories': '你的仓库',
        'Recent activity': '最近活动',
        'Popular repositories': '热门仓库',
        'Trending repositories': '趋势仓库',
        'Trending developers': '趋势开发者',
        'Contributions': '贡献',
        'Pull requests': '拉取请求',
        'Issues': '问题',
        'Codespaces': 'Codespaces',
        'Discussions': '讨论',
        'Commits': '提交',
        'Repository activity': '仓库活动',
        'Team activity': '团队活动',
        'Organization activity': '组织活动',
        'Activity feed': '活动动态',
        'Your activity': '你的活动',
        'Explore repositories': '探索仓库',
        'Explore topics': '探索主题',
        'Explore collections': '探索合集',
        'Recent repositories': '最近的仓库',
        'Recently visited': '最近访问',
        'Recently updated': '最近更新',
        'Recently forked': '最近复刻',
        'Recently starred': '最近标星',
        'Create new': '新建',
        'Create repository': '创建仓库',
        'Create project': '创建项目',
        'Create discussion': '创建讨论',
        'Create codespace': '创建Codespace',
        'Create organization': '创建组织',
        'Create gist': '创建代码片段',
        'Jump to repository': '跳转到仓库',
        'Quick access': '快速访问',
        'Learn Git and GitHub': '学习Git和GitHub',
        'GitHub Skills': 'GitHub技能',
        'GitHub Sponsors': 'GitHub赞助',
        'GitHub Marketplace': 'GitHub市场',
        'Your profile': '你的资料',
        'Your teams': '你的团队',
        'Your organizations': '你的组织',
        'View all': '查看全部',
        'Welcome back': '欢迎回来',
        'What\'s new': '最新动态',
        'News feed': '新闻动态',
        'Today': '今天',
        'Yesterday': '昨天',
        'This week': '本周',
        'Last week': '上周',
        'This month': '本月',
        'Last month': '上月',
        'Years of service': '服务年限',
        'Active repositories': '活跃仓库',
        'Watchers': '关注者',
        'Forks': '复刻数',
        'Stargazers': '标星者',
        'Open pull requests': '打开的拉取请求',
        'Open issues': '打开的问题',
        'Closed pull requests': '关闭的拉取请求',
        'Closed issues': '关闭的问题',
        'Merged pull requests': '已合并的拉取请求',
        'Waiting for review': '等待审查',
        'Ready to merge': '准备合并',
        'Draft pull requests': '草稿拉取请求',
        'Assigned to you': '分配给你',
        'Mentioned in': '提及你的',
        'Review requests': '审查请求',
        'Your review requests': '你的审查请求',
        'Waiting on you': '等待你处理',
        'Your pull requests': '你的拉取请求',
        'Your issues': '你的问题',
        'Team pull requests': '团队拉取请求',
        'Team issues': '团队问题',
        'Organization pull requests': '组织拉取请求',
        'Organization issues': '组织问题',
        'Recently closed': '最近关闭',
        'Recently merged': '最近合并',
        'Recently created': '最近创建',
        'Popular topics': '热门主题',
        'Recommended topics': '推荐主题',
        'My teams': '我的团队',
        'My organizations': '我的组织',
        'Start a project': '开始一个项目',
        'Clone a repository': '克隆一个仓库',
        'Import a repository': '导入一个仓库',
        'New file': '新建文件',
        'Upload files': '上传文件',
        'Find a team': '查找团队',
        'Find an organization': '查找组织',
        'Filter by language': '按语言筛选',
        'Filter by topic': '按主题筛选',
        'Filter by license': '按许可证筛选',
        'Sort by': '排序方式',
        
        // ========== GitHub 搜索页面 ==========
        'Advanced search': '高级搜索',
        'This repository': '此仓库',
        'All repositories': '所有仓库',
        'Search code': '搜索代码',
        'Search commits': '搜索提交',
        'Search issues and pull requests': '搜索问题和拉取请求',
        'Search discussions': '搜索讨论',
        'Search packages': '搜索包',
        'Search wiki': '搜索维基',
        'Search users': '搜索用户',
        'Search topics': '搜索主题',
        'Search labels': '搜索标签',
        'Location': '位置',
        'Language': '语言',
        'More options': '更多选项',
        'Clear': '清除',
        'Search': '搜索',
        'Type to filter results': '输入以筛选结果',
        'Select a language': '选择语言',
        'Any language': '任意语言',
        'Most stars': '最多标星',
        'Fewest stars': '最少标星',
        'Most forks': '最多复刻',
        'Fewest forks': '最少复刻',
        'Recently updated': '最近更新',
        'Least recently updated': '最久未更新',
        'Sort': '排序',
        'Filter': '筛选',
        'Query syntax help': '查询语法帮助',
        'Saved searches': '已保存的搜索',
        'Save this search': '保存此搜索',
        'Share search': '分享搜索',
        'Copy search URL': '复制搜索URL',
        'Apply current filters': '应用当前筛选',
        'Toggle filters': '切换筛选器',
        'Hide filters': '隐藏筛选器',
        'Show filters': '显示筛选器',
        'No results found': '未找到结果',
        'Try adjusting your search or filter to find what you\'re looking for': '尝试调整搜索条件或筛选器以找到您想要的内容',
        'Did you mean': '您是不是想找',
        'Suggestions': '建议',
        'Popular searches': '热门搜索',
        'Related searches': '相关搜索',
        'Advanced search options': '高级搜索选项',
        'Repository name contains': '仓库名称包含',
        'Description contains': '描述包含',
        'Readme contains': 'README包含',
        'Topics contain': '主题包含',
        'Language': '语言',
        'Stars': '标星',
        'Forks': '复刻',
        'Size': '大小',
        'Last updated': '最后更新',
        'Created': '创建时间',
        'Pushed': '推送时间',
        'License': '许可证',
        'Users': '用户',
        'Organizations': '组织',
        'Topics': '主题',
        'Followers': '关注者',
        'Repositories': '仓库',
        'Gists': '代码片段',
        'Following': '关注中',
        'Type': '类型',
        'Public': '公开',
        'Private': '私有',
        'Archived': '已归档',
        'Mirrored': '镜像',
        'Template': '模板',
        'In': '在',
        'At least': '至少',
        'At most': '至多',
        'Between': '在之间',
        'and': '和',
        'On or after': '在或之后',
        'On or before': '在或之前',
        'From': '从',
        'To': '到',
        'With': '包含',
        'Without': '不包含',
        'Select': '选择',
        'Choose': '选择',
        'Apply': '应用',
        'Reset': '重置',
        'Range': '范围',
        'Date': '日期',
        'Time': '时间',
        'Day': '天',
        'Month': '月',
        'Year': '年',
        'Any': '任意',
        'Exact match': '精确匹配',
        'Case sensitive': '区分大小写',
        'Match whole words': '匹配整个单词',
        'Exclude': '排除',
        'Include': '包含',
        'Filter by': '按...筛选',
        'Sort by': '按...排序',
        'Order': '顺序',
        'Ascending': '升序',
        'Descending': '降序',
        'Format': '格式',
        'CSV': 'CSV格式',
        'JSON': 'JSON格式',
        'Download': '下载',
        'Export': '导出',
        'Save': '保存',
        'Share': '分享',
        'Embed': '嵌入',
        'View': '查看',
        'Columns': '列',
        'Display': '显示',
        'Layout': '布局',
        'Grid view': '网格视图',
        'List view': '列表视图',
        'Table view': '表格视图',
        'Card view': '卡片视图',
        'Compact view': '紧凑视图',
        'Expanded view': '展开视图',
        'Default view': '默认视图',
        'Custom view': '自定义视图',
        'Show more': '显示更多',
        'Show less': '显示更少',
        'Load more': '加载更多',
        'Next': '下一页',
        'Previous': '上一页',
        'First': '第一页',
        'Last': '最后一页',
        'Page': '页',
        'of': '共',
        'items': '项',
        'per page': '每页',
        'Go to page': '跳转到页',
        'Results per page': '每页结果数',
        'Results': '结果',
        'About': '约',
        'matches': '个匹配',
        'for': '，搜索',

        // ========== 创建仓库页面 ==========
        'Create a new repository': '创建一个新仓库',
        'Owner': '所有者',
        'Repository name': '仓库名称',
        'Description': '描述',
        '(optional)': '（可选）',
        'Public': '公开',
        'Private': '私有',
        'Initialize this repository with': '使用以下内容初始化仓库',
        'Add a README file': '添加 README 文件',
        'Add .gitignore': '添加 .gitignore',
        'Choose a license': '选择许可证',
        'Create repository': '创建仓库',
        'Import code': '导入代码',
        'Import a repository': '导入一个仓库',
        'Repository template': '仓库模板',
        'Select template': '选择模板',
        'Include all branches': '包含所有分支',
        'Gitignore template': 'Gitignore 模板',
        'License template': '许可证模板',
        'Repository visibility': '仓库可见性',
        'Create in organization': '在组织中创建',
        'Advanced settings': '高级设置',
        'Automatically delete head branches': '自动删除源分支',
        'Enable discussions': '启用讨论',
        'Enable issues': '启用问题',
        'Enable projects': '启用项目',
        'Enable wiki': '启用维基',
        'Add topics': '添加主题',
        'Choose a template': '选择一个模板',
        'Template description': '模板描述',
        'Popular templates': '热门模板',
        'Personal templates': '个人模板',
        'Organization templates': '组织模板',
        'Most stars': '最多标星',
        'Most forks': '最多复刻',
        'Most recent': '最新',
        'Least recent': '最旧',
        'Show more activity': '显示更多活动',
        'Hide activity': '隐藏活动',
        'Mark all as read': '全部标记为已读',
        'Refresh dashboard': '刷新仪表盘',
        'Customize dashboard': '自定义仪表盘',
        'Hide sidebar': '隐藏侧边栏',
        'Show sidebar': '显示侧边栏',
        'Expand sidebar': '展开侧边栏',
        'Collapse sidebar': '折叠侧边栏',
        'Sidebar': '侧边栏',
        'Main content': '主内容',
        'Left sidebar': '左侧边栏',
        'Right sidebar': '右侧边栏',
        'Your work': '你的工作',
        'Personal dashboard': '个人仪表盘',
        'Team dashboard': '团队仪表盘',
        'Organization dashboard': '组织仪表盘',
        'Global dashboard': '全局仪表盘',
        'Switch dashboard': '切换仪表盘',
        'Dashboard settings': '仪表盘设置',
        'Layout': '布局',
        'Theme': '主题',
        'Messages': '消息',
        'Inbox': '收件箱',
        'Sent': '已发送',
        'Archived': '已归档',
        'Spam': '垃圾邮件',
        'Important': '重要',
        'Unread': '未读',
        'Read': '已读',
        'Flagged': '已标记',
        'Unflagged': '未标记',
        'Priority': '优先级',
        'High priority': '高优先级',
        'Medium priority': '中优先级',
        'Low priority': '低优先级',
        'No priority': '无优先级',
        'Show more': '显示更多',
        'Hide': '隐藏',
        'Collaborators': '协作者',
        'Stars': '标星',
        'Forks': '复刻',
        'Last commit': '最后提交',
        'Updated': '已更新',
        'Created': '已创建',
        'Filter by': '筛选方式',
        'Filter repositories': '筛选仓库',
        'Repository filter': '仓库筛选',
        'Activity type': '活动类型',
        'Date range': '日期范围',
        'This year': '今年',
        'All time': '所有时间',
        'Custom range': '自定义范围',
        'Start date': '开始日期',
        'End date': '结束日期',
        'Apply filters': '应用筛选',
        'Clear filters': '清除筛选',
        'No activity found': '未找到活动',
        'No repositories found': '未找到仓库',
        'Latest updates': '最新更新',
        'Featured today': '今日精选',
        'Popular this week': '本周热门',
        'Trending this month': '本月趋势',
        'Your favorite languages': '你喜欢的语言',
        'Most used languages': '最常用语言',
        'Language stats': '语言统计',
        'Repository stats': '仓库统计',
        'Activity summary': '活动摘要',
        'Monthly contributions': '月度贡献',
        'Annual contributions': '年度贡献',
        'Contribution graph': '贡献图表',
        'Achievements': '成就',
        'Milestones': '里程碑',
        'Settings': '设置',
        'Preferences': '偏好设置',
        'Appearance': '外观',
        'Email': '邮箱',
        'Security': '安全',
        'Billing': '账单',
        'Help': '帮助',
        'Support': '支持',
        'Documentation': '文档',
        'About': '关于',
        'Privacy': '隐私',
        'Terms': '条款',
        'Contact': '联系',
        'Feedback': '反馈',
        'Report': '报告',
        'Share': '分享',
        'Copy': '复制',
        'Download': '下载',
        'Print': '打印',
        'Refresh': '刷新',
        'Reload': '重新加载',
        'Reset': '重置',
        
        // ========== 补充Dashboard页面翻译项 ==========
        'At a glance': '概览',
        'Activity overview': '活动概览',
        'Your projects': '你的项目',
        'Active projects': '活跃项目',
        'Recently closed projects': '最近关闭的项目',
        'Your packages': '你的包',
        'Recent packages': '最近的包',
        'Dependency graph': '依赖图',
        'Security alerts': '安全警报',
        'Vulnerabilities': '漏洞',
        'Dependabot alerts': '依赖机器人警报',
        'Code scanning alerts': '代码扫描警报',
        'Secret scanning alerts': '密钥扫描警报',
        'Issues assigned to you': '分配给你的问题',
        'Pull requests awaiting your review': '等待你审查的拉取请求',
        'Your watchlist': '你的监视列表',
        'Recently starred repositories': '最近标星的仓库',
        'Popular repositories for you': '为你推荐的热门仓库',
        'Similar to your starred repositories': '类似你标星的仓库',
        'Recently discovered': '最近发现',
        'Sort options': '排序选项',
        'Filter options': '筛选选项',
        'Display options': '显示选项',
        'Compact view': '紧凑视图',
        'Expanded view': '展开视图',
        'Grid view': '网格视图',
        'List view': '列表视图',
        'Card view': '卡片视图',
        'Time range': '时间范围',
        'Last 24 hours': '过去24小时',
        'Last 7 days': '过去7天',
        'Last 30 days': '过去30天',
        'Last 90 days': '过去90天',
        'Last year': '过去一年',
        'All contributions': '所有贡献',
        'Code contributions': '代码贡献',
        'Documentation contributions': '文档贡献',
        'Community contributions': '社区贡献',
        'Your contributions': '你的贡献',
        'Top contributors': '顶级贡献者',
        'Repository contributors': '仓库贡献者',
        'Team contributors': '团队贡献者',
        'Organization contributors': '组织贡献者',
        'Contribution insights': '贡献洞察',
        'Activity patterns': '活动模式',
        'Peak activity times': '活动高峰时间',
        'Productivity insights': '生产力洞察',
        'Most active days': '最活跃日',
        'Most active times': '最活跃时间',
        'Recent achievements': '最近成就',
        'Upcoming milestones': '即将到来的里程碑',
        'Milestone progress': '里程碑进度',
        'Completion rate': '完成率',
        'On track': '按计划进行',
        'At risk': '存在风险',
        'Off track': '偏离计划',
        'Completed': '已完成',
        'In progress': '进行中',
        'Not started': '未开始',
        'Blocked': '已阻塞',
        'Critical': '严重',
        'High': '高',
        'Medium': '中',
        'Low': '低',
        'Very low': '很低',
        'Due today': '今天到期',
        'Due tomorrow': '明天到期',
        'Due this week': '本周到期',
        'Overdue': '已逾期',
        'No due date': '无截止日期',
        'Assigned to': '分配给',
        'Created by': '创建者',
        'Updated by': '更新者',
        'Labels': '标签',
        'Milestone': '里程碑',
        'Project': '项目',
        'Reviewer': '审查者',
        'Author': '作者',
        'Commenter': '评论者',
        'Mentioned': '被提及',
        'Subscribed': '已订阅',
        'Unsubscribed': '未订阅',
        'Ignore': '忽略',
        'Track': '跟踪',
        'All labels': '所有标签',
        'All milestones': '所有里程碑',
        'All projects': '所有项目',
        'All assignees': '所有经办人',
        'All reviewers': '所有审查者',
        'All authors': '所有作者',
        'All statuses': '所有状态',
        'All priorities': '所有优先级',
        'All due dates': '所有截止日期',
        'All activity types': '所有活动类型',
        'All repositories': '所有仓库',
        'All teams': '所有团队',
        'All organizations': '所有组织',
        'Public repositories': '公共仓库',
        'Private repositories': '私有仓库',
        'Internal repositories': '内部仓库',
        'Public gists': '公共代码片段',
        'Secret gists': '私密代码片段',
        'Public discussions': '公共讨论',
        'Team discussions': '团队讨论',
        'Organization discussions': '组织讨论',
        'Public projects': '公共项目',
        'Private projects': '私有项目',
        'Internal projects': '内部项目',
        // ========== 通知页面特定翻译项 ==========
        'Notifications are being fetched': '正在获取通知',
        'No matching notifications': '没有匹配的通知',
        'Notifications marked as read': '通知已标记为已读',
        'Notifications saved': '通知已保存',
        'Notifications unsaved': '通知已取消保存',
        'Notifications muted': '通知已静音',
        'Notifications unmuted': '通知已取消静音',
        'Notifications settings updated': '通知设置已更新',
        'Notification preferences saved': '通知偏好设置已保存',
        'Notification delivery settings': '通知送达设置',
        'Notification sound': '通知声音',
        'Notification badges': '通知标记',
        'Desktop notifications': '桌面通知',
        'Mobile push notifications': '移动推送通知',
        'Email notifications': '邮件通知',
        'Web notifications': '网页通知',
        'Notification digest': '通知摘要',
        'Daily digest': '每日摘要',
        'Weekly digest': '每周摘要',
        'Skip digest': '跳过摘要',
        'Notification frequency': '通知频率',
        'Immediate': '立即',
        'Hourly': '每小时',
        'Daily': '每日',
        'Weekly': '每周',
        'Monthly': '每月',
        'Never': '从不',
        'Notification filters': '通知筛选器',
        'Custom filters': '自定义筛选器',
        'Create custom filter': '创建自定义筛选器',
        'Edit filter': '编辑筛选器',
        'Delete filter': '删除筛选器',
        'Filter by repository': '按仓库筛选',
        'Filter by type': '按类型筛选',
        'Filter by status': '按状态筛选',
        'Filter by date': '按日期筛选',
        'Filter by author': '按作者筛选',
        'Filter by assignee': '按经办人筛选',
        'Filter by label': '按标签筛选',
        'Filter by milestone': '按里程碑筛选',
        'Filter by project': '按项目筛选',
        'Filter by language': '按语言筛选',
        'Filter by topic': '按主题筛选',
        'Filter by license': '按许可证筛选',
        'Filter by star count': '按标星数量筛选',
        'Filter by fork count': '按复刻数量筛选',
        'Filter by last updated': '按最后更新时间筛选',
        'Filter by created': '按创建时间筛选',
        'Filter by size': '按大小筛选',
        'Filter by activity': '按活动筛选',
        'Filter by contributions': '按贡献筛选',
        'Filter by involvement': '按参与度筛选',
        'Filter by reaction': '按反应筛选',
        'Filter by comment': '按评论筛选',
        'Filter by review': '按审查筛选',
        'Filter by mention': '按提及筛选',
        'Filter by assignment': '按分配筛选',
        'Filter by subscription': '按订阅筛选',
        'Filter by watching': '按关注筛选',
        'Filter by starring': '按标星筛选',
        'Filter by forking': '按复刻筛选',
        'Filter by following': '按关注用户筛选',
        'Filter by collaborator': '按协作者筛选',
        'Filter by member': '按成员筛选',
        'Filter by owner': '按所有者筛选',
        'Filter by admin': '按管理员筛选',
        'Filter by maintainer': '按维护者筛选',
        'Filter by contributor': '按贡献者筛选',
        'Filter by guest': '按访客筛选',
        'Filter by role': '按角色筛选',
        'Filter by permission': '按权限筛选',
        'Filter by access': '按访问权限筛选',
        'Filter by visibility': '按可见性筛选',
        'Filter by branch': '按分支筛选',
        'Filter by tag': '按标签筛选',
        'Filter by commit': '按提交筛选',
        'Filter by pull request': '按拉取请求筛选',
        'Filter by issue': '按问题筛选',
        'Filter by discussion': '按讨论筛选',
        'Filter by project': '按项目筛选',
        'Filter by wiki': '按维基筛选',
        'Filter by action': '按操作筛选',
        'Filter by package': '按包筛选',
        'Filter by security': '按安全筛选',
        'Filter by insight': '按洞察筛选',
        'Filter by page': '按页面筛选',
        'Filter by codespace': '按代码空间筛选',
        'Filter by gist': '按代码片段筛选',
        // ========== GitHub Codespaces 相关 ==========
        'Codespace': '代码空间',
        'Codespaces': '代码空间',
        'Create a codespace': '创建代码空间',
        'Open in codespace': '在代码空间中打开',
        'Develop in a codespace': '在代码空间中开发',
        'Default codespace': '默认代码空间',
        'Active codespaces': '活跃的代码空间',
        'Stop codespace': '停止代码空间',
        'Restart codespace': '重启代码空间',
        'Delete codespace': '删除代码空间',
        'Codespace configuration': '代码空间配置',
        'Codespace settings': '代码空间设置',
        'Codespace lifecycle': '代码空间生命周期',
        'Codespace machine type': '代码空间机器类型',
        'Codespace storage': '代码空间存储',
        'Codespace region': '代码空间区域',
        'Codespace editor': '代码空间编辑器',
        'Dev container': '开发容器',
        'Dev container configuration': '开发容器配置',
        'Filter by marketplace': '按市场筛选',
        'Filter by sponsor': '按赞助筛选',
        'Filter by sponsorship': '按赞助关系筛选',
        'Filter by organization': '按组织筛选',
        'Filter by team': '按团队筛选',
        'Filter by user': '按用户筛选'
    };
    /**
     * 正则表达式处理模块
     * @description 提供正则表达式的创建、缓存和管理功能，采用LRU缓存策略优化性能
     */
    const regexModule = {
        // 存储编译后的正则表达式的缓存，使用Map实现
        _cache: new Map(),
        
        // 存储访问顺序，用于LRU缓存策略
        _accessOrder: [],
        
        // 常用预编译正则表达式，避免重复创建
        _precompiledPatterns: {
            // 文件路径相关模式
            filePath: /[\w\-\.]+\/[\w\-\.\/]+/g,
            // URL链接模式
            url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
            // 邮箱地址模式
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            // 提交SHA模式
            commitSha: /[0-9a-f]{7,40}/g
        },
        
        /**
         * 转义正则表达式特殊字符
         * @param {string} string - 需要转义的字符串
         * @returns {string} 转义后的安全字符串
         */
        escapeRegExp(string) {
            try {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.error('[GitHub_i18n] 正则表达式转义失败:', error);
                }
                return string; // 发生错误时返回原字符串
            }
        },
        
        /**
         * 获取预编译的常用正则表达式
         * @param {string} patternName - 预定义模式名称
         * @returns {RegExp|null} 预编译的正则表达式或null
         */
        getPrecompiledPattern(patternName) {
            return this._precompiledPatterns[patternName] || null;
        },
        
        /**
         * 获取或创建正则表达式
         * @param {string} pattern - 正则表达式模式
         * @param {string} flags - 正则表达式标志，默认为'g'
         * @returns {RegExp} 编译后的正则表达式
         */
        getRegex(pattern, flags = 'g') {
            if (!pattern || typeof pattern !== 'string') {
                return new RegExp('', flags); // 安全返回空正则
            }
            
            // 使用模式+标志作为缓存键，以支持不同标志的相同模式
            const cacheKey = `${pattern}:${flags}`;
            
            // 检查缓存中是否已存在
            if (this._cache.has(cacheKey)) {
                // 更新访问顺序（LRU策略）
                this._updateAccessOrder(cacheKey);
                return this._cache.get(cacheKey);
            }
            
            try {
                // 创建新的正则表达式
                const escapedPattern = this.escapeRegExp(pattern);
                const regex = new RegExp(escapedPattern, flags);
                
                // 存储到缓存
                this._cache.set(cacheKey, regex);
                this._accessOrder.push(cacheKey);
                
                // 限制缓存大小，实现LRU策略
                this._trimCache();
                
                return regex;
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.error('[GitHub_i18n] 正则表达式创建失败:', error);
                }
                return new RegExp(this.escapeRegExp(pattern), flags); // 尝试安全降级
            }
        },
        
        /**
         * 更新缓存项的访问顺序（LRU策略）
         * @private
         * @param {string} cacheKey - 缓存键
         */
        _updateAccessOrder(cacheKey) {
            const index = this._accessOrder.indexOf(cacheKey);
            if (index > -1) {
                // 移除旧位置
                this._accessOrder.splice(index, 1);
                // 添加到末尾（最近访问）
                this._accessOrder.push(cacheKey);
            }
        },
        
        /**
         * 修剪缓存，确保不超过最大大小限制
         * @private
         */
        _trimCache() {
            const maxSize = CONFIG.performance.regexCacheSize || 200;
            while (this._cache.size > maxSize) {
                // 移除最久未访问的项（访问顺序数组的第一个元素）
                const oldestKey = this._accessOrder.shift();
                if (oldestKey) {
                    this._cache.delete(oldestKey);
                }
            }
        },
        
        /**
         * 清除正则表达式缓存
         */
        clearCache() {
            this._cache.clear();
            this._accessOrder = [];
        },
        
        /**
         * 获取缓存统计信息
         * @returns {Object} 缓存统计数据
         */
        getCacheStats() {
            return {
                size: this._cache.size,
                maxSize: CONFIG.performance.regexCacheSize || 200
            };
        }
    };
    
    /**
     * 获取或创建正则表达式（兼容旧API的包装函数）
     * @param {string} pattern - 正则表达式模式
     * @returns {RegExp} 编译后的正则表达式
     */
    function getRegex(pattern) {
        return regexModule.getRegex(pattern);
    }
    
    /**
     * 检查节点是否在不应翻译的区域内（兼容性更好的实现）
     * @param {Node} element - 要检查的 DOM 元素
     * @returns {boolean} - 是否在不应翻译的区域内
     */
    function isInSkippedRegion(element) {
        if (!element) return false;
        
        // 快速检查 - 先检查元素自身是否有跳过标记
        if (element.dataset.translated === 'skip') return true;
        
        // 限制递归深度，避免栈溢出
        const MAX_DEPTH = 10;
        let currentElement = element;
        let depth = 0;
        
        // 缓存查询结果，避免重复检查相同元素
        const cacheKey = element.getAttribute('data-skip-cache-key');
        if (cacheKey && cacheKey === element.textContent) {
            return element.dataset.skipRegion === 'true';
        }
        
        while (currentElement && depth < MAX_DEPTH) {
            const parent = currentElement.parentElement;
            if (!parent) break;
            
            // 检查常见的不应翻译的类
            const skipClasses = [
                'js-file-line',       // 代码文件行
                'commit-tease',       // 提交信息预览
                'copy-button',        // 复制按钮
                'blob-code',          // 代码块
                'react-code-text',    // React代码文本
                'user-name',          // 用户名
                'repo-name',          // 仓库名
                'branch-name',        // 分支名
                'file-path',          // 文件路径
                'timestamp',          // 时间戳
                'date',               // 日期
                'markdown-body',      // Markdown内容
                'commit-message',     // 提交信息
                'issue-title',        // 问题标题
                'pr-title',           // PR标题
                'ref-name',           // 引用名称
                'tag-name',           // 标签名称
                'commit-sha',         // 提交SHA
                'oid',                // 对象ID
                'sha',                // SHA值
                'url-link',           // URL链接
                'email-address'       // 邮箱地址
            ];
            
            if (parent.classList && parent.classList.length) {
                for (const cls of skipClasses) {
                    if (parent.classList.contains(cls)) {
                        // 缓存结果
                        element.setAttribute('data-skip-cache-key', element.textContent);
                        element.dataset.skipRegion = 'true';
                        return true;
                    }
                }
            }
            
            // 检查标签名
            const skipParentTags = ['code', 'pre', 'textarea', 'input', 'script', 'style'];
            if (skipParentTags.includes(parent.tagName.toLowerCase())) {
                // 缓存结果
                element.setAttribute('data-skip-cache-key', element.textContent);
                element.dataset.skipRegion = 'true';
                return true;
            }
            
            currentElement = parent;
            depth++;
        }
        
        // 缓存结果
        element.setAttribute('data-skip-cache-key', element.textContent);
        element.dataset.skipRegion = 'false';
        return false;
    }
    
    /**
     * 翻译缓存模块
     * @description 提供翻译结果的缓存管理功能，采用LRU缓存策略优化性能
     */
    const translationCache = {
        // 存储翻译结果的缓存，使用Map实现
        _cache: new Map(),
        
        // 存储访问顺序，用于LRU缓存策略
        _accessOrder: [],
        
        // 缓存命中和未命中统计
        _stats: {
            hits: 0,
            misses: 0,
            totalLookups: 0
        },
        
        // 缓存项的元数据，用于追踪使用频率和时间
        _metadata: new Map(),
        
        /**
         * 获取缓存的最大大小
         * @returns {number} 缓存最大条目数
         */
        _getMaxSize() {
            return CONFIG.performance.maxCacheSize || 1000;
        },
        
        /**
         * 检查是否存在缓存项
         * @param {string} key - 缓存键
         * @returns {boolean} 是否存在缓存项
         */
        has(key) {
            const exists = this._cache.has(key);
            this._stats.totalLookups++;
            
            if (exists) {
                this._stats.hits++;
                // 更新访问顺序（LRU策略）
                this._updateAccessOrder(key);
                // 更新使用次数和最后访问时间
                this._updateMetadata(key);
            } else {
                this._stats.misses++;
            }
            
            return exists;
        },
        
        /**
         * 获取缓存项
         * @param {string} key - 缓存键
         * @returns {string|null} 缓存的翻译结果或null
         */
        get(key) {
            if (this.has(key)) {
                return this._cache.get(key);
            }
            return null;
        },
        
        /**
         * 设置缓存项
         * @param {string} key - 缓存键
         * @param {string} value - 缓存的翻译结果
         * @returns {boolean} 设置是否成功
         */
        set(key, value) {
            if (typeof key !== 'string' || typeof value !== 'string') {
                return false;
            }
            
            try {
                // 检查是否需要更新已存在的项
                if (this._cache.has(key)) {
                    this._cache.set(key, value);
                    this._updateAccessOrder(key);
                    this._updateMetadata(key);
                } else {
                    // 添加新缓存项
                    this._cache.set(key, value);
                    this._accessOrder.push(key);
                    this._metadata.set(key, {
                        usageCount: 1,
                        lastAccessed: Date.now(),
                        createdAt: Date.now()
                    });
                }
                
                // 限制缓存大小，实现LRU策略
                this._trimCache();
                
                return true;
            } catch (error) {
                if (CONFIG.debugMode) {
                    console.error('[GitHub_i18n] 翻译缓存设置失败:', error);
                }
                return false;
            }
        },
        
        /**
         * 更新缓存项的访问顺序（LRU策略）
         * @private
         * @param {string} key - 缓存键
         */
        _updateAccessOrder(key) {
            const index = this._accessOrder.indexOf(key);
            if (index > -1) {
                // 移除旧位置
                this._accessOrder.splice(index, 1);
                // 添加到末尾（最近访问）
                this._accessOrder.push(key);
            }
        },
        
        /**
         * 更新缓存项的元数据
         * @private
         * @param {string} key - 缓存键
         */
        _updateMetadata(key) {
            const metadata = this._metadata.get(key);
            if (metadata) {
                metadata.usageCount++;
                metadata.lastAccessed = Date.now();
            }
        },
        
        /**
         * 修剪缓存，确保不超过最大大小限制
         * @private
         */
        _trimCache() {
            const maxSize = this._getMaxSize();
            const overflow = this._cache.size - maxSize;
            
            if (overflow > 0) {
                // 移除最久未访问的项
                for (let i = 0; i < overflow; i++) {
                    const oldestKey = this._accessOrder.shift();
                    if (oldestKey) {
                        this._cache.delete(oldestKey);
                        this._metadata.delete(oldestKey);
                    }
                }
            }
        },
        
        /**
         * 清除所有缓存项
         */
        clear() {
            this._cache.clear();
            this._accessOrder = [];
            this._metadata.clear();
            
            // 重置统计信息
            this._stats.hits = 0;
            this._stats.misses = 0;
            this._stats.totalLookups = 0;
        },
        
        /**
         * 获取缓存统计信息
         * @returns {Object} 缓存统计数据
         */
        getStats() {
            const hitRate = this._stats.totalLookups > 0 ? 
                Math.round((this._stats.hits / this._stats.totalLookups) * 100) : 0;
                
            return {
                size: this._cache.size,
                maxSize: this._getMaxSize(),
                hits: this._stats.hits,
                misses: this._stats.misses,
                totalLookups: this._stats.totalLookups,
                hitRate: hitRate + '%'
            };
        },
        
        /**
         * 导出缓存内容（用于调试）
         * @returns {Array} 缓存项数组
         */
        exportCache() {
            if (!CONFIG.debugMode) {
                return []; // 非调试模式下不导出缓存
            }
            
            const cacheItems = [];
            this._cache.forEach((value, key) => {
                const metadata = this._metadata.get(key);
                cacheItems.push({
                    key,
                    value,
                    metadata: metadata || {} // 确保总是有元数据对象
                });
            });
            
            return cacheItems;
        },
        
        /**
         * 移除指定时间之前的缓存项
         * @param {number} timeThreshold - 时间阈值（毫秒）
         * @returns {number} 移除的缓存项数量
         */
        removeStaleItems(timeThreshold = 3600000) { // 默认移除1小时前的项
            const now = Date.now();
            let removedCount = 0;
            
            // 找出所有过期的键
            const staleKeys = [];
            this._metadata.forEach((metadata, key) => {
                if (now - metadata.lastAccessed > timeThreshold) {
                    staleKeys.push(key);
                }
            });
            
            // 移除过期项
            staleKeys.forEach(key => {
                this._cache.delete(key);
                this._metadata.delete(key);
                const index = this._accessOrder.indexOf(key);
                if (index > -1) {
                    this._accessOrder.splice(index, 1);
                }
                removedCount++;
            });
            
            return removedCount;
        }
    };
    
    // 翻译缓存，用于存储已翻译的文本（兼容旧API的引用）
    const TRANSLATION_CACHE = translationCache;
    
    // 正则表达式合并的翻译规则（全局变量，只在初始化时创建一次）
    let regexMergedRules = [];
    
    /**
     * 安全替换文本节点（不破坏 HTML 结构和布局）
     * @param {Node} node - 要处理的 DOM 节点
     */
    function replaceTextNodes(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        
        // 跳过不应翻译的区域
        const skipTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'KBD'];
        if (skipTags.includes(node.tagName)) return;
        
        if (isInSkippedRegion(node)) return;
        
        // 检查是否已经翻译过
        if (node.dataset.translated === 'true') return;

        // 使用队列实现从左到右的广度优先遍历
        const queue = [node];
        while (queue.length > 0) {
            const currentNode = queue.shift(); // 从队列头部取出节点
            for (let i = 0; i < currentNode.childNodes.length; i++) {
                const child = currentNode.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    let textContent = child.textContent;
                    let originalText = textContent;
                    
                    // 检查翻译缓存
                    if (TRANSLATION_CACHE.has(textContent)) {
                        const cachedResult = TRANSLATION_CACHE.get(textContent);
                        if (cachedResult !== textContent) {
                            child.textContent = cachedResult;
                        }
                        continue;
                    }
                    
                    // 首先尝试正则表达式规则匹配（如果启用了正则优化）
                    if (CONFIG.performance.enableRegexOptimization !== false && regexMergedRules.length > 0) {
                        for (const rule of regexMergedRules) {
                            // 尝试对整行文本应用正则规则
                            if (rule.pattern.test(textContent)) {
                                const replacedText = textContent.replace(rule.pattern, rule.replacement);
                                if (replacedText !== textContent) {
                                    textContent = replacedText;
                                    if (CONFIG.debugMode) {
                                        console.log(`[GitHub_i18n] 正则匹配翻译: "${textContent}" -> "${replacedText}"`);
                                    }
                                    break; // 找到匹配的规则后就跳出循环
                                }
                            }
                        }
                    }
                    
                    // 如果正则匹配没有完全翻译，尝试完全匹配
                    if (textContent === originalText) {
                        const trimmedText = textContent.trim();
                        if (trimmedText && TRANSLATION_DICT.hasOwnProperty(trimmedText)) {
                            textContent = textContent.replace(trimmedText, TRANSLATION_DICT[trimmedText]);
                            if (CONFIG.debugMode && textContent !== originalText) {
                                console.log(`[GitHub_i18n] 已翻译: "${trimmedText}" -> "${TRANSLATION_DICT[trimmedText]}"`);
                            }
                        }
                    }
                    
                    // 如果完全匹配也没有翻译，尝试部分匹配
                    if (textContent === originalText && CONFIG.performance.enablePartialMatch !== false) {
                        // 再尝试部分匹配（按长度降序排序，确保最长的匹配项优先）
                        // 只有当enablePartialMatch未设置为false时才执行
                        const sortedKeys = Object.keys(TRANSLATION_DICT).sort((a, b) => b.length - a.length);
                        for (const key of sortedKeys) {
                            if (key.length > 1 && textContent.includes(key)) {
                                // 使用缓存的正则表达式
                                const regex = getRegex(key);
                                textContent = textContent.replace(regex, TRANSLATION_DICT[key]);
                                if (CONFIG.debugMode) {
                                    console.log(`[GitHub_i18n] 部分翻译: "${key}" -> "${TRANSLATION_DICT[key]}"`);
                                }
                            }
                        }
                    }
                    
                    // 应用翻译后的文本
                    if (textContent !== originalText) {
                        child.textContent = textContent;
                    }
                    
                    // 存入缓存，translationCache内部会自动处理大小限制
                    translationCache.set(originalText, textContent);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    // 检查子节点是否需要跳过翻译
                    if (!skipTags.includes(child.tagName) && !isInSkippedRegion(child)) {
                        queue.push(child);
                    }
                }
            }
        }
        
        // 标记已翻译的节点
        node.dataset.translated = 'true';
    }

    /**
     * 翻译页面上的关键区域
     */
    function translatePage() {
        const selectors = [
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
            '.js-menu-container'                // JavaScript生成的菜单容器
        ];

        // 优化：合并选择器查询以提高性能
        const combinedSelector = selectors.join(', ');
        document.querySelectorAll(combinedSelector).forEach(el => {
            replaceTextNodes(el);
        });
        
        // 额外处理：专门针对弹出菜单的处理，确保及时翻译
        handlePopupMenus();
    }
    
    /**
     * 专门处理弹出菜单的翻译
     * @description 针对GitHub动态生成的弹出菜单进行额外处理，确保它们能够被及时翻译
     */
    function handlePopupMenus() {
        try {
            // 查找所有可能是弹出菜单的元素
            const popupSelectors = [
                '[aria-label="Menu"]',            // 带标签的菜单
                '[role="menu"]',                 // 具有menu角色的元素
                '.ReactModal__Content',            // React模态框
                '.Overlay-backdrop',               // 覆盖层
                '[data-component-type="dropdown"]' // 数据组件类型标记的下拉菜单
            ];
            
            popupSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(menu => {
                    // 检查是否已经翻译过，避免重复翻译
                    if (!menu.dataset.translated) {
                        replaceTextNodes(menu);
                        menu.dataset.translated = 'true';
                    }
                });
            });
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 处理弹出菜单失败:', error);
            }
        }
    }

    // 节流函数，用于限制高频操作的执行频率
    function throttle(func, limit) {
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
    }

    /**
     * 使用正则表达式合并相似的键值对
     * @description 识别并合并具有相似模式的键值对，使用正则表达式减少词典大小
     * @returns {Array} 包含正则表达式规则的数组
     */
    function createRegexMergedDict() {
        const regexRules = [];
        
        // 定义常见的模式组
        const patternGroups = [
            {
                // 时间范围模式
                pattern: /^Last (\d+) (hours?|days?|weeks?|months?|years?)$/i,
                replacement: "过去$1$2",
                testKeys: ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 12 months']
            },
            {
                // 贡献类型模式
                pattern: /^(.*?) contributions$/i,
                replacement: "$1贡献",
                testKeys: ['Code contributions', 'Documentation contributions', 'Issue contributions']
            },
            {
                // 贡献者类型模式
                pattern: /^(.*?) contributors$/i,
                replacement: "$1贡献者",
                testKeys: ['Top contributors', 'Repository contributors', 'Organization contributors']
            },
            {
                // 任务状态模式
                pattern: /^(.*?) task$/i,
                replacement: "$1任务",
                testKeys: ['Completed task', 'In progress task', 'Pending task']
            },
            {
                // 优先级模式
                pattern: /^(.*?) priority$/i,
                replacement: "$1优先级",
                testKeys: ['Critical priority', 'High priority', 'Medium priority', 'Low priority']
            },
            {
                // 截止日期模式
                pattern: /^Due (today|tomorrow|\w+)$/i,
                replacement: "截止$1",
                testKeys: ['Due today', 'Due tomorrow', 'Due Monday']
            }
        ];
        
        try {
            // 检查哪些模式组在实际词典中存在
            const dictKeys = new Set(Object.keys(TRANSLATION_DICT));
            let mergedCount = 0;
            
            patternGroups.forEach(group => {
                // 检查该模式组是否有足够的键在词典中
                const matchingKeys = group.testKeys.filter(key => dictKeys.has(key));
                
                if (matchingKeys.length >= 2) {
                    // 验证替换逻辑是否正确
                    const validReplacements = matchingKeys.every(key => {
                        const match = key.match(group.pattern);
                        if (!match) return false;
                        
                        // 生成替换文本
                        let replacedText = group.replacement;
                        match.slice(1).forEach((capture, index) => {
                            replacedText = replacedText.replace(`$${index + 1}`, capture);
                        });
                        
                        // 检查是否与实际翻译匹配
                        return TRANSLATION_DICT[key] === replacedText;
                    });
                    
                    if (validReplacements) {
                        regexRules.push({
                            pattern: group.pattern,
                            replacement: group.replacement,
                            matchedKeys: matchingKeys
                        });
                        mergedCount += matchingKeys.length;
                    }
                }
            });
            
            if (CONFIG.debugMode && mergedCount > 0) {
                console.log(`[GitHub_i18n] 正则表达式优化完成: 合并了 ${mergedCount} 个键，创建了 ${regexRules.length} 个规则`);
            }
            
            return regexRules;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 正则表达式优化失败:', error);
            }
            return [];
        }
    }
    
    /**
     * 合并重复的翻译字符串
     * @description 分析翻译词典，找出具有相同中文翻译的英文键，优化词典结构
     * @returns {Object} 优化后的翻译词典
     */
    function optimizeTranslationDict() {
        if (!CONFIG.performance.enableDictOptimization) return TRANSLATION_DICT;
        
        try {
            // 值 -> 键数组的映射，用于查找具有相同值的键
            const valueToKeysMap = new Map();
            
            // 遍历翻译词典
            for (const [key, value] of Object.entries(TRANSLATION_DICT)) {
                if (!valueToKeysMap.has(value)) {
                    valueToKeysMap.set(value, []);
                }
                valueToKeysMap.get(value).push(key);
            }
            
            // 统计重复值
            let duplicateCount = 0;
            const duplicatesInfo = [];
            
            valueToKeysMap.forEach((keys, value) => {
                if (keys.length > 1) {
                    duplicateCount += keys.length - 1;
                    duplicatesInfo.push({
                        value,
                        keys,
                        count: keys.length
                    });
                }
            });
            
            // 创建优化后的词典
            const optimizedDict = {};
            
            valueToKeysMap.forEach((keys, value) => {
                // 保留所有键值对以保持兼容性
                keys.forEach(key => {
                    optimizedDict[key] = value;
                });
            });
            
            if (CONFIG.debugMode && duplicateCount > 0) {
                console.log(`[GitHub_i18n] 翻译词典优化完成: 发现 ${duplicateCount} 个重复翻译项`);
            }
            
            return optimizedDict;
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 翻译词典优化失败:', error);
            }
            return TRANSLATION_DICT; // 失败时返回原词典
        }
    }
    
    /**
     * 初始化翻译功能
     */
    function init() {
        // 优化翻译词典
        const optimizedDict = optimizeTranslationDict();
        if (optimizedDict !== TRANSLATION_DICT) {
            // 替换为优化后的词典
            Object.assign(TRANSLATION_DICT, optimizedDict);
        }
        
        // 初始化正则表达式规则
        if (CONFIG.performance.enableRegexOptimization !== false) {
            regexMergedRules = createRegexMergedDict();
        }
        
        // 初始翻译
        translatePage();

        // 设置节流版的翻译函数
        const throttledTranslatePage = throttle(() => {
            translatePage();
        }, CONFIG.performance.throttleInterval || 200);

        // 设置 MutationObserver 监听动态内容变化
        const observer = new MutationObserver((mutations) => {
            // 防抖 + 延迟确保元素渲染完成
            clearTimeout(observer.timer);
            observer.timer = setTimeout(() => {
                // 性能优化：如果启用了深度观察器限制，则只处理关键区域的变化
                if (CONFIG.performance.enableDeepObserver === false) {
                    // 只处理关键区域的变化
                    const hasRelevantMutation = mutations.some(mutation => {
                        const target = mutation.target;
                        // 检查是否在关键区域内
                        const keyAreas = document.querySelectorAll('#header, .application-main');
                        for (const area of keyAreas) {
                            if (area.contains(target)) return true;
                        }
                        return false;
                    });
                    
                    if (hasRelevantMutation) {
                        throttledTranslatePage();
                    }
                } else {
                    throttledTranslatePage();
                }
            }, CONFIG.debounceDelay);
        });

        // 开始监听 - 优化监听配置
        const observeConfig = {
            childList: true,
            subtree: CONFIG.performance.enableDeepObserver !== false, // 可以通过配置禁用深度监听
            characterData: CONFIG.performance.observeTextChanges === true // 可选的文本变化监听
        };
        
        // 优化：只监听关键区域而不是整个body
        const observeTargets = CONFIG.performance.enableDeepObserver === false 
            ? document.querySelectorAll('#header, .application-main') 
            : [document.body];
        
        observeTargets.forEach(target => {
            if (target) observer.observe(target, observeConfig);
        });

        // 监听 SPA 路由变化
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            setTimeout(translatePage, CONFIG.routeChangeDelay);
        };
        
        window.addEventListener('popstate', () => {
            setTimeout(translatePage, CONFIG.routeChangeDelay);
        });

        if (CONFIG.debugMode) {
            console.log(`[GitHub_i18n] 已成功初始化，当前版本: ${CONFIG.version}`);
        }
    }

    /**
     * 检查脚本更新
     * @description 自动检测GitHub上的最新版本，并在有更新时通知用户
     */
    function checkForUpdates() {
        if (!CONFIG.updateCheck.enabled) return;
        
        try {
            // 获取当前版本
            const currentVersion = CONFIG.version;
            
            // 获取上次检查时间
            const lastCheckTime = localStorage.getItem('GitHub_i18n_lastUpdateCheck');
            const now = Date.now();
            const intervalMs = CONFIG.updateCheck.intervalHours * 60 * 60 * 1000;
            
            // 如果距离上次检查未超过设定间隔，则跳过检查
            if (lastCheckTime && now - parseInt(lastCheckTime) < intervalMs) {
                if (CONFIG.debugMode) {
                    console.log('[GitHub_i18n] 未到更新检测时间');
                }
                return;
            }
            
            // 更新上次检查时间
            localStorage.setItem('GitHub_i18n_lastUpdateCheck', now.toString());
            
            // 发送请求获取最新版本
            fetch(CONFIG.updateCheck.scriptUrl, {
                method: 'GET',
                cache: 'no-cache'
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(content => {
                // 从脚本内容中提取版本号
                const versionMatch = content.match(/\/\/\s*@version\s+(\S+)/);
                if (versionMatch && versionMatch[1]) {
                    const latestVersion = versionMatch[1];
                    
                    if (CONFIG.debugMode) {
                        console.log(`[GitHub_i18n] 当前版本: ${currentVersion}, 最新版本: ${latestVersion}`);
                    }
                    
                    // 比较版本号
                    if (isNewerVersion(latestVersion, currentVersion)) {
                        showUpdateNotification(latestVersion, currentVersion);
                         
                        // 如果启用了自动版本号更新，则更新本地版本记录
                        if (CONFIG.updateCheck.autoUpdateVersion) {
                            updateLocalVersion(latestVersion);
                        }
                    }
                }
            })
            .catch(error => {
                if (CONFIG.debugMode) {
                    console.error('[GitHub_i18n] 检查更新失败:', error);
                }
            });
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 更新检查功能异常:', error);
            }
        }
    }
    
    /**
     * 更新本地存储的版本号
     * @param {string} newVersion - 新版本号
     */
    function updateLocalVersion(newVersion) {
        try {
            // 存储新版本号到 localStorage
            localStorage.setItem('GitHub_i18n_latestVersion', newVersion);
            
            if (CONFIG.debugMode) {
                console.log(`[GitHub_i18n] 已更新本地版本号记录: ${CONFIG.version} → ${newVersion}`);
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 更新本地版本号失败:', error);
            }
        }
    }
    
    /**
     * 比较版本号，判断是否为新版本
     * @param {string} latestVersion - 最新版本号
     * @param {string} currentVersion - 当前版本号
     * @returns {boolean} 是否为新版本
     */
    function isNewerVersion(latestVersion, currentVersion) {
        try {
            // 安全检查
            if (!latestVersion || !currentVersion) {
                return false;
            }
            
            const latestParts = latestVersion.split('.').map(part => {
                // 处理非数字部分
                const num = parseInt(part);
                return isNaN(num) ? 0 : num;
            });
            
            const currentParts = currentVersion.split('.').map(part => {
                // 处理非数字部分
                const num = parseInt(part);
                return isNaN(num) ? 0 : num;
            });
            
            // 比较每个版本部分
            for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
                const latest = latestParts[i] || 0;
                const current = currentParts[i] || 0;
                
                if (latest > current) return true;
                if (latest < current) return false;
            }
            
            // 如果版本数字部分相同，但字符串不同，考虑预发布版本等情况
            if (latestVersion !== currentVersion) {
                // 更安全的字符串比较，避免特殊字符问题
                return String(latestVersion).localeCompare(String(currentVersion)) > 0;
            }
            
            return false; // 版本完全相同
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 版本比较出错:', error);
            }
            // 版本格式异常时，进行安全的字符串比较
            try {
                return String(latestVersion).localeCompare(String(currentVersion)) > 0;
            } catch (e) {
                return latestVersion !== currentVersion;
            }
        }
    }
    
    /**
     * 显示更新通知
     * @param {string} latestVersion - 最新版本号
     * @param {string} currentVersion - 当前版本号
     */
    function showUpdateNotification(latestVersion, currentVersion) {
        try {
            // 检查是否已经存在通知，避免重复显示
            if (document.querySelector('.GitHub_i18n_update_notification')) {
                return;
            }
            
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = 'GitHub_i18n_update_notification';
            notification.style.cssText = `
                position: fixed;
                top: 70px; /* 避免被GitHub顶栏遮挡 */
                right: 20px;
                background: #0366d6;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 14px;
                max-width: 400px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            // 安全地转义版本号，避免XSS风险
            const safeLatestVersion = latestVersion ? document.createTextNode(latestVersion).textContent : '未知';
            const safeCurrentVersion = currentVersion ? document.createTextNode(currentVersion).textContent : '未知';
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <div>
                        <div style="font-weight: 500;">GitHub 中文翻译脚本有更新</div>
                        <div style="opacity: 0.9; margin-top: 2px;">版本 ${safeCurrentVersion} → ${safeLatestVersion}</div>
                    </div>
                </div>
            `;
            
            // 点击通知跳转到安装页面
            notification.addEventListener('click', () => {
                try {
                    if (CONFIG.updateCheck && CONFIG.updateCheck.scriptUrl) {
                        window.open(CONFIG.updateCheck.scriptUrl, '_blank');
                    }
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub_i18n] 打开更新链接失败:', error);
                    }
                } finally {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        try {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        } catch (e) {}
                    }, 300);
                }
            });
            
            // 自动关闭
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    try {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    } catch (e) {}
                }, 300);
            }, 15000);
            
            // 安全地添加到页面
            if (document.body) {
                document.body.appendChild(notification);
            }
            
            // 添加悬停效果
            notification.addEventListener('mouseenter', () => {
                notification.style.transform = 'translateY(-2px)';
                notification.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            });
            
            notification.addEventListener('mouseleave', () => {
                notification.style.transform = 'translateY(0)';
                notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 显示更新通知失败:', error);
            }
        }
    }
    
    /**
     * 处理版本号自动升级
     * @description 检查本地存储的版本号，实现自动升级逻辑
     */
    function handleVersionAutoUpgrade() {
        try {
            // 检查 localStorage 中是否有最新版本号记录
            const storedLatestVersion = localStorage.getItem('GitHub_i18n_latestVersion');
            
            if (storedLatestVersion && CONFIG.updateCheck.autoUpdateVersion) {
                // 比较存储的版本号和当前版本号
                if (isNewerVersion(storedLatestVersion, CONFIG.version)) {
                    if (CONFIG.debugMode) {
                        console.log(`[GitHub_i18n] 检测到已通知的新版本: ${CONFIG.version} → ${storedLatestVersion}`);
                        console.log(`[GitHub_i18n] 请访问脚本安装页面更新到最新版本`);
                    }
                }
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 版本自动升级处理失败:', error);
            }
        }
    }
    
    /**
     * 性能监控工具
     */
    const performanceMonitor = {
        startTime: null,
        measures: new Map(),
        
        start() {
            this.startTime = performance.now();
        },
        
        measure(label) {
            if (!this.startTime) return;
            const endTime = performance.now();
            const duration = endTime - this.startTime;
            this.measures.set(label, duration);
            if (CONFIG.performance.enableLogging === true) {
                console.log(`[GitHub_i18n] 性能监控 - ${label}: ${duration.toFixed(2)}ms`);
            }
        },
        
        reset() {
            this.startTime = null;
        }
    };

    /**
     * 延迟加载非关键功能
     */
    function loadNonCriticalFeatures() {
        try {
            // 只有在配置启用的情况下才执行
            if (CONFIG.performance.loadNonCriticalFeatures !== false) {
                // 延迟加载功能列表
                const deferredFeatures = [
                    {
                        name: 'updateCheck',
                        condition: () => CONFIG.updateCheck && CONFIG.updateCheck.enabled,
                        callback: () => checkForUpdates(),
                        delay: CONFIG.updateCheck.checkDelay || 5000
                    }
                ];
                
                // 按配置的延迟时间执行每个功能
                deferredFeatures.forEach(feature => {
                    if (feature.condition()) {
                        setTimeout(() => {
                            try {
                                if (CONFIG.performance.enableLogging === true) {
                                    console.log(`[GitHub_i18n] 延迟加载功能: ${feature.name}`);
                                }
                                feature.callback();
                            } catch (error) {
                                if (CONFIG.debugMode) {
                                    console.error(`[GitHub_i18n] 延迟加载功能 ${feature.name} 失败:`, error);
                                }
                            }
                        }, feature.delay);
                    }
                });
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 延迟加载非关键功能失败:', error);
            }
        }
    }

    /**
     * 启动脚本
     */
    function startScript() {
        try {
            // 开始性能监控
            if (CONFIG.performance.enableLogging === true) {
                performanceMonitor.start();
            }
            
            // 处理版本自动升级
            handleVersionAutoUpgrade();
            
            // 检查文档是否已加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    try {
                        init();
                        
                        // 记录初始化性能
                        if (CONFIG.performance.enableLogging === true) {
                            performanceMonitor.measure('初始化完成');
                        }
                        
                        // 延迟加载非关键功能
                        loadNonCriticalFeatures();
                    } catch (error) {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub_i18n] DOMContentLoaded 初始化失败:', error);
                        }
                    }
                });
            } else {
                try {
                    init();
                    
                    // 记录初始化性能
                    if (CONFIG.performance.enableLogging === true) {
                        performanceMonitor.measure('初始化完成');
                    }
                    
                    // 延迟加载非关键功能
                    loadNonCriticalFeatures();
                } catch (error) {
                    if (CONFIG.debugMode) {
                        console.error('[GitHub_i18n] 直接初始化失败:', error);
                    }
                }
            }
        } catch (error) {
            if (CONFIG.debugMode) {
                console.error('[GitHub_i18n] 启动脚本失败:', error);
            }
        }
    }
    // 🕒 启动脚本
    startScript();

})();