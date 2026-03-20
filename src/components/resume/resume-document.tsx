import type { SectionBudgetMetric } from '@/lib/resume/budget';
import type {
	ComposedResumeDocument,
	LanguageCode,
	SavedPresetUi,
	SectionKey,
} from '@/lib/resume/types';
import { cn } from '@/lib/utils';

const RESUME_SECTION_LABELS: Record<LanguageCode, Record<string, string>> = {
	en: {
		summary: 'Summary',
		selected_impact: 'Selected impact',
		strengths: 'Strengths',
		experience: 'Experience',
		overlays: 'Overlays',
		stack: 'Stack',
		education: 'Education',
		certifications: 'Certifications',
		references: 'References',
		languages: 'Languages',
	},
	sv: {
		summary: 'Sammanfattning',
		selected_impact: 'Utvalda resultat',
		strengths: 'Styrkor',
		experience: 'Erfarenhet',
		overlays: 'Tillägg',
		stack: 'Verktyg och plattformar',
		education: 'Utbildning',
		certifications: 'Certifieringar',
		references: 'Referenser',
		languages: 'Språk',
	},
};

export function isSectionVisible(ui: SavedPresetUi | undefined, sectionKey: SectionKey): boolean {
	return ui?.section_visibility?.[sectionKey] !== false;
}

