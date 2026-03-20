import { LANGUAGE_CODES, ROLE_TRACKS } from './schema';
import type { LanguageCode, PresetFile, RoleTrack, SavedPresetRecord } from './types';

export interface BuilderSearch {
	preset?: string;
	saved?: string;
	language: LanguageCode;
	roleTrack: RoleTrack;
	overlays: Array<string>;
}

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const DEFAULT_ROLE_TRACK: RoleTrack = 'technical_delivery';

function firstString(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}

	if (Array.isArray(value)) {
		return firstString(value[0]);
	}

	return undefined;
}

function parseStringList(value: unknown): Array<string> {
	if (Array.isArray(value)) {
		return value.flatMap((entry) => parseStringList(entry));
	}

	const text = firstString(value);
	if (!text) {
		return [];
	}

	return Array.from(
		new Set(
			text
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean)
		)
	);
}

function isLanguageCode(value: string | undefined): value is LanguageCode {
	return Boolean(value && LANGUAGE_CODES.includes(value as LanguageCode));
}

function isRoleTrack(value: string | undefined): value is RoleTrack {
	return Boolean(value && ROLE_TRACKS.includes(value as RoleTrack));
}

export function validateBuilderSearch(rawSearch: Record<string, unknown>): BuilderSearch {
	const languageCandidate = firstString(rawSearch.lang ?? rawSearch.language);
	const roleTrackCandidate = firstString(rawSearch.track ?? rawSearch.roleTrack);

	return {
		preset: firstString(rawSearch.preset),
		saved: firstString(rawSearch.saved),
		language: isLanguageCode(languageCandidate) ? languageCandidate : DEFAULT_LANGUAGE,
		roleTrack: isRoleTrack(roleTrackCandidate) ? roleTrackCandidate : DEFAULT_ROLE_TRACK,
		overlays: parseStringList(rawSearch.overlays ?? rawSearch.overlayIds),
	};
}

export function createSearchFromPreset(params: {
	presetId?: string;
	savedPresetId?: string;
	preset: Pick<PresetFile, 'language' | 'role_track' | 'overlay_ids'>;
}): BuilderSearch {
	return {
		preset: params.presetId,
		saved: params.savedPresetId,
		language: params.preset.language,
		roleTrack: params.preset.role_track,
		overlays: [...params.preset.overlay_ids],
	};
}

export function createSearchFromSavedPreset(record: SavedPresetRecord): BuilderSearch {
	return createSearchFromPreset({
		presetId: record.source_preset_id ?? record.preset.id,
		savedPresetId: record.id,
		preset: record.preset,
	});
}

export function areBuilderSearchesEqual(left: BuilderSearch, right: BuilderSearch): boolean {
	return (
		left.preset === right.preset &&
		left.saved === right.saved &&
		left.language === right.language &&
		left.roleTrack === right.roleTrack &&
		left.overlays.length === right.overlays.length &&
		left.overlays.every((overlayId, index) => overlayId === right.overlays[index])
	);
}

export function hasMeaningfulBuilderSearch(search: BuilderSearch): boolean {
	return (
		Boolean(search.preset) ||
		Boolean(search.saved) ||
		search.language !== DEFAULT_LANGUAGE ||
		search.roleTrack !== DEFAULT_ROLE_TRACK ||
		search.overlays.length > 0
	);
}

export function normalizeSearchForNavigation(
	search: BuilderSearch
): Record<string, string | undefined> {
	return {
		preset: search.preset,
		saved: search.saved,
		lang: search.language,
		track: search.roleTrack,
		overlays: search.overlays.length > 0 ? search.overlays.join(',') : undefined,
	};
}

export function createRouteSearchInput(search: BuilderSearch): Record<string, unknown> {
	return {
		preset: search.preset,
		saved: search.saved,
		language: search.language,
		roleTrack: search.roleTrack,
		overlays: [...search.overlays],
	};
}

export function buildResumeHref(pathname: string, search: BuilderSearch): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(normalizeSearchForNavigation(search))) {
		if (value) {
			params.set(key, value);
		}
	}

	const query = params.toString();
	return query.length > 0 ? `${pathname}?${query}` : pathname;
}
