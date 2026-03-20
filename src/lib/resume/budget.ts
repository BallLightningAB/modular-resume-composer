import type { ComposedResumeDocument, SectionKey } from './types';

export interface SectionBudgetMetric {
	key: SectionKey;
	label: string;
	used: number;
	max: number;
	status: 'ok' | 'warning' | 'over';
}

const SECTION_BUDGET_LIMITS: Record<SectionKey, number> = {
	summary: 260,
	selected_impact: 420,
	strengths: 700,
	experience: 2200,
	stack: 260,
	ai_overlay: 360,
	education: 180,
	certifications: 140,
	references: 220,
	languages: 100,
};

const SECTION_LABELS: Record<SectionKey, string> = {
	summary: 'Summary',
	selected_impact: 'Selected impact',
	strengths: 'Strengths',
	experience: 'Experience',
	stack: 'Stack',
	ai_overlay: 'Overlays',
	education: 'Education',
	certifications: 'Certifications',
	references: 'References',
	languages: 'Languages',
};

function countStrings(items: Array<string>): number {
	return items.reduce((sum, item) => sum + item.length, 0);
}

function countExperience(document: ComposedResumeDocument): number {
	return document.experience.reduce((sum, entry) => {
		return (
			sum +
			entry.company.length +
			entry.role.length +
			(entry.location?.length ?? 0) +
			(entry.subtitle?.length ?? 0) +
			entry.dates.length +
			countStrings(entry.bullets)
		);
	}, 0);
}

function countStrengths(document: ComposedResumeDocument): number {
	if (!document.strengths) {
		return 0;
	}

	return (
		countStrings(document.strengths.items) +
		document.strengths.overlay_sections.reduce(
			(sum, section) => sum + (section.title?.length ?? 0) + countStrings(section.items),
			0
		)
	);
}

export function getSectionCharacterUsage(
	document: ComposedResumeDocument,
	sectionKey: SectionKey
): number {
	switch (sectionKey) {
		case 'summary':
			return document.summary?.length ?? 0;
		case 'selected_impact':
			return document.selected_impact
				? (document.selected_impact.title?.length ?? 0) +
						countStrings(document.selected_impact.items)
				: 0;
		case 'strengths':
			return countStrengths(document);
		case 'experience':
			return countExperience(document);
		case 'ai_overlay':
			return document.overlays.reduce(
				(sum, overlay) => sum + (overlay.title?.length ?? 0) + countStrings(overlay.items),
				0
			);
		case 'stack':
			return document.stack
				? (document.stack.title?.length ?? 0) + countStrings(document.stack.items)
				: 0;
		case 'education':
			return document.education
				? (document.education.title?.length ?? 0) + countStrings(document.education.items)
				: 0;
		case 'certifications':
			return document.certifications
				? (document.certifications.title?.length ?? 0) + countStrings(document.certifications.items)
				: 0;
		case 'references':
			return document.references
				? (document.references.title?.length ?? 0) + countStrings(document.references.items)
				: 0;
		case 'languages':
			return countStrings(document.languages);
		default:
			return 0;
	}
}

export function getBudgetMetrics(
	document: ComposedResumeDocument
): Record<SectionKey, SectionBudgetMetric> {
	return Object.fromEntries(
		document.section_order.map((key) => {
			const used = getSectionCharacterUsage(document, key);
			const max = SECTION_BUDGET_LIMITS[key];
			const ratio = max === 0 ? 0 : used / max;
			const status = ratio > 1 ? 'over' : ratio > 0.85 ? 'warning' : 'ok';
			return [
				key,
				{
					key,
					label: SECTION_LABELS[key],
					used,
					max,
					status,
				},
			] as const;
		})
	) as Record<SectionKey, SectionBudgetMetric>;
}