function ResumeSection(props: {
	title: string;
	children: React.ReactNode;
	className?: string;
	budget?: SectionBudgetMetric;
	isActive?: boolean;
}) {
	return (
		<section
			className={cn(
				'resume-section group space-y-3 border-t border-slate-200 pt-4 transition-colors hover:rounded-xl hover:bg-sky-50/70 hover:px-3 hover:py-4 hover:ring-1 hover:ring-sky-200',
				props.isActive && 'rounded-xl bg-sky-50/70 px-3 py-4 ring-1 ring-sky-200',
				props.className
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
					{props.title}
				</h2>
				{props.budget ? (
					<span
						className={cn(
							'rounded-full border px-2 py-1 text-[11px] font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100',
							props.isActive && 'opacity-100',
							props.budget.status === 'over' && 'border-red-200 bg-red-50 text-red-700',
							props.budget.status === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
							props.budget.status === 'ok' && 'border-slate-200 bg-white text-slate-600'
						)}
					>
						{props.budget.used}/{props.budget.max}
					</span>
				) : null}
			</div>
			{props.children}
		</section>
	);
}

export function ResumeDocument(props: {
	document: ComposedResumeDocument;
	ui?: SavedPresetUi;
	className?: string;
	budgetMetrics?: Partial<Record<SectionKey, SectionBudgetMetric>>;
	activeSection?: SectionKey | null;
	showPageGuides?: boolean;
}) {
	const { document, ui, budgetMetrics, activeSection, showPageGuides } = props;
	const labels = RESUME_SECTION_LABELS[document.metadata.language];

	const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
		summary: document.summary ? (
			<ResumeSection
				title={labels.summary}
				budget={budgetMetrics?.summary}
				isActive={activeSection === 'summary'}
			>
				<p className="text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.45]">
					{document.summary}
				</p>
			</ResumeSection>
		) : undefined,
		selected_impact: document.selected_impact ? (
			<ResumeSection
				title={document.selected_impact.title ?? labels.selected_impact}
				budget={budgetMetrics?.selected_impact}
				isActive={activeSection === 'selected_impact'}
			>
				<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.4]">
					{document.selected_impact.items.map((item) => (
						<li key={item} className="flex gap-3" title={`${item.length} characters`}>
							<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
							<span>{item}</span>
						</li>
					))}
				</ul>
			</ResumeSection>
		) : undefined,
		strengths: document.strengths ? (
			<ResumeSection
				title={document.strengths.title ?? labels.strengths}
				className="break-inside-avoid-page"
				budget={budgetMetrics?.strengths}
				isActive={activeSection === 'strengths'}
			>
				<ul className="grid gap-x-6 gap-y-2 text-sm leading-5 text-slate-700 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] print:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] print:text-[12.5px] print:leading-[1.35]">
					{document.strengths.items.map((item) => (
						<li
							key={item}
							className="rounded-md bg-slate-50 px-2.5 py-1.5 print:bg-slate-50/60"
							title={`${item.length} characters`}
						>
							{item}
						</li>
					))}
				</ul>
				{document.strengths.overlay_sections.length > 0 ? (
					<div className="space-y-3 pt-2">
						<div className="border-t border-dashed border-slate-200 pt-3" />
						{document.strengths.overlay_sections.map((overlay) => (
							<div key={overlay.id} className="space-y-2">
								<h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
									{overlay.title ?? overlay.id}
								</h3>
								<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[12.5px] print:leading-[1.35]">
									{overlay.items.map((item) => (
										<li key={item} className="flex gap-3" title={`${item.length} characters`}>
											<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				) : null}
			</ResumeSection>
		) : undefined,
		experience:
			document.experience.length > 0 ? (
				<ResumeSection
					title={labels.experience}
					className="break-inside-auto"
					budget={budgetMetrics?.experience}
					isActive={activeSection === 'experience'}
				>
					<div className="space-y-4">
						{document.experience.map((entry) => (
							<article
								key={entry.id}
								className="resume-entry space-y-2 break-inside-avoid-page border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
							>
								<div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between">
									<div>
										<h3 className="text-base font-semibold text-slate-900 print:text-[15px]">
											{entry.role}
										</h3>
										<p className="text-sm font-medium text-slate-700">
											{entry.company}
											{entry.subtitle ? ` | ${entry.subtitle}` : ''}
										</p>
									</div>
									<div className="text-xs uppercase tracking-[0.2em] text-slate-500 sm:text-right print:text-right">
										<div>{entry.dates}</div>
										{entry.location ? <div>{entry.location}</div> : null}
									</div>
								</div>
								<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.4]">
									{entry.bullets.map((bullet) => (
										<li key={bullet} className="flex gap-3" title={`${bullet.length} characters`}>
											<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
											<span>{bullet}</span>
										</li>
									))}
								</ul>
							</article>
						))}
					</div>
				</ResumeSection>
			) : undefined,
		ai_overlay:
			document.overlays.length > 0 && !document.strengths ? (
				<ResumeSection
					title={labels.overlays}
					budget={budgetMetrics?.ai_overlay}
					isActive={activeSection === 'ai_overlay'}
				>
					<div className="space-y-4">
						{document.overlays.map((overlay) => (
							<div key={overlay.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<h3 className="text-sm font-semibold text-slate-900">
									{overlay.title ?? overlay.id}
								</h3>
								<ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
									{overlay.items.map((item) => (
										<li key={item} className="flex gap-3">
											<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</ResumeSection>
			) : undefined,
		stack: document.stack ? (
			<ResumeSection
				title={document.stack.title ?? labels.stack}
				className="break-inside-avoid-page"
				budget={budgetMetrics?.stack}
				isActive={activeSection === 'stack'}
			>
				<ul className="grid gap-x-6 gap-y-1.5 text-sm leading-5 text-slate-700 sm:grid-cols-2 print:grid-cols-2 print:text-[12.5px] print:leading-[1.35]">
					{document.stack.items.map((item) => (
						<li key={item} title={`${item.length} characters`}>
							{item}
						</li>
					))}
				</ul>
			</ResumeSection>
		) : undefined,
		education: document.education ? (
			<ResumeSection
				title={document.education.title ?? labels.education}
				className="break-inside-avoid-page"
				budget={budgetMetrics?.education}
				isActive={activeSection === 'education'}
			>
				<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.35]">
					{document.education.items.map((item) => (
						<li key={item} title={`${item.length} characters`}>
							{item}
						</li>
					))}
				</ul>
			</ResumeSection>
		) : undefined,
		certifications: document.certifications ? (
			<ResumeSection
				title={document.certifications.title ?? labels.certifications}
				className="break-inside-avoid-page"
				budget={budgetMetrics?.certifications}
				isActive={activeSection === 'certifications'}
			>
				<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.35]">
					{document.certifications.items.map((item) => (
						<li key={item} title={`${item.length} characters`}>
							{item}
						</li>
					))}
				</ul>
			</ResumeSection>
		) : undefined,
		references: document.references ? (
			<ResumeSection
				title={document.references.title ?? labels.references}
				className="break-inside-avoid-page"
				budget={budgetMetrics?.references}
				isActive={activeSection === 'references'}
			>
				<ul className="grid gap-x-8 gap-y-2 text-sm leading-6 text-slate-700 sm:grid-cols-2 print:grid-cols-2 print:text-[12.5px] print:leading-[1.35]">
					{document.references.items.map((item) => (
						<li key={item} title={`${item.length} characters`}>
							{item}
						</li>
					))}
				</ul>
			</ResumeSection>
		) : undefined,
		languages:
			document.languages.length > 0 ? (
				<ResumeSection
					title={labels.languages}
					className="break-inside-avoid-page"
					budget={budgetMetrics?.languages}
					isActive={activeSection === 'languages'}
				>
					<ul className="space-y-1.5 text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.35]">
						{document.languages.map((item) => (
							<li key={item} title={`${item.length} characters`}>
								{item}
							</li>
						))}
					</ul>
				</ResumeSection>
			) : undefined,
	};

	return (
		<div className="resume-sheet-shell relative mx-auto w-full max-w-[210mm]">
			{showPageGuides ? (
				<>
					<div className="resume-page-guide top-[297mm]" aria-hidden="true">
						<span>Page 1 ends</span>
					</div>
					<div className="resume-page-guide top-[594mm]" aria-hidden="true">
						<span>Page 2 ends</span>
					</div>
				</>
			) : null}
			<article
				className={cn(
					'resume-sheet mx-auto w-full max-w-[210mm] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none',
					props.className
				)}
			>
				<header className="space-y-4 border-b border-slate-200 pb-6 print:break-inside-avoid-page print:pb-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between">
						<div className="space-y-1">
							<h1 className="text-3xl font-semibold tracking-tight text-slate-950 print:text-[32px]">
								{document.header.name}
							</h1>
							{document.title_line ? (
								<p className="text-base font-medium text-slate-700 print:text-[15px]">
									{document.title_line}
								</p>
							) : null}
						</div>
						<div className="space-y-1 text-sm leading-6 text-slate-600 sm:text-right print:text-right print:text-[13px] print:leading-[1.45]">
							<div>{document.header.location}</div>
							<a href={`mailto:${document.header.email}`} className="block hover:text-slate-900">
								{document.header.email}
							</a>
							<div>{document.header.phone}</div>
							<a
								href={`https://${document.header.linkedin}`}
								className="block hover:text-slate-900"
							>
								{document.header.linkedin}
							</a>
							<a
								href={`https://${document.header.portfolio}`}
								className="block hover:text-slate-900"
							>
								{document.header.portfolio}
							</a>
						</div>
					</div>
				</header>
				<div className="space-y-5 pt-6 print:space-y-4 print:pt-5">
					{document.section_order.map((sectionKey) => {
						if (!isSectionVisible(ui, sectionKey)) {
							return null;
						}

						return <div key={sectionKey}>{sectionContent[sectionKey] ?? null}</div>;
					})}
				</div>
			</article>
		</div>
	);
}
