// ==UserScript==
// @name         GitHub 网站国际化之中文翻译
// @namespace    https://github.com/sutchan/GitHub_i18n
// @version 1.6.12
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

    // ========== 配置项 ==========
    const CONFIG = {
        // 当前脚本版本号（用于统一管理）
        version: '1.6.12',
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
        }
    };

    // ========== 翻译词典 ==========
    // 🔤 完整预定义翻译词典（覆盖导航、个人菜单、设置、组织、通知等）
    // 结构：{英文词汇: 中文翻译}
    const TRANSLATION_DICT = {
        // ========== 顶部全局导航 ==========
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
        'Signed in as': '已登录为',
        'Dashboard': '仪表盘',
        'Actions': '操作',
        'Projects': '项目',
        'Wiki': '维基',
        'Security': '安全',
        'Insights': '洞察',
        'Settings': '设置',
        'Code': '代码',
        'Discussions': '讨论',
        'Marketplace': '市场',
        'Explore': '探索',
        'Copilot': 'Copilot',
        'Notifications': '通知',
        'New repository': '新建仓库',
        'Import repository': '导入仓库',
        'New gist': '新建代码片段',
        'New organization': '新建组织',
        'New codespace': '新建 Codespace',
        'Your profile': '个人资料',
        'Your repositories': '你的仓库',
        'Your stars': '你的标星',
        'Your gists': '你的代码片段',
        'Your codespaces': '你的 Codespaces',
        'Your projects': '你的项目',
        'Your organizations': '你的组织',
        'Your notifications': '你的通知',
        'Feature preview': '功能预览',
        'Help': '帮助',
        'Sign out': '退出登录',
        'Signed in as': '已登录为',
        'Dashboard': '仪表盘',

        // ========== 仓库页主导航（UnderlineNav）==========
        'Overview': '概览',
        'Commits': '提交',
        'Branches': '分支',
        'Tags': '标签',
        'Releases': '发布',
        'Packages': '包',
        'Environments': '环境',
        'Contributors': '贡献者',
        'Activity': '活动',
        'Dependency graph': '依赖关系图',
        'Dependabot': 'Dependabot',
        'Code scanning': '代码扫描',
        'Secret scanning': '密钥扫描',
        'Audit log': '审计日志',
        'Billing': '账单',
        'Members': '成员',
        'Teams': '团队',
        'Custom properties': '自定义属性',
        'Moderation settings': '审核设置',
        'Installed GitHub Apps': '已安装的 GitHub 应用',
        'Webhooks': 'Webhooks',
        'Service hooks': '服务钩子',
        'Deploy keys': '部署密钥',
        'Self-hosted runners': '自托管运行器',
        'Runner groups': '运行器组',
        'Variables': '变量',
        'Secrets': '密钥',
        'Pages': 'Pages',
        'Actions secrets': '操作密钥',
        'Artifacts': '产物',
        'Caches': '缓存',
        'Workflows': '工作流',
        'Runs': '运行记录',
        'Summary': '摘要',
        'Jobs': '任务',
        'Logs': '日志',

        // ========== 仓库操作菜单（右上角 "Code" 按钮下拉）==========
        'Clone': '克隆',
        'Open with GitHub Desktop': '使用 GitHub Desktop 打开',
        'Open with Codespaces': '使用 Codespaces 打开',
        'Download ZIP': '下载 ZIP',
        'Local': '本地',
        'GitHub CLI': 'GitHub CLI',
        'HTTPS': 'HTTPS',
        'Use SSH': '使用 SSH',
        'Use HTTPS': '使用 HTTPS',

        // ========== Issues / PR 操作菜单 ==========
        'New issue': '新建问题',
        'New pull request': '新建拉取请求',
        'Assignees': '负责人',
        'Labels': '标签',
        'Projects': '项目',
        'Milestone': '里程碑',
        'Development': '开发',
        'Linked pull requests': '关联的拉取请求',
        'Convert to issue': '转换为问题',
        'Close issue': '关闭问题',
        'Reopen issue': '重新开启问题',
        'Close pull request': '关闭拉取请求',
        'Ready for review': '准备审核',
        'Mark as draft': '标记为草稿',
        'Reviewers': '审核人',
        'Request review': '请求审核',
        'Add reaction': '添加反应',
        'Subscribe': '订阅',
        'Unsubscribe': '取消订阅',

        // ========== 个人主页标签 ==========
        'Repositories': '仓库',
        'Stars': '标星',
        'Followers': '关注者',
        'Following': '关注中',
        'Sponsoring': '赞助中',
        'Sponsors': '赞助者',
        'Highlights': '亮点',
        'Pinned': '置顶',

        // ========== 设置页面主菜单（左侧边栏）==========
        'Home': '首页',
        'Public profile': '公开个人资料',
        'Account': '账户',
        'Profile': '个人资料',
        'Account security': '账户安全',
        'Sessions': '登录会话',
        'SSH and GPG keys': 'SSH 和 GPG 密钥',
        'Access tokens': '访问令牌',
        'Sponsored developers': '赞助开发者',
        'Organization memberships': '组织成员资格',
        'Email': '邮箱',
        'Public email': '公开邮箱',
        'Business': '企业',
        'Connected accounts': '已连接账户',
        'Block users': '屏蔽用户',
        'Delete account': '删除账户',
        'Preferences': '偏好设置',
        'Appearance': '外观',
        'Accessibility': '无障碍',
        'Notifications': '通知',
        'Email notifications': '邮件通知',
        'Watched repositories': '关注的仓库',
        'Scheduled digests': '定期摘要',
        'Integrations': '集成',
        'Authorized OAuth Apps': '授权的 OAuth 应用',
        'Authorized GitHub Apps': '授权的 GitHub 应用',
        'Webhooks': 'Webhooks',
        'Service hooks': '服务钩子',
        'Billing & plans': '账单与计划',
        'Developer settings': '开发者设置',
        'Fine-grained personal access tokens': '精细个人访问令牌',
        'Personal access tokens (classic)': '个人访问令牌（经典）',
        'OAuth Apps': 'OAuth 应用',
        'GitHub Apps': 'GitHub 应用',
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

        // ========== Codespaces ==========
        'Codespaces': 'Codespaces',
        'New codespace': '新建 Codespace',
        'Recent codespaces': '最近的 Codespaces',
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
        'Delete codespace': '删除 Codespace',

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
        'Create': '创建',
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
        'Project settings': '项目设置',
        
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
        'Milestone': '里程碑',
        'Draft': '草稿',
        'Ready': '准备就绪',
        'Waiting for review': '等待审查',
        'In progress': '进行中',
        'Needs work': '需要改进',
        'Approved': '已批准',
        'Changes requested': '请求更改',
        'Commented': '已评论',
        'Add reviewer': '添加审查人',
        'Add assignee': '添加经办人',
        'Add label': '添加标签',
        'Add to project': '添加到项目',
        'Assign to milestone': '分配到里程碑',
        
        // ========== 新增翻译项 - 搜索与筛选 ==========
        'Search results': '搜索结果',
        'Clear all filters': '清除所有筛选条件',
        'No matches found': '未找到匹配项',
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
        'File': '文件',
        'Code': '代码',
        'Blame': '代码归属',
        'History': '历史',
        'Raw': '原始',
        'Download': '下载',
        'Copy path': '复制路径',
        'Copy permalink': '复制永久链接',
        'Permalink': '永久链接',
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
        'All notifications': '所有通知',
        'Unread notifications': '未读通知',
        'Participating notifications': '参与的通知',
        'Saved notifications': '已保存的通知',
        'Mark as read': '标记为已读',
        'Mark as unread': '标记为未读',
        'Save notification': '保存通知',
        'Unsave notification': '取消保存',
        'Mute notifications': '静音通知',
        'Unmute notifications': '取消静音通知',
        'Notification settings': '通知设置',
        
        // ========== 新增翻译项 - 仓库设置 ==========
        'Options': '选项',
        'Manage access': '管理访问权限',
        'Branches': '分支',
        'Tags': '标签',
        'Releases': '发布',
        'Actions': '操作',
        'Secrets': '密钥',
        'Variables': '变量',
        'Webhooks': 'Webhooks',
        'Deploy keys': '部署密钥',
        'Collaborators': '协作者',
        'Templates': '模板',
        'Code security': '代码安全',
        'Code scanning': '代码扫描',
        'Secret scanning': '密钥扫描',
        'Dependency graph': '依赖图',
        'Dependabot alerts': 'Dependabot提醒',
        'Dependabot security updates': 'Dependabot安全更新',
        'Dependabot version updates': 'Dependabot版本更新',
        'Advanced security': '高级安全',
        'Pages': 'Pages',
        'Packages': '包',
        'Environments': '环境',
        'Teams': '团队',
        'Audit log': '审计日志',
        'Billing & plans': '账单与计划',
        
        // ========== 新增翻译项 - 用户与个人资料 ==========
        'User': '用户',
        'Profile': '资料',
        'Activity': '活动',
        'Public contributions': '公开贡献',
        'Private contributions': '私有贡献',
        'Contribution settings': '贡献设置',
        'Edit profile': '编辑资料',
        'Change avatar': '更换头像',
        'Edit bio': '编辑简介',
        'Update bio': '更新简介',
        'View followers': '查看关注者',
        'View following': '查看关注中',
        'View repositories': '查看仓库',
        'View stars': '查看标星',
        'View gists': '查看代码片段',
        'View codespaces': '查看Codespaces',
        'View projects': '查看项目',
        'View organizations': '查看组织',
        
        // ========== 新增翻译项 - 市场与扩展 ==========
        'GitHub Marketplace': 'GitHub市场',
        'Featured': '精选',
        'Categories': '分类',
        'All categories': '所有分类',
        'Popular': '热门',
        'Newest': '最新',
        'Recommended': '推荐',
        'Install': '安装',
        'Uninstall': '卸载',
        'Configure': '配置',
        'App settings': '应用设置',
        
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
        
        // ========== 新增翻译项 - Copilot功能设置 ==========
        'GitHub Copilot': 'GitHub Copilot',
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
        'Milestones': '里程碑',
        'Projects': '项目',
        'Sort': '排序',
        'Newest': '最新',
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
        'Open': '开放',
        'Closed': '已关闭',
        'Merged': '已合并',
        'All pull requests': '所有拉取请求',
        'Show all activity': '显示所有活动',
        'Show only comments': '仅显示评论',
        'Show only commits': '仅显示提交',
        'Show only file changes': '仅显示文件变更',
        'Compare changes': '比较更改',
        'Create a pull request': '创建拉取请求',
        'Compare & pull request': '比较并拉取请求',
        
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
        
        // ========== 设置页面相关翻译项 ==========
        // 组织设置页面
        'Organizations': '组织',
        'Your organizations': '你的组织',
        'New organization': '新建组织',
        'Organization billing': '组织账单',
        'Organization security': '组织安全',
        'Organization members': '组织成员',
        'Organization repositories': '组织仓库',
        
        // 企业设置页面
        'Enterprises': '企业',
        'Enterprise accounts': '企业账户',
        'Enterprise settings': '企业设置',
        'Enterprise members': '企业成员',
        'Enterprise policies': '企业策略',
        'Enterprise security': '企业安全',
        
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
        'Copilot features': 'Copilot功能',
        'Copilot settings': 'Copilot设置',
        'Copilot coding agent': 'Copilot编码代理',
        'Agent mode': '代理模式',
        'Copilot chat': 'Copilot聊天',
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
        'All notifications': '所有通知',
        'Unread notifications': '未读通知',
        'Participating notifications': '参与的通知',
        'Saved notifications': '已保存的通知',
        'Mark as read': '标记为已读',
        'Mark as unread': '标记为未读',
        'Save notification': '保存通知',
        'Unsave notification': '取消保存',
        'Mute notifications': '静音通知',
        'Unmute notifications': '取消静音',
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
        'Internal projects': '内部项目'
    };
    /**
     * 检查节点是否在不应翻译的区域内（兼容性更好的实现）
     * @param {Node} element - 要检查的 DOM 元素
     * @returns {boolean} - 是否在不应翻译的区域内
     */
    function isInSkippedRegion(element) {
        if (!element) return false;
        
        // 限制递归深度，避免栈溢出
        const MAX_DEPTH = 10;
        let currentElement = element;
        let depth = 0;
        
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
                    if (parent.classList.contains(cls)) return true;
                }
            }
            
            // 检查标签名
            const skipParentTags = ['code', 'pre', 'textarea', 'input', 'script', 'style'];
            if (skipParentTags.includes(parent.tagName.toLowerCase())) return true;
            
            currentElement = parent;
            depth++;
        }
        
        return false;
    }
    
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

        // 使用队列实现从左到右的广度优先遍历
        const queue = [node];
        while (queue.length > 0) {
            const currentNode = queue.shift(); // 从队列头部取出节点
            for (let i = 0; i < currentNode.childNodes.length; i++) {
                const child = currentNode.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    let textContent = child.textContent;
                    let originalText = textContent;
                    
                    // 先尝试完全匹配
                    const trimmedText = textContent.trim();
                    if (trimmedText && TRANSLATION_DICT.hasOwnProperty(trimmedText)) {
                        textContent = textContent.replace(trimmedText, TRANSLATION_DICT[trimmedText]);
                        if (CONFIG.debugMode && textContent !== originalText) {
                            console.log(`[GitHub_i18n] 已翻译: "${trimmedText}" -> "${TRANSLATION_DICT[trimmedText]}"`);
                        }
                    } else {
                        // 再尝试部分匹配（按长度降序排序，确保最长的匹配项优先）
                        const sortedKeys = Object.keys(TRANSLATION_DICT).sort((a, b) => b.length - a.length);
                        for (const key of sortedKeys) {
                            if (key.length > 1 && textContent.includes(key)) {
                                // 创建正则表达式，全局替换所有匹配项
                                const regex = new RegExp(escapeRegExp(key), 'g');
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
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    // 检查子节点是否需要跳过翻译
                    if (!skipTags.includes(child.tagName) && !isInSkippedRegion(child)) {
                        queue.push(child);
                    }
                }
            }
        }
        
        // 辅助函数：转义正则表达式特殊字符
        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
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

    /**
     * 初始化翻译功能
     */
    function init() {
        // 初始翻译
        translatePage();

        // 设置 MutationObserver 监听动态内容变化
        const observer = new MutationObserver(() => {
            // 防抖 + 延迟确保元素渲染完成
            clearTimeout(observer.timer);
            observer.timer = setTimeout(translatePage, CONFIG.debounceDelay);
        });

        // 开始监听
        observer.observe(document.body, {
            childList: true,
            subtree: true
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
     * 启动脚本
     */
    function startScript() {
        try {
            // 处理版本自动升级
            handleVersionAutoUpgrade();
            
            // 检查文档是否已加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    try {
                        init();
                        // 初始化后检查更新
                        if (CONFIG.updateCheck && CONFIG.updateCheck.enabled) {
                            // 延迟检查，避免影响页面加载性能
                            setTimeout(checkForUpdates, CONFIG.updateCheck.checkDelay || 5000);
                        }
                    } catch (error) {
                        if (CONFIG.debugMode) {
                            console.error('[GitHub_i18n] DOMContentLoaded 初始化失败:', error);
                        }
                    }
                });
            } else {
                try {
                    init();
                    // 初始化后检查更新
                    if (CONFIG.updateCheck && CONFIG.updateCheck.enabled) {
                        // 延迟检查，避免影响页面加载性能
                        setTimeout(checkForUpdates, CONFIG.updateCheck.checkDelay || 5000);
                    }
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