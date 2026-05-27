import { PrismaClient } from "@prisma/client"
import { faker } from "@faker-js/faker"

const prisma = new PrismaClient()

type SeedStatus =
    | "DRAFT"
    | "ANALYZING"
    | "READY"
    | "IN_PROGRESS"
    | "TESTING"
    | "DONE"

const statusPath: SeedStatus[] = [
    "DRAFT",
    "ANALYZING",
    "READY",
    "IN_PROGRESS",
    "TESTING",
    "DONE",
]

const statusReason: Record<SeedStatus, string> = {
    DRAFT: "需求录入，待分析",
    ANALYZING: "开始需求分析与技术评审",
    READY: "澄清完成，可进入开发",
    IN_PROGRESS: "开发实现中",
    TESTING: "提测，联调与回归测试",
    DONE: "验收通过，已上线",
}

function list(values: string[]) {
    return JSON.stringify(values)
}

function historyFor(status: SeedStatus) {
    const targetIndex = statusPath.indexOf(status)
    return statusPath.slice(0, targetIndex + 1).map((toStatus, index) => ({
        fromStatus: index === 0 ? null : statusPath[index - 1],
        toStatus,
        actor: index === 0 ? "PM-张伟" : faker.person.fullName(),
        reason: statusReason[toStatus],
    }))
}

// ====== 真实业务场景数据 ======

interface WorkItemSeed {
    id: string
    title: string
    description: string
    type: "story" | "bug" | "task"
    priority: "P0" | "P1" | "P2" | "P3"
    status: SeedStatus
    tags: string[]
    riskLevel: "HIGH" | "MEDIUM" | "LOW"
    acceptanceCriteria: string[]
    clarifications: Array<{
        content: string
        severity: "HIGH" | "MEDIUM" | "LOW"
        status: "OPEN" | "RESOLVED"
        answer?: string
    }>
    ai?: {
        summary: string
        risks: Array<{
            title: string
            level: "HIGH" | "MEDIUM" | "LOW"
            reason: string
        }>
        suggestedClarificationQuestions: string[]
        taskBreakdown: string[]
    }
}

