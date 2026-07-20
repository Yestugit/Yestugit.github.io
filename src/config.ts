import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Yuxiang's Digital Garden",
	subtitle: "记录学习、项目与生活的个人数字花园",
	description:
		"Yuxiang 的个人数字花园，记录机器学习、大语言模型、项目开发、技术实践、阅读与生活。",
	url: "https://yestugit.github.io/",
	author: "Yuxiang Ye",
	copyrightName: "Yuxiang",
	timeZone: "Asia/Shanghai",
	socialImage: "/images/social/og.png",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 265, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/banner-placeholder.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		{ src: "/favicon/favicon-light-32.png", theme: "light", sizes: "32x32" },
		{ src: "/favicon/favicon-dark-32.png", theme: "dark", sizes: "32x32" },
		{
			src: "/favicon/favicon-light-192.png",
			theme: "light",
			sizes: "192x192",
		},
		{
			src: "/favicon/favicon-dark-192.png",
			theme: "dark",
			sizes: "192x192",
		},
	],
};

export const siteMetricsConfig = {
	apiBaseUrl: "https://yestugit-site-metrics.saeye75.workers.dev",
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		{ name: "学习札记", url: "/learning/" },
		{ name: "生活随想", url: "/life/" },
		{ name: "项目", url: "/projects/" },
		LinkPreset.Archive,
		LinkPreset.About,
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/G_wG5MgaYAAOwSt.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "橘の記録",
	bio: "本科毕业于华南理工大学软件学院，目前在浙江大学软件学院攻读硕士学位，是计算机与人工智能方向的学习者。喜欢玩游戏，赛博朋克2077，消光，生化危机，魔裁（主推橘远，艾玛和希罗）等等。喜欢追番，罪恶王冠，莉可莉丝，中二病，我心危，胆大党等等。个人名言：Stay curious, stay moving.",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Yestugit",
		},
		{
			name: "邮箱",
			icon: "fa6-regular:envelope",
			url: "mailto:1735837808@qq.com",
		},
		{
			name: "哔哩哔哩",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/1868822677?spm_id_from=333.1387.0.0",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
