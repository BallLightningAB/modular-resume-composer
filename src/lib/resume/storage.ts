import { LastUsedResumeStateSchema, SavedPresetCollectionSchema } from './schema';
import type { LastUsedResumeState, SavedPresetRecord } from './types';

const SAVED_PRESETS_KEY = 'modular-resume-composer:saved-presets:v1';
const LAST_USED_KEY = 'modular-resume-composer:last-used:v1';

function getStorage(): Storage | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function readSavedPresetCollection(): Array<SavedPresetRecord> {
	const storage = getStorage();
	if (!storage) {
		return [];
	}

	const raw = storage.getItem(SAVED_PRESETS_KEY);
	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw);
		const result = SavedPresetCollectionSchema.safeParse(parsed);
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}

export function writeSavedPresetCollection(collection: Array<SavedPresetRecord>): void {
	const storage = getStorage();
	if (!storage) {
		return;
	}

	storage.setItem(SAVED_PRESETS_KEY, JSON.stringify(collection));
}

export function upsertSavedPreset(record: SavedPresetRecord): Array<SavedPresetRecord> {
	const existing = readSavedPresetCollection();
	const next = [record, ...existing.filter((item) => item.id !== record.id)].sort((left, right) =>
		right.updated_at.localeCompare(left.updated_at)
	);
	writeSavedPresetCollection(next);
	return next;
}

export function deleteSavedPreset(presetId: string): Array<SavedPresetRecord> {
	const next = readSavedPresetCollection().filter((item) => item.id !== presetId);
	writeSavedPresetCollection(next);
	return next;
}

export function readLastUsedResumeState(): LastUsedResumeState | null {
	const storage = getStorage();
	if (!storage) {
		return null;
	}

	const raw = storage.getItem(LAST_USED_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw);
		const result = LastUsedResumeStateSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function writeLastUsedResumeState(state: LastUsedResumeState): void {
	const storage = getStorage();
	if (!storage) {
		return;
	}

	storage.setItem(LAST_USED_KEY, JSON.stringify(state));
}
