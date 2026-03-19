import type {
	BlockCollection,
	BlockItem,
	ComposedExperienceEntry,
	ComposedResumeDocument,
	ComposeResumeInput,
	ExperienceBullet,
	ExperienceEntry,
	ExperienceRule,
	RoleTrack,
	SummaryItem,
} from './types';

function normalizeTag(tag: string): string {
	return tag.trim().toLowerCase();
}

function hasAnyTag(tags: Array<string>, wanted: Array<string>): boolean {
	if (wanted.length === 0) return true;
	const normalized = new Set(tags.map(normalizeTag));
	return wanted.some((tag) => normalized.has(normalizeTag(tag)));
}

function hasAllTags(tags: Array<string>, required: Array<string>): boolean {
	if (required.length === 0) return true;
	const normalized = new Set(tags.map(normalizeTag));
	return required.every((tag) => normalized.has(normalizeTag(tag)));
}

function matchesLanguage<T extends { language: string }>(
	items: Array<T>,
	language: string
): Array<T> {
	return items.filter((item) => item.language === language);
}

function resolveSummaryText(params: {
	summaries: ComposeResumeInput['modules']['summaries'];
	language: string;
	roleTrack: RoleTrack;
	summaryId?: string;
}): string | undefined {
	const { summaries, language, roleTrack, summaryId } = params;

	if (summaryId) {
		return summaries.items.find(
			(item: SummaryItem) => item.id === summaryId && item.language === language
		)?.text;
	}

	return summaries.items.find(
		(item: SummaryItem) => item.language === language && item.role_track === roleTrack
	)?.text;
}

function resolveBlock(params: {
	collection?: BlockCollection;
	language: string;
	roleTrack: RoleTrack;
	blockId?: string;
}): BlockItem | undefined {
	const { collection, language, roleTrack, blockId } = params;
	if (!collection) return undefined;

	if (blockId) {
		return collection.items.find(
			(item: BlockItem) => item.id === blockId && item.language === language
		);
	}

	const exactMatch = collection.items.find(
		(item: BlockItem) => item.language === language && item.role_track === roleTrack
	);
	if (exactMatch) return exactMatch;

	return collection.items.find(
		(item: BlockItem) => item.language === language && item.role_track === undefined
	);
}

function scoreBullet(params: {
	bulletTags: Array<string>;
	rule: ExperienceRule;
	roleTrack: RoleTrack;
}): number {
	const { bulletTags, rule, roleTrack } = params;
	const normalized = bulletTags.map(normalizeTag);

	let score = 0;

	if (normalized.includes(normalizeTag(roleTrack))) score += 100;

	for (const tag of rule.prefer_tags) {
		if (normalized.includes(normalizeTag(tag))) score += 25;
	}

	for (const tag of rule.required_tags) {
		if (normalized.includes(normalizeTag(tag))) score += 10;
	}

	return score;
}

function selectBullets(
	entry: ExperienceEntry,
	rule: ExperienceRule,
	roleTrack: RoleTrack
): Array<string> {
	const forced = entry.bullets.filter((bullet: ExperienceBullet) =>
		rule.force_bullet_ids.includes(bullet.id)
	);

	const candidates = entry.bullets
		.filter((bullet: ExperienceBullet) => !rule.force_bullet_ids.includes(bullet.id))
		.filter((bullet: ExperienceBullet) => !hasAnyTag(bullet.tags, rule.exclude_tags))
		.filter((bullet: ExperienceBullet) => hasAllTags(bullet.tags, rule.required_tags))
		.map((bullet: ExperienceBullet) => ({
			bullet,
			score:
				scoreBullet({
					bulletTags: bullet.tags,
					rule,
					roleTrack,
				}) + bullet.priority,
		}))
		.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

	const maxBullets = Math.max(rule.max_bullets - forced.length, 0);
	const selected = candidates
		.slice(0, maxBullets)
		.map((item: { bullet: ExperienceBullet }) => item.bullet);

	return [...forced, ...selected].map((bullet) => bullet.text);
}

