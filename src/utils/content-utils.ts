import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import type { PostSection } from "../types/content";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (const post of sorted) {
		post.data.nextSlug = "";
		post.data.nextTitle = "";
		post.data.prevSlug = "";
		post.data.prevTitle = "";
	}

	const postsBySection = new Map<string, CollectionEntry<"posts">[]>();
	for (const post of sorted) {
		const section = post.data.section ?? "unsectioned";
		const sectionPosts = postsBySection.get(section) ?? [];
		sectionPosts.push(post);
		postsBySection.set(section, sectionPosts);
	}

	for (const sectionPosts of postsBySection.values()) {
		for (let i = 1; i < sectionPosts.length; i++) {
			sectionPosts[i].data.nextSlug = sectionPosts[i - 1].slug;
			sectionPosts[i].data.nextTitle = sectionPosts[i - 1].data.title;
		}
		for (let i = 0; i < sectionPosts.length - 1; i++) {
			sectionPosts[i].data.prevSlug = sectionPosts[i + 1].slug;
			sectionPosts[i].data.prevTitle = sectionPosts[i + 1].data.title;
		}
	}

	return sorted;
}

export async function getPostsBySection(section: PostSection) {
	const sorted = await getSortedPosts();
	return sorted.filter((post) => post.data.section === section);
}

export type SectionOverview = {
	posts: CollectionEntry<"posts">[];
	categories: string[];
	tags: string[];
	latestUpdated?: Date;
};

export async function getSectionOverview(
	section: PostSection,
): Promise<SectionOverview> {
	const posts = await getPostsBySection(section);
	const categories = [
		...new Set(
			posts
				.map((post) => post.data.category?.trim())
				.filter((category): category is string => Boolean(category)),
		),
	].sort((a, b) => a.localeCompare(b, "zh-CN"));
	const tags = [
		...new Set(
			posts.flatMap((post) => post.data.tags.map((tag) => tag.trim())),
		),
	]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "zh-CN"));
	const latestUpdated = posts.reduce<Date | undefined>((latest, post) => {
		const postDate = post.data.updated ?? post.data.published;
		return !latest || postDate > latest ? postDate : latest;
	}, undefined);

	return { posts, categories, tags, latestUpdated };
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