const workItems: WorkItemSeed[] = [
    // ====== DRAFT (草稿) ======
    {
        id: "WI-001",
        title: "用户登录支持 OAuth 2.0 第三方登录（Google/GitHub）",
        type: "story",
        priority: "P1",
        status: "DRAFT",
        riskLevel: "MEDIUM",
        description:
            "当前系统仅支持账号密码登录，需要扩展 OAuth 2.0 协议接入 Google 和 GitHub 第三方登录，降低注册门槛。需处理 token 刷新、会话管理和账号绑定/解绑逻辑。",
        tags: ["frontend", "backend", "auth"],
        acceptanceCriteria: [
            "用户可通过 Google 账号一键登录注册",
            "用户可通过 GitHub 账号一键登录注册",
            "已绑定账号的用户可在设置页解绑",
            "OAuth 回调失败时显示友好错误提示",
            "token 过期后自动刷新，用户无感知",
        ],
        clarifications: [
            {
                content: "OAuth 回调地址是否需要同时支持测试环境和生产环境？",
                severity: "HIGH",
                status: "OPEN",
            },
            {
                content: "是否允许同一个邮箱同时绑定 Google 和 GitHub？",
                severity: "MEDIUM",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-002",
        title: "数据看板页面加载耗时超过 5 秒需优化",
        type: "bug",
        priority: "P0",
        status: "DRAFT",
        riskLevel: "HIGH",
        description:
            "生产环境监控发现数据看板页面 P95 加载耗时达到 8.2 秒，远超 SLI 目标（3 秒）。初步排查为 API 未做分页、图表渲染阻塞主线程导致。",
        tags: ["frontend", "performance", "bug"],
        acceptanceCriteria: [
            "看板页面首屏加载时间 P95 ≤ 3 秒",
            "图表组件改为懒加载，不阻塞首屏渲染",
            "列表数据接口增加分页参数",
            "添加加载骨架屏提升感知性能",
        ],
        clarifications: [
            {
                content: "是否需要支持大数据量（10 万+ 条记录）的看板查询？",
                severity: "HIGH",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-003",
        title: "消息通知中心改版，支持 Websocket 实时推送",
        type: "story",
        priority: "P1",
        status: "DRAFT",
        riskLevel: "HIGH",
        description:
            "当前通知需要手动刷新页面才能看到新消息，计划接入 Websocket 实现实时推送。包含站内信、系统通知、@提醒三种类型，需支持已读/未读状态和通知偏好设置。",
        tags: ["frontend", "backend", "websocket"],
        acceptanceCriteria: [
            "新消息到达时页面右上角红点实时更新",
            "通知列表支持按类型筛选和全部已读",
            "用户可在设置页关闭特定类型的通知推送",
            "Websocket 断线后自动重连，间隔递增",
        ],
        clarifications: [
            {
                content: "Websocket 连接数上限是多少？是否需要考虑水平扩展？",
                severity: "HIGH",
                status: "OPEN",
            },
            {
                content: "通知内容是否需要支持富文本和图片？",
                severity: "LOW",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-004",
        title: "修复 iOS Safari 下日期选择器无法正常弹出",
        type: "bug",
        priority: "P1",
        status: "DRAFT",
        riskLevel: "LOW",
        description:
            "用户反馈 iPhone Safari 浏览器中点击日期输入框，原生日期选择器无法弹出，必须使用第三方日期组件替代。影响所有使用日期筛选的页面。",
        tags: ["frontend", "bug", "mobile"],
        acceptanceCriteria: [
            "iOS Safari 下日期选择器正常弹出",
            "Android Chrome 下日期选择器不受影响",
            "选择日期后值正确回填到输入框",
        ],
        clarifications: [],
    },

    // ====== ANALYZING (分析中) ======
    {
        id: "WI-005",
        title: "文件上传组件支持分片上传和断点续传",
        type: "story",
        priority: "P1",
        status: "ANALYZING",
        riskLevel: "HIGH",
        description:
            "当前文件上传限制 50MB，业务方反馈需要上传 GB 级视频文件。需要实现分片上传 + 断点续传，支持进度展示、秒传检测和并发控制。后端需配套实现分片合并接口。",
        tags: ["frontend", "backend", "upload"],
        acceptanceCriteria: [
            "单文件最大支持 10GB",
            "上传进度实时展示百分比和速度",
            "网络中断恢复后自动从断点续传",
            "已上传过的文件秒传跳过",
            "并发上传数限制为 3 个分片，防止浏览器卡顿",
        ],
        clarifications: [
            {
                content: "分片大小默认多少？是否支持用户自定义？",
                severity: "MEDIUM",
                status: "RESOLVED",
                answer: "默认 5MB/片，暂不支持自定义，后续版本根据实际使用数据调整。",
            },
            {
                content: "上传文件存储在哪里？本地磁盘还是对象存储？",
                severity: "HIGH",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-006",
        title: "生产环境偶发数据库连接池耗尽导致服务 503",
        type: "bug",
        priority: "P0",
        status: "ANALYZING",
        riskLevel: "HIGH",
        description:
            "最近一周出现 3 次凌晨 2:00 左右服务 503，日志显示 `too many connections`。初步怀疑定时任务未正确释放连接。需要排查所有数据库操作的事务生命周期。",
        tags: ["backend", "bug", "production"],
        acceptanceCriteria: [
            "定位并修复连接泄漏的代码路径",
            "添加连接池监控告警（阈值 80%）",
            "所有数据库操作确认使用 try-finally 释放连接",
            "压测验证连接数稳定在正常范围",
        ],
        clarifications: [
            {
                content: "当前数据库最大连接数配置是多少？是否需要调整？",
                severity: "HIGH",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-007",
        title: "API 接口增加统一的请求限流和防刷机制",
        type: "task",
        priority: "P1",
        status: "ANALYZING",
        riskLevel: "MEDIUM",
        description:
            "近期发现部分接口被恶意高频调用，需要实现基于 IP + 用户的双重限流策略。登录接口额外增加验证码人机校验。限流配置需可通过后台动态调整。",
        tags: ["backend", "security"],
        acceptanceCriteria: [
            "通用接口限制 100 次/分钟/IP",
            "登录接口限制 5 次/分钟/IP，超限触发验证码",
            "被限流后返回 HTTP 429 和 Retry-After 头",
            "限流白名单支持内网 IP 免限",
        ],
        clarifications: [
            {
                content: "限流策略用令牌桶还是滑动窗口？",
                severity: "MEDIUM",
                status: "RESOLVED",
                answer: "采用滑动窗口，Redis 实现，更精确且易于调试。",
            },
        ],
    },
    {
        id: "WI-008",
        title: "移动端表格组件横向滚动体验差，需要重新设计",
        type: "story",
        priority: "P2",
        status: "ANALYZING",
        riskLevel: "LOW",
        description:
            "用户反馈在手机端查看数据列表时，表格列太多需要横向滚动，体验不好。需要设计移动端友好的表格展示方案，例如卡片式布局或关键列固定+横向滚动。",
        tags: ["frontend", "mobile", "ux"],
        acceptanceCriteria: [
            "移动端表格改为卡片式布局，信息清晰可读",
            "桌面端保持原有表格布局不变",
            "关键操作按钮在移动端始终可见（固定在底部或滑动时显示）",
        ],
        clarifications: [],
    },

    // ====== READY (已准备) ======
    {
        id: "WI-009",
        title: "实现全局搜索功能，支持跨模块模糊匹配",
        type: "story",
        priority: "P1",
        status: "READY",
        riskLevel: "MEDIUM",
        description:
            "用户需要在任意页面通过 `Cmd+K` 唤起搜索面板，支持搜索工作项、文档、成员和最近访问记录。搜索结果需按相关度排序，支持键盘上下选择并回车跳转。",
        tags: ["frontend", "search"],
        acceptanceCriteria: [
            "Cmd+K / Ctrl+K 唤起全局搜索弹窗",
            "输入关键词后 300ms 防抖触发搜索",
            "搜索结果分类型展示（工作项/文档/成员）",
            "键盘 ↑↓ 选择，Enter 跳转，Esc 关闭",
            "无结果时显示'未找到相关内容'和新建入口",
        ],
        clarifications: [],
        ai: {
            summary:
                "实现一个全局搜索功能，用户可通过快捷键唤起搜索面板，支持搜索多种类型的内容。建议使用 Fuse.js 做前端模糊匹配以减少后端压力。搜索面板需要高性能渲染，建议虚拟列表处理大量结果。",
            risks: [
                {
                    title: "大量数据时前端模糊匹配性能不足",
                    level: "MEDIUM",
                    reason: "如果工作项数量增长到数千条，前端全量模糊匹配可能卡顿，建议后端建立搜索索引",
                },
                {
                    title: "快捷键与浏览器默认行为冲突",
                    level: "LOW",
                    reason: "Cmd+K 在某些浏览器中已占用，需做兼容处理",
                },
            ],
            suggestedClarificationQuestions: [
                "搜索结果是否需要高亮匹配的关键词？",
                "是否需要搜索历史记录和热门搜索推荐功能？",
                "跨模块搜索的 API 是统一接口还是分别调用？",
            ],
            taskBreakdown: [
                "实现搜索弹窗 UI（Command Palette 风格）",
                "接入 Fuse.js 实现前端模糊搜索",
                "实现搜索结果分组展示和键盘导航",
                "绑定全局快捷键 Cmd+K",
                "空状态和加载状态处理",
                "移动端适配",
            ],
        },
    },
    {
        id: "WI-010",
        title: "修复数据导出 Excel 时日期格式变成数字串",
        type: "bug",
        priority: "P2",
        status: "READY",
        riskLevel: "LOW",
        description:
            "导出报表数据到 Excel 时，日期列显示为 5 位数字串（如 45123），而非 `yyyy-MM-dd` 格式。原因是导出库未正确设置单元格格式。",
        tags: ["backend", "bug"],
        acceptanceCriteria: [
            "导出 Excel 中日期列显示为 yyyy-MM-dd 格式",
            "导出 CSV 中日期列格式不受影响",
            "时区统一使用 Asia/Shanghai",
        ],
        clarifications: [],
    },
    {
        id: "WI-011",
        title: "CI/CD 流水线增加自动化 E2E 测试和构建产物校验",
        type: "task",
        priority: "P1",
        status: "READY",
        riskLevel: "MEDIUM",
        description:
            "当前 CI 只做 lint + unit test，缺少端到端测试和构建产物完整性检查。需要在 pipeline 中增加 Playwright E2E 测试步骤和构建产物大小/文件数校验。",
        tags: ["devops", "ci"],
        acceptanceCriteria: [
            "每次 PR 自动运行 12 个 Playwright E2E 用例",
            "构建产物超过 500MB 时 pipeline 报警",
            "测试失败时自动上传截图和 trace 到制品库",
            "pipeline 总耗时控制在 10 分钟内",
        ],
        clarifications: [],
    },
    {
        id: "WI-012",
        title: "暗色模式颜色变量整理，统一设计 Token",
        type: "task",
        priority: "P2",
        status: "READY",
        riskLevel: "LOW",
        description:
            "当前暗色模式部分组件颜色硬编码，切换主题时出现不一致。需要将颜色统一抽成 CSS 变量/设计 Token，确保 light/dark 切换时所有组件颜色一致。",
        tags: ["frontend", "design"],
        acceptanceCriteria: [
            "dark/light 切换时所有文字、边框、背景颜色一致",
            "色板 Token 定义在单一文件中，方便后续调整",
            "对比度符合 WCAG AA 标准",
        ],
        clarifications: [],
    },

    // ====== IN_PROGRESS (开发中) ======
    {
        id: "WI-013",
        title: "用户权限管理模块重构，支持 RBAC 角色模型",
        type: "story",
        priority: "P0",
        status: "IN_PROGRESS",
        riskLevel: "HIGH",
        description:
            "当前权限判断散落在各路由和组件中，难以维护。需要重构为基于 RBAC 的统一权限模型，支持管理员、编辑者、查看者三级角色，并预留自定义角色扩展。前后端需同步改造。",
        tags: ["frontend", "backend", "auth"],
        acceptanceCriteria: [
            "三种内置角色：admin、editor、viewer",
            "前端路由守卫根据角色自动拦截无权页面",
            "后端 API 基于角色进行接口级鉴权",
            "按钮/操作根据权限自动显示/隐藏",
            "管理后台支持创建自定义角色并配置权限点",
        ],
        clarifications: [
            {
                content:
                    "是否需要一个'超级管理员'角色，拥有所有权限且不可删除？",
                severity: "HIGH",
                status: "RESOLVED",
                answer: "是的，系统初始化时创建 admin 角色，不可删除，不可修改权限范围。",
            },
            {
                content: "角色变更后是否需要用户重新登录才生效？",
                severity: "MEDIUM",
                status: "OPEN",
            },
        ],
    },
    {
        id: "WI-014",
        title: "修复 PDF 预览组件在 Firefox 下白屏",
        type: "bug",
        priority: "P1",
        status: "IN_PROGRESS",
        riskLevel: "MEDIUM",
        description:
            "Firefox 浏览器下内嵌 PDF 预览组件显示白屏，Chrome 和 Edge 正常。经排查是 Firefox 对 PDF.js worker 的 CSP 策略更严格导致。",
        tags: ["frontend", "bug", "browser"],
        acceptanceCriteria: [
            "Firefox 最新版 PDF 预览正常显示",
            "Chrome/Edge/Safari 不受影响",
            "添加浏览器兼容性自动化测试用例",
        ],
        clarifications: [
            {
                content: "是否需要支持 Firefox ESR 版本？",
                severity: "LOW",
                status: "RESOLVED",
                answer: "仅支持最近 2 个主版本，ESR 不在范围内。",
            },
        ],
    },
    {
        id: "WI-015",
        title: "后端接口统一错误码和国际化错误消息",
        type: "task",
        priority: "P2",
        status: "IN_PROGRESS",
        riskLevel: "LOW",
        description:
            "当前各接口错误消息为硬编码中文，前端难以统一处理且无法国际化。需要定义标准错误码枚举（如 USER_NOT_FOUND、PERMISSION_DENIED），后端返回错误码+参数化消息，前端根据错误码展示对应提示。",
        tags: ["backend", "i18n"],
        acceptanceCriteria: [
            "所有 API 错误返回统一格式 { code, message, details }",
            "错误码定义在共享常量文件中",
            "前端根据错误码映射用户友好提示",
            "支持中英文两种语言的错误消息",
        ],
        clarifications: [],
    },
    {
        id: "WI-016",
        title: "修复列表页排序后分页数据跳变",
        type: "bug",
        priority: "P2",
        status: "IN_PROGRESS",
        riskLevel: "LOW",
        description:
            "在列表页先翻到第 3 页，然后点击列头排序，数据会跳回第 1 页且页码显示仍为第 3 页。原因是排序时未重置页码状态。",
        tags: ["frontend", "bug"],
        acceptanceCriteria: [
            "排序后自动回到第 1 页并更新分页组件",
            "筛选条件变更后同样重置页码",
            "URL 参数与分页状态保持一致",
        ],
        clarifications: [],
    },

    // ====== TESTING (测试中) ======
    {
        id: "WI-017",
        title: "用户注册流程增加手机号验证码校验",
        type: "story",
        priority: "P1",
        status: "TESTING",
        riskLevel: "MEDIUM",
        description:
            "为防止恶意注册和垃圾账号，注册流程增加手机号短信验证码环节。对接阿里云短信服务，支持 60 秒发送间隔限制和每日发送上限。",
        tags: ["frontend", "backend", "auth"],
        acceptanceCriteria: [
            "注册页增加手机号输入和验证码发送按钮",
            "发送后按钮倒计时 60 秒不可点击",
            "同一手机号每日最多发送 5 条验证码",
            "验证码有效期 5 分钟",
            "测试环境和生产环境使用不同的短信签名",
        ],
        clarifications: [
            {
                content: "海外手机号是否也需要支持？",
                severity: "MEDIUM",
                status: "RESOLVED",
                answer: "一期仅支持 +86 手机号，二期接入国际短信服务。",
            },
        ],
    },
    {
        id: "WI-018",
        title: "修复富文本编辑器粘贴 Word 内容格式错乱",
        type: "bug",
        priority: "P2",
        status: "TESTING",
        riskLevel: "LOW",
        description:
            "用户从 Word 复制内容粘贴到富文本编辑器时，格式严重错乱（字体、颜色、间距异常）。需要在粘贴时做格式清洗，只保留基本格式（加粗、斜体、列表、链接）。",
        tags: ["frontend", "bug"],
        acceptanceCriteria: [
            "粘贴 Word 内容后格式整洁，无异常样式",
            "保留加粗、斜体、有序/无序列表、超链接",
            "自动过滤 Word 特有的 mso-* 样式",
        ],
        clarifications: [],
    },
    {
        id: "WI-019",
        title: "核心 API 接口补充单元测试，覆盖率达到 80%",
        type: "task",
        priority: "P1",
        status: "TESTING",
        riskLevel: "LOW",
        description:
            "当前后端接口测试覆盖率仅 45%，需要为核心业务接口补充单元测试和集成测试，重点覆盖状态流转校验、澄清问题 CRUD 和 AI 分析接口。",
        tags: ["backend", "test"],
        acceptanceCriteria: [
            "状态流转接口测试覆盖率 100%（含合法/非法/阻断场景）",
            "澄清问题 CRUD 测试覆盖完整生命周期",
            "整体行覆盖率 ≥ 80%",
            "CI 中配置覆盖率门槛，不达标阻断合并",
        ],
        clarifications: [],
    },
    {
        id: "WI-020",
        title: "修复线上环境 502 错误增加，需要排查 Nginx 超时配置",
        type: "bug",
        priority: "P0",
        status: "TESTING",
        riskLevel: "HIGH",
        description:
            "生产环境近 24 小时 502 错误率从 0.1% 升至 2.3%，Nginx 日志显示 upstream timed out。怀疑后端某个接口耗时突增触发 Nginx 60s 超时。需排查慢接口并优化或调整超时配置。",
        tags: ["backend", "bug", "production"],
        acceptanceCriteria: [
            "定位导致超时的具体接口和根因",
            "优化慢查询或增加缓存",
            "502 错误率恢复至 0.1% 以下",
        ],
        clarifications: [
            {
                content: "是否需要在应用层增加请求超时熔断机制？",
                severity: "HIGH",
                status: "OPEN",
            },
        ],
    },

    // ====== DONE (已完成) ======
    {
        id: "WI-021",
        title: "项目初始化：Next.js + TypeScript + Tailwind 脚手架搭建",
        type: "task",
        priority: "P0",
        status: "DONE",
        riskLevel: "LOW",
        description:
            "搭建项目基础架构，包括 Next.js 16 App Router、TypeScript 严格模式、TailwindCSS 4、ESLint 配置、目录结构规划和基础组件库引入。",
        tags: ["frontend", "setup"],
        acceptanceCriteria: [
            "项目可正常启动 npm run dev",
            "TypeScript strict mode 通过",
            "TailwindCSS 正常工作",
            "ESLint 规则生效",
        ],
        clarifications: [],
    },
    {
        id: "WI-022",
        title: "数据库设计与 Prisma Schema 定义",
        type: "task",
        priority: "P0",
        status: "DONE",
        riskLevel: "MEDIUM",
        description:
            "完成核心数据模型设计：WorkItem、ClarificationQuestion、AiAnalysis、StatusHistory、Tag、Assignee。确定字段类型、关联关系和索引策略。",
        tags: ["backend", "database"],
        acceptanceCriteria: [
            "Prisma schema 定义完整，generate 无报错",
            "SQLite 本地可正常运行",
            "迁移脚本可重复执行",
            "种子数据可正常填充",
        ],
        clarifications: [],
    },
    {
        id: "WI-023",
        title: "修复登录页密码明文传输的安全漏洞",
        type: "bug",
        priority: "P0",
        status: "DONE",
        riskLevel: "HIGH",
        description:
            "安全审计发现登录接口密码以明文形式在网络中传输。修复方案：前端使用 RSA 公钥加密密码后再传输，后端使用私钥解密。同时全站强制 HTTPS，添加 CSP 头。",
        tags: ["backend", "security", "bug"],
        acceptanceCriteria: [
            "密码传输全程加密，抓包无法看到明文",
            "全站启用 HSTS",
            "CSP 头正确配置",
        ],
        clarifications: [],
        ai: {
            summary:
                "修复登录密码明文传输的安全漏洞。使用非对称加密方案，前端用公钥加密后传输，后端私钥解密。同时加强 HTTPS 和 CSP 安全头配置。",
            risks: [
                {
                    title: "RSA 加密对移动端性能影响",
                    level: "LOW",
                    reason: "移动端 RSA 加密计算可能造成短暂延迟，需实际测试",
                },
                {
                    title: "旧客户端未更新可能无法登录",
                    level: "MEDIUM",
                    reason: "加密方案上线后旧版本 App 无法兼容，需灰度发布",
                },
            ],
            suggestedClarificationQuestions: [
                "是否需要在前端增加请求签名防止重放攻击？",
            ],
            taskBreakdown: [
                "前端实现 RSA 公钥加密逻辑",
                "后端解密中间件",
                "全站 HSTS 配置",
                "CSP 安全头配置",
            ],
        },
    },
    {
        id: "WI-024",
        title: "看板页面响应式适配，移动端支持水平滑动",
        type: "story",
        priority: "P1",
        status: "DONE",
        riskLevel: "LOW",
        description:
            "看板页面在移动端 6 列压缩在一起无法使用。改为水平滑动模式，每列最小宽度 280px，支持左右滑动浏览各状态列。桌面端保持原有 6 列布局不变。",
        tags: ["frontend", "mobile", "responsive"],
        acceptanceCriteria: [
            "移动端看板可左右滑动查看各列",
            "每列宽度 ≥ 280px，卡片文字可读",
            "桌面端布局不受影响，仍为 6 列",
        ],
        clarifications: [],
    },
]

// ====== Assignee 池 ======
const assignees = [
    "张伟",
    "李娜",
    "王强",
    "赵敏",
    "陈晓东",
    "刘洋",
    "黄丽",
    "周杰",
    "吴鑫",
    "孙雨桐",
    "devops-bot",
    "test-bot",
]

// ====== Tag 池 ======
const tags = [
    "frontend",
    "backend",
    "devops",
    "mobile",
    "bug",
    "security",
    "performance",
    "production",
    "auth",
    "database",
    "api",
    "ux",
    "design",
    "ci",
    "test",
    "i18n",
    "upload",
    "search",
    "setup",
    "browser",
    "websocket",
    "responsive",
]

async function main() {
    // Clear
    await prisma.tag.deleteMany()
    await prisma.statusHistory.deleteMany()
    await prisma.aiAnalysis.deleteMany()
    await prisma.clarificationQuestion.deleteMany()
    await prisma.workItem.deleteMany()
    await prisma.assignee.deleteMany()

    // Assignees
    for (const name of assignees) {
        await prisma.assignee.create({
            data: {
                name,
                avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&radius=50`,
            },
        })
    }

    // Tags
    await prisma.tag.createMany({ data: tags.map((name) => ({ name })) })

    // Work items
    for (const item of workItems) {
        await prisma.workItem.create({
            data: {
                id: item.id,
                title: item.title,
                description: item.description,
                type: item.type,
                priority: item.priority,
                status: item.status,
                assignee: faker.helpers.arrayElement(assignees),
                tags: list(item.tags),
                riskLevel: item.riskLevel,
                acceptanceCriteria: list(item.acceptanceCriteria),
                clarifications: {
                    create: item.clarifications.map((q) => ({
                        content: q.content,
                        severity: q.severity,
                        status: q.status,
                        answer: q.answer ?? null,
                    })),
                },
                aiAnalyses: item.ai
                    ? {
                          create: {
                              summary: item.ai.summary,
                              suggestedAcceptanceCriteria: list(
                                  item.acceptanceCriteria,
                              ),
                              risks: JSON.stringify(item.ai.risks),
                              suggestedClarificationQuestions: list(
                                  item.ai.suggestedClarificationQuestions,
                              ),
                              taskBreakdown: list(item.ai.taskBreakdown),
                          },
                      }
                    : undefined,
                statusHistory: {
                    create: historyFor(item.status),
                },
            },
        })
    }

    console.log(`Seeded ${workItems.length} work items`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
