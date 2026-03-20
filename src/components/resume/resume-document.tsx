import type { ComposedResumeDocument, SavedPresetUi, SectionKey } from '@/lib/resume/types';
import { cn } from '@/lib/utils';

export function isSectionVisible(ui: SavedPresetUi | undefined, sectionKey: SectionKey): boolean {
	return ui?.section_visibility?.[sectionKey] !== false;
}

function ResumeSection(props: { title: string; children: React.ReactNode; className?: string }) {
	return (
		<section
			className={cn('resume-section space-y-3 border-t border-slate-200 pt-4', props.className)}
		>
			<h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
				{props.title}
			</h2>
			{props.children}
		</section>
	);
}

export function ResumeDocument(props: {
	document: ComposedResumeDocument;
	ui?: SavedPresetUi;
	className?: string;
}) {
	const { document, ui } = props;

	const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
		summary: document.summary ? (
			<ResumeSection title="Summary">
				<p className="text-sm leading-6 text-slate-700 print:text-[13px] print:leading-[1.45]">
					{document.summary}
				</p>
			</ResumeSection>
		) : undefined,
		selected_impact: document.selected_impact ? (
			<ResumeSection title={document.selected_impact.title ?? 'Selected impact'}>
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
				title={document.strengths.title ?? 'Strengths'}
				className="break-inside-avoid-page"
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
				<ResumeSection title="Experience" className="break-inside-auto">
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
				<ResumeSection title="Overlays">
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
			<ResumeSection title={document.stack.title ?? 'Stack'} className="break-inside-avoid-page">
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
				title={document.education.title ?? 'Education'}
				className="break-inside-avoid-page"
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
				title={document.certifications.title ?? 'Certifications'}
				className="break-inside-avoid-page"
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
				title={document.references.title ?? 'References'}
				className="break-inside-avoid-page"
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
				<ResumeSection title="Languages" className="break-inside-avoid-page">
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
						<a href={`https://${document.header.linkedin}`} className="block hover:text-slate-900">
							{document.header.linkedin}
						</a>
						<a href={`https://${document.header.portfolio}`} className="block hover:text-slate-900">
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
	);
}
