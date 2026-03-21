import { z } from 'zod';

export const LANGUAGE_CODES = ['en', 'sv'] as const;
export const ROLE_TRACKS = [
	'technical_delivery',
	'technical_project_management',
	'integration',
] as const;
export const SECTION_KEYS = [
	'summary',
	'selected_impact',
	'strengths',
	'experience',
	'stack',
	'ai_overlay',
	'education',
	'certifications',
	'references',
	'languages',
] as const;

export const LanguageCodeSchema = z.enum(LANGUAGE_CODES);
export const RoleTrackSchema = z.enum(ROLE_TRACKS);
export const SectionKeySchema = z.enum(SECTION_KEYS);

export const ContactSchema = z.object({
	location: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(1),
	linkedin: z.string().min(1),
	portfolio: z.string().min(1),
});

export const LanguageItemSchema = z.object({
	name: z.string().min(1),
	proficiency: z.string().min(1),
});

export const ProfileFileSchema = z.object({
	version: z.union([z.string(), z.number()]).transform(String).default('1'),
	person: z.object({
		name: z.string().min(1),
		contact: ContactSchema,
	}),
	title_lines: z.record(z.string(), z.string()).default({}),
	languages: z.array(LanguageItemSchema).default([]),
});

export const SummaryItemSchema = z.object({
	id: z.string().min(1),
	language: LanguageCodeSchema,
	role_track: RoleTrackSchema,
	text: z.string().min(1),
});

export const SummariesFileSchema = z.object({
	version: z.union([z.string(), z.number()]).transform(String).default('1'),
	items: z.array(SummaryItemSchema).min(1),
});

function coerceBlockItemText(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}

	if (typeof value === 'number' || typeof value === 'bigint') {
		return String(value);
	}

	if (!value || typeof value !== 'object') {
		return undefined;
	}

	const record = value as Record<string, unknown>;
	const preferredKeys = ['text', 'title', 'label', 'name', 'value', 'content'];

	for (const key of preferredKeys) {
		const candidate = record[key];
		if (typeof candidate === 'string') {
			const trimmed = candidate.trim();
			if (trimmed.length > 0) {
				return trimmed;
			}
		}
	}

	for (const candidate of Object.values(record)) {
		const text = coerceBlockItemText(candidate);
		if (text) {
			return text;
		}
	}

	return undefined;
}

export const BlockItemSchema = z.object({
	id: z.string().min(1),
	language: LanguageCodeSchema,
	role_track: RoleTrackSchema.optional(),
	title: z.string().optional(),
	items: z
		.array(z.unknown())
		.transform((items) =>
			items.map(coerceBlockItemText).filter((item): item is string => Boolean(item))
		),
});

export const BlockCollectionSchema = z.object({
	version: z.union([z.string(), z.number()]).transform(String).default('1'),
	items: z.array(BlockItemSchema).min(1),
});

export const ExperienceBulletSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
	tags: z.array(z.string().min(1)).default([]),
	priority: z.number().int().min(0).max(100).default(0),
});

export const ExperienceEntrySchema = z.object({
	id: z.string().min(1),
	language: LanguageCodeSchema,
	company: z.string().min(1),
	role: z.string().min(1),
	dates: z.union([z.string().min(1), z.number()]).transform(String),
	location: z.string().optional(),
	subtitle: z.string().optional(),
	bullets: z.array(ExperienceBulletSchema).min(1),
});

export const ExperienceFileSchema = z.object({
	version: z.union([z.string(), z.number()]).transform(String).default('1'),
	entries: z.array(ExperienceEntrySchema).min(1),
});

export const ExperienceRuleSchema = z.object({
	entry_id: z.string().min(1),
	max_bullets: z.number().int().min(1).max(10).default(4),
	prefer_tags: z.array(z.string().min(1)).default([]),
	required_tags: z.array(z.string().min(1)).default([]),
	exclude_tags: z.array(z.string().min(1)).default([]),
	force_bullet_ids: z.array(z.string().min(1)).default([]),
});

export const PresetFileSchema = z.object({
	id: z.string().min(1),
	language: LanguageCodeSchema,
	role_track: RoleTrackSchema,
	title_line: z.string().optional(),
	summary_id: z.string().optional(),
	impacts_id: z.string().optional(),
	strengths_id: z.string().optional(),
	education_id: z.string().optional(),
	certifications_id: z.string().optional(),
	references_id: z.string().optional(),
	stack_id: z.string().optional(),
	overlay_ids: z.array(z.string().min(1)).default([]),
	section_order: z.array(SectionKeySchema).min(1),
	experience: z.array(ExperienceRuleSchema).min(1),
});

export const SavedPresetUiSchema = z.object({
	section_visibility: z.record(z.string().min(1), z.boolean()).default({}),
});

export const SavedPresetRecordSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	source_preset_id: z.string().optional(),
	preset: PresetFileSchema,
	modules: z.lazy(() => LoadedResumeModulesSchema).optional(),
	ui: SavedPresetUiSchema.default({ section_visibility: {} }),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
});

export const SavedPresetCollectionSchema = z.array(SavedPresetRecordSchema);

export const LastUsedResumeStateSchema = z.object({
	source: z.enum(['builtin', 'saved', 'draft']),
	saved_preset_id: z.string().optional(),
	preset: PresetFileSchema,
	modules: z.lazy(() => LoadedResumeModulesSchema).optional(),
	ui: SavedPresetUiSchema.default({ section_visibility: {} }),
	updated_at: z.string().min(1),
});

export const LoadedResumeModulesSchema = z.object({
	profile: ProfileFileSchema,
	summaries: SummariesFileSchema,
	strengths: BlockCollectionSchema,
	impacts: BlockCollectionSchema,
	experience: ExperienceFileSchema,
	overlays: BlockCollectionSchema.optional(),
	references: BlockCollectionSchema.optional(),
	education: BlockCollectionSchema.optional(),
	certifications: BlockCollectionSchema.optional(),
	stack: BlockCollectionSchema.optional(),
});
