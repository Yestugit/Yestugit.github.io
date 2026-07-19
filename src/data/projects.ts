export type ProjectStatus = "开发中" | "维护中" | "已完成" | "已暂停";

export type Project = {
	name: string;
	description: string;
	technologies: string[];
	status: ProjectStatus;
	date: string;
	repository: string;
	demo: string;
	image: string;
	featured: boolean;
};

export const projects: Project[] = [
	{
		name: "VisualizingBook",
		description: "一个正在开发中的可视化阅读与学习相关项目。",
		technologies: ["待补充"],
		status: "开发中",
		date: "待补充",
		repository: "",
		demo: "",
		image: "",
		featured: true,
	},
];
