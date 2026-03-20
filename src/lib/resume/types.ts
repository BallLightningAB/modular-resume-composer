import type { z } from 'zod';
import type {
	BlockCollectionSchema,
	BlockItemSchema,
	ExperienceBulletSchema,
	ExperienceEntrySchema,
	ExperienceFileSchema,
	ExperienceRuleSchema,
	LanguageCodeSchema,
	LastUsedResumeStateSchema,
	LoadedResumeModulesSchema,
	PresetFileSchema,
	ProfileFileSchema,
	RoleTrackSchema,
	SavedPresetCollectionSchema,
	SavedPresetRecordSchema,
	SavedPresetUiSchema,
	SectionKeySchema,
	SummariesFileSchema,
	SummaryItemSchema,
} from './schema';

export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
export type RoleTrack = z.infer<typeof RoleTrackSchema>;
export type SectionKey = z.infer<typeof SectionKeySchema>;

export type ProfileFile = z.infer<typeof ProfileFileSchema>;
export type SummariesFile = z.infer<typeof SummariesFileSchema>;
export type BlockCollection = z.infer<typeof BlockCollectionSchema>;
export type ExperienceFile = z.infer<typeof ExperienceFileSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ExperienceRule = z.infer<typeof ExperienceRuleSchema>;
export type PresetFile = z.infer<typeof PresetFileSchema>;
export type LoadedResumeModules = z.infer<typeof LoadedResumeModulesSchema>;
export type SummaryItem = z.infer<typeof SummaryItemSchema>;
export type BlockItem = z.infer<typeof BlockItemSchema>;
export type ExperienceBullet = z.infer<typeof ExperienceBulletSchema>;
export type SavedPresetUi = z.infer<typeof SavedPresetUiSchema>;
export type SavedPresetRecord = z.infer<typeof SavedPresetRecordSchema>;
export type SavedPresetCollection = z.infer<typeof SavedPresetCollectionSchema>;
export type LastUsedResumeState = z.infer<typeof LastUsedResumeStateSchema>;

export interface ComposeResumeInput {
	modules: LoadedResumeModules;
	preset: PresetFile;
}

export interface ComposedHeader {
	name: string;
	location: string;
	email: string;
	phone: string;
	linkedin: string;
	portfolio: string;
}

export interface ComposedExperienceEntry {
	id: string;
	company: string;
	role: string;
	dates: string;
	location?: string;
	subtitle?: string;
	bullets: Array<string>;
}

export interface ComposedOverlaySection {
	id: string;
	title?: string;
	items: Array<string>;
}

export interface ComposedBlockSection {
	id: string;
	title?: string;
	items: Array<string>;
}

export interface ComposedResumeDocument {
	metadata: {
		preset_id: string;
		language: LanguageCode;
		role_track: RoleTrack;
	};
	header: ComposedHeader;
	title_line?: string;
	section_order: Array<SectionKey>;
	summary?: string;
	selected_impact?: ComposedBlockSection;
	strengths?: ComposedBlockSection & {
		overlay_sections: Array<ComposedOverlaySection>;
	};
	experience: Array<ComposedExperienceEntry>;
	overlays: Array<ComposedOverlaySection>;
	education?: ComposedBlockSection;
	certifications?: ComposedBlockSection;
	references?: ComposedBlockSection;
	stack?: ComposedBlockSection;
	languages: Array<string>;
}
