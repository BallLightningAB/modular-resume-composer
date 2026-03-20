import type { BuilderSearch } from './search';
import type { LastUsedResumeState, PresetFile, SavedPresetRecord, SavedPresetUi } from './types';

export interface ResumeBuilderState {
	source: 'builtin' | 'saved' | 'draft';
	builtinPresetId?: string;
	savedPresetId?: string;
	label: string;
	preset: PresetFile;
	ui: SavedPresetUi;
}

function cloneExperienceRule(rule: PresetFile['experience'][number]) {
	return {
		...rule,
		prefer_tags: [...rule.prefer_tags],
		required_tags: [...rule.required_tags],
		exclude_tags: [...rule.exclude_tags],
		force_bullet_ids: [...rule.force_bullet_ids],
	};
}

export function clonePreset(preset: PresetFile): PresetFile {
	return {
		...preset,
		overlay_ids: [...preset.overlay_ids],
		section_order: [...preset.section_order],
		experience: preset.experience.map(cloneExperienceRule),
	};
}

export function cloneSavedPresetUi(ui?: SavedPresetUi): SavedPresetUi {
	return {
		section_visibility: {
			...(ui?.section_visibility ?? {}),
		},
	};
}

export function applySearchToPreset(preset: PresetFile, search: BuilderSearch): PresetFile {
	const next = clonePreset(preset);
	next.language = search.language;
	next.role_track = search.roleTrack;
	next.overlay_ids = [...search.overlays];
	return next;
}

export function findBuiltinPreset(presets: Array<PresetFile>, presetId?: string): PresetFile {
	if (presets.length === 0) {
		throw new Error('No built-in resume presets are available.');
	}

	if (presetId) {
		const matched = presets.find((preset) => preset.id === presetId);
		if (matched) {
			return matched;
		}
	}

	return presets[0];
}

export function deriveBuilderState(params: {
	presetCatalog: Array<PresetFile>;
	search: BuilderSearch;
	savedPresets: Array<SavedPresetRecord>;
}): ResumeBuilderState {
	const { presetCatalog, search, savedPresets } = params;

	if (search.saved) {
		const savedPreset = savedPresets.find((record) => record.id === search.saved);
		if (savedPreset) {
			return {
				source: 'saved',
				builtinPresetId: search.preset ?? savedPreset.source_preset_id,
				savedPresetId: savedPreset.id,
				label: savedPreset.name,
				preset: applySearchToPreset(savedPreset.preset, search),
				ui: cloneSavedPresetUi(savedPreset.ui),
			};
		}
	}

	const builtinPreset = findBuiltinPreset(presetCatalog, search.preset);

	return {
		source: 'builtin',
		builtinPresetId: builtinPreset.id,
		label: builtinPreset.id,
		preset: applySearchToPreset(builtinPreset, search),
		ui: cloneSavedPresetUi(),
	};
}

export function deriveBuilderStateFromLastUsed(
	lastUsed: LastUsedResumeState,
	search?: BuilderSearch
): ResumeBuilderState {
	const effectiveSearch: BuilderSearch = search
		? search
		: {
				preset: undefined,
				saved: lastUsed.saved_preset_id,
				language: lastUsed.preset.language,
				roleTrack: lastUsed.preset.role_track,
				overlays: [...lastUsed.preset.overlay_ids],
			};

	return {
		source: lastUsed.source,
		savedPresetId: lastUsed.saved_preset_id,
		label: lastUsed.saved_preset_id ?? lastUsed.preset.id,
		preset: applySearchToPreset(lastUsed.preset, effectiveSearch),
		ui: cloneSavedPresetUi(lastUsed.ui),
	};
}

export function createLastUsedState(state: ResumeBuilderState): LastUsedResumeState {
	return {
		source: state.source,
		saved_preset_id: state.savedPresetId,
		preset: clonePreset(state.preset),
		ui: cloneSavedPresetUi(state.ui),
		updated_at: new Date().toISOString(),
	};
}

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
		.slice(0, 40);
}

function createRecordId(name: string): string {
	const base = slugify(name) || 'preset';
	const stamp = new Date()
		.toISOString()
		.replace(/[^0-9]/g, '')
		.slice(0, 14);
	return `saved-${base}-${stamp}`;
}

export function createSavedPresetRecord(params: {
	name: string;
	state: ResumeBuilderState;
}): SavedPresetRecord {
	const timestamp = new Date().toISOString();
	return {
		id: createRecordId(params.name),
		name: params.name.trim(),
		source_preset_id: params.state.builtinPresetId,
		preset: clonePreset(params.state.preset),
		ui: cloneSavedPresetUi(params.state.ui),
		created_at: timestamp,
		updated_at: timestamp,
	};
}