function composeExperience(params: {
	entries: Array<ExperienceEntry>;
	rules: Array<ExperienceRule>;
	language: string;
	roleTrack: RoleTrack;
}): Array<ComposedExperienceEntry> {
	const { entries, rules, language, roleTrack } = params;
	const entriesForLanguage = matchesLanguage(entries, language);

	const results = rules.map((rule) => {
		const entry = entriesForLanguage.find((item: ExperienceEntry) => item.id === rule.entry_id);
		if (!entry) return null;

		return {
			id: entry.id,
			company: entry.company,
			role: entry.role,
			dates: entry.dates,
			location: entry.location,
			subtitle: entry.subtitle,
			bullets: selectBullets(entry, rule, roleTrack),
		} as ComposedExperienceEntry;
	});

	return results.filter((item): item is ComposedExperienceEntry => item !== null);
}

export function composeResumeDocument(input: ComposeResumeInput): ComposedResumeDocument {
	const { modules, preset } = input;
	const {
		profile,
		summaries,
		strengths,
		impacts,
		experience,
		overlays,
		education,
		certifications,
		stack,
	} = modules;

	const summary = resolveSummaryText({
		summaries,
		language: preset.language,
		roleTrack: preset.role_track,
		summaryId: preset.summary_id,
	});

	const impactBlock = resolveBlock({
		collection: impacts,
		language: preset.language,
		roleTrack: preset.role_track,
		blockId: preset.impacts_id,
	});

	const strengthsBlock = resolveBlock({
		collection: strengths,
		language: preset.language,
		roleTrack: preset.role_track,
		blockId: preset.strengths_id,
	});

	const educationBlock = resolveBlock({
		collection: education,
		language: preset.language,
		roleTrack: preset.role_track,
		blockId: preset.education_id,
	});

	const certificationsBlock = resolveBlock({
		collection: certifications,
		language: preset.language,
		roleTrack: preset.role_track,
		blockId: preset.certifications_id,
	});

	const stackBlock = resolveBlock({
		collection: stack,
		language: preset.language,
		roleTrack: preset.role_track,
		blockId: preset.stack_id,
	});

	const overlaySections =
		overlays?.items
			.filter(
				(item: BlockItem) =>
					item.language === preset.language && preset.overlay_ids.includes(item.id)
			)
			.map((item: BlockItem) => ({
				id: item.id,
				title: item.title,
				items: item.items,
			})) ?? [];

	const composedExperience = composeExperience({
		entries: experience.entries,
		rules: preset.experience,
		language: preset.language,
		roleTrack: preset.role_track,
	});

	const titleLine = preset.title_line ?? profile.title_lines[preset.role_track];

	return {
		metadata: {
			preset_id: preset.id,
			language: preset.language,
			role_track: preset.role_track,
		},
		header: {
			name: profile.person.name,
			location: profile.person.contact.location,
			email: profile.person.contact.email,
			phone: profile.person.contact.phone,
			linkedin: profile.person.contact.linkedin,
			portfolio: profile.person.contact.portfolio,
		},
		title_line: titleLine,
		section_order: preset.section_order,
		summary,
		selected_impact: impactBlock
			? {
					id: impactBlock.id,
					title: impactBlock.title,
					items: impactBlock.items,
				}
			: undefined,
		strengths: strengthsBlock
			? {
					id: strengthsBlock.id,
					title: strengthsBlock.title,
					items: strengthsBlock.items,
				}
			: undefined,
		experience: composedExperience,
		overlays: overlaySections,
		education: educationBlock
			? {
					id: educationBlock.id,
					title: educationBlock.title,
					items: educationBlock.items,
				}
			: undefined,
		certifications: certificationsBlock
			? {
					id: certificationsBlock.id,
					title: certificationsBlock.title,
					items: certificationsBlock.items,
				}
			: undefined,
		stack: stackBlock
			? {
					id: stackBlock.id,
					title: stackBlock.title,
					items: stackBlock.items,
				}
			: undefined,
		languages: profile.languages.map(
			(language: { name: string; proficiency: string }) =>
				`${language.name} — ${language.proficiency}`
		),
	};
}
