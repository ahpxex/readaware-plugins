/**
 * ReadAware plugin API — the public contract of ReadAware 0.6.8.
 *
 * GENERATED from ahpxex/read-aware at v0.6.8 (3da6800c3faf) by
 * scripts/sync-plugin-dts.ts. Do not edit: regenerate for each app release.
 * Capability versions for `manifest.requires` are in ./host-capabilities.json.
 *
 * Import with `import type` only — plugins run in a sandbox where none of the
 * host's modules exist at runtime.
 */

export type Id = string;
/** ISO-8601 timestamp string (UTC). */
export type IsoDate = string;
/**
 * "virtual" marks a plugin-provided book: no imported file, content served by
 * a registered content provider at open time.
 */
export type BookFormat = "epub" | "mobi" | "azw3" | "fb2" | "cbz" | "cbr" | "txt" | "html" | "pdf" | "virtual";
/** Cover-extraction outcome; replaces the old coverChecked + coverUrl pair. */
export type CoverStatus = "unchecked" | "ready" | "none" | "failed";
export type ReadingStatus = "unread" | "reading" | "finished";
export type HighlightColor = "yellow" | "green" | "blue" | "pink";
export type HighlightStyle = "highlight" | "underline";
/** Explicit user feedback on a long-term memory. */
export type MemoryFeedbackSignal = "pin" | "unpin" | "correct" | "reject";
/**
 * Which software actor produced an event, orthogonal to `actorId` (operator
 * identity). "user" = a direct user action through the app UI; "agent" = the
 * reading agent's runtime; "system" = background machinery (cover extraction,
 * migrations); "plugin:<id>" = a plugin write through the plugin data API.
 */
export type EventOrigin = "user" | "agent" | "system" | `plugin:${string}`;
/**
 * Snapshot of a dictionary entry as produced by the dictionary service. Structurally
 * mirrors the dictionary feature's entry shape — the log must stay
 * self-contained, so the payload carries the full snapshot instead of a
 * reference into a rebuildable cache.
 */
export interface DictionaryEntrySnapshot {
	headword: string;
	pronunciation?: string;
	senses: {
		partOfSpeech: string;
		definition: string;
		examples: string[];
	}[];
	etymology?: string;
	contextualMeaning?: string;
}
/**
 * Font containers the import accepts, detected from magic bytes — never
 * from the file's extension. `ttc` is a TrueType/OpenType collection; the
 * reader renders its first face, which is also the face metadata describes.
 */
export type UserFontFormat = "ttf" | "otf" | "ttc" | "woff" | "woff2";
export type BookRemovalCleanupQuery = {
	after?: string;
	limit?: number;
};
export type BookRemovalCleanupPage = {
	items: Array<{
		bookId: string;
		title: string;
		removedAt: string;
	}>;
	/** Live keyset pagination, not a frozen snapshot. */
	nextCursor: string | null;
};
/** A committed batch is not rolled back if subsequent local blob release fails. */
export type BookFileReleaseReceipt = {
	bookIds: string[];
	files: {
		status: "released";
	} | {
		status: "pending";
		errorCode: string;
	};
};
export type BookRemovalReceipt = BookFileReleaseReceipt & {
	/** The record transaction committed. This is not a filesystem transaction. */
	committed: true;
};
export type ReadingTimeCursor = {
	bookId: string;
	localDay: string;
	localHour: number;
};
export type ReadingTimeQuery = {
	bookId?: string;
	/** Calendar day recorded by each session, not converted to today's timezone. */
	localDay?: string;
	after?: ReadingTimeCursor;
	limit?: number;
};
export type PendingReadingTime = ReadingTimeCursor & {
	ms: number;
	startedAt: number;
	lastAt: number;
	/** Page-turn observation clock; time ticks do not advance it. */
	positionAt: number | null;
};
export type ReadingTimeSnapshot = {
	bookId: string | null;
	localDay: string | null;
	/** Native wall clock inside the SQLite read transaction, not a revision. */
	observedAtEpochMs: number;
	settledMs: number;
	pendingMs: number;
	totalMs: number;
	pendingBucketCount: number;
	/** Bounded live keyset page; totals cover the entire scope, not just this page. */
	pending: PendingReadingTime[];
	nextCursor: ReadingTimeCursor | null;
};
export type ReadingTimeObservation = {
	revision: number;
	status: "ready";
	snapshot: ReadingTimeSnapshot;
} | {
	revision: number;
	status: "error";
	errorCode: string;
};
export type ReadingPeriod = "week" | "month" | "year" | "all";
export type ReadingInsightsQuery = {
	bookId?: string;
	period?: ReadingPeriod;
	asOfDay?: string;
};
export type ReadingInsights = {
	bookId: string | null;
	source: "settled";
	asOfDay: string;
	period: ReadingPeriod;
	totalMs: number;
	daysRead: number;
	booksRead: number;
	avgPerDayMs: number;
	/** Ratio, not a percentage: 0.5 means +50%. Null when comparison is undefined. */
	deltaRatio: number | null;
	/** Days for week/month; months for year/all. Keys, not localized labels. */
	bars: {
		key: string;
		ms: number;
		isCurrent: boolean;
	}[];
	/** Seven slots, Monday first. */
	weekdayMs: number[];
	/** Host only stores the all-time hour histogram; never pretend it is period-scoped. */
	allTimeHourlyMs: number[];
	achievements: {
		totalMs: number;
		currentStreak: number;
		longestStreak: number;
		bestDayMs: number;
		bestDayKey: string | null;
		daysRead: number;
		booksRead: number;
		mostReadBookId: string | null;
		mostReadBookMs: number;
		nextMilestoneMs: number | null;
	};
};
export type ModelCatalogQuery = {
	provider: string;
	search?: string;
	offset?: number;
	limit?: number;
	revision?: number;
};
export type ModelCatalogPage = {
	provider: string;
	revision: number;
	refreshing: boolean;
	checkedAt: number | null;
	errorCode: string | null;
	models: Array<{
		id: string;
		name: string;
		reasoning: boolean;
		input: Array<"text" | "image">;
		contextWindow: number;
		maxOutputTokens: number;
	}>;
	total: number;
	offset: number;
	nextOffset: number | null;
};
declare const WORKSPACE_SETTINGS_SECTIONS: readonly [
	"general",
	"appearance",
	"reading",
	"ai",
	"plugins",
	"menus",
	"shortcuts",
	"dataSync",
	"about"
];
export type WorkspaceSettingsSection = (typeof WORKSPACE_SETTINGS_SECTIONS)[number] | `plugin:${string}`;
export type WorkspaceTarget = {
	surface: "shelf";
	collectionId?: string | null;
	selection?: {
		active: boolean;
		bookIds: string[];
	};
} | {
	surface: "agent" | "stats";
} | {
	surface: "settings";
	section?: WorkspaceSettingsSection;
} | {
	surface: "search";
	query?: string;
};
export type WorkspaceQuery = {
	selectionAfter?: string;
	limit?: number;
};
export type WorkspaceSnapshot = {
	revision: number;
	/** Present on a book-authorized projection. Collection identity and command
	 * search text are withheld, not evidence that the underlying UI is empty.
	 * Selection counts/cursors cover only this book. The revision remains a
	 * conservative concurrency token and can change for hidden UI changes. */
	scope?: {
		bookId: string | null;
		withheld: ("collectionId" | "search.query")[];
	};
	surface: "shelf" | "agent" | "stats" | "plugin" | "reader";
	collectionId: string | null;
	settings: {
		open: boolean;
		section: WorkspaceSettingsSection | null;
	};
	search: {
		open: boolean;
		query: string;
	};
	selection: {
		active: boolean;
		total: number;
		bookIds: string[];
		nextCursor: string | null;
	};
};
export type WorkspaceReceipt = {
	status: "completed";
	snapshot: WorkspaceSnapshot;
};
declare const PARAMETERLESS_HOST_COMMAND_IDS: readonly [
	"go-shelf",
	"go-context",
	"go-stats",
	"open-settings",
	"select",
	"layout-grid",
	"layout-list",
	"sort-recent",
	"sort-added",
	"sort-title",
	"sort-author",
	"sort-progress",
	"group-none",
	"group-status",
	"group-author",
	"group-format"
];
declare const HOST_COMMAND_IDS: readonly [
	"go-shelf",
	"go-context",
	"go-stats",
	"open-settings",
	"select",
	"layout-grid",
	"layout-list",
	"sort-recent",
	"sort-added",
	"sort-title",
	"sort-author",
	"sort-progress",
	"group-none",
	"group-status",
	"group-author",
	"group-format",
	"open-book",
	"open-collection"
];
export type HostCommandId = (typeof HOST_COMMAND_IDS)[number];
export type HostCommandRequest = ({
	id: (typeof PARAMETERLESS_HOST_COMMAND_IDS)[number];
	args?: never;
} | {
	id: "open-book";
	args: {
		bookId: string;
	};
} | {
	id: "open-collection";
	args: {
		collectionId: string;
	};
}) & {
	expectedWorkspaceRevision?: number;
};
export type HostCommandDescriptor = {
	id: HostCommandId;
	title: string;
	/** Ambient permission/workspace readiness; supplied resource IDs are validated during execute. */
	enabled: boolean;
	checked?: boolean;
	unavailableReason?: "permission" | "workspace" | "reader-control" | "object-scope";
	settingsPath?: string;
	/** Parameters are semantic resource IDs, never rendered menu IDs or labels. */
	parameters: {
		type: "object";
		properties: Record<string, {
			type: "string";
			minLength: number;
			maxLength: number;
		}>;
		required?: string[];
		additionalProperties: false;
	};
};
export type HostCommandSnapshot = {
	version: 1;
	workspaceRevision: number | null;
	commands: HostCommandDescriptor[];
};
/** Revision orders deliveries within one subscription, not across subscriptions or settings writes. */
export type HostCommandObservation = {
	revision: number;
} & ({
	status: "ready";
	snapshot: HostCommandSnapshot;
} | {
	status: "error";
	code: string;
});
export type HostCommandReceipt = {
	commandId: HostCommandId;
	status: "completed" | "partial";
	completed: ("settings" | "workspace" | "reading")[];
	errorCode?: string;
};
/** Read-only chapter memory contracts. These are distilled evidence, never verbatim source text. */
export type DigestFlavor = "narrative" | "expository";
/** Names/aliases use this edition's spelling; flavor determines character vs concept semantics. */
export interface DigestCharacter {
	name: string;
	aliases?: string[];
	note?: string;
}
export interface DigestRelation {
	from: string;
	kind: string;
	to: string;
	note?: string;
}
export interface BookGraphEdge extends DigestRelation {
	establishedAt: number;
}
export type BookGraphQuery = {
	names?: string[];
	chapterIndex?: number;
};
export type BookGraphProfile = DigestCharacter & {
	appearsInChapters: number[];
	relations: BookGraphEdge[];
	relationsTruncated: boolean;
};
export type BookGraphResult = {
	fence?: string;
} & ({
	graph: "empty" | "unavailable" | "miss";
	note: string;
} | {
	graph: "chapter";
	contentVersion?: string;
	chapterIndex: number;
	chapterHref?: string;
	summary: string;
	entities: DigestCharacter[];
	relations: DigestRelation[];
} | {
	graph: "profiles";
	profiles: BookGraphProfile[];
	notFound: string[];
	truncated: boolean;
	note: string;
} | {
	graph: "overview";
	chaptersDigested: number;
	chapterRange: [
		number,
		number
	];
	entityCount: number;
	edgeCount: number;
	entities: {
		name: string;
		aliases?: string[];
		chapters: number;
	}[];
	truncated: boolean;
	note: string;
});
/** Device-local classification + relevant event identity, not a content version or distributed CAS. */
export type BookClassificationSnapshot = {
	bookId: string;
	narrativity: DigestFlavor | null;
	spoilerSensitive?: boolean | null;
	revision: string;
};
export type BookClassificationChange = {
	bookId: string;
	narrativity: DigestFlavor;
	spoilerSensitive?: boolean;
	expectedRevision: string;
};
export type BookClassificationReceipt = {
	snapshot: BookClassificationSnapshot;
	changed: boolean;
};
export type MemoryScope = "user" | "global" | `book:${string}`;
export type MemoryKind = "fact" | "preference" | "insight" | "summary";
export type MemoryStatus = "active" | "superseded" | "forgotten";
export interface MemoryRecord {
	id: string;
	scope: MemoryScope;
	kind: MemoryKind;
	content: string;
	/** 0..1 significance; evidenceCount records reinforcement independently. */
	importance: number;
	evidenceCount: number;
	pinned?: boolean;
	/** Legacy omission means active; superseded/forgotten records are excluded from retrieval. */
	status?: MemoryStatus;
	createdAt: string;
	updatedAt: string;
}
/** Native scans are bounded to 10000 rows/8 MiB and 128 KiB per row; oversize fails explicitly.
 * A query selects explicit scopes; permission to read memory is separately granted by the host. */
export type MemoryQuery = {
	scopes: MemoryScope[];
	query?: string;
	limit?: number;
};
/** Device-local row + event identity token. Never substitute updatedAt for revision. */
export type MemorySnapshot = {
	memory: MemoryRecord;
	revision: string;
};
export type MemoryMutation = {
	memoryId: string;
	expectedRevision: string;
} & ({
	op: "correct";
	content: string;
} | {
	op: "setPinned";
	pinned: boolean;
} | {
	op: "forget";
});
export type MemoryMutationReceipt = {
	memoryId: string;
	revision: string | null;
};
export interface BookGraphTaskOptions {
	/** Maximum chapter attempts, including empty/failed chapters; not a model-call or billing cap. */
	maxChapters: number;
}
/** Reports count this finite pass, not a synchronized global graph backlog. */
export interface DigestReport {
	status: "complete" | "partial" | "unavailable";
	reason?: "boundary-unknown" | "no-toc" | "classification-pending" | "chapter-limit";
	eligible: number;
	attempted: number;
	digested: number;
	remaining: number;
	emptyChapters: number[];
	failures: Array<{
		chapterIndex: number;
		errorCode: string;
	}>;
}
export type BookGraphTaskStatus = "queued" | "running" | "cancelling" | "cancelled" | "completed" | "partial" | "unavailable" | "failed";
export interface BookGraphTaskSnapshot {
	taskId: string;
	bookId: string;
	mode: "catch-up" | "rebuild";
	maxChapters: number;
	retryOf?: string;
	revision: number;
	status: BookGraphTaskStatus;
	createdAt: string;
	updatedAt: string;
	report?: DigestReport;
	errorCode?: string;
}
export type UserProfileQuery = {
	offset?: number;
	limit?: number;
	expectedRevision?: string;
};
export type UserProfileChange = {
	summary: string;
	expectedRevision: string;
};
export type UserProfileReceipt = {
	changed: boolean;
	revision: string;
	persistence: "event-log";
};
export type UserProfilePage = {
	exists: boolean;
	text: string;
	offset: number;
	nextOffset: number | null;
	totalLength: number;
	revision: string;
	format: "plain-text";
	persistence: "event-log";
};
export type MemoryPageQuery = MemoryQuery & {
	offset?: number;
	expectedRevision?: string;
};
export type MemoryPage = {
	/** Native payload budget may shorten a page below limit; always use nextOffset. */
	items: MemoryRecord[];
	offset: number;
	nextOffset: number | null;
	total: number;
	/** Identity of the filtered, ordered result, not a memory mutation token. */
	revision: string;
};
export type EntityDefinition = {
	kind: string;
	canonicalName: string;
};
export type EntityIdentity = {
	id: string;
	definition: EntityDefinition | null;
};
export type EntityAlias = {
	entityId: string;
	alias: string;
};
export type EntityPaging = {
	offset?: number;
	limit?: number;
	expectedRevision?: string;
};
export type EntityQuery = EntityPaging & ({
	kind: "identities";
	search?: string;
} | {
	kind: "members" | "aliases";
	entityId: string;
});
export type EntityPageBase = {
	canonicalId: string | null;
	canonicalDefinition: EntityDefinition | null;
	offset: number;
	nextOffset: number | null;
	total: number;
	revision: string;
};
export type EntityPage = EntityPageBase & ({
	kind: "identities" | "members";
	items: EntityIdentity[];
} | {
	kind: "aliases";
	items: EntityAlias[];
});
export type EntityDecision = {
	expectedRevision: string;
} & ({
	op: "resolve";
	entityId: string;
	kind: string;
	canonicalName: string;
	aliases?: string[];
} | {
	op: "merge";
	keepId: string;
	mergedId: string;
});
export type EntityDecisionReceipt = {
	entityId: string;
	canonicalId: string;
	changed: boolean;
	revision: string;
};
export type IdentitySource = {
	memoryId: string;
	revision: string;
};
export type ConsolidatedProfile = {
	version: 1;
	summary: string;
	sources: IdentitySource[];
	/** Proposed IDs include no-ops; only commit receipts prove emission. */
	entityEvidence: {
		eventId: string;
		memoryIds: string[];
	}[];
};
export type ProfileContext = {
	curated: string | null;
	consolidated: ConsolidatedProfile | null;
	derivedStatus: "absent" | "current" | "stale" | "invalid";
};
export type ProfileInspectionQuery = {
	kind?: "summary" | "sources" | "entityEvidence";
	offset?: number;
	limit?: number;
	expectedRevision?: string;
};
export type InspectionBase = {
	revision: string;
	curatedRevision: string;
	curatedExists: boolean;
	/** Current means source-consistent, not semantically verified or a completed maintenance pass. */
	derivedStatus: ProfileContext["derivedStatus"];
	offset: number;
	nextOffset: number | null;
};
export type ProfileInspectionPage = InspectionBase & ({
	kind: "summary";
	text: string | null;
	totalLength: number;
} | {
	kind: "sources";
	items: (IdentitySource & {
		currentRevision: string | null;
	})[];
	total: number;
}
/** Proposed event IDs can name no-ops. These links are not emission receipts. */
 | {
	kind: "entityEvidence";
	items: {
		eventId: string;
		memoryId: string;
	}[];
	total: number;
});
/** Query filters do not expand the actor's memory grant or spoiler boundary. */
export type MemoryObservationQuery = {
	kind: "profile";
	query?: UserProfileQuery;
} | {
	kind: "profileContext";
	query?: ProfileInspectionQuery;
} | {
	kind: "search";
	query: MemoryQuery;
} | {
	kind: "page";
	query: MemoryPageQuery;
} | {
	kind: "inspect";
	memoryId: string;
} | {
	kind: "classification";
	bookId: string;
} | {
	kind: "graphTasks";
	bookId: string;
} | {
	kind: "graphTask";
	bookId: string;
	taskId: string;
} | {
	kind: "bookGraph";
	bookId: string;
	query?: BookGraphQuery;
};
export type MemoryObservationResult = {
	kind: "profile";
	profile: UserProfilePage;
} | {
	kind: "profileContext";
	page: ProfileInspectionPage;
} | {
	kind: "search";
	memories: MemoryRecord[];
} | {
	kind: "page";
	page: MemoryPage;
} | {
	kind: "inspect";
	snapshot: MemorySnapshot | null;
} | {
	kind: "classification";
	snapshot: BookClassificationSnapshot | null;
} | {
	kind: "graphTasks";
	tasks: BookGraphTaskSnapshot[];
} | {
	kind: "graphTask";
	task: BookGraphTaskSnapshot;
} | {
	kind: "bookGraph";
	graph: BookGraphResult;
};
/** Revision orders this subscription only; it is not a mutation/CAS token. */
export type MemoryObservation = {
	revision: number;
} & ({
	status: "ready";
	result: MemoryObservationResult;
} | {
	status: "error";
	errorCode: string;
});
/** Serializable reading state shared by the host, plugins and the product Agent. */
export type ReadingTextQuote = {
	exact: string;
	prefix?: string;
	suffix?: string;
};
export type ReadingLocation = {
	bookId: string;
	/** Source hash when available; otherwise a session-scoped content revision. */
	contentVersion: string;
	cfi?: string;
	href?: string;
	fraction?: number;
	/** Resolve against the rendered text layer, e.g. an unrendered PDF search hit. */
	textQuote?: ReadingTextQuote;
};
export type ReadingTarget = {
	bookId?: string;
	contentVersion?: string;
	cfi?: string;
	href?: string;
	fraction?: number;
	textQuote?: ReadingTextQuote;
	/** Zero-based source reading-order index, not TOC/chapter numbering or a printed page label. Requires contentVersion. */
	sectionIndex?: number;
};
/** Chapter steps follow flattened TOC targets (including subsections); section
 * steps follow linear source sections. Neither interprets printed chapter numbers. */
export type ReadingStep = "next" | "previous" | "next-section" | "previous-section" | "next-chapter" | "previous-chapter" | "start" | "end";
/** Optional execution preconditions, not a replacement for actor authorization. */
export type ReadingSessionGuard = {
	bookId?: string;
	sessionId?: string;
};
export type ReadingVisibleTextState = {
	status: "available" | "empty" | "unavailable";
	source: "range" | "pdf-text-layer" | null;
	truncated: boolean;
	reason?: "not-ready" | "not-visible" | "unsupported" | "scan-limit" | "read-failed" | "withheld";
};
export type ReadingDemandSnapshot = {
	active: boolean;
	lastActivityAt: number | null;
	idleAt: number | null;
	reason: "render" | "relocate" | null;
};
export type ReadingSessionChange = {
	/** Actor of this publication. Unattributed renderer/lifecycle feedback is system,
	 * not inferred human input or the actor of a concurrent pending command. */
	origin: EventOrigin;
	reason: "initial" | "open" | "ready" | "detach" | "error" | "close" | "relocate" | "navigate" | "back" | "forward" | "step" | "reload" | "mode-step" | "mode-return" | "selection" | "controls" | "mode" | "playback" | "reader-demand";
};
export type ReadingSessionSnapshot = {
	/** Reading 2.20: last publication, not a replayable event stream. Slow observers
	 * may skip revisions; sessionId remains the generation/retirement identity. */
	change?: ReadingSessionChange;
	/** Reading 2.19: process-local render/relocation demand, not human presence or a durable event log. */
	readerDemand?: ReadingDemandSnapshot;
	revision: number;
	sessionId: string | null;
	bookId: string | null;
	status: "idle" | "loading" | "ready" | "error";
	location: ReadingLocation | null;
	visibleText: string;
	/** Reading 2.17: distinguishes a rendered empty viewport from unavailable text.
	 * PDF includes text runs intersecting the reader viewport, not OCR or occlusion detection. */
	visibleTextState?: ReadingVisibleTextState;
	/** Captured from the current reader, never reconstructed from an old annotation. */
	selection: ReadingSelectionSnapshot | null;
	errorCode?: string;
	history: {
		canGoBack: boolean;
		canGoForward: boolean;
	};
	playback: ReadingPlaybackSnapshot;
	mode: ReadingModeSnapshot;
	/** Last committed reader-chrome visibility, or null without an attached UI. */
	controls: ReadingControlsSnapshot | null;
	/** Current layout only; null without a ready, reporting renderer. */
	pagination: ReadingPaginationSnapshot | null;
	/** Reading 2.16: source token captured by the ready renderer; absent/null for
	 * unavailable or non-reporting engines. Compare with library.getContentState. */
	sourceRevision?: string | null;
};
export type ReadingPaginationSnapshot = {
	layout: "reflowable" | "fixed";
	flow: "paginated" | "scrolled";
	/** Zero-based original source section, including non-linear sections. */
	section: {
		index: number;
		count: number;
	};
	/** Zero-based viewport/spread in the CURRENT reflowable section, excluding
	 * engine padding. Not columns, printed page labels or a whole-book total.
	 * Null for fixed layout, continuous scroll or unavailable/transient geometry.
	 * Changes with window/font/layout; never use as a persistent reading target. */
	screen: {
		index: number;
		count: number;
	} | null;
};
export type ReadingSelectionSnapshot = {
	id: string;
	/** UTF-16 bounded preview; textLength describes the complete normalized selection. */
	text: string;
	textLength: number;
	range: BookTextRange | null;
	/** A selection can be copied even when its source cannot issue a readable range. */
	rangeUnavailableReason?: "unsupported" | "too-large" | "unavailable";
};
export type ReadingSelectionReceipt = {
	status: "completed";
	sessionId: string;
	selection: ReadingSelectionSnapshot | null;
};
export type ReadingControlsSnapshot = {
	visible: boolean;
};
export type ReadingControlsReceipt = {
	status: "completed";
	sessionId: string;
	controls: ReadingControlsSnapshot;
};
/** A versioned address independent of the currently visible section. */
export type ReadingModePosition = {
	location: ReadingLocation & {
		cfi: string;
	};
	modeKey: string;
	unitId: string;
};
/** A registered text-unit mode. No passage text or executable provider is exposed. */
export type ReadingModeDescriptor = {
	key: string;
	label: string;
	units: {
		id: string;
		label: string;
	}[];
	defaultUnitId: string;
};
export type ReadingModeSnapshot = {
	/** Ready means the current section is indexed; it is not a navigation receipt. */
	status: "unavailable" | "inactive" | "preparing" | "ready" | "empty" | "error";
	unavailableReason: "no-session" | "unsupported-format" | "no-provider" | null;
	requestedActive: boolean;
	/** Registered choices for this reader; selected modeKey may be temporarily absent. */
	availableModes: ReadingModeDescriptor[];
	modeKey: string | null;
	label: string | null;
	unitId: string | null;
	units: {
		id: string;
		label: string;
	}[];
	/** Zero-based position in the indexed section, not the whole book. */
	progress: {
		ordinal: number;
		total: number;
	} | null;
	cfiRange: string | null;
	/** The resting unit remains addressable when ordinary navigation leaves its section. */
	position: ReadingModePosition | null;
	errorCode?: string;
};
export type ReadingModeConfiguration = {
	active: boolean;
	/** Execution precondition; does not select a provider. */
	modeKey?: string;
	/** Select a registered provider, atomically with active/unitId. */
	selectModeKey?: string;
	unitId?: string;
};
export type ReadingModeReceipt = {
	status: "completed";
	sessionId: string;
	mode: ReadingModeSnapshot;
};
export type ReadingModeStepOutcome = "moved" | "start-of-book" | "end-of-book";
export type ReadingModeStepReceipt = ReadingModeReceipt & {
	outcome: ReadingModeStepOutcome;
};
/** Text is deliberately omitted: playback control grants no additional reading access. */
export type ReadingPlaybackSnapshot = {
	status: "unavailable" | "stopped" | "preparing" | "playing" | "advancing" | "error";
	unavailableReason: "no-session" | "mode-inactive" | "no-voice" | "no-unit" | null;
	backend: "plugin" | "system" | null;
	fallback: boolean;
	owner: EventOrigin | null;
	cfiRange: string | null;
	errorCode?: string;
};
export type ReadingPlaybackReceipt = {
	status: "completed";
	sessionId: string;
	playback: ReadingPlaybackSnapshot;
};
export type ReadingNavigationReceipt = {
	status: "completed";
	sessionId: string;
	location: ReadingLocation;
};
/** A content-versioned text range, not a DOM handle or an authorization token. */
export type BookTextRange = {
	bookId: string;
	contentVersion: string;
	cfi: string;
	/** Text-only sections (PDF) use a page CFI plus a disambiguating quote. */
	textQuote?: ReadingTextQuote;
};
export type BookRangeQuery = {
	range: BookTextRange;
	/** UTF-16 offsets in the resolved range, never in extracted chapter text. */
	offset?: number;
	limit?: number;
	contextChars?: number;
};
export type BookRangePage = {
	range: BookTextRange;
	sectionIndex: number;
	text: string;
	offset: number;
	totalLength: number;
	nextOffset: number | null;
	/** Bounded context outside the whole range, confined to the same section. */
	context: {
		before: string;
		after: string;
	};
};
/** A shelf book as the books domain lists it. */
export interface BookSummary {
	id: Id;
	title: string;
	author?: string;
	format: BookFormat;
	starred: boolean;
	/** Single-membership collection, or null when ungrouped. */
	collectionId: string | null;
	addedAt: IsoDate;
	updatedAt: IsoDate;
	lastOpenedAt?: IsoDate;
	/** Original import file name/size; absent on virtual books. */
	fileName?: string;
	fileSize?: number;
	/** Folder-relative origin of a folder import (`Books/Sci-fi/Dune.epub`); absent otherwise. */
	sourcePath?: string;
	/**
	 * Digest organization (people/events versus concepts), written
	 * by the idle classification pipeline. Absent = not yet classified.
	 */
	narrativity?: "narrative" | "expository";
	/** Independent protection for fictional plot revelations. */
	spoilerSensitive?: boolean;
}
export interface CollectionSummary {
	id: Id;
	name: string;
	createdAt: IsoDate;
}
export interface HighlightItem {
	/** Validated source at creation; absent on legacy/unanchored annotations. */
	range?: BookTextRange;
	kind: "highlight";
	id: Id;
	bookId: Id;
	text: string;
	/** Range anchor (EPUB CFI / PDF locator); absent when unanchorable. */
	anchor?: string;
	chapterHref?: string;
	color: HighlightColor;
	style: HighlightStyle;
	createdAt: IsoDate;
	updatedAt: IsoDate;
}
export interface NoteItem {
	/** Validated source at creation; absent on legacy/unanchored annotations. */
	range?: BookTextRange;
	kind: "note";
	id: Id;
	bookId: Id;
	/** The passage the note anchors to, when it quotes one. */
	quotedText?: string;
	body: string;
	anchor?: string;
	chapterHref?: string;
	createdAt: IsoDate;
	updatedAt: IsoDate;
}
/** A passive trace of a question asked in the book thread (agent-written). */
export interface AskItem {
	kind: "ask";
	id: Id;
	bookId: Id;
	text: string;
	anchor?: string;
	chapterHref?: string;
	createdAt: IsoDate;
}
export type AnnotationItem = HighlightItem | NoteItem | AskItem;
/** Current reading position and status of one book. */
export interface ReadingState {
	bookId: Id;
	/** 0..100. */
	progressPercent: number;
	status: ReadingStatus;
	/** Format-neutral position (EPUB CFI or PDF locator), when recorded. */
	locator?: string;
	chapterHref?: string;
	currentLocation?: number;
	totalLocations?: number;
}
/** One book through the shelf's stats face: position, status, and time. */
export interface BookStats extends ReadingState {
	totalMs: number;
	firstReadAt?: IsoDate;
	lastReadAt?: IsoDate;
	/** Active ms per local day, keyed YYYY-MM-DD. */
	daily: Record<string, number>;
}
/** Whole-shelf aggregate over every book's recorded reading. */
export interface StatsOverview {
	totalMs: number;
	/** Active ms per local day across all books, keyed YYYY-MM-DD. */
	daily: Record<string, number>;
	firstReadAt?: IsoDate;
	lastReadAt?: IsoDate;
	/** Books currently in progress (status "reading"). */
	booksReading: number;
	booksFinished: number;
}
/** One turn of an AI thread as the conversations domain lists it. */
export interface ChatMessageSummary {
	id: Id;
	role: "user" | "assistant";
	content: string;
	createdAt: IsoDate;
}
export interface ThreadSummary {
	id: Id;
	title?: string;
	updatedAt?: IsoDate;
}
/** One chapter of a book's extracted text (content-layer read). */
export interface ChapterRef {
	index: number;
	title?: string;
	/** Plain-text length, for budgeting reads. */
	chars: number;
}
export type AnnotationPageQuery = {
	bookId?: string;
	kind?: AnnotationItem["kind"];
	query?: string;
	/** 1..100 rows; defaults to 20. Page may stop earlier at 1 MiB; follow nextCursor. */
	limit?: number;
	/** Opaque bookmark bound to bookId, kind and normalized query, not a grant. */
	cursor?: string;
};
export type AnnotationPage = {
	/** Each complete item is limited to 512 KiB encoded native JSON. Oversize rejects, never truncates. */
	items: AnnotationItem[];
	nextCursor: string | null;
	/**
	 * Newest first by createdAt/id. Each page reads current storage, not a frozen
	 * export snapshot. Deleting the boundary row does not invalidate its cursor;
	 * edits can change filter membership behind it. Restart to see newer rows.
	 */
	consistency: "live";
};
/** Revision is an opaque, device-local observation token, not a timestamp. */
export type AnnotationSnapshot = {
	annotation: AnnotationItem;
	revision: string;
};
export type Condition = {
	annotationId: string;
	expectedRevision: string;
};
export type AnnotationMutation = Condition & ({
	op: "updateNote";
	body: string;
} | {
	op: "recolorHighlight";
	color: HighlightColor;
	style?: HighlightStyle;
} | {
	op: "remove";
	kind: AnnotationItem["kind"];
});
export type AnnotationCommitResult = {
	atomic: true;
	changes: {
		annotationId: string;
		revision: string | null;
	}[];
};
export type AnnotationObservationQuery = {
	kind: "page";
	query?: AnnotationPageQuery;
} | {
	kind: "inspect";
	annotationId: string;
};
export type AnnotationObservationResult = {
	kind: "page";
	page: AnnotationPage;
} | {
	kind: "inspect";
	snapshot: AnnotationSnapshot | null;
};
/** Subscription-local delivery order, never an annotation mutation revision. */
export type AnnotationObservation = {
	revision: number;
} & ({
	status: "ready";
	result: AnnotationObservationResult;
} | {
	status: "error";
	errorCode: string;
});
declare const READING_DOMAIN_EVENT_TYPES: readonly [
	"book.opened",
	"book.finished",
	"book.progressed",
	"book.timeRecorded",
	"book.sessionRecorded"
];
export type ReadingDomainEventType = (typeof READING_DOMAIN_EVENT_TYPES)[number];
declare const DOMAIN_CATALOG: {
	readonly library: {
		readonly version: "1.35.0";
		readonly pluginAccess: readonly [
			"read",
			"write"
		];
	};
	readonly reading: {
		readonly version: "2.24.0";
		readonly pluginAccess: readonly [
			"read",
			"write"
		];
	};
	readonly annotations: {
		readonly version: "2.2.0";
		readonly pluginAccess: readonly [
			"read",
			"write"
		];
	};
	readonly conversations: {
		readonly version: "1.6.0";
		readonly pluginAccess: readonly [
			"read",
			"write"
		];
	};
	readonly settings: {
		readonly version: "1.11.0";
		readonly pluginAccess: readonly [
		];
	};
	readonly memory: {
		readonly version: "2.8.0";
		readonly pluginAccess: readonly [
			"read",
			"write"
		];
	};
};
export type DomainId = keyof typeof DOMAIN_CATALOG;
/** A conservative reload hint. Revision orders this subscription's deliveries,
 * not database transactions; it is neither a cursor nor a conditional-write token. */
export type ProjectionInvalidation = {
	revision: number;
	source: "initial" | "local" | "host" | "remote" | "restore" | "mixed";
};
export type DomainAccess = "read" | "write";
export type DomainPermission = {
	[K in DomainId]: (typeof DOMAIN_CATALOG)[K]["pluginAccess"][number] extends infer TAccess ? TAccess extends DomainAccess ? `${K}:${TAccess}` : never : never;
}[DomainId];
declare const CONTRIBUTION_CATALOG: {
	readonly uriHandlers: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly selectionActions: {
		readonly version: "1.2.0";
		readonly permission: null;
	};
	readonly headerActions: {
		readonly version: "1.2.0";
		readonly permission: null;
	};
	readonly contextActions: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly commands: {
		readonly version: "1.1.0";
		readonly permission: null;
	};
	readonly settingsOptions: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly settingsPage: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly voiceProviders: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly contentProviders: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly readerModes: {
		readonly version: "1.1.0";
		readonly permission: "reader:modes";
	};
	readonly agentTools: {
		readonly version: "1.3.0";
		readonly permission: "agent:tools";
	};
	readonly agentContextProviders: {
		readonly version: "1.1.0";
		readonly permission: "agent:context";
	};
	readonly agentRetrievalProviders: {
		readonly version: "1.0.0";
		readonly permission: "agent:retrieval";
	};
	readonly memoryCandidateProviders: {
		readonly version: "1.1.0";
		readonly permission: "agent:memory";
	};
	readonly themes: {
		readonly version: "1.2.0";
		readonly permission: "ui:themes";
	};
	readonly fonts: {
		readonly version: "1.0.0";
		readonly permission: "ui:themes";
	};
	readonly syncTransports: {
		readonly version: "2.0.0";
		readonly permission: "sync:transport";
	};
};
export type ContributionId = keyof typeof CONTRIBUTION_CATALOG;
export type ContributionPermission = Exclude<(typeof CONTRIBUTION_CATALOG)[ContributionId]["permission"], null>;
declare const HOST_SERVICE_CATALOG: {
	readonly storage: {
		readonly version: "2.6.0";
		readonly permission: null;
	};
	readonly secrets: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly ui: {
		readonly version: "1.17.0";
		readonly permission: null;
	};
	readonly schedules: {
		readonly version: "2.1.0";
		readonly permission: null;
	};
	readonly jobs: {
		readonly version: "1.1.0";
		readonly permission: null;
	};
	readonly changes: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly transactions: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly session: {
		readonly version: "2.18.0";
		readonly permission: null;
	};
	readonly plugins: {
		readonly version: "1.10.0";
		readonly permission: null;
	};
	readonly maintenance: {
		readonly version: "1.5.0";
		readonly permission: null;
	};
	readonly diagnostics: {
		readonly version: "1.2.0";
		readonly permission: "service:diagnostics";
	};
	readonly logging: {
		readonly version: "1.0.0";
		readonly permission: null;
	};
	readonly resources: {
		readonly version: "1.6.0";
		readonly permission: null;
	};
	readonly sync: {
		readonly version: "1.2.0";
		readonly permission: "service:sync";
	};
	readonly network: {
		readonly version: "2.2.0";
		readonly permission: "service:network";
	};
	readonly llm: {
		readonly version: "1.6.0";
		readonly permission: "service:llm";
	};
	readonly clipboard: {
		readonly version: "1.1.0";
		readonly permission: "service:clipboard";
	};
};
export type HostServiceId = keyof typeof HOST_SERVICE_CATALOG;
export type HostServicePermission = Exclude<(typeof HOST_SERVICE_CATALOG)[HostServiceId]["permission"], null>;
declare const DECLARATIVE_SCHEMA_CATALOG: {
	readonly views: {
		readonly version: "1.12.0";
	};
	readonly settings: {
		readonly version: "1.0.0";
	};
	readonly themes: {
		readonly version: "1.0.0";
	};
};
export type DeclarativeSchemaId = keyof typeof DECLARATIVE_SCHEMA_CATALOG;
export type PluginPermission = Exclude<DomainPermission | ContributionPermission | HostServicePermission, "reader:modes">;
declare const CONTEXT_BUNDLE_KINDS: readonly [
	"user_profile_context",
	"reading_intent_context",
	"book_memory_context",
	"conversation_insights_context"
];
export type ContextBundleKind = (typeof CONTEXT_BUNDLE_KINDS)[number];
declare const CONTEXT_BUNDLE_ITEM_KINDS: readonly [
	"curated_profile",
	"derived_profile",
	"reading_goal",
	"memory",
	"annotation",
	"chapter_digest",
	"conversation_insight",
	"entity"
];
export type ContextBundleItemKind = (typeof CONTEXT_BUNDLE_ITEM_KINDS)[number];
export type ContextBundleScope = {
	kind: "user";
} | {
	kind: "book" | "conversation";
	id: string;
};
export type ContextBundleSelector = {
	kind: ContextBundleKind;
	scope: ContextBundleScope;
};
export type ContextBundleItem = {
	kind: ContextBundleItemKind;
	id: string;
	revision: string;
	label: string;
	text: string;
};
export type ContextBundleOmission = {
	kind: ContextBundleItemKind;
	reason: "privacy" | "spoiler" | "unavailable";
	count: number;
};
export type ContextBundleContent = {
	format: "readaware.context";
	schemaVersion: 1;
	recipeVersion: 1;
	kind: ContextBundleKind;
	scope: ContextBundleScope;
	sourceRevision: string;
	items: ContextBundleItem[];
	omissions: ContextBundleOmission[];
};
export type ContextBundle = {
	version: string;
	content: ContextBundleContent;
};
export type OnboardingSeed = {
	kind: "fact" | "preference";
	content: string;
};
export type OnboardingChange = {
	submissionId: string;
	expectedRevision: string;
	summary: string;
	seeds: OnboardingSeed[];
};
export type OnboardingReceipt = {
	status: "completed" | "already-completed";
	submissionId: string;
	revision: string;
	memoryIds: string[];
	persistence: "event-log";
};
/**
 * Hybrid Logical Clock stamp — gives every event a total, causally-consistent
 * order across devices so two local logs can be merged deterministically.
 */
export interface HlcStamp {
	/** Wall-clock milliseconds at emit time. */
	wallMs: number;
	/** Monotonic counter to break ties within the same wallMs on one device. */
	counter: number;
	/** Stable per-device id; the final tiebreaker. */
	deviceId: string;
}
export interface DomainEventEnvelope<T extends string = string, P = unknown> {
	/** Globally unique event id (uuid). */
	id: Id;
	/** Discriminator. */
	type: T;
	/** Ordering + sync key. */
	hlc: HlcStamp;
	/**
	 * Payload version. Bump (and add a new payload variant) instead of mutating
	 * an existing shape — replay of historical events must never break. Mirrors
	 * domain_events.schema_version.
	 */
	schemaVersion?: number;
	/** Operator identity; `"local"` on the single-user desktop app today. */
	actorId?: Id;
	/**
	 * Which software actor produced the event (user action, agent runtime,
	 * background machinery, or a plugin write). Orthogonal to `actorId` — the
	 * operator stays the same person when a plugin writes on their behalf.
	 * Defaults to `"user"`. This is what makes plugin writes auditable and
	 * per-plugin compensation (e.g. cleanup after uninstall) possible.
	 */
	origin?: EventOrigin;
	/**
	 * When the recorded fact happened (ISO-8601 UTC), for display and audit.
	 * Usually equals the HLC wall time and may be omitted (the store derives it
	 * from the HLC). It diverges on genesis backfill: events synthesized for
	 * pre-event-era rows carry the row's historical timestamp here while their
	 * HLC is stamped at synthesis time (the HLC orders the log, it is not a
	 * display time — and reusing historical millis would risk colliding with
	 * stamps already handed out).
	 */
	createdAt?: string;
	/** Event-specific data. */
	payload: P;
}
/**
 * Where a text-unit reading mode (sentence-by-sentence, paragraph-by-paragraph)
 * rests within the reading position it was observed with. The CFI addresses
 * content, so any device holding the same `contentVersion` can resume on the
 * unit that contains it, whichever mode or unit it reads with.
 */
export type ReadingModeResume = {
	modeKey: string;
	unitId: string;
	contentVersion: string;
	cfi: string;
};
export type DomainEvent = DomainEventEnvelope<"backup.restoreChunk", {
	restoreId: Id;
	index: number;
	data: string;
}> | DomainEventEnvelope<"backup.restored", {
	restoreId: Id;
	format: 1;
	chunks: number;
	sha256: string;
}> | DomainEventEnvelope<"book.imported", {
	bookId: Id;
	title: string;
	author?: string;
	format: BookFormat;
	/** Original import file name (reader rebuilds the File from it). */
	fileName: string;
	mimeType?: string;
	/** Original file size in bytes. */
	fileSize: number;
	/** Blob key of the original source file (no format conversion). */
	sourceBlobKey: string;
	/** Content hash for reliable duplicate-import detection. */
	sourceSha256?: string;
	/**
	 * Where a folder import found the file: the picked folder's name and
	 * the path below it, `/`-separated (`Books/Sci-fi/Dune.epub`). Never an
	 * absolute device path. Absent for single-file imports — additive field.
	 */
	sourcePath?: string;
}> | DomainEventEnvelope<"book.metadataEdited", {
	bookId: Id;
	title?: string;
	author?: string;
}> | DomainEventEnvelope<"book.coverExtracted", {
	bookId: Id;
	status: CoverStatus;
	coverBlobKey?: string;
}>
/**
 * 章节读毕提炼（book_memory 投影的原料）：读者读完一章后，后台管线从
 * 该章文本提炼出的摘要与人物名录。像 coverExtracted 一样，这是"记录一个
 * 派生事实"——LLM 产物不可确定性重算，所以入事件而非只入投影；投影表
 * chapter_digests 可从事件流完整重建。名字必须按本书文本原样拼写——
 * 这是版本保真（译名、称呼）的数据源。digestVersion 升版意味着提炼
 * 管线换代，旧摘要可被同章新事件整体覆盖。
 */
 | DomainEventEnvelope<"book.chapterDigested", {
	bookId: Id;
	contentVersion?: string;
	chapterIndex: number;
	chapterHref?: string;
	/** 一两句话的章节纪要，严格来自该章文本。 */
	summary: string;
	/** 该章出场人物；name/aliases 按本书文本原样拼写。 */
	characters: Array<{
		name: string;
		aliases?: string[];
		note?: string;
	}>;
	/**
	 * 该章确立的人物关系边（digestVersion 2 起）。from/to 引用
	 * characters 的 name；确立章节即本事件的 chapterIndex——叙事图
	 * 的剧透切片靠它。
	 */
	relations?: Array<{
		from: string;
		kind: string;
		to: string;
		note?: string;
	}>;
	digestVersion: number;
	/**
	 * 提炼口径（narrative 抽人物图 / expository 抽概念图）；缺省 =
	 * narrative（口径分流之前的旧事件）。
	 */
	flavor?: "narrative" | "expository";
	model?: string;
}>
/**
 * 叙事性分类：空闲管线从书名/目录/正文样本判定这本书是叙事作品还是
 * 说明文类；spoilerSensitive 单独决定是否保护情节揭晓。与 chapterDigested 同理，
 * LLM 判定不可确定性重算——入事件流，投影落 books.narrativity。
 * New automatic verdicts set onlyIfUnclassified; the current projector
 * preserves an existing classification on replay. Legacy unmarked events
 * remain unconditional, and older projectors do not enforce this guard.
 */
 | DomainEventEnvelope<"book.narrativityClassified", {
	bookId: Id;
	narrativity: "narrative" | "expository";
	spoilerSensitive?: boolean;
	model?: string;
	onlyIfUnclassified?: true;
}>
/**
 * Two book records turned out to be the same content (matching source
 * sha256 — e.g. the same file imported independently on two devices).
 * Everything the merged record accrued (annotations, reading time,
 * progress) folds into the keeper, and later events addressed to the
 * merged id re-route through the alias table. `keepId` is chosen
 * deterministically (earliest import, then smallest id), so concurrent
 * detection on two devices emits identical, idempotent merges.
 */
 | DomainEventEnvelope<"book.merged", {
	keepId: Id;
	mergedId: Id;
}>
/** Drives books.last_opened_at; emitted when a book is opened in the reader. */
 | DomainEventEnvelope<"book.opened", {
	bookId: Id;
}> | DomainEventEnvelope<"book.starred", {
	bookId: Id;
	starred: boolean;
}>
/**
 * The reader DECLARED the book finished, which is not the same fact as the
 * position reaching the end: a book can be finished with pages skipped, and
 * reaching 100% is not a commitment. `book.progressed` carries a derived
 * status; this carries the user's own.
 */
 | DomainEventEnvelope<"book.finished", {
	bookId: Id;
	finished: boolean;
}> | DomainEventEnvelope<"book.removed", {
	bookId: Id;
}> | DomainEventEnvelope<"collection.created", {
	collectionId: Id;
	name: string;
}> | DomainEventEnvelope<"collection.renamed", {
	collectionId: Id;
	name: string;
}> | DomainEventEnvelope<"collection.removed", {
	collectionId: Id;
}> | DomainEventEnvelope<"book.addedToCollection", {
	bookId: Id;
	collectionId: Id;
}> | DomainEventEnvelope<"book.removedFromCollection", {
	bookId: Id;
	collectionId: Id;
}>
/**
 * A font file the user imported into the app — how mobile gets custom
 * fonts (mobile platforms cannot enumerate installed families). `fontId`
 * is the file's content hash: the same file imported on two devices is
 * the same font, so concurrent imports converge on one row and replay is
 * idempotent. `name` is the family/display name parsed from the font's
 * name table — never the file name. Applying the event also leaves a
 * `blob_objects` manifest row for `blobKey`, so a fresh device learns the
 * bytes exist before they arrive.
 */
 | DomainEventEnvelope<"userFont.imported", {
	fontId: Id;
	name: string;
	format: UserFontFormat;
	/** Original picked file name (display secondary/diagnostics). */
	fileName: string;
	mimeType: string;
	byteSize: number;
	sha256: string;
	/** Blob key of the font bytes (`userfont:<sha256>`). */
	blobKey: string;
	/** OS/2 usWeightClass of the default instance (100–900). */
	weight: number;
	/** Variable fonts: the fvar `wght` axis upper bound, when present. */
	weightMax?: number;
	italic: boolean;
}>
/**
 * The user removed an imported font. `blobKey` rides along so the log
 * stays self-contained even though the cleanup trigger captures the same
 * key from the deleted projection row.
 */
 | DomainEventEnvelope<"userFont.removed", {
	fontId: Id;
	blobKey: string;
}> | DomainEventEnvelope<"book.progressed", {
	bookId: Id;
	/** Format-neutral position (EPUB CFI or PDF locator). */
	locator: string;
	chapterHref?: string;
	currentLocation?: number;
	totalLocations?: number;
	progressPercent?: number;
	status?: ReadingStatus;
}>
/**
 * Active reading time; `ms` is a duration, `atEpochMs` the local instant.
 * `localDay` (YYYY-MM-DD) and `localHour` (0-23) are stamped at RECORD time
 * in the recording device's timezone: the reading_time_daily/hourly
 * projections bucket by local day, and deriving the bucket at replay time
 * from `atEpochMs` would shift history when a rebuild runs in a different
 * timezone.
 */
 | DomainEventEnvelope<"book.timeRecorded", {
	bookId: Id;
	ms: number;
	atEpochMs: number;
	localDay: string;
	localHour: number;
}>
/**
 * One closed reading session bucket: the time read AND the position
 * reached, observed at `endedAt`. Reading is modelled as sessions (one
 * event per book per local hour, closed by the hour rolling over, the book
 * or app closing, or a pause), so neither page turns nor ticks reach the
 * log. `progress` is the position's own state — the LAST one observed in
 * the bucket, back or forward; the projection keeps the LATEST OBSERVATION
 * (`progress.observedAt`) across devices, never the latest event or the
 * furthest page — a session that closes late on one device cannot
 * overwrite a newer position from another, and a reader who turns back
 * reopens where they turned back to. Supersedes `book.progressed` +
 * `book.timeRecorded`, which remain replayable.
 */
 | DomainEventEnvelope<"book.sessionRecorded", {
	bookId: Id;
	ms: number;
	startedAt: number;
	endedAt: number;
	localDay: string;
	localHour: number;
	progress?: {
		/** When this position was observed — a page turn's time, never a
		 *  tick's. Defaults to `endedAt` when absent. */
		observedAt?: number;
		locator: string;
		chapterHref?: string;
		currentLocation?: number;
		totalLocations?: number;
		progressPercent?: number;
		status?: ReadingStatus;
		/** The reading mode's resting unit at this observation, so the
		 *  mode resumes in step with the position on every device. Null:
		 *  observed with no resting unit (mode off). Absent: recorded by a
		 *  build that predates the field — unknown. */
		readingMode?: ReadingModeResume | null;
	};
}> | DomainEventEnvelope<"highlight.created", {
	highlightId: Id;
	bookId: Id;
	range?: BookTextRange;
	/** Range anchor; may be absent for unanchorable formats (some PDFs). */
	anchor?: string;
	chapterHref?: string;
	text: string;
	color?: HighlightColor;
	style?: HighlightStyle;
}> | DomainEventEnvelope<"highlight.recolored", {
	highlightId: Id;
	color: HighlightColor;
	style?: HighlightStyle;
}> | DomainEventEnvelope<"highlight.removed", {
	highlightId: Id;
}> | DomainEventEnvelope<"note.created", {
	noteId: Id;
	bookId: Id;
	range?: BookTextRange;
	highlightId?: Id;
	anchor?: string;
	chapterHref?: string;
	quotedText?: string;
	body: string;
}> | DomainEventEnvelope<"note.updated", {
	noteId: Id;
	body: string;
}> | DomainEventEnvelope<"note.removed", {
	noteId: Id;
}>
/**
 * A question asked in the book thread leaves a passive trace anchored at the
 * selection or reading position (docs/architecture/agent-architecture.md). Written by
 * the agent runtime, not the user.
 */
 | DomainEventEnvelope<"ask.recorded", {
	askId: Id;
	bookId: Id;
	anchor?: string;
	chapterHref?: string;
	text: string;
}> | DomainEventEnvelope<"ask.removed", {
	askId: Id;
}> | DomainEventEnvelope<"aiConversation.started", 
/** `bookId` absent on global (Context page) threads — additive change. */
{
	conversationId: Id;
	bookId?: Id;
	title?: string;
}> | DomainEventEnvelope<"aiMessage.appended", {
	messageId: Id;
	conversationId: Id;
	role: "user" | "assistant";
	seq: number;
	content: string;
	model?: string;
	attachments?: Array<{
		attachmentId: Id;
		kind?: "selection";
		text: string;
		anchor?: string;
		chapterHref?: string;
	} | {
		attachmentId: Id;
		kind: "image";
		cacheKey: string;
		name: string;
	}>;
}>
/**
 * A message left the transcript (retry/regenerate truncation). Without it,
 * replaying `aiMessage.appended` would resurrect truncated turns.
 */
 | DomainEventEnvelope<"aiMessage.removed", {
	messageId: Id;
	conversationId: Id;
}> | DomainEventEnvelope<"aiConversation.cleared", {
	conversationId: Id;
}> | DomainEventEnvelope<"context.bundlePublished", ContextBundle> | DomainEventEnvelope<"profile.onboarded", OnboardingChange> | DomainEventEnvelope<"profile.updated", {
	displayName?: string | null;
	summary?: string | null;
	traits?: Record<string, unknown>;
}> | DomainEventEnvelope<"entity.resolved", {
	entityId: Id;
	kind: string;
	canonicalName: string;
	aliases?: string[];
}> | DomainEventEnvelope<"entity.merged", {
	keepId: Id;
	mergedId: Id;
}> | DomainEventEnvelope<"memory.promoted", {
	memoryId: Id;
	kind: string;
	/** "global" added for the agent's cross-book scope — additive change. */
	scope?: "user" | "global" | "book" | "entity" | "conversation";
	bookId?: Id;
	entityId?: Id;
	subject?: string;
	content: string;
	importance?: number;
	confidence?: number;
	evidence?: Array<{
		sourceKind: string;
		sourceId: Id;
		quote?: string;
		weight?: number;
	}>;
}> | DomainEventEnvelope<"memory.revised", {
	memoryId: Id;
	content?: string;
	importance?: number;
	confidence?: number;
	/** Scope promotion (e.g. book → user) — additive field. */
	scope?: "user" | "global" | "book" | "entity" | "conversation";
	/** Set alongside scope "book". */
	bookId?: Id;
	/** Absolute evidence count after a reinforcement — additive field. */
	evidenceCount?: number;
}> | DomainEventEnvelope<"memory.superseded", 
/** `bySupersedingId` optional: a supersession may have no single winner. */
{
	memoryId: Id;
	bySupersedingId?: Id;
}> | DomainEventEnvelope<"memory.feedback", {
	memoryId: Id;
	signal: MemoryFeedbackSignal;
	note?: string;
}> | DomainEventEnvelope<"memory.forgotten", {
	memoryId: Id;
	reason: "decay" | "user";
}>
/**
 * A device-roaming preference changed. `key` is the preference namespace
 * (the same `read-aware-*` key its device-local KV copy uses), `value` the
 * whole settings object for that namespace — coarse on purpose: one event
 * per save keeps last-writer-wins at the granularity users actually edit.
 * Only ALLOWLISTED namespaces roam (platform/roaming-preferences.ts);
 * device-local config (OS integration, shortcuts, secrets) never appears
 * here.
 */
 | DomainEventEnvelope<"preference.changed", {
	key: string;
	value: unknown;
}>;
export type DomainEventType = DomainEvent["type"];
export type ConversationTarget = {
	kind: "book" | "global";
	id: string;
};
export type ConversationSessionState = ConversationTarget & {
	sessionId: string;
	loading: boolean;
	streaming: boolean;
	messageCount: number;
};
export type ConversationRuntimeSnapshot = {
	revision: number;
	selectedGlobalThreadId: string;
	sessions: ConversationSessionState[];
};
export type ConversationControlReceipt = {
	status: "completed";
	target: ConversationTarget;
};
export type ConversationTurnRequest = {
	target: ConversationTarget;
} & ({
	action: "draft" | "send";
	text: string;
} | {
	action: "retry";
});
export type ConversationTurnRequestStatus = "pending" | "adopted" | "started" | "dismissed" | "cancelled" | "stale" | "failed" | "expired";
export type ConversationTurnRequestSnapshot = {
	id: string;
	target: ConversationTarget;
	action: ConversationTurnRequest["action"];
	status: ConversationTurnRequestStatus;
	createdAt: number;
};
export type ReadingIntentScope = {
	kind: "user";
} | {
	kind: "book";
	id: string;
};
export type ReadingIntentSnapshot = {
	revision: string | null;
	text: string | null;
};
export type ContextBundleHistoryQuery = ContextBundleSelector & {
	offset?: number;
	limit?: number;
	expectedRevision?: string;
};
export type ContextBundleReadQuery = ContextBundleSelector & {
	version: string;
};
export type ContextBundleHistoryEntry = {
	version: string;
	publishedAt: string;
};
export type ContextBundleHistoryPage = {
	selector: ContextBundleSelector;
	items: ContextBundleHistoryEntry[];
	offset: number;
	nextOffset: number | null;
	total: number;
	revision: string;
};
export type PluginScheduleOutcome = "running" | "succeeded" | "failed" | "cancelled" | "interrupted";
export type PluginDeferredRequest = {
	requestId: string;
	delayMs: number;
	when: "any" | "idle";
};
export type PluginDeferredState = PluginDeferredRequest & {
	ownerVersion: string;
	dueAt: number;
	state: "queued" | PluginScheduleOutcome;
	errorCode: string | null;
};
export type PluginScheduleRun = {
	trigger: "periodic" | "manual" | "deferred";
	requestId: string | null;
	startedAt: number;
};
export type PluginDeferredReceipt = {
	status: "queued" | "retained" | "cancelled" | "not-queued";
	request: PluginDeferredState | null;
};
export type PluginScheduleState = {
	pluginId: string;
	id: string;
	label: string;
	everyMinutes: number | null;
	/** The most recent one-shot request only, not an execution-history archive. */
	deferred?: PluginDeferredState | null;
	paused: boolean;
	running: boolean;
	lastStartedAt: number | null;
	lastFinishedAt: number | null;
	lastSuccessAt: number | null;
	lastOutcome: PluginScheduleOutcome | null;
	lastErrorCode: string | null;
};
export type PluginSchedulePage = {
	schedules: PluginScheduleState[];
	total: number;
	nextOffset: number | null;
};
export type PluginScheduleQuery = {
	pluginId?: string;
	offset?: number;
	limit?: number;
};
export type PluginScheduleControl = {
	pluginId: string;
	id: string;
	action: "pause" | "resume" | "run";
};
export type PluginScheduleReceipt = {
	status: "completed" | "already-running";
	schedule: PluginScheduleState;
};
/**
 * One sealed event as it crosses the wire. The clear fields are exactly what
 * routing needs: `id` for idempotent dedup, `hlc` for merge ordering (and the
 * receiver advances its clock from it BEFORE decrypting). Everything that
 * describes behavior lives inside `ciphertext`.
 */
export type SealedEventWire = {
	id: string;
	hlc: HlcStamp;
	/** Envelope version — room to rotate algorithms/keys without a flag day. */
	v: 1;
	/** 24-byte XChaCha20 nonce, base64. */
	nonce: string;
	ciphertext: string;
};
/**
 * Account tiers: `free` / `sync` / `pro` / `max` are the public ladder
 * (`sync` = the data plan: pro-sized storage, no bundled AI — built for BYOK
 * users), `staff` is internal-only. The tier decides quotas and nothing else
 * — the relay stores ciphertext either way. Tier → quota mapping lives
 * server-side (apps/relay/src/ports.ts); the wire carries the resolved
 * numbers in `AccountResponse.limits` so the client never hardcodes them.
 */
export type SyncTier = "free" | "sync" | "pro" | "max" | "staff";
/** Resolved quota numbers for the account's current tier; null = unlimited. */
export type SyncTierLimits = {
	/** Per single blob upload. */
	maxBlobBytes: number | null;
	/** Per account, total blob bytes. */
	maxAccountBlobBytes: number | null;
	/** Per account, total events in the mailbox. */
	maxAccountEvents: number | null;
	/** Bundled-AI budget per month; 0 = BYOK only (free tier), null = unmetered. */
	aiMonthlyCredits: number | null;
};
export type HostSyncSnapshot = {
	revision: number;
	supported: boolean;
	connectionBusy: boolean;
	state: "disabled" | "idle" | "syncing" | "error" | "unauthenticated";
	connected: boolean;
	backend: "relay" | "transport" | null;
	lastSyncAt: number | null;
	lastErrorCode: string | null;
	progress: {
		phase: "bootstrap" | "pull" | "verify" | "push" | "blobs" | "backfill" | "checkpoint";
		pulled: number;
		pushed: number;
		verified: number;
		backfilled: number;
		blobsDone: number;
		blobsTotal: number;
	} | null;
	cycleStartBacklog: {
		events: number;
		blobs: number;
	} | null;
	lastCycle: {
		pulled: number;
		pushed: number;
		blobs: number;
		backfilled: number;
	} | null;
	backfillRemaining: number;
};
export type HostSyncAccount = {
	tier: SyncTier;
	hasBilling: boolean;
	blobBytesUsed: number;
	eventsUsed: number;
	aiCreditsUsed: number;
	limits: SyncTierLimits;
};
export type HostSyncReceipt = {
	status: "completed" | "already-running";
	snapshot: HostSyncSnapshot;
};
export type HostSyncFlow = "connect" | "disconnect" | "delete-account" | "upgrade" | "billing";
export type HostSyncFlowRequest = {
	action: HostSyncFlow;
	transportRef?: string;
};
export type HostSyncFlowReceipt = {
	action: HostSyncFlow;
	/** External handoff is not proof of purchase or a billing change. */
	status: "completed" | "cancelled" | "external-opened";
};
export type HostSyncPort = {
	/** Current sync state: backend, connection, progress, last cycle and last error code. */
	snapshot(): Promise<HostSyncSnapshot>;
	backlog(signal?: AbortSignal): Promise<{
		events: number;
		blobs: number;
	}>;
	/** Explicit remote read. No email, account ID, keys, session or billing ticket. */
	account(signal?: AbortSignal): Promise<HostSyncAccount | null>;
	/**
	 * Runs one sync round on the configured backend — the relay or a plugin
	 * transport such as WebDAV, including transports that only sync on request —
	 * and resolves when that round has finished: `completed`, or
	 * `already-running` when a round was in progress (it is not queued again).
	 * Rejects with a coded `AppError` when no round can start (`ui/unavailable`
	 * while sync is unsupported, disconnected, disabled or busy) and with the
	 * round's error when it fails — classified failures carry a `sync/*` code
	 * such as `sync/network` or `sync/unauthorized`. Caller cancellation cannot
	 * stop a shared sync or undo its writes.
	 */
	requestSync(signal?: AbortSignal): Promise<HostSyncReceipt>;
	/** Opens the host Data & Sync page, not an automatic login, disconnect or purchase. */
	openSettings(signal?: AbortSignal): Promise<{
		status: "opened";
		surface: "dataSync";
	}>;
	/** Registered backend references and display labels, never endpoint credentials. */
	connectionOptions(): Promise<{
		ref: string;
		label: string;
	}[]>;
	/** Host-owned identity/passphrase and destructive confirmation. Waits for the
	 * final local outcome or external handoff. Cancellation cannot undo a started operation. */
	requestFlow(request: HostSyncFlowRequest, signal?: AbortSignal): Promise<HostSyncFlowReceipt>;
};
/** Closed JSON Schema vocabulary. No executable validators, references, or coercion. */
export type PluginServiceSchema = {
	description?: string;
} & ({
	type: "string";
	maxLength?: number;
	enum?: string[];
} | {
	type: "number" | "integer";
	minimum?: number;
	maximum?: number;
} | {
	type: "boolean" | "null";
} | {
	type: "array";
	items: PluginServiceSchema;
	maxItems?: number;
} | {
	type: "object";
	properties: Record<string, PluginServiceSchema>;
	required?: string[];
	additionalProperties: false;
} | {
	anyOf: PluginServiceSchema[];
});
export type PluginServiceDeclaration = {
	id: string;
	version: string;
	title: string;
	description: string;
	scope: "book" | "global";
	permissions: PluginPermission[];
	input: PluginServiceSchema;
	output: PluginServiceSchema;
};
export type PluginServiceRef = {
	pluginId: string;
	id: string;
	version: string;
	generation: string;
};
export type PluginServiceDescriptor = PluginServiceDeclaration & {
	ref: PluginServiceRef;
};
export type PluginServiceQuery = {
	pluginId?: string;
	id?: string;
	offset?: number;
	limit?: number;
};
export type PluginServicePage = {
	services: PluginServiceDescriptor[];
	total: number;
	nextOffset: number | null;
};
export type PluginServiceCall = {
	service: PluginServiceRef;
	bookId?: string;
	input: unknown;
};
export type PluginServiceReceipt = {
	callId: string;
	service: PluginServiceRef;
	value: unknown;
};
export type HostWindowState = {
	minimized: boolean;
	maximized: boolean;
	fullscreen: boolean;
	focused: boolean;
};
export type HostWindowSnapshot = {
	supported: false;
	revision: number;
} | ({
	supported: true;
	revision: number;
} & HostWindowState);
export type HostWindowRequest = {
	action: "minimize" | "maximize" | "restore";
} | {
	action: "fullscreen";
	enabled: boolean;
};
export type HostWindowReceipt = {
	status: "requested";
	snapshot: HostWindowSnapshot;
};
export type HostWindowObservation = {
	status: "ready";
	snapshot: HostWindowSnapshot;
} | {
	status: "error";
	code: string;
};
export type HostExportDescription = {
	filename: string;
	byteLength: number;
	mimeType?: string;
};
export type PluginDirectoryQuery = {
	search?: string;
	offset?: number;
	limit?: number;
};
export type PluginDirectoryEntry = {
	id: string;
	name: string;
	version: string;
	builtin: boolean;
	/** Configured enabled state, not proof that every contribution is active. */
	enabled: boolean;
	activationFailed: boolean;
};
export type PluginDirectoryPage = {
	plugins: PluginDirectoryEntry[];
	total: number;
	offset: number;
	nextOffset: number | null;
};
export type PluginContributionQuery = PluginDirectoryQuery & {
	point?: ContributionId;
	pluginId?: string;
};
export type PluginContributionEntry = {
	point: ContributionId;
	pluginId: string;
	/** Registry key, not a callable handle or a universal settings value. */
	key: string;
};
export type PluginContributionPage = {
	contributions: PluginContributionEntry[];
	total: number;
	offset: number;
	nextOffset: number | null;
};
/** A local derived-text snapshot, not the book's live reader/search index. */
export type BookTextSnapshot = {
	bookId: string;
	contentVersion: string | null;
	status: "unprepared" | "preparing" | "ready" | "partial" | "unsupported" | "unavailable" | "error";
	/** Text can exist even when the chapter indexing policy retains no chapters. */
	text: "unknown" | "available" | "textless";
	chapterCount: number;
	progress: {
		total: number;
		completed: number;
		failed: number;
		unsupported: number;
	} | null;
	errorCode?: string;
};
export type BookTextPriority = "normal" | "background";
export type BookTextWaitReason = "queue" | "reader" | null;
export type BookTextPrepareOptions = {
	rebuild?: boolean;
	priority?: BookTextPriority;
	timeoutMs?: number;
};
/** One caller's ephemeral request, not ownership of all extraction for this book. */
export type BookTextTaskSnapshot = {
	taskId: string;
	bookId: string;
	mode: "prepare" | "rebuild";
	priority: BookTextPriority;
	/** Wall-clock deadline from admission, including queueing and pause. */
	timeoutMs: number;
	deadlineAt: string;
	waitReason: BookTextWaitReason;
	revision: number;
	status: "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
	createdAt: string;
	updatedAt: string;
	textState: BookTextSnapshot;
	/** Persistence of the latest recorded milestone; separate from extraction completion. */
	history?: {
		status: "pending" | "saved" | "failed";
		persistedRevision?: number;
		errorCode?: string;
	};
	errorCode?: string;
};
/** Persisted metadata only; an old handle never grants control of a new request. */
export type BookTextTaskHistoryEntry = {
	snapshot: BookTextTaskSnapshot;
	recordedAt: string;
	requestAvailable: boolean;
	interrupted: boolean;
};
export type BookTextTaskHistoryQuery = {
	offset?: number;
	limit?: number;
};
export type BookTextTaskHistoryPage = {
	items: BookTextTaskHistoryEntry[];
	total: number;
	nextOffset: number | null;
	retainedLimit: number;
};
/** Semantic operation conditions, not a promise of remote success. More
 * operation kinds share this contract as their authoritative checks are wired. */
export type InferenceAvailabilityQuery = {
	operation: "llm.infer";
	model?: "fast" | "smart";
	images?: boolean;
};
export type ReadingOperationQuery = {
	bookId: string;
	sessionId?: string;
} & ({
	operation: "reading.playback";
	action: "start" | "stop";
} | ({
	operation: "reading.mode.configure";
} & ReadingModeConfiguration));
export type BookTextAvailabilityQuery = {
	operation: "library.text.prepare";
	bookId: string;
} & BookTextPrepareOptions;
export type GraphAvailabilityQuery = {
	operation: "memory.graph.generate";
	bookId: string;
	mode: "catch-up" | "rebuild";
	maxChapters?: number;
};
export type WindowAvailabilityQuery = {
	operation: "window.control";
	request: HostWindowRequest;
};
export type ExportAvailabilityQuery = {
	operation: "ui.exportFile";
} & HostExportDescription;
export type HostIOAvailabilityQuery = ExportAvailabilityQuery | {
	operation: "clipboard.writeText";
	text: string;
} | {
	operation: "ui.openExternal";
	url: string;
};
export type SyncAvailabilityQuery = {
	operation: "sync.now";
} | {
	operation: "sync.requestFlow";
	flow: HostSyncFlowRequest;
};
export type ScheduleAvailabilityQuery = {
	operation: "schedules.control";
	schedule: PluginScheduleControl;
};
export type ModelCatalogAvailabilityQuery = {
	operation: "settings.refreshModelCatalog";
	provider: string;
};
export type UpdateAvailabilityQuery = {
	operation: "maintenance.checkForUpdates";
} | {
	operation: "diagnostics.verifyProjections";
};
export type HostFlowAvailabilityQuery = {
	operation: "maintenance.requestBackup";
	action: "import" | "export";
} | {
	operation: "diagnostics.requestReport";
	action: "export" | "send";
} | {
	operation: "maintenance.requestConnectionTest";
} | {
	operation: "diagnostics.requestProjectionRepair";
};
export type PluginServiceAvailabilityQuery = {
	operation: "plugins.callService";
	serviceCall: PluginServiceCall;
};
export type HostCommandAvailabilityQuery = {
	operation: "ui.commands.execute";
	command: HostCommandRequest;
};
export type OperationAvailabilityQuery = ResourceOperationQuery | ScheduleAvailabilityQuery | ModelCatalogAvailabilityQuery | HostFlowAvailabilityQuery | UpdateAvailabilityQuery | HostCommandAvailabilityQuery | PluginServiceAvailabilityQuery | InferenceAvailabilityQuery | ReadingOperationQuery | BookTextAvailabilityQuery | GraphAvailabilityQuery | SyncAvailabilityQuery | WindowAvailabilityQuery | HostIOAvailabilityQuery;
export type OperationConditionState = "satisfied" | "unconfigured" | "unavailable" | "unknown";
export type OperationCondition = {
	kind: "permission" | "account" | "model" | "endpoint" | "provider" | "input" | "object" | "reader" | "capacity";
	state: OperationConditionState;
	reason: string;
	errorCode?: string;
};
export type OperationAvailability = {
	operation: OperationAvailabilityQuery["operation"];
	model?: "fast" | "smart";
	state: "available" | Exclude<OperationConditionState, "satisfied">;
	conditions: OperationCondition[];
	/** This query never sends a probe or executes the operation. */
	remoteChecked: false;
};
/** Opaque, activation/thread-local reference. Never a path or native storage key. */
export type ResourceRef = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	state: "writing" | "ready";
	expiresAt: number;
	source: "picked" | "created" | "book" | "cover" | "image" | "context" | "asset";
};
export type ResourcePickOptions = {
	multiple?: boolean;
	extensions?: string[];
};
/** User-selected live directory grant. Paths below it are relative, never ambient filesystem paths. */
export type ResourceDirectoryRef = {
	id: string;
	name: string;
	expiresAt: number;
};
export type ResourceDirectoryQuery = {
	relativePath?: string;
	cursor?: string;
	limit?: number;
};
export type ResourceDirectoryPage = {
	entries: {
		name: string;
		relativePath: string;
		kind: "file" | "directory";
		size: number | null;
	}[];
	nextCursor: string | null;
	omittedCount: number;
};
export type ResourceCreateOptions = {
	name: string;
	mimeType?: string;
};
export type ResourceChunk = {
	data: ArrayBuffer;
	nextOffset: number;
	eof: boolean;
};
export type ResourceImageReceipt = {
	copied: true;
	width: number;
	height: number;
};
export type ResourceOperationQuery = {
	operation: "resources.save";
	resourceId: string;
	filename?: string;
} | {
	operation: "resources.openAssociated";
	resourceId: string;
};
export type ContextBundleCaptureReceipt = {
	bundle: ContextBundle;
	changed: boolean;
	persistence: "event-log";
};
export type ReadingEmphasisStyle = "highlight" | "underline";
export type ReadingEmphasisWrite = {
	ranges: BookTextRange[];
	style?: ReadingEmphasisStyle;
	/** Omit both fields to create; replacing requires the observed configuration revision. */
	id?: string;
	expectedRevision?: number;
};
export type ReadingEmphasisRef = {
	id: string;
	expectedRevision: number;
};
export type ReadingEmphasisSnapshot = {
	id: string;
	/** Changes when configuration is replaced, not when another page becomes attached. */
	revision: number;
	sessionId: string;
	bookId: string;
	style: ReadingEmphasisStyle;
	count: number;
	/** Ranges attached to rendered documents, not a guarantee of viewport visibility. */
	attached: number;
	status: "attached" | "deferred" | "partial" | "error";
	errorCode?: string;
};
export type ReadingEmphasisReceipt = {
	status: "completed";
	emphasis: ReadingEmphasisSnapshot;
};
export type ReadingEmphasisRemoval = {
	status: "completed";
	id: string;
	removed: boolean;
};
export type HostUpdatePhase = "idle" | "checking" | "up-to-date" | "available" | "downloading" | "installing" | "permission-required" | "installer-open" | "error";
export type HostUpdateState = {
	phase: HostUpdatePhase;
	currentVersion: string | null;
	availableVersion: string | null;
	progress: number | null;
	errorStage: "check" | "install" | null;
};
declare const HOST_MAINTENANCE_SURFACES: readonly [
	"updates",
	"diagnostics",
	"plugins",
	"backup-import",
	"backup-export",
	"delete-data",
	"ai-connection",
	"data-location"
];
export type HostMaintenanceSurface = (typeof HOST_MAINTENANCE_SURFACES)[number];
export type BackupAction = "import" | "export";
export type BackupReceipt = {
	action: BackupAction;
	status: "imported" | "exported" | "cancelled";
};
export type ConnectionTestReceipt = {
	action: "test";
	status: "responded" | "empty" | "cancelled";
};
export type HostMaintenanceSnapshot = HostUpdateState & {
	supported: boolean;
	channel: "stable" | "beta";
	/** Channel of the last successful check, not necessarily the selected channel. */
	checkedChannel: "stable" | "beta" | null;
};
export type HostMaintenancePort = {
	/** Reveal the native test button and await an explicit user click; no configuration or response text. */
	requestConnectionTest(signal?: AbortSignal): Promise<ConnectionTestReceipt>;
	/** Reveal a host button, then await the user's native action. No bytes or paths. */
	requestBackup(action: BackupAction, signal?: AbortSignal): Promise<BackupReceipt>;
	snapshot(): Promise<HostMaintenanceSnapshot>;
	/** Checks the host release feed only. Never downloads, installs or restarts. */
	checkForUpdates(signal?: AbortSignal): Promise<HostMaintenanceSnapshot>;
	/** Reveals mounted host controls, never clicks them. No install, backup or wipe executes. */
	openSettings(surface: HostMaintenanceSurface, signal?: AbortSignal): Promise<{
		status: "opened";
		surface: HostMaintenanceSurface;
	}>;
};
/** Counts only. No table names, row samples, identifiers, logs or user content. */
export type ProjectionVerification = {
	scope: "event-projections";
	checkedAt: string;
	consistent: boolean;
	eventsReplayed: number;
	driftedTables: number;
	onlyLiveRows: number;
	onlyReplayedRows: number;
};
export type DiagnosticsReportAction = "export" | "send";
export type ProjectionRepairReceipt = {
	action: "repair";
	/** Rebuilt means the local transaction committed; the host must reload its
	 * stores before resuming writes. No claim about backups or other devices. */
	status: "rebuilt-reload-required" | "cancelled";
};
export type DiagnosticsReportReceipt = {
	action: DiagnosticsReportAction;
	/** Saved locally or acknowledged by the report endpoint, not developer review. */
	status: "exported" | "sent" | "cancelled";
};
export type BookEnrichmentJob = {
	phase: "idle" | "queued" | "running" | "completed" | "skipped" | "failed";
	startedAt: number | null;
	finishedAt: number | null;
	errorCode: string | null;
	reason: "book-removed" | "not-needed" | "unsupported-format" | "source-unavailable" | null;
};
export type BookEnrichmentSnapshot = {
	bookId: string;
	cover: {
		status: "unchecked" | "none" | "ready";
		local: boolean;
	};
	metadataPending: boolean;
	supported: boolean;
	sourceLocal: boolean;
	job: BookEnrichmentJob;
};
export type BookEnrichmentReceipt = {
	status: "queued" | "already-running" | "not-needed" | "unavailable";
	snapshot: BookEnrichmentSnapshot;
};
export type BookEnrichmentObservation = {
	status: "ready";
	snapshot: BookEnrichmentSnapshot;
} | {
	status: "error";
	errorCode: string;
};
export type DuplicateBookQuery = {
	offset?: number;
	limit?: number;
};
export type DuplicateBookGroup = {
	bookId: string;
	title: string;
	count: number;
};
export type DuplicateBookPage = {
	groups: DuplicateBookGroup[];
	total: number;
	nextOffset: number | null;
};
export type BookMergeMember = {
	id: string;
	title: string;
	author: string;
	createdAt: string;
};
export type BookMergePreview = {
	revision: string;
	keep: BookMergeMember;
	merged: BookMergeMember[];
};
export type BookMergeRequest = {
	bookId: string;
	expectedRevision: string;
};
export type BookMergeReceipt = {
	committed: true;
	keepId: string;
	redirects: {
		from: string;
		to: string;
	}[];
};
export type BookFormatCapability = {
	format: Exclude<BookFormat, "virtual">;
	extensions: string[];
	mimeTypes: string[];
};
export type BookInspection = {
	/** Same name/MIME/head-based routing hint as import, not a verified container identity. */
	formatHint: BookFormat | null;
	status: "parsed" | "unsupported" | "encrypted" | "failed";
	/** Initialization only: section resources and rendering can still fail later. */
	coverage: "initialization";
	sectionCount: number | null;
	errorCode: string | null;
};
export type BookImportReceipt = {
	status: "imported" | "duplicate";
	book: BookSummary;
};
/** Host milestones, not invented byte percentages inside an opaque native stage. */
export type BookImportPhase = "preparing" | "staging" | "committing";
export type BookImportRequest = {
	kind: "resource";
	resourceId: string;
} | {
	kind: "file";
	fileName: string;
	data: ArrayBuffer | Uint8Array;
};
export type BookImportTaskSnapshot = {
	taskId: string;
	sourceName: string;
	phase: "queued" | BookImportPhase | "completed" | "cancelled" | "failed";
	revision: number;
	createdAt: string;
	updatedAt: string;
	cancellable: boolean;
	cancelRequested: boolean;
	receipt: BookImportReceipt | null;
	errorCode: string | null;
};
export type ReaderPanel = "toc" | "annotations" | "appearance" | "chat";
export type ResizableReaderPanel = "toc" | "chat";
export type ReaderPanelSizes = Record<ResizableReaderPanel, number>;
/** Committed UI state, not a guarantee that an optimistic preference is durable. */
export type ReaderPanelsView = {
	controlsVisible: boolean;
	/** Preferred CSS-pixel widths, shared across books; ignored in exclusive layout. */
	sizes: ReaderPanelSizes;
	layout: "docked" | "exclusive";
	panels: Record<ReaderPanel, {
		open: boolean;
		visible: boolean;
	}>;
};
export type ReaderPanelsSnapshot = ReaderPanelsView & {
	sessionId: string;
	bookId: string;
	revision: number;
};
export type ReaderPanelReceipt = {
	status: "completed";
	panel: ReaderPanel;
	snapshot: ReaderPanelsSnapshot;
};
export type ReaderFocusTarget = "content" | "toc" | "chat";
export type ReaderFocusOutcome = {
	status: "focused";
} | {
	status: "not-focused";
	reason: "missing" | "hidden" | "blocked" | "rejected";
};
export type ReaderFocusReceipt = ReaderFocusOutcome & {
	target: ReaderFocusTarget;
	sessionId: string;
	bookId: string;
};
/** Separately declared book text for host-governed model input assembly.
 * This is not provenance verification for arbitrary prompt/system strings. */
export type ModelReadingContext = {
	selection?: string;
	surrounding?: string;
	/** Reject before inference if any named fragment is withheld; never guess it. */
	required?: Array<"selection" | "surrounding">;
};
/** One-shot response metadata, not an invoice or an application-wide budget. */
export type InferenceAttemptReceipt = {
	/** Resolved catalog model; no account credentials or endpoint. */
	model: {
		id: string;
		provider: string;
	};
	stopReason: "pending" | "stop" | "length" | "toolUse" | "error" | "aborted" | "deferred";
	/** Per-attempt cap requested from the SDK, null when using account defaults. */
	maxOutputTokens: number | null;
	/** SDK counters; null when unavailable/all zero. Missing individual counters remain null.
	 * reasoning is included in output and must not be added again. */
	usage: {
		input: number | null;
		output: number | null;
		cacheRead: number | null;
		cacheWrite: number | null;
		reasoning: number | null;
		totalTokens: number | null;
	} | null;
	/** SDK estimate in USD using catalog prices; null for unknown/zero-only pricing.
	 * This is not the provider's bill, including subscription and custom accounts. */
	estimatedCostUsd: number | null;
};
export type InferenceResult<T = unknown> = {
	value: T;
	/** One entry per completed attempt, including the first invalid structured reply.
	 * Successful calls only; failures/cancellation still reject without a final receipt. */
	attempts: InferenceAttemptReceipt[];
};
/** Owned request metadata only. No prompt, output, credential or provider error prose. */
export type InferenceRequestReceipt = {
	requestId: string;
	/** Live handle in the calling activation; historical IDs cannot cancel new work. */
	requestAvailable: boolean;
	/** Observation ended before all provider promises settled; no automatic replay. */
	interrupted: boolean;
	revision: number;
	status: "running" | "completed" | "failed" | "cancelled" | "timed-out";
	/** All known provider promises have settled. Not proof of remote billing finality. */
	settled: boolean;
	createdAt: string;
	updatedAt: string;
	errorCode: string | null;
	attempts: InferenceAttemptReceipt[];
};
/** Non-sensitive host facts. No book, account, endpoint or hardware identifiers. */
export type HostEnvironmentSnapshot = {
	revision: number;
	runtime: "desktop" | "preview";
	platform: "macos" | "windows" | "linux" | "unknown";
	locale: string;
	timeZone: string | null;
	/** Minutes east of UTC, including the current daylight-saving offset. */
	utcOffsetMinutes: number;
	/** OS/WebView hint only, never a claim that sync or a model endpoint is reachable. */
	networkHint: "online" | "offline" | "unknown";
};
export type ReaderImageTransform = {
	scale: number;
	rotation: number;
	panX: number;
	panY: number;
};
export type ReaderImageSnapshot = ReaderImageTransform & {
	id: string;
	bookId: string;
	sessionId: string;
	revision: number;
};
export type ReaderImageAction = {
	action: "zoom-in" | "zoom-out" | "rotate" | "reset" | "close";
} | {
	action: "pan";
	dx: number;
	dy: number;
};
export type ReaderImageRequest = ReaderImageAction & {
	id: string;
};
export type ReaderImageReceipt = {
	status: "updated";
	snapshot: ReaderImageSnapshot;
} | {
	status: "closed";
	id: string;
};
export type ReaderImageOpenReceipt = {
	status: "opened";
	snapshot: ReaderImageSnapshot;
} | {
	status: "not-opened";
	reason: "missing" | "external" | "unsupported";
};
/** Navigation TOC order is not the extracted-text chapter index or printed numbering. */
export type BookTocEntry = {
	id: string;
	label: string;
	ordinal: number;
	sectionIndex: number | null;
	location: ReadingLocation | null;
	children: BookTocEntry[];
};
export type BookNavigationToc = {
	bookId: string;
	contentVersion: string;
	entries: BookTocEntry[];
};
export type BookLocationSearch = {
	bookId: string;
	query: string;
	matchCase?: boolean;
	wholeWords?: boolean;
	limit?: number;
	cursor?: string;
	contentVersion?: string;
	/** When supplied, only the sections resolved by these hrefs are searched. */
	hrefs?: string[];
};
export type BookLocationHit = {
	id: string;
	sectionIndex: number;
	excerpt: {
		pre: string;
		match: string;
		post: string;
	};
	location: ReadingLocation;
	/** Exact text identity usable by library.readRange without moving the reader. */
	range: BookTextRange;
};
export type BookLocationSearchPage = {
	bookId: string;
	contentVersion: string;
	hits: BookLocationHit[];
	nextCursor: string | null;
	/** Partial means no text found yet, but unscanned or unsupported sections remain. */
	textStatus: "available" | "textless" | "unsupported" | "unsearched" | "partial";
	scannedSections: number;
	totalSections: number;
};
export type BookNavigationTargetsQuery = {
	bookId: string;
	contentVersion: string;
	kind: "sections" | "pages";
	offset?: number;
	limit?: number;
	/** Exact source page label, not a page index. Duplicate labels remain separate results. */
	label?: string;
};
export type BookNavigationTargetEntry = {
	index: number;
	sectionIndex: number | null;
	label: string | null;
	labelTruncated: boolean;
	linear: boolean | null;
	location: ReadingLocation | null;
};
export type BookNavigationTargetsPage = {
	bookId: string;
	contentVersion: string;
	kind: "sections" | "pages";
	status: "available" | "absent";
	items: BookNavigationTargetEntry[];
	total: number;
	nextOffset: number | null;
};
export type BookReference = {
	bookId: string;
	contentVersion: string;
	sectionIndex: number;
	index: number;
};
export type BookReferencesQuery = {
	bookId: string;
	contentVersion: string;
	sectionIndex: number;
	offset?: number;
	limit?: number;
};
export type BookReferencesPage = {
	bookId: string;
	contentVersion: string;
	sectionIndex: number;
	status: "available" | "unsupported";
	items: {
		reference: BookReference;
		label: string;
		kind: "link" | "inline-note";
	}[];
	total: number;
	nextOffset: number | null;
};
export type BookReferenceQuery = {
	reference: BookReference;
	offset?: number;
	limit?: number;
};
export type BookReferencePreview = {
	reference: BookReference;
	status: "resolved" | "external" | "blocked" | "missing" | "unsupported";
	label: string;
	/** Only a resolved internal target; never an untrusted href to execute. */
	location?: ReadingLocation;
	/** HTTP(S) only; returned for inspection, never fetched or opened by this query. */
	url?: string;
	text: string;
	offset: number;
	totalLength: number;
	nextOffset: number | null;
};
export type BookImageRef = BookReference;
export type BookImagesQuery = BookReferencesQuery;
export type BookImageQuery = {
	image: BookImageRef;
};
export type BookImage = {
	image: BookImageRef;
	alt: string;
	location?: ReadingLocation;
};
export type BookImagesPage = {
	bookId: string;
	contentVersion: string;
	sectionIndex: number;
	status: "available" | "unsupported";
	items: BookImage[];
	total: number;
	nextOffset: number | null;
};
export type BookImageResource = {
	status: "ready";
	image: BookImage;
	resource: ResourceRef;
} | {
	status: "missing" | "external" | "unsupported";
	image: BookImage;
};
export type ReaderReferencePreviewReceipt = {
	status: "opened";
	id: string;
	sessionId: string;
	preview: BookReferencePreview;
} | {
	status: "not-opened";
	preview: BookReferencePreview;
};
export type ReaderReferenceCloseReceipt = {
	status: "closed" | "not-current";
	id: string;
};
export interface ChapterHit {
	chapterIndex: number;
	chapterTitle?: string;
	snippet: string;
	offset: number;
	match: "exact" | "partial";
}
/** Derived prose, not an engine Location or a renderable Range. */
export type BookTextHit = ChapterHit & {
	bookId: Id;
};
export interface BookTextSearch {
	/** 1-12 nonblank, case-sensitive variants, at most 1024 characters each. */
	queries: string[];
	/** Omit to scan only locally persisted indexes across the shelf. */
	bookId?: string;
	/** Inclusive chapter ceiling; -1 searches no chapters. Requires bookId. */
	throughChapterIndex?: number;
	/** 1-100, default 16. This caps results, not total scanning work. */
	limit?: number;
}
/** Canonical product settings vocabulary shared by UI, agent, and plugins. */
export type SettingsSection = "general" | "shelf" | "shortcuts" | "appearance" | "reading" | "annotations" | "ai" | "menus" | "sync" | "plugins";
/** Values that can cross the generic settings domain boundary. */
export type SettingValue = string | number | boolean | null | string[];
export type SettingKind = "boolean" | "enum" | "string" | "integer" | "number" | "id-list" | "key-chord";
export interface SettingOption {
	value: SettingValue;
	label: string;
	source?: "builtin" | "plugin" | "system" | "user";
	pluginName?: string;
	polarity?: "light" | "dark";
}
export type SettingsTarget = {
	kind: "global";
} | {
	kind: "all-books";
} | {
	kind: "book";
	bookId: string;
};
export type SettingsQueryTarget = Exclude<SettingsTarget, {
	kind: "all-books";
}>;
export interface SettingDescriptor {
	path: string;
	section: SettingsSection;
	label: string;
	description?: string;
	kind: SettingKind;
	value: SettingValue;
	writable: boolean;
	/** Present for reader preferences. Global is a source layer, not proof of a persisted override. */
	reading?: {
		source: "global" | "book";
		override: "absent" | "active" | "inactive";
		defaultValue: SettingValue;
	};
	nullable?: boolean;
	options?: SettingOption[];
	/** Runtime plugin catalog. options() may invoke its registered provider. */
	dynamicOptions?: boolean;
	supportedTargets?: Array<SettingsTarget["kind"]>;
	/** Read-only metadata for key-chord values. Null writes restore the default. */
	shortcut?: {
		defaultBinding: string[] | null;
		overridden: boolean;
		available: boolean;
		/** Binding is suspended even when conflicting paths are hidden by grants. */
		conflicted: boolean;
		conflicts: string[];
	};
}
export type SettingCatalogEntry = Omit<SettingDescriptor, "value" | "reading">;
export interface SettingReadResult {
	path: string;
	value: SettingValue;
	target: SettingsQueryTarget;
	reading?: SettingDescriptor["reading"];
}
/** Exact paths or an explicit `section.*` group. `*` means every path. */
export type SettingsPathPattern = string;
export interface SettingsAccessPolicy {
	discover?: readonly SettingsPathPattern[];
	read?: readonly SettingsPathPattern[];
	write?: readonly SettingsPathPattern[];
}
export interface SettingsOverrideSummary {
	target: {
		kind: "book";
		bookId: string;
	};
	paths: string[];
}
export interface SettingsQuery {
	section?: SettingsSection;
	target?: SettingsQueryTarget;
}
/** Settings 1.8: explicit, bounded option discovery, including installed fonts. */
export interface SettingsOptionsQuery {
	path: string;
	target?: SettingsQueryTarget;
	search?: string;
	offset?: number;
	limit?: number;
	/** Required after the first page. Catalog changes require restarting at zero.
	 * Dynamic plugin pages pin a 60-second result snapshot, not the settings revision. */
	revision?: number;
}
export interface SettingsOptionsPage {
	path: string;
	revision: number;
	options: SettingOption[];
	total: number;
	offset: number;
	nextOffset: number | null;
}
export interface SettingsSnapshot {
	/** Process-local catalog/value revision. Not a sync clock or durable event sequence. */
	revision: number;
	target: SettingsQueryTarget;
	settings: SettingDescriptor[];
	overrides: SettingsOverrideSummary[];
}
export type SettingsObservationCause = {
	source: "initial" | "local" | "remote" | "restore" | "catalog" | "mixed";
	/** Null for legacy writes, remote origin unknown, catalog changes, or coalesced actors. */
	origin: EventOrigin | null;
};
export type SettingsObservation = SettingsObservationCause & ({
	status: "ready";
	snapshot: SettingsSnapshot;
} | {
	status: "error";
	revision: number;
	code: string;
});
export interface SettingChange {
	path: string;
	value: SettingValue;
	target?: SettingsTarget;
}
export interface SettingsUpdateResult {
	/** Returned only after the entire validated settings command commits locally. */
	changed: SettingChange[];
	settings: SettingsSnapshot;
}
export interface SettingsChangedEvent {
	type: "settings.changed";
	origin: EventOrigin;
	changes: SettingChange[];
}
/** Whole reader-preference bundle, matching the host's per-book override model. */
export type ReadingSettingsReset = {
	action: "defaults";
	target: SettingsTarget;
} | {
	action: "inherit";
	target: Exclude<SettingsTarget, {
		kind: "global";
	}>;
};
/** Source metadata only: querying this never parses, downloads or invokes a provider. */
export type BookContentState = {
	bookId: string;
	source: "file" | "virtual";
	availability: "local" | "missing" | "provider-registered" | "provider-unavailable";
	/** Opaque process-local equality token. Compare with a ready reading session's
	 * sourceRevision; this is neither a durable locator nor a write/CAS token. */
	sourceRevision: string;
	/** Local file hash when known; virtual content is not loaded just to hash it. */
	contentVersion: string | null;
};
export type BookContentObservation = {
	status: "ready";
	snapshot: BookContentState;
} | {
	status: "error";
	errorCode: string;
};
/** Outcome for a plugin's own proposal, not a memory record or a durable receipt. */
export type MemoryCandidateOutcome = {
	status: "saved";
} | {
	status: "rejected";
	reason: "invalid" | "scope" | "duplicate" | "limit";
} | {
	status: "skipped";
	reason: "cancelled" | "provider-unavailable" | "prior-failure";
} | {
	status: "failed";
	errorCode: string;
};
export interface MemoryCandidateReceipt {
	requestId: string;
	results: Array<{
		index: number;
		outcome: MemoryCandidateOutcome;
	}>;
	/** Proposals beyond the per-provider budget, not inspected or persisted. */
	discarded: number;
}
/** Durable names are scoped to one plugin ID; opening creates a new ephemeral
 * ResourceRef owned by the current activation. No filesystem/blob IDs escape. */
export type PluginAsset = {
	key: string;
	revision: string;
	name: string;
	mimeType: string;
	size: number;
	updatedAt: string;
};
export type PluginAssetQuery = {
	limit?: number;
	after?: string;
};
/** Key-ordered pagination, not an immutable multi-page snapshot. */
export type PluginAssetPage = {
	items: PluginAsset[];
	nextAfter: string | null;
};
export type PluginAssetWrite = {
	key: string;
	expectedRevision: string | null;
	name?: string;
};
export type PluginAssetReceipt = {
	asset: PluginAsset;
	cleanupPending: boolean;
};
export type PluginAssetPolicy = {
	storage: "local";
	backup: "complete";
	uninstall: "delete";
	maxAssets: number;
	maxBytes: number;
	maxAssetBytes: number;
	usedAssets: number;
	usedBytes: number;
};
/** Only local semantic mutations can join a transaction. External I/O, import,
 * deletion of book files and arbitrary plugin callbacks are not atomic verbs. */
export type AtomicOperation = {
	kind: "book.metadata";
	bookId: string;
	patch: {
		title?: string;
		author?: string;
	};
} | {
	kind: "settings";
	changes: SettingChange[];
} | {
	kind: "document.put";
	collection: string;
	id: string;
	bookId: string | null;
	data: unknown;
	anchor?: string;
	expectedRevision?: string | null;
} | {
	kind: "document.delete" | "document.check";
	collection: string;
	id: string;
	expectedRevision?: string | null;
};
export type AtomicPreview = {
	id: string;
	expiresAt: string;
	operations: AtomicOperation[];
	before: unknown[];
	undoOf?: string;
};
export type AtomicReceipt = {
	id: string;
	committed: true;
	undoOf?: string;
};
export type DurableJobStep = {
	id: string;
} & ({
	kind: "transaction";
	operations: AtomicOperation[];
} | {
	kind: "library.text.prepare";
	bookId: string;
	options?: BookTextPrepareOptions;
} | {
	kind: "book.graph";
	bookId: string;
	mode: "catch-up" | "rebuild";
	options?: BookGraphTaskOptions;
});
export type DurableJobPlan = {
	title: string;
	steps: DurableJobStep[];
};
export type DurableJobStatus = "queued" | "running" | "paused" | "needs-attention" | "completed" | "failed" | "cancelled";
export type DurableJobSnapshot = {
	id: string;
	title: string;
	revision: string;
	status: DurableJobStatus;
	totalSteps: number;
	completedSteps: number;
	activeStep: Pick<DurableJobStep, "id" | "kind"> | null;
	errorCode: string | null;
	createdAt: string;
	updatedAt: string;
};
export type DurableJobControl = "pause" | "resume" | "cancel";
declare const CHANGE_AREAS: readonly [
	"library",
	"reading",
	"annotations",
	"conversations",
	"memory",
	"settings",
	"documents"
];
export type ChangeArea = (typeof CHANGE_AREAS)[number];
export type ChangesQuery = {
	areas: ChangeArea[];
	bookId?: string;
	settingsPaths?: string[];
	collection?: string;
};
/** Conservative invalidations only: read current authorized state through its
 * ordinary domain API. Neither event payloads nor deleted values are exposed. */
export type ChangeNotice = {
	areas: ChangeArea[];
	bookId?: string;
	collection?: string;
	id?: string;
};
export type ChangesPage = {
	changes: ChangeNotice[];
	cursor: string;
	hasMore: boolean;
};
/** The small reader contract used by the paged search helper. */
export type BookLocationSearchPageReader = (input: BookLocationSearch, options?: {
	signal?: AbortSignal;
}) => Promise<BookLocationSearchPage>;
export type BookLocationSearchProgress = {
	scannedSections: number;
	totalSections: number;
	hitCount: number;
	contentVersion: string | null;
};
export type BookLocationSearchRunStatus = "completed" | "scan-limit" | "result-limit" | "timed-out" | "cancelled" | "stale";
export type BookLocationSearchRun = {
	status: BookLocationSearchRunStatus;
	bookId: string;
	contentVersion: string | null;
	hits: BookLocationHit[];
	scannedSections: number;
	totalSections: number;
	textStatus: BookLocationSearchPage["textStatus"];
};
export type BookLocationSearchRunOptions = {
	signal?: AbortSignal;
	maxSections?: number;
	maxHits?: number;
	maxExcerptBytes?: number;
	timeoutMs?: number;
	onProgress?: (progress: BookLocationSearchProgress) => void | Promise<void>;
};
/**
 * Consume location pages as one activation-scoped bounded operation.
 * Pages are never fetched concurrently and no state is persisted. Section
 * limits are checked between pages: a reader may finish one page above the
 * requested boundary, and a terminal page is still completed when it has no
 * continuation.
 */
declare function searchAllBookLocations(reader: BookLocationSearchPageReader, input: BookLocationSearch, options?: BookLocationSearchRunOptions): Promise<BookLocationSearchRun>;
/** Runtime validation list, derived from the canonical capability catalogs. */
declare const PLUGIN_PERMISSIONS: readonly PluginPermission[];
export type PluginCapabilityRequirements = {
	domains?: Partial<Record<DomainId, string>>;
	contributions?: Partial<Record<ContributionId, string>>;
	services?: Partial<Record<HostServiceId, string>>;
	schemas?: Partial<Record<DeclarativeSchemaId, string>>;
};
export type PluginCapabilityView = {
	domains: Partial<Record<DomainId, string>>;
	contributions: Partial<Record<ContributionId, string>>;
	services: Partial<Record<HostServiceId, string>>;
	schemas: Partial<Record<DeclarativeSchemaId, string>>;
};
/**
 * User granted book scope for a plugin activation. `all` is the legacy
 * domain-level grant; `current` follows the book and session currently held
 * by the reader; `book` names one stable library object.
 *
 * This is host authority, not a manifest declaration. A plugin cannot widen
 * it by passing a different book id, range, cursor, resource id, or observer
 * query.
 */
export type PluginBookAccess = {
	mode: "all";
} | {
	mode: "current";
} | {
	mode: "book";
	bookId: string;
};
export type PluginNetworkAccess = {
	/** Exact HTTP(S) origins (scheme/host/port), or ["*"] for all HTTP(S) origins.
	 * No paths, subdomain globs, credentials or fragments. At most 32 entries. */
	origins: string[];
};
export type PluginNetworkStream = {
	/** Opaque, non-persistent response owned by this activation only. */
	id: string;
	status: number;
	statusText: string;
	url: string;
	redirected: boolean;
	headers: [
		string,
		string
	][];
	/** Absolute deadline for headers and all subsequent reads, not refreshed by activity. */
	expiresAt: number;
};
export type PluginNetworkChunk = {
	offset: number;
	bytes: ArrayBuffer;
	/** EOF releases the response. The final non-empty chunk may precede an empty EOF read. */
	done: boolean;
};
export type PluginManifest = {
	/** Directory name and namespace: lowercase, digits, hyphens. */
	id: string;
	name: string;
	version: string;
	/**
	 * Version of this plugin's private KV and document data. The host records
	 * the last committed value separately from plugin-owned storage and invokes
	 * migrate() before a different version becomes active.
	 */
	schemaVersion: number;
	description?: string;
	author?: string;
	/** Lowest app version the plugin supports, e.g. "0.3.0". */
	minAppVersion?: string;
	/** Exact host capability contracts and semver ranges this plugin needs. */
	requires: PluginCapabilityRequirements;
	permissions?: PluginPermission[];
	/** Exact Settings Domain paths, or an explicit `section.*` group. */
	settingsAccess?: SettingsAccessPolicy;
	/** Network 2.0. Missing/empty means no arbitrary HTTP requests, even with
	 * service:network. Fixed-purpose host actions retain their own authorization.
	 * Disclosed on install/update; requires a network >=2 capability range. */
	networkAccess?: PluginNetworkAccess;
	/** Entry module relative to the plugin folder. Defaults to "main.js". */
	main?: string;
	/**
	 * Declarative settings: rendered by the app from the Plugins panel; edits
	 * write through as one object under the plugin's storage key `settings`
	 * (read with `ctx.services.storage.get("settings")`).
	 *
	 * Nothing is stored until the first save, so `get("settings")` starts as
	 * null; declared `value`s are only what the form shows. A save from the
	 * settings page writes every non-secret field; the agent and the settings
	 * domain merge one field at a time (null resets it). Merge your defaults
	 * over whatever is stored.
	 */
	settings?: PluginFormField[];
	/**
	 * Declarative schedules (shown at install and in the Plugins panel). The
	 * host runs each one AT LEAST every `everyMinutes` while the app is open,
	 * with a catch-up run at launch when overdue — never an exact-time
	 * guarantee, and nothing runs while the app is closed. The plugin binds
	 * the actual work at activate() via `ctx.services.schedules.bind(id, run)`.
	 */
	schedules?: PluginScheduleDeclaration[];
	/** Plugins 1.8: explicit versioned module service exports, executed with shared authority. */
	services?: PluginServiceDeclaration[];
	/**
	 * Declarative themes (`ui:themes`). Registered while the plugin is enabled;
	 * they appear alongside the built-in choices in Settings → Appearance
	 * (app part) and the reader's page-color control (reader part), and apply
	 * only when the user selects them. Purely data — the host generates and
	 * injects all CSS.
	 */
	themes?: PluginThemeContribution[];
	/**
	 * Font faces bundled with the plugin (`ui:themes`), served from the plugin
	 * folder. Each becomes a `plugin:<pluginId>:<fontId>` entry in the reader's
	 * font picker; a theme's typography defaults may reference its own fonts
	 * as `plugin:<fontId>`.
	 */
	fonts?: PluginFontContribution[];
};
/** One selectable voice a provider offers. */
export type PluginVoice = {
	/** Unique within the provider. */
	id: string;
	label: PluginText;
	/** BCP-47 tags this voice speaks well — informational, shown in pickers. */
	languages?: string[];
};
/**
 * A text-to-speech engine for the reader's read-aloud. The plugin only turns
 * text into ENCODED AUDIO BYTES (mp3/wav/ogg — anything the webview can
 * decode); the host owns playback, sentence pacing, prefetch, and the
 * follow-along highlight, and falls back to the system voice when a call
 * fails. Voices are listed once at registration and re-listed when the
 * plugin's settings change.
 */
export type PluginVoiceProvider = {
	id: string;
	/** Provider name shown alongside its voices in the voice picker. */
	label: PluginText;
	listVoices(): PluginVoice[] | Promise<PluginVoice[]>;
	synthesize(input: {
		text: string;
		voiceId: string;
	}): Promise<ArrayBuffer | Uint8Array>;
};
/** The floor the host clamps `everyMinutes` to. */
declare const MIN_SCHEDULE_MINUTES = 15;
export type PluginScheduleDeclaration = {
	/** Unique within the plugin: lowercase letters, digits, hyphens. */
	id: string;
	/** Shown at install time and in the Plugins panel. */
	label: string;
} & ({
	everyMinutes: number;
	mode?: never;
} | {
	mode: "deferred";
	everyMinutes?: never;
});
/**
 * Whether a theme reads as light or dark. Drives everything polarity-keyed in
 * the host: `color-scheme`, the dark token defaults an app theme inherits for
 * tokens it leaves unset, the `dark:` styling variant, and how the reader's
 * "auto" page color resolves while the theme is active.
 */
export type PluginThemePolarity = "light" | "dark";
/**
 * A color in one of the strict grammars the host accepts: `#rgb[a]` /
 * `#rrggbb[aa]` hex, or `rgb()` / `rgba()` / `hsl()` / `hsla()` with numeric
 * bodies only. Anything else — keywords, `var()`, `url()`, gradients — is
 * rejected at manifest validation. The grammar is the injection boundary:
 * these values end up inside host-generated stylesheets.
 */
export type PluginThemeColor = string;
/**
 * The app-chrome token vocabulary a theme may override. Every key is optional:
 * unset tokens keep the host's own values for the theme's polarity, so a
 * near-default theme only states its differences. This vocabulary is a
 * long-term contract (only ever extended, never renamed).
 */
export type PluginAppThemeTokens = {
	/** The app canvas. */
	paper?: PluginThemeColor;
	/** Hairline borders. */
	border?: PluginThemeColor;
	/** Primary text. */
	fg?: PluginThemeColor;
	/** Secondary text. */
	fgMuted?: PluginThemeColor;
	/** Tertiary/disabled text. */
	fgSubtle?: PluginThemeColor;
	/** Text on inverted (fg-colored) surfaces. */
	inverseFg?: PluginThemeColor;
	/** Raised surfaces: cards, dialogs, inputs. */
	surface?: PluginThemeColor;
	/** Quiet fills: hovers, wells, code spans. */
	fill?: PluginThemeColor;
	/** Stronger fills: active states, tracks. */
	fillStrong?: PluginThemeColor;
	/** Emphasized borders. */
	borderStrong?: PluginThemeColor;
	/** The main content surface behind panels. */
	mainSurface?: PluginThemeColor;
	/** Overlay scrollbar thumbs. */
	scrollbar?: PluginThemeColor;
};
/**
 * The six-color palette a reader theme paints book pages with — the same
 * vocabulary the built-in light/warm/dark page colors use. All six are
 * required: book pages have no polarity fallback to inherit from.
 */
export type PluginReaderPalette = {
	/** Page background. */
	bg: PluginThemeColor;
	/** Body text. */
	text: PluginThemeColor;
	/** Text selection background. */
	selection: PluginThemeColor;
	/** Rules and table borders. */
	rule: PluginThemeColor;
	/** Quiet fills (code blocks, inline code). */
	faint: PluginThemeColor;
	/** De-emphasized ink: link underlines, list markers, captions. */
	muted: PluginThemeColor;
};
export type PluginReaderFontSize = "xx-small" | "x-small" | "small" | "medium" | "large" | "x-large" | "xx-large" | "xxx-large";
export type PluginReaderFontWeight = "light" | "regular" | "medium" | "semibold" | "bold" | "extra-bold" | "black";
export type PluginReaderLineSpacing = "compact" | "comfortable" | "relaxed";
export type PluginReaderParagraphSpacing = "tight" | "normal" | "loose";
/**
 * Typography a reader theme suggests. Applied as a one-shot preset when the
 * user SELECTS the theme — seeding the ordinary reader settings, which the
 * user can then adjust freely (re-selecting the theme re-applies). Never a
 * live constraint.
 *
 * `fontFamily` accepts `plugin:<fontId>` (a font this manifest declares),
 * `curated:<id>` (a host curated font), or `system:<family>`.
 */
export type PluginReaderTypographyDefaults = {
	fontFamily?: string;
	fontSize?: PluginReaderFontSize;
	fontWeight?: PluginReaderFontWeight;
	lineSpacing?: PluginReaderLineSpacing;
	paragraphSpacing?: PluginReaderParagraphSpacing;
};
/**
 * One named theme. The two mount points are independent and optional — a
 * theme may skin only the app chrome, only the book page, or both; each part
 * is offered only on the surface it targets.
 */
export type PluginThemeContribution = {
	/** Theme id within the plugin: lowercase, digits, hyphens. */
	id: string;
	/** Display name in the theme pickers. */
	name: PluginText;
	polarity: PluginThemePolarity;
	/** App-chrome token overrides (Settings → Appearance). */
	app?: PluginAppThemeTokens;
	/** Book-page palette and optional typography preset (reader page color). */
	reader?: {
		palette: PluginReaderPalette;
		typography?: PluginReaderTypographyDefaults;
	};
};
/**
 * One font face file inside the plugin folder. `path` is folder-relative
 * (forward slashes, `[A-Za-z0-9._-]` segments, no leading dots) and must end
 * in `.woff2`, `.woff`, `.ttf`, or `.otf`.
 */
export type PluginFontFile = {
	path: string;
	/** CSS numeric weight of this face. Defaults to 400. */
	weight?: number;
	/** Defaults to "normal". */
	style?: "normal" | "italic";
	/** Optional `unicode-range` for split/subset files. */
	unicodeRange?: string;
};
/**
 * A font bundled with the plugin. Its faces are served straight from the
 * plugin folder (no download step); the host writes the `@font-face` rules
 * and lists the family in the reader's font picker while the plugin is
 * enabled.
 */
export type PluginFontContribution = {
	/** Font id within the plugin: lowercase, digits, hyphens. */
	id: string;
	/** CSS font-family name; also the picker label. */
	family: string;
	/** Chooses the generic fallback stack appended after the family. */
	kind?: "sans" | "serif" | "cjk";
	files: PluginFontFile[];
};
/** Returned by every `register*`/`on` call; disposing removes the contribution. */
export type PluginDisposable = {
	dispose: () => void;
};
/** A contribution handle bound to a live event delivery. Await retirement to
 * observe host rejection or registration retirement across the Worker boundary;
 * already-started provider cleanup still follows the activation drain contract. */
export type PluginEventRegistration<T extends PluginDisposable> = Omit<T, "dispose"> & {
	dispose(): Promise<void>;
};
export type PluginMarkdownView = {
	kind: "markdown";
	title?: string;
	markdown: string;
};
/** An app-rendered action. Plugins provide behavior and content, never UI. */
export type PluginAction = {
	id: string;
	label: string;
	/** Icon name from the curated Phosphor set. */
	icon?: string;
	variant?: "solid" | "outline" | "ghost" | "danger";
	/**
	 * Where a view-level toolbar places the action. `primary` actions render
	 * inline as labeled buttons; `secondary` ones fold into the host's "More"
	 * menu. Unset actions fill the remaining inline slots in declaration order
	 * (a `solid` action counts as primary), so a view should mark at most two
	 * actions primary and leave housekeeping such as refresh secondary. A lone
	 * overflow action renders inline at its declaration position — the menu
	 * never holds a single action.
	 */
	priority?: "primary" | "secondary";
	/**
	 * Views 1.12: render the action inert. For a control whose availability the
	 * plugin knows when it builds the view (history that cannot go back yet), so
	 * the row keeps its shape instead of the control appearing and vanishing.
	 */
	disabled?: boolean;
	run: () => PluginViewResult | Promise<PluginViewResult>;
};
export type PluginListAccessory = {
	kind: "text";
	text: string;
} | {
	kind: "tag";
	text: string;
} | {
	kind: "icon";
	icon: string;
	label?: string;
};
export type PluginListItem = {
	id: string;
	title: string;
	subtitle?: string;
	/** ISO timestamp used by the host timeline, never formatted by the plugin. */
	timestamp?: string;
	/** Icon name from the curated Phosphor set. */
	icon?: string;
	/** Additional terms used by the host's built-in filtering. */
	keywords?: string[];
	/** Quiet, host-rendered values at the trailing edge of the item. */
	accessories?: PluginListAccessory[];
	/** Open returned views in-place or in a host-owned modal Dialog. */
	presentation?: "push" | "dialog";
	/** Optional drill-down: return `{ view }` for the selected item. */
	onSelect?: () => PluginViewResult | Promise<PluginViewResult>;
};
/** Plugin-owned pages, including cursor sources with no known page count.
 * Callbacks return the complete containing view; navigation defaults to replace.
 * No speculative fetch, accumulation, or data-source access is performed by the host. */
export type PluginViewPagination = {
	/** One-based display page. */
	page: number;
	pageCount?: number;
	/** Omit a callback when that direction is unavailable. */
	onPrevious?: () => PluginViewResult | Promise<PluginViewResult>;
	onNext?: () => PluginViewResult | Promise<PluginViewResult>;
};
/**
 * Views 1.12: a search box whose results the PLUGIN computes — for lists
 * where matching is not a substring test over the supplied rows: a go-to box
 * that reads "42" as chapter 42 and page 42, or a query that reaches data
 * outside the current page. The host owns the input: it renders the field,
 * debounces typing, keeps the typed text across pushed views and back
 * navigation, and drops out-of-order answers, so the plugin only maps a query
 * to rows. Enter activates the first row that has `onSelect`.
 */
export type PluginListSearch = {
	placeholder?: string;
	/** Focus the field when the list mounts; for panels whose whole purpose is the box. */
	autoFocus?: boolean;
	/**
	 * Called with the trimmed text after typing settles (and with "" when the
	 * box is cleared). Return `{ view }` with the complete list for that text:
	 * it replaces this frame's CONTENT in place — the same lifecycle as a live
	 * update, so the field keeps its text, focus and caret — rather than
	 * navigating, and must therefore carry no `live` or `onClose`. Return null
	 * to keep what is shown. Other result fields (close, toast, navigation,
	 * fieldErrors) are rejected: a query is a read, not an action.
	 */
	onQuery: (query: string) => PluginViewResult | Promise<PluginViewResult>;
};
export type PluginListView = {
	kind: "list";
	title?: string;
	items: PluginListItem[];
	/** Host-rendered list-level actions; timelines place them after the tabs. */
	actions?: PluginAction[];
	/** Shown when `items` is empty. */
	emptyText?: string;
	/** Adds host-rendered local filtering over title, subtitle, and keywords. */
	searchable?: boolean;
	searchPlaceholder?: string;
	/** Plugin-computed search (views 1.12). Exclusive with `searchable`. */
	search?: PluginListSearch;
	/**
	 * Sort and group items by `timestamp`, with host-owned Today / This week /
	 * This month / All tabs. Search is debounced by the host.
	 */
	timeline?: boolean;
	/** Search and timeline filters apply only to items on this supplied page. */
	pagination?: PluginViewPagination;
};
export type PluginTableColumn = {
	id: string;
	label: string;
	align?: "start" | "end";
	/** Requires the table's sort controller. */
	sortable?: boolean;
};
export type PluginTableSort = {
	column: string;
	direction: "ascending" | "descending";
};
export type PluginTableRow = {
	id: string;
	/** Accessible name for the row's open command. */
	label: string;
	/** Exactly one plain-text, finite-number, or null cell for each declared column. */
	cells: Record<string, string | number | null>;
	presentation?: "push" | "dialog";
	onSelect?: () => PluginViewResult | Promise<PluginViewResult>;
};
/** A semantic, horizontally scrollable table: 1-16 columns and at most 200 rows
 * per snapshot. Use pagination for larger datasets. No HTML or custom cell renderers. */
export type PluginTableView = {
	kind: "table";
	title?: string;
	columns: PluginTableColumn[];
	rows: PluginTableRow[];
	actions?: PluginAction[];
	emptyText?: string;
	pagination?: PluginViewPagination;
	/** Plugin owns dataset-wide ordering and returns the complete containing view.
	 * The host never sorts only the visible page. Navigation defaults to replace. */
	sort?: {
		value?: PluginTableSort;
		onChange: (sort: PluginTableSort) => PluginViewResult | Promise<PluginViewResult>;
	};
};
export type PluginTreeNode = {
	/** Unique throughout this tree snapshot, not just among siblings. */
	id: string;
	title: string;
	subtitle?: string;
	icon?: string;
	/** Supplied children only. Expanding never fetches data or invokes plugin code. */
	children?: PluginTreeNode[];
	presentation?: "push" | "dialog";
	onSelect?: () => PluginViewResult | Promise<PluginViewResult>;
};
/** Bounded hierarchy: at most 500 nodes including collapsed descendants, 12
 * levels. Expansion and keyboard focus belong to the mounted host frame.
 * Use pagination/actions to load another complete snapshot, not hidden IO. */
export type PluginTreeView = {
	kind: "tree";
	/** Required accessible name, also used as the root view heading. */
	title: string;
	nodes: PluginTreeNode[];
	/** Initial expansion for each mounted frame; must name populated branches.
	 * Live updates retain local expansion for surviving IDs. */
	expandedIds?: string[];
	actions?: PluginAction[];
	emptyText?: string;
	pagination?: PluginViewPagination;
};
/** Host-decoded preview of this activation's sealed resource. No URL, path,
 * data URI, HTML or original book file. PNG/JPEG/GIF/BMP/WebP raster inputs;
 * preview is a static PNG, at most 2048 px per edge, without upscaling. */
export type PluginImageView = {
	kind: "image";
	resourceId: string;
	title?: string;
	/** Required alternative text; empty explicitly marks a decorative image. */
	alt: string;
	caption?: string;
	/** Stable display box ratio, 0.25..4, default 4/3; image always fits uncropped. */
	aspectRatio?: number;
};
/**
 * A bounded plain-text editor. The host owns the draft and its explicit
 * save/cancel controls; `revision` is an opaque value the consumer must pass
 * back to its conditional write. This is deliberately not rich text and does
 * not expose React, HTML, DOM, or storage access to a plugin.
 */
export type PluginEditorView = {
	kind: "editor";
	title?: string;
	label: PluginText;
	value: string;
	/** Non-empty opaque revision captured with `value`; never interpreted by the host. */
	revision: string;
	/** UTF-16 code-unit limit enforced by the host; at most 100,000. */
	maxLength: number;
	saveLabel?: PluginText;
	cancelLabel?: PluginText;
	/** Called only after an explicit save, with the captured revision. */
	onSave: (value: string, revision: string) => PluginViewResult | Promise<PluginViewResult>;
	/** Optional cancellation navigation. The host discards the draft first. */
	onCancel?: () => PluginViewResult | Promise<PluginViewResult>;
};
/**
 * Shared field attributes. `agentHidden` keeps a declared setting out of the
 * reading agent's settings catalog (the Plugins panel still shows it); text
 * fields with `inputMode: "password"` are agent-hidden automatically — and
 * real credentials belong in `ctx.services.secrets`, not in settings at all.
 *
 * `visibleWhen` renders the field only while another field of the same form
 * holds one of the given values (compared as strings). Hidden fields keep
 * their stored values — this is how one settings object carries a value set
 * per variant (e.g. one voice per TTS provider) without the variants
 * overwriting each other.
 *
 * Every user-visible string on a field (`label`, `helperText`,
 * `placeholder`, `description`, option labels) is a `PluginText`: a plain
 * string, or a localized bundle resolved against the app language.
 */
export type PluginFormFieldBase = {
	agentHidden?: boolean;
	visibleWhen?: {
		field: string;
		equals: string | string[];
	};
};
/** One option of a select/choice field. */
export type PluginSelectOption = {
	value: string;
	label: PluginText;
};
export type PluginFormField = PluginFormFieldBase & ({
	kind: "text";
	id: string;
	label: PluginText;
	value?: string;
	placeholder?: PluginText;
	helperText?: PluginText;
	inputMode?: "text" | "email" | "url" | "password";
} | {
	kind: "textarea";
	id: string;
	label: PluginText;
	value?: string;
	placeholder?: PluginText;
	helperText?: PluginText;
	rows?: number;
} | {
	/**
	 * A time of day, rendered as two host-owned dropdowns (hours,
	 * minutes) — never a text box: a typed time invites "7pm", locale
	 * ambiguity, and half-finished states, none of which a plugin should
	 * have to parse. The stored value is always 24-hour `HH:MM`.
	 */
	kind: "time";
	id: string;
	label: PluginText;
	/** `HH:MM`, 24-hour. */
	value?: string;
	helperText?: PluginText;
	/** Minute granularity offered, 1–30. Defaults to 5. */
	minuteStep?: number;
} | {
	kind: "number";
	id: string;
	label: PluginText;
	value?: number;
	helperText?: PluginText;
	/** Stored values are finite numbers within min/max on every write path
	 * (the settings page enforces them in releases after 0.6.5; the agent always did). */
	min?: number;
	max?: number;
	/** Input increment only; stored values are not rounded to it. */
	step?: number;
} | {
	kind: "select";
	id: string;
	label: PluginText;
	value?: string;
	/** Static options; may be empty when `dynamicOptions` is set. */
	options: PluginSelectOption[];
	helperText?: PluginText;
	/**
	 * Options resolved at runtime instead of listed in the declaration —
	 * for lists only the plugin can know (an account's voices, what a
	 * local endpoint serves). Declared settings bind the source via
	 * `ctx.contributions.settingsOptions.register`; a plugin-authored form view carries
	 * it as `resolveOptions`. While the source yields options the field
	 * renders as a select (the stored value is kept selectable even when
	 * the list no longer contains it); when it errors or yields none, the
	 * field falls back to a free text input — a listing failure must
	 * never lock the user out of typing the value.
	 */
	dynamicOptions?: boolean;
	/**
	 * Whether the resolved list is a CATALOG — the default: a sample of an
	 * open set, so "Enter manually…" and the empty-list text fallback stay
	 * available — or the WHOLE set (`false`: every acceptable value is in
	 * the list, so typing one is meaningless and the escape hatch is
	 * dropped; an empty list then reads as "nothing to pick" rather than
	 * as an invitation to type). Set it to `false` only when the value is
	 * checked against a closed set the host owns — a theme, an installed
	 * font — never for a remote catalog that may be incomplete or briefly
	 * unreachable.
	 */
	allowManualEntry?: boolean;
} | {
	/**
	 * A credential field: host-rendered password input whose value lives in
	 * the ENCRYPTED secret store (`ctx.services.secrets`), never in the settings
	 * object, the KV, or the agent's settings catalog. `id` IS the secret
	 * key the plugin reads back (`ctx.services.secrets.get(id)`); lowercase letters,
	 * digits, `_`/`-`. The field shows configured/empty state and a clear
	 * affordance — it never echoes the stored value. Writes go through the
	 * form's `secrets` adapter: declared settings get it from the host; a
	 * plugin-authored form view may supply its own bound to `ctx.services.secrets`.
	 * A secret persists as soon as its input blurs, regardless of the
	 * form's `submitMode` — credentials never sit in form state waiting
	 * for a submit.
	 */
	kind: "secret";
	id: string;
	label: PluginText;
	placeholder?: PluginText;
	helperText?: PluginText;
} | {
	kind: "toggle";
	id: string;
	label: PluginText;
	description?: PluginText;
	value?: boolean;
} | {
	kind: "checkbox";
	id: string;
	label: PluginText;
	description?: PluginText;
	value?: boolean;
} | {
	kind: "choice";
	id: string;
	label: PluginText;
	value?: string;
	options: {
		value: string;
		label: PluginText;
		icon?: string;
	}[];
});
export type PluginFormValues = Record<string, string | boolean | number>;
/**
 * Ordinary field drafts survive push/back within one host view session.
 * Root/live refreshes adopt unchanged defaults and preserve edited values.
 * Nested form identity is its structural path; fields use id and kind.
 * Replace/reset, removal or session disposal discard drafts. Password inputs
 * clear when their frame hides; secret fields never enter PluginFormValues.
 * This is in-memory editor state, not storage or a successful save receipt.
 */
export type PluginFormView = {
	kind: "form";
	title?: string;
	fields: PluginFormField[];
	/**
	 * `explicit` (default) renders a submit button. `change` writes through after
	 * each edit and omits that button, for forms that represent settings.
	 */
	submitMode?: "explicit" | "change";
	submitLabel?: string;
	onSubmit: (values: PluginFormValues) => PluginViewResult | Promise<PluginViewResult>;
	/**
	 * Option source for this form's `dynamicOptions` select fields. Called with
	 * the field's id and the form's CURRENT values (so a list may depend on a
	 * sibling field, e.g. an endpoint URL) when the field becomes visible and
	 * again when sibling values change. Declared settings forms get this wired
	 * by the host from `ctx.contributions.settingsOptions.register`.
	 */
	resolveOptions?: (fieldId: string, values: PluginFormValues) => PluginSelectOption[] | Promise<PluginSelectOption[]>;
	/**
	 * Storage adapter for this form's `secret` fields, keyed by field id.
	 * Declared settings forms get one from the host, bound to the plugin's
	 * encrypted secret namespace; a plugin-authored form may wire its own from
	 * `ctx.services.secrets`. Secret fields render disabled without an adapter.
	 */
	secrets?: {
		has(id: string): boolean | Promise<boolean>;
		set(id: string, value: string): void | Promise<void>;
		remove(id: string): void | Promise<void>;
	};
};
/**
 * The compositional view: an ordered sequence of blocks. This is the growth
 * path of the vocabulary — richer surfaces come from new block kinds, not
 * from plugins drawing their own UI. The single-kind views above remain as
 * shorthands for one-block pages.
 */
export type PluginBlocksView = {
	kind: "blocks";
	title?: string;
	blocks: PluginBlock[];
};
/**
 * A compact host-rendered control for a detail surface. Plugins declare the
 * options and behavior; the app owns the actual menu, focus behavior, and
 * visual treatment.
 */
export type PluginSelectControl = {
	kind: "select";
	id: string;
	label: string;
	value: string;
	icon?: string;
	options: {
		value: string;
		label: string;
	}[];
	onChange: (value: string) => PluginViewResult | Promise<PluginViewResult>;
};
export type PluginDetailControl = PluginSelectControl;
/** Host detail: primary content, contextual controls, actions, and metadata. */
export type PluginDetailView = {
	kind: "detail";
	title?: string;
	content: PluginBlock[];
	metadata?: PluginMetadataItem[];
	controls?: PluginDetailControl[];
	actions?: PluginAction[];
};
export type PluginMetadataItem = {
	kind: "label";
	label: string;
	value: string;
	icon?: string;
} | {
	kind: "tags";
	label: string;
	values: string[];
} | {
	kind: "divider";
};
export type PluginLayoutGap = "tight" | "normal" | "relaxed";
export type PluginBlock = 
/** Host-localized persistent failure. Raw error text is never rendered. Views >=1.2. */
{
	kind: "error";
	code: string;
} | {
	kind: "markdown";
	markdown: string;
}
/** Host typography; plugins choose semantic emphasis, never classes. */
 | {
	kind: "text";
	text: string;
	variant?: "body" | "caption" | "eyebrow" | "heading";
	tone?: "default" | "muted" | "subtle";
}
/** A section header: quiet eyebrow caption over an optional line of text. */
 | {
	kind: "heading";
	text: string;
	caption?: string;
}
/** A dictionary entry, rendered with the app's own dictionary UX. */
 | {
	kind: "dictionary";
	entry: PluginDictionaryEntry;
}
/** Label/value rows (provenance, metadata) in a quiet definition list. */
 | {
	kind: "keyValue";
	rows: {
		label: string;
		value: string;
	}[];
	layout?: "stacked" | "inline";
	columns?: 1 | 2 | 3;
}
/** A quoted passage with an optional attribution line. */
 | {
	kind: "quote";
	text: string;
	caption?: string;
}
/** A row of host buttons; each runs like any other contribution outcome. */
 | {
	kind: "actions";
	actions: PluginAction[];
	align?: "start" | "end";
} | {
	kind: "metric";
	label: string;
	value: string;
	description?: string;
}
/** Views 1.8: null is indeterminate. Cancel requests run while the main action is busy;
 * the plugin must stop its own work and publish the resulting state. */
 | {
	kind: "progress";
	value: number | null;
	max?: number;
	label?: string;
	showValue?: boolean;
	cancel?: Pick<PluginAction, "id" | "label" | "run">;
} | {
	kind: "tags";
	label?: string;
	values: string[];
} | {
	kind: "alert";
	title?: string;
	message: string;
	variant?: "default" | "destructive" | "success";
} | {
	kind: "divider";
}
/** A titled vertical group with design-system-owned hierarchy and spacing. */
 | {
	kind: "section";
	title?: string;
	description?: string;
	blocks: PluginBlock[];
	gap?: PluginLayoutGap;
}
/** A vertical group for composing blocks without introducing raw layout. */
 | {
	kind: "group";
	blocks: PluginBlock[];
	gap?: PluginLayoutGap;
}
/**
 * Responsive, host-owned columns. Plugins may choose relative weight,
 * minimum-width preset, spacing, and vertical alignment; wrapping and exact
 * CSS remain owned by the design system. Nesting is allowed to a bounded
 * depth and is validated at runtime.
 */
 | {
	kind: "columns";
	cells: PluginColumnCell[];
	gap?: PluginLayoutGap;
	align?: "start" | "center" | "baseline" | "stretch";
}
/**
 * Backward-compatible single-block columns. Prefer `columns`, whose cells
 * may contain a composed block sequence.
 */
 | {
	kind: "row";
	cells: PluginRowCell[];
	align?: "start" | "center" | "baseline";
} | PluginListView | PluginTableView | PluginTreeView | PluginImageView | PluginEditorView | PluginFormView;
export type PluginColumnCell = {
	weight?: number;
	minWidth?: "compact" | "standard" | "wide";
	blocks: PluginBlock[];
};
/** One column of a `row` block. */
export type PluginRowCell = {
	/** Relative width among the row's cells (default 1); clamped to >= 0. */
	weight?: number;
	block: PluginRowCellBlock;
};
/** Legacy row cells stay single-block; runtime validation bounds recursion. */
export type PluginRowCellBlock = PluginBlock;
export type PluginViewContent = (PluginMarkdownView | PluginListView | PluginTableView | PluginTreeView | PluginImageView | PluginEditorView | PluginFormView | PluginBlocksView | PluginDetailView) & {
	/** Views 1.10: a host-labelled drop zone for this visible view. Dropping grants
	 * this activation read access to the selected file snapshots, never paths.
	 * Defaults to one file; multiple accepts at most 16. Release resources when done.
	 * User drops or the host chooser invoke this; it does not intercept other app surfaces. */
	fileDrop?: {
		multiple?: boolean;
		extensions?: string[];
		onDrop(resources: ResourceRef[]): PluginViewResult | Promise<PluginViewResult>;
	};
};
/** Issued by the host for one visible frame; never saved or reused after disposal. */
export type PluginViewChannel = {
	id: string;
};
export type PluginViewUpdate = {
	revision: number;
	view: PluginViewContent;
};
export type PluginViewUpdateReceipt = {
	status: "applied" | "stale" | "inactive";
};
export type PluginViewCloseReason = "closed" | "back" | "replaced" | "reset" | "refreshed" | "unmounted";
/** Error copy and retry eligibility are host-owned; never pass a raw Error/message. */
export type PluginToast = string | {
	kind: "error";
	code: string;
	retry?: () => void | Promise<void>;
};
export type PluginView = PluginViewContent & {
	/** Once when this accepted frame is removed, not when covered or live-updated.
	 * Notification only: cannot veto closing or return navigation. Not guaranteed after
	 * activation retirement/crash; use activate's disposer for activation resources. */
	onClose?(event: {
		reason: PluginViewCloseReason;
	}): void | Promise<void>;
	/** Subscribed only while this frame is visible. Publish full snapshots through ui.publishView.
	 * Return a disposer; hiding/back/close/retirement invalidates the channel immediately.
	 * Each subscription must send its current snapshot before subsequent changes. */
	live?: {
		subscribe(channel: PluginViewChannel): PluginDisposable | Promise<PluginDisposable>;
	};
};
/**
 * What an action / list-select / form-submit may produce:
 * - `undefined` / `null` — nothing happens (surface stays as is);
 * - `{ toast }` — a transient notice;
 * - `{ view }` — open (or push onto) the surface with this view;
 * - `{ view, navigation: "replace" | "reset" }` — replace the current view
 *   or return the surface to a new root view;
 * - `{ close: true }` — dismiss the current surface (composable with `toast`);
 * - `{ close: "all" }` — since views 1.9, dismiss this presentation and its
 *   nested plugin dialogs, not another plugin presentation or native viewer;
 * - `{ fieldErrors }` (from a form submit) — stay on the form and show the
 *   errors under their fields.
 */
export type PluginViewResult = void | undefined | null | {
	toast?: PluginToast;
	view?: PluginView;
	navigation?: "push" | "replace" | "reset";
	close?: boolean | "all";
	fieldErrors?: Record<string, string>;
};
/** Where a selection action was triggered from. */
export type SelectionActionSource = "selection" | "annotation" | "navigator";
export type SelectionActionInput = {
	/** The whole selected text with whitespace runs collapsed — never truncated. For the
	 * annotation and navigator sources, the annotation's or navigator unit's text. */
	text: string;
	/** Surrounding passage when the reader can recover it. */
	context?: string;
	/** CFI range of the selection/annotation, when the engine can anchor it. */
	cfiRange: string | null;
	/** Since selectionActions 1.2: captured source reference. Null for legacy annotations or unavailable anchors. */
	range?: BookTextRange | null;
	chapterHref: string | null;
	book: {
		id: string;
		title: string;
		author?: string;
	};
	source: SelectionActionSource;
};
/** Full presentation snapshot. Hidden or disabled actions reject new execution.
 * revision is a non-negative safe integer; initial omission defaults to 0/true/true.
 * checked is presentation only and does not toggle itself or grant authority. */
export type PluginActionState = {
	revision: number;
	visible: boolean;
	enabled: boolean;
	checked?: boolean;
};
/** applied acknowledges host state, not DOM paint or durable business completion. */
export type PluginActionStateReceipt = {
	status: "applied" | "stale" | "inactive";
};
/** Since the four interactive contribution points v1.1. State belongs to this
 * exact registration. Replaced/disposed handles are inactive; old revisions stale.
 * Updates require an active plugin and do not cancel already-started operations. */
export type PluginActionRegistration = PluginDisposable & {
	updateState(state: PluginActionState): Promise<PluginActionStateReceipt>;
};
/** Selection/annotation menu entry. May run silently, report a toast or open a view.
 * It appears on every source (selection, annotation, navigator); branch on
 * `input.source` inside `run` when an action only makes sense on some. */
export type PluginSelectionAction = {
	state?: PluginActionState;
	id: string;
	title: PluginText;
	icon?: string;
	/** Optional host semantic used by the matching keyboard command. */
	role?: "lookup";
	/** Opens the host Dialog immediately in a loading state before `run` resolves. */
	presentation?: "dialog";
	run: (input: SelectionActionInput) => PluginViewResult | Promise<PluginViewResult>;
};
export type PluginHeaderSurface = "shelf" | "reader" | "agent";
export type HeaderActionInput = {
	/** Present on the reader surface: the open book. */
	book?: {
		id: string;
		title: string;
		author?: string;
	};
	/** Agent page: selected global thread, which may not yet have persisted turns. */
	thread?: {
		kind: "global";
		id: string;
	};
};
/**
 * An icon button on a header bar. On the reader surface the view always opens
 * as an anchored Popup; on the shelf it opens as a Popup or a full Page,
 * per `presentation`.
 */
export type PluginHeaderAction = {
	state?: PluginActionState;
	id: string;
	title: PluginText;
	icon?: string;
	surface: PluginHeaderSurface;
	/** Shelf only; reader and Agent headers always open a popup. */
	presentation?: "popup" | "page";
	view: (input: HeaderActionInput) => PluginView | Promise<PluginView>;
};
/** User-selected target metadata only; reading or mutating it still requires domain grants. */
export type ContextActionInput = {
	surface: "book";
	book: {
		id: string;
		title: string;
		author?: string;
	};
} | {
	surface: "collection";
	collection: {
		id: string;
		name: string;
	};
};
export type PluginContextAction = {
	id: string;
	title: PluginText;
	icon?: string;
	surface: ContextActionInput["surface"];
	/** Registration-wide state, not a separate state for each target. */
	state?: PluginActionState;
	presentation?: "dialog";
	run(input: ContextActionInput): PluginViewResult | Promise<PluginViewResult>;
};
/**
 * Plugin-owned copy with an English/default fallback. Locale keys are BCP-47
 * tags; the host resolves the active locale and always renders the result.
 */
export type PluginLocalizedText = {
	default: string;
	translations?: Record<string, string>;
};
/**
 * User-visible copy a contribution carries: a plain string, or a localized
 * bundle resolved against the app locale (exact tag, then base language,
 * then `default`). Contribution titles and tool labels accept this shape.
 */
export type PluginText = string | PluginLocalizedText;
/** One semantic step size declared by a text-unit reader mode. */
export type PluginReaderTextUnit = {
	id: string;
	/** Label used by the host's settings control. */
	label: PluginLocalizedText;
	previousLabel: PluginLocalizedText;
	nextLabel: PluginLocalizedText;
	/** Label for the host-rendered quick toggle. Defaults to `label`. */
	toggleLabel?: PluginLocalizedText;
	/** Curated host icon name. Plugins cannot supply SVG or UI code. */
	icon?: string;
};
/**
 * Copy for every host-rendered surface belonging to the mode.
 *
 * Behavior settings (step unit, tap-to-advance, …) are NOT copy: the plugin
 * declares them as ordinary `manifest.settings` fields under the well-known
 * ids `unitId`, `tapToAdvance`, `scrollToStep`, `showProgress`,
 * `sessionTimer`, and the host reads those values from the plugin's settings
 * object. Its settings page is the one editing surface.
 */
export type PluginReaderModeCopy = {
	title: PluginLocalizedText;
	enable: PluginLocalizedText;
	exit: PluginLocalizedText;
	returnToCurrent: PluginLocalizedText;
	showToolbars: PluginLocalizedText;
	moreActions: PluginLocalizedText;
	collapseActions: PluginLocalizedText;
	menuLabel: PluginLocalizedText;
	shortcuts: {
		description: PluginLocalizedText;
		volumeKeys: PluginLocalizedText;
	};
};
/**
 * One half-open span (`start <= offset < end`) inside a text block supplied by
 * the reader host. The host maps offsets back to Foliate DOM Ranges; plugins
 * never receive a Document, Range, iframe, or engine instance.
 */
export type PluginReaderTextSegment = {
	start: number;
	end: number;
};
export type PluginReaderTextSegmentInput = {
	/** Plain text from one host-detected block in the current reflowable section. */
	text: string;
	/** The section document's language tag, when the book declares one. */
	language?: string;
	/** One of the registering mode's declared `units[].id` values. */
	unitId: string;
};
/**
 * A guided reader mode over host-owned text units. The plugin supplies unit
 * semantics, localized copy, curated icon names, and segmentation policy;
 * ReadAware owns section traversal, CFI mapping, overlays, input capture,
 * persistence, actions, settings, and every rendered control.
 *
 * `reader:modes` is currently reserved for bundled first-party plugins while
 * this privileged lifecycle contract settles.
 */
export type PluginReaderMode = {
	id: string;
	kind: "text-unit-navigator";
	/** Curated host icon used for the reader-header entry. */
	icon?: string;
	/** Semantic units exposed through host-owned settings and controls. */
	units: PluginReaderTextUnit[];
	defaultUnitId: string;
	copy: PluginReaderModeCopy;
	/** Segment one block. Results must be ordered, non-overlapping spans.
	 * readerModes 1.1 permits async providers. Failure rejects the section build;
	 * returning [] deliberately declares this block has no reading units. */
	segmentText(input: PluginReaderTextSegmentInput): PluginReaderTextSegment[] | Promise<PluginReaderTextSegment[]>;
};
/**
 * A key chord for a command's default binding. `mod` is the platform command
 * key (⌘ on macOS, Ctrl elsewhere); `key` is a `KeyboardEvent.key`, single
 * characters lowercased.
 */
export type PluginShortcut = {
	key: string;
	mod?: boolean;
	alt?: boolean;
	shift?: boolean;
};
/** A command-palette entry. */
export type PluginCommand = {
	state?: PluginActionState;
	id: string;
	title: PluginText;
	icon?: string;
	/** Extra text folded into palette matching. */
	keywords?: string;
	/**
	 * Optional default key binding. Every registered command is bindable in
	 * Settings → Shortcuts whether or not it declares one; the user can rebind
	 * it there, and their override wins over this default.
	 */
	defaultShortcut?: PluginShortcut;
	run: () => PluginViewResult | Promise<PluginViewResult>;
};
/**
 * A tool exposed to the reading agent. `parameters` is plain JSON Schema for
 * the arguments object; omit it for a no-argument tool. The registered tool is
 * namespaced `plugin_<pluginId>_<name>` before it reaches the model.
 */
export type PluginToolDefinition = {
	state?: PluginActionState;
	/** agentTools >=1.2: host confirmation of this exact call before execute.
	 * Requires a manifest range excluding older hosts. Does not grant new permissions. */
	approval?: "required";
	/** snake_case identifier, unique within the plugin. */
	name: string;
	/** Short human label shown in the chat's tool activity row. */
	label?: PluginText;
	description: string;
	/**
	 * Agent surfaces where this tool is useful. Omit for both surfaces so older
	 * plugins keep their existing behavior; focused tools should opt into the
	 * narrowest useful set to avoid crowding the model's tool context.
	 */
	contexts?: Array<"book" | "global">;
	parameters?: Record<string, unknown>;
	/**
	 * Resolve with any JSON value — it is serialized as the tool result the
	 * model reads. Resolve with `{ gist, wordCards }` (PluginToolWordCards) to
	 * additionally render word cards in the chat turn: the reader sees the full
	 * entries as cards at the tool's position, the model sees only `gist`.
	 * agentTools >=1.3 also accepts PluginToolBookCards: host-resolved shelf
	 * cards, requiring library read access; the model receives gist and ID receipts.
	 */
	execute: (params: Record<string, unknown>) => unknown | Promise<unknown>;
};
/** One word card a tool result can carry (full entry, host-rendered). */
export type PluginToolWordCard = {
	/** The headword, in its original language. */
	term: string;
	/** Human-readable name of the language the entry explains in. */
	language: string;
	entry: PluginDictionaryEntry;
};
/**
 * Card-carrying tool result: `gist` is what the model receives (keep it to a
 * one-line summary — the card IS the content); `wordCards` render as word
 * cards in the chat.
 */
export type PluginToolWordCards = {
	gist: unknown;
	wordCards: PluginToolWordCard[];
};
/** Host-rendered shelf cards (agentTools >=1.3, library:read/write).
 * 1..24 references, each bookId nonblank and at most 256 characters.
 * Duplicates collapse; unknown books are skipped. A book thread can show only
 * its current book, a global thread any authorized shelf book. No custom
 * titles, covers, URLs or mixing with wordCards; rendering does not open books. */
export type PluginToolBookCards = {
	gist: unknown;
	bookCards: Array<{
		bookId: string;
	}>;
};
/**
 * A domain event as delivered to a plugin subscription: the canonical type +
 * payload from the app's event catalog (@read-aware/core events.ts), with the
 * software-actor origin and display timestamp. Persistence internals (HLC,
 * event ids) are not part of the plugin surface.
 */
/** Host-issued causal lease. Opaque: it conveys no permission or object grant.
 * Retained only until the asynchronous subscription callback settles. */
export type PluginReactionToken = Readonly<{
	id: string;
	status: "ready" | "cycle";
}>;
export type PluginReactionEvent = {
	readonly reaction?: PluginReactionToken;
};
/** Plugins 1.3: observation snapshots keep their existing shape. Use the second
 * argument with ctx.withEvent for automatic follow-up operations. */
export type PluginObservationHandler<T> = (snapshot: T, delivery?: PluginReactionEvent) => unknown;
export type PluginDomainEvent<K extends DomainEventType = DomainEventType> = {
	[T in DomainEventType]: {
		type: T;
		payload: Extract<DomainEvent, {
			type: T;
		}>["payload"];
		createdAt: string;
		origin: EventOrigin;
		readonly reaction?: PluginReactionToken;
	};
}[K];
/** Subscribe helper: one domain's event names, canonical, fully typed. */
export type DomainSubscribe<E extends DomainEventType> = <K extends E>(event: K, 
/** An async handler keeps its event reaction until the returned promise settles. */
handler: (event: PluginDomainEvent<K>) => unknown, options?: {
	/**
	 * Skip events produced by this plugin's own writes (origin
	 * `plugin:<id>`). Default false — by default you hear your own echoes.
	 */
	ignoreSelf?: boolean;
	/** Stable rule identity within this plugin (plugins 1.9). Reuse the same
	 * name after activation/restart; do not reuse it for a different rule.
	 * Lowercase identifier, up to 128 characters; unique while subscribed.
	 * Omit for an activation-local identity. This grants no write permission. */
	ruleId?: string;
}) => PluginDisposable;
/** Book, source, metadata, and collection changes. */
export type LibraryDomainEventType = "book.imported" | "book.metadataEdited" | "book.coverExtracted" | "book.merged" | "book.starred" | "book.removed" | "collection.created" | "collection.renamed" | "collection.removed" | "book.addedToCollection" | "book.removedFromCollection";
export type AnnotationDomainEventType = "highlight.created" | "highlight.recolored" | "highlight.removed" | "note.created" | "note.updated" | "note.removed" | "ask.recorded" | "ask.removed";
export type ConversationDomainEventType = "aiConversation.started" | "aiMessage.appended" | "aiMessage.removed" | "aiConversation.cleared";
export type PluginBook = BookSummary;
export type PluginCollection = CollectionSummary;
export type PluginHighlight = HighlightItem;
export type PluginNote = NoteItem;
/** A passive trace of a question asked in the book thread (agent-written). */
export type PluginAsk = AskItem;
export type PluginAnnotation = AnnotationItem;
/** One book's reading position, status, and time. */
export type PluginBookStats = BookStats;
/** Aggregate over every book's recorded reading. */
export type PluginStatsOverview = StatsOverview;
/**
 * A structured dictionary entry — the shape the `dictionary` view kind and
 * word-card tool results render with the app's own dictionary UX. Producing
 * entries is plugin business (e.g. via `llm.ask` with a schema); this is the
 * presentation contract.
 */
export type PluginDictionaryEntry = DictionaryEntrySnapshot;
export type PluginChatMessage = ChatMessageSummary;
export type PluginThreadSummary = ThreadSummary;
export type PluginChapterRef = ChapterRef;
export type PluginBookContent = {
	title?: string;
	author?: string;
	language?: string;
	sections: {
		id?: string;
		title?: string;
		html: string;
	}[];
};
export type PluginLibraryDomain = {
	queries: {
		books: {
			list(): Promise<PluginBook[]>;
			/** Library 1.11: import routing hints; extensions alone do not prove readability. */
			listFormats(): Promise<BookFormatCapability[]>;
			/** Initialize this activation's sealed resource with the reader parser; no import. */
			inspectResource(id: string, options?: PluginCallOptions): Promise<BookInspection>;
			/** Library 1.10: same-content groups; live offset pages, limit 1-50. */
			listDuplicates(query?: DuplicateBookQuery): Promise<DuplicateBookPage>;
			previewMerge(bookId: string): Promise<BookMergePreview | null>;
			/** Current book ID or merge redirect, null if neither points to a living book. */
			resolveId(bookId: string): Promise<string | null>;
			/** Durable device-local pending file cleanup, including after view/plugin restart. Live keyset page, limit 1-100 (default 50). */
			listRemovalCleanup(query?: BookRemovalCleanupQuery): Promise<BookRemovalCleanupPage>;
			get(bookId: string): Promise<PluginBook | null>;
			getToc(bookId: string): Promise<PluginChapterRef[]>;
			/** Read-only derived-text state. Never starts parsing, fetching, or extraction. */
			getTextState(bookId: string): Promise<BookTextSnapshot>;
			/** Library 1.9: local cover/source state and the latest process-local enrichment attempt. */
			getEnrichment(bookId: string): Promise<BookEnrichmentSnapshot>;
			/** Source metadata only; never loads a provider or reveals reading state. Library 1.16. */
			getContentState(bookId: string, options?: PluginCallOptions): Promise<BookContentState>;
			listTextTaskHistory(bookId: string, query?: BookTextTaskHistoryQuery): Promise<BookTextTaskHistoryPage>;
			getTextTask(bookId: string, taskId: string): Promise<BookTextTaskSnapshot>;
			listTextTasks(bookId: string): Promise<BookTextTaskSnapshot[]>;
			/** Library 1.20: this activation's in-memory import handles (64 retained). */
			/** waitMs (0..30000) waits for terminal state or returns current progress at the deadline.
			 * Cancelling this query stops observation only. */
			getImportTask(taskId: string, waitMs?: number, options?: PluginCallOptions): Promise<BookImportTaskSnapshot>;
			listImportTasks(): Promise<BookImportTaskSnapshot[]>;
			getChapterText(bookId: string, chapterIndex: number): Promise<string | null>;
			getNavigationToc(bookId: string, options?: PluginCallOptions): Promise<BookNavigationToc>;
			/** Library 1.14: bounded source-section or author-supplied page-label catalog; not screen page counts. */
			listNavigationTargets(input: BookNavigationTargetsQuery, options?: PluginCallOptions): Promise<BookNavigationTargetsPage>;
			searchLocations(input: BookLocationSearch, options?: PluginCallOptions): Promise<BookLocationSearchPage>;
			readRange(input: BookRangeQuery, options?: PluginCallOptions): Promise<BookRangePage>;
			/** Library 1.12: versioned section references, not extracted chapter indices. */
			listReferences(input: BookReferencesQuery, options?: PluginCallOptions): Promise<BookReferencesPage>;
			/** Library 1.29: section-local img/SVG, srcset/authored CSS and PDF image candidates. No remote fetch; PDF operator inspection can decode objects. */
			listImages(input: BookImagesQuery, options?: PluginCallOptions): Promise<BookImagesPage>;
			/** Seal an embedded image as this activation's ResourceRef; does not display it or decode pixels. */
			openImageResource(input: BookImageQuery): Promise<BookImageResource>;
			/** Plain-text preview and resolved navigation location; never fetches or opens an external URL. */
			readReference(input: BookReferenceQuery, options?: PluginCallOptions): Promise<BookReferencePreview>;
			/** Multi-query derived prose search. Single-book may prepare text; shelf search never does. Results are not navigation locations. */
			searchText(input: BookTextSearch, options?: PluginCallOptions): Promise<BookTextHit[]>;
		};
		collections: {
			list(): Promise<PluginCollection[]>;
			booksIn(collectionId: string): Promise<string[]>;
		};
	};
	commands?: {
		books: {
			/** Library 1.31: starts an actor-owned background request. A receipt is not completion.
			 * Current-book grants fence admission and the lease through pause/resume;
			 * switching books cancels only this request, without undoing accepted writes. */
			prepareText(bookId: string, options?: BookTextPrepareOptions): Promise<BookTextTaskSnapshot>;
			/** Retry unchecked covers and missing/filename-derived metadata using the shared queue, without forcing replacement or download. */
			retryEnrichment(bookId: string): Promise<BookEnrichmentReceipt>;
			/** Conditional record merge with the host's deterministic keeper; not file deletion or undo. */
			mergeDuplicates(input: BookMergeRequest): Promise<BookMergeReceipt>;
			/** Library 1.21: pauses only this request by releasing its lease; other consumers and dispatched I/O may continue. */
			setTextTaskPriority(bookId: string, taskId: string, priority: BookTextPriority): Promise<BookTextTaskSnapshot>;
			pauseTextTask(bookId: string, taskId: string): Promise<BookTextTaskSnapshot>;
			/** Library 1.21: reacquires this paused request using saved checkpoints and the same handle. */
			resumeTextTask(bookId: string, taskId: string): Promise<BookTextTaskSnapshot>;
			/** Cancels only this activation's request; shared work or dispatched writes may continue. */
			cancelTextTask(bookId: string, taskId: string): Promise<BookTextTaskSnapshot>;
			importBook(input: {
				fileName: string;
				data: ArrayBuffer | Uint8Array;
			}, options?: PluginCallOptions): Promise<PluginBook>;
			/** Library 1.19 adds per-call cancellation. Before the first durable write,
			 * cancellation prevents admission; afterward await the actual imported/duplicate
			 * receipt or failure. No whole-file transfer, opening or resource release. */
			importResource(id: string, options?: PluginCallOptions): Promise<BookImportReceipt>;
			/** Start a task over owned sealed resources or <=64 MiB file bytes (wire limits still apply).
			 * Queued is not imported. options.signal cancels admission only; use cancelImportTask
			 * after the receipt. At most 2 physical task executions per activation, 4 in the app;
			 * direct imports/picker jobs are outside this task quota.
			 * Tasks do not resume after restart. Accepted writes finish despite cancellation. */
			startImport(input: BookImportRequest, options?: PluginCallOptions): Promise<BookImportTaskSnapshot>;
			cancelImportTask(taskId: string): Promise<BookImportTaskSnapshot>;
			editMetadata(bookId: string, patch: {
				title?: string;
				author?: string;
			}): Promise<void>;
			setStarred(bookId: string, starred: boolean): Promise<void>;
			remove(bookId: string): Promise<void>;
			/** 1-1000 IDs, deduplicated. Atomic record deletion; local file release is separately reported. */
			removeMany(bookIds: string[]): Promise<BookRemovalReceipt>;
			/** Retry file release only. Refuses any ID now present in the library; never deletes records. */
			retryRemovalCleanup(bookIds: string[]): Promise<BookFileReleaseReceipt>;
			addVirtualBook(input: {
				providerId: string;
				key: string;
				title: string;
				author?: string;
			}): Promise<PluginBook>;
			removeVirtualBook(input: {
				providerId: string;
				key: string;
				expectedBookId?: string;
			}): Promise<void>;
			/** Announce already-saved source changes. Does not reload or move the reader.
			 * revision is a process-local invalidation fence, not a content hash. Library 1.15. */
			invalidateVirtualBook(input: {
				providerId: string;
				key: string;
			}): Promise<{
				bookId: string;
				revision: string;
			}>;
		};
		collections: {
			create(name: string): Promise<PluginCollection>;
			rename(collectionId: string, name: string): Promise<void>;
			remove(collectionId: string): Promise<void>;
			assignBooks(bookIds: string[], collectionId: string | null): Promise<void>;
		};
	};
	events: {
		subscribe: DomainSubscribe<LibraryDomainEventType>;
		/** Library 1.32: serial reaction deliveries retain task and history-write sources. */
		observeTextTask(bookId: string, taskId: string, handler: PluginObservationHandler<BookTextTaskSnapshot>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		/** Initial snapshot and coalesced monotonic revisions, including terminal failures. */
		observeImportTask(taskId: string, handler: PluginObservationHandler<BookImportTaskSnapshot>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		observeEnrichment(bookId: string, handler: PluginObservationHandler<BookEnrichmentObservation>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		observeContentState(bookId: string, handler: PluginObservationHandler<BookContentObservation>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		/** Initial and coalesced reload hints, including remote projection changes.
		 * Re-query authorized data; not an event log or a conditional-write token. */
		observeInvalidation(handler: PluginObservationHandler<ProjectionInvalidation>): PluginDisposable;
	};
};
/** Library 1.17 / Reading 2.18: optional final argument on supported calls.
 * Cancellation stops waiting and reaches cooperative host work, not rollback.
 * Already-started parsing/IPC or navigation may still finish; realm cleanup drains sources. */
export type PluginCallOptions = {
	signal?: AbortSignal;
};
export type PluginReadingDomain = {
	queries: {
		/** This activation's temporary marks only; attached does not mean visible in the viewport. */
		emphasis(): Promise<ReadingEmphasisSnapshot[]>;
		session(): Promise<ReadingSessionSnapshot>;
		stats: {
			/** Atomic settled + pending time, with native sampling clock. Reading >=2.7. */
			time(query?: ReadingTimeQuery): Promise<ReadingTimeSnapshot>;
			insights(query?: ReadingInsightsQuery): Promise<ReadingInsights>;
			forBook(bookId: string): Promise<PluginBookStats | null>;
			list(): Promise<PluginBookStats[]>;
			overview(): Promise<PluginStatsOverview>;
		};
	};
	commands?: {
		/** Temporary owned marks, not annotations. No navigation; replacement requires an observed revision. */
		putEmphasis(input: ReadingEmphasisWrite, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingEmphasisReceipt>;
		removeEmphasis(input: ReadingEmphasisRef, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingEmphasisRemoval>;
		/** Requires this book to be open; validates its source range, navigates, then waits for the selection overlay commit. */
		selectRange(range: BookTextRange, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingSelectionReceipt>;
		/** Clears only the observed selection ID; a replacement selection is never silently cleared. */
		clearSelection(expectedId: string, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingSelectionReceipt>;
		/** Set reader chrome visibility; completes after UI commit. Does not alter panel preferences or playback. */
		setControls(visible: boolean, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingControlsReceipt>;
		setFinished(bookId: string, finished: boolean): Promise<void>;
		openBook(bookId: string, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		goTo(target: ReadingTarget, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		back(guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		forward(guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		/** Reading 2.12: page, source-section and book-boundary navigation; section/boundary jumps enter history. */
		step(direction: ReadingStep, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		/** Reading 2.21: reopen source; virtual sections with identical stable identity/content preserve their location across reorder. Stale/legacy virtual locators restart at the beginning; files still restart. Whole-book contentVersion guards remain strict. */
		reload(guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		close(guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<void>;
		/** Start resolves on actual audio start. Stop is idempotent; disabling the initiating plugin stops its playback. */
		controlPlayback(action: "start" | "stop", guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingPlaybackReceipt>;
		/** Configure the host mode; modeKey guards the current provider, selectModeKey selects from session().mode.availableModes.
		 * Resolves after real indexing (ready/empty) or deactivation. Failed indexing rejects.
		 * Disabling the caller cancels an unfinished change; completed mode preferences remain. */
		configureMode(input: ReadingModeConfiguration, guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingModeReceipt>;
		/** Return to the versioned resting unit; wait for renderer navigation and unit restoration before committing history. */
		returnToMode(guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingNavigationReceipt>;
		/** Step one configured text unit, across sections if necessary; reports book boundaries explicitly. */
		stepMode(direction: "next" | "previous", guard?: ReadingSessionGuard, options?: PluginCallOptions): Promise<ReadingModeStepReceipt>;
	};
	events: {
		subscribe: DomainSubscribe<ReadingDomainEventType>;
		/** Immediate and subsequent snapshots carry a live reaction lease. Use withEvent for automatic writes;
		 * keep the original context for later user actions. A stable ruleId can resume job causality across activations. */
		observeSession(handler: (snapshot: ReadingSessionSnapshot, delivery?: PluginReactionEvent) => void | Promise<void>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		observeEmphasis(handler: (snapshot: ReadingEmphasisSnapshot[], delivery?: PluginReactionEvent) => void | Promise<void>): PluginDisposable;
		/** Immediate sample then a 1s minimum gap after each delivery. Errors are explicit; dispose stops further delivery.
		 * Reading 2.24: delivery retains sampling subscription ancestry across timers.
		 * It does not identify historical writers of the aggregate. */
		observeTime(query: ReadingTimeQuery, handler: (event: ReadingTimeObservation, delivery?: PluginReactionEvent) => void | Promise<void>, options?: {
			ruleId?: string;
		}): PluginDisposable;
	};
};
/**
 * Annotations — highlights, notes, and asks. Ask creation belongs to the
 * agent runtime; authorized writers may erase the user's existing traces.
 * Since 2.2, reads reject oversized items (512 KiB), pages are bounded to 1 MiB,
 * and list rejects collections requiring multiple pages. Use page and nextCursor.
 */
export type PluginAnnotationsDomain = {
	queries: {
		/** annotations >=1.3.0. Read an item and its conditional-write token atomically. */
		inspect(annotationId: string): Promise<AnnotationSnapshot | null>;
		/** annotations >=1.2.0. Live keyset page, not a frozen snapshot across calls. */
		page(input?: AnnotationPageQuery): Promise<AnnotationPage>;
		/** annotations >=1.1.0. Missing IDs return null; read failures reject. */
		get(annotationId: string): Promise<PluginAnnotation | null>;
		list(filter?: {
			bookId?: string;
			kind?: "highlight" | "note" | "ask";
			query?: string;
		}): Promise<PluginAnnotation[]>;
	};
	commands?: {
		/** Since 2.0 this is the only edit/delete entry. Use the revision observed
		 * before the user's decision; 1..100 distinct items, all commit or none. */
		applyChanges(changes: AnnotationMutation[]): Promise<AnnotationCommitResult>;
		/** annotations >=2.1: range validates and preserves the captured source; requires library:read. */
		createHighlight(input: {
			range?: BookTextRange;
			bookId: string;
			text: string;
			anchor?: string | null;
			chapterHref?: string | null;
			color?: HighlightColor;
			style?: HighlightStyle;
		}): Promise<PluginHighlight>;
		createNote(input: {
			range?: BookTextRange;
			bookId: string;
			body: string;
			quotedText?: string;
			anchor?: string | null;
			chapterHref?: string | null;
		}): Promise<PluginNote>;
	};
	events: {
		subscribe: DomainSubscribe<AnnotationDomainEventType>;
		/** Since 1.4. Initial authorized snapshot, then changed results/errors/recovery. Disposal ends polling. */
		observe(query: AnnotationObservationQuery, handler: PluginObservationHandler<AnnotationObservation>): PluginDisposable;
	};
};
/**
 * Conversations 1.5 supports current/specified-book grants for book transcripts,
 * summaries, runtime, actor-owned turn requests, events and stop/clear controls.
 * listThreads/getThread/createThread/selectThread are global-thread operations
 * requiring an all-books grant. Restricted runtime revisions reflect only the
 * visible book/session state, and selectedGlobalThreadId is null. Pending proposals
 * retire on a current-book/session change; only host acceptance starts a turn.
 * Message generation stays with the host chat runtime.
 */
/** A book-scoped installation receives no selected global thread identity. */
export type PluginConversationRuntimeSnapshot = Omit<ConversationRuntimeSnapshot, "selectedGlobalThreadId"> & {
	selectedGlobalThreadId: string | null;
};
export type PluginConversationsDomain = {
	queries: {
		/** Conversations 1.4: stored rolling summary of a book/global thread, or null.
		 * No generation, freshness guarantee, raw runtime state or summary writes. */
		getInsights(target: ConversationTarget): Promise<string | null>;
		/** Up to 128 recently retained host requests, filtered to this actor; no text or other actors' requests. */
		turnRequests(): Promise<ConversationTurnRequestSnapshot[]>;
		runtime(): Promise<PluginConversationRuntimeSnapshot>;
		getBookThread(bookId: string): Promise<PluginChatMessage[]>;
		listThreads(): Promise<PluginThreadSummary[]>;
		getThread(threadId: string): Promise<PluginChatMessage[]>;
	};
	commands?: {
		/** Requires a mounted conversation. Only a host UI confirmation can adopt/send/retry; receipt is not a completed turn. */
		requestTurn(request: ConversationTurnRequest): Promise<ConversationTurnRequestSnapshot>;
		cancelTurnRequest(id: string): Promise<ConversationTurnRequestSnapshot>;
		/** Creates and selects a global draft; no transcript row until the first message. Does not navigate the app. */
		createThread(): Promise<ConversationControlReceipt & {
			draft: true;
		}>;
		selectThread(threadId: string): Promise<ConversationControlReceipt>;
		/** Stops live UI turns and waits for their final transcript writes. Does not undo tool effects. */
		stop(target: ConversationTarget): Promise<ConversationControlReceipt>;
		/** Clears transcript/hidden thread state after draining turns, not long-term memory or event history. */
		clear(target: ConversationTarget): Promise<ConversationControlReceipt>;
	};
	events: {
		subscribe: DomainSubscribe<ConversationDomainEventType>;
		observeInvalidation(handler: PluginObservationHandler<ProjectionInvalidation>): PluginDisposable;
		/** Conversations 1.6: serial reaction deliveries, with an optional stable rule ID. */
		observeRuntime(handler: PluginObservationHandler<PluginConversationRuntimeSnapshot>, options?: {
			ruleId?: string;
		}): PluginDisposable;
	};
};
export type PluginSettingsDomain = {
	queries: {
		/** Settings 1.9: cached public model metadata; discover access to primaryModel or fastModel. No network. */
		modelCatalog(query: ModelCatalogQuery): Promise<ModelCatalogPage>;
		/** Since settings 1.3: one host snapshot after prior queued writes settle, filtered by exact path grants. */
		snapshot(query?: SettingsQuery): Promise<SettingsSnapshot>;
		/** Settled snapshots after native, domain, remote, restore and catalog changes. Coalesces slow callbacks. */
		observe(query: SettingsQuery, handler: PluginObservationHandler<SettingsObservation>): PluginDisposable;
		discover(query?: SettingsQuery): Promise<SettingCatalogEntry[]>;
		/** Settings 1.8: bounded options; same path grants as discover. Includes
		 * installed system families for reading/content fonts without font paths or bytes.
		 * Since 1.10, dynamicOptions fields invoke the registered owning provider with
		 * saved non-secret form values, never caller-supplied values. Network-enabled
		 * providers additionally require this caller's service:network permission.
		 * Results are cached for 60 seconds, at most 16 lists / 2000 options per list,
		 * 512 characters per label/value and 1 MiB of label/value JSON. Pages retain
		 * the returned revision; changed settings/provider or expiry require restart.
		 * Four provider loads host-wide, 10-second wait; already-started provider work
		 * is not cancelled by this deadline or caller retirement. No writes/synthesis.
		 * Plugin-owned option queries require the caller's active phase, not activation/migration.
		 * Empty results still allow manual values; provider failures remain failures. */
		options(query: SettingsOptionsQuery): Promise<SettingsOptionsPage>;
		read(path: string, target?: SettingsQueryTarget): Promise<SettingReadResult>;
	};
	commands: {
		/** Settings 1.9: additionally requires service:network. Shared native refresh, not a connection test. */
		refreshModelCatalog?(provider: string, options?: PluginCallOptions): Promise<ModelCatalogPage>;
		update(changes: SettingChange[]): Promise<SettingsUpdateResult>;
		/** Settings 1.7: reset the whole reader-preference bundle; every reading path must be writable.
		 * defaults restores built-ins; inherit deletes active and remembered book overrides. */
		resetReading(request: ReadingSettingsReset): Promise<SettingsUpdateResult>;
	};
	events: {
		subscribe(
		/** An async handler keeps its event reaction until the returned promise settles. */
		handler: (event: SettingsChangedEvent & PluginReactionEvent) => unknown, options?: {
			ignoreSelf?: boolean;
			ruleId?: string;
		}): PluginDisposable;
	};
};
export type PluginDomains = {
	library?: PluginLibraryDomain;
	reading?: PluginReadingDomain;
	annotations?: PluginAnnotationsDomain;
	conversations?: PluginConversationsDomain;
	/** Memory 2.8 supports current/specified-book grants for book-scoped search,
	 * pages, inspect, mutations, classification, graphs/tasks and book context recipes.
	 * Restricted queries must name exactly one authorized book scope; global profile
	 * and identity APIs require an all-books grant. Current-book/session changes
	 * invalidate outstanding reads, observations and exported context resources,
	 * and cancel graph execution. Graph generation additionally requires service:llm;
	 * handles belong to this activation. Dispatched writes may have committed even
	 * if a later scope change prevents disclosure of their result; inspect before retry. */
	memory?: {
		queries: {
			/** Memory 2.4: the versioned context-bundle archive (`docs/architecture/context-bundles.md`). Every recipe also needs
			 * read access to the domains it draws on: book_memory_context needs annotations and library, book scopes
			 * need library, conversation_insights_context needs conversations. History pages carry versions and
			 * publication times only. A pinned read delivers the exact immutable cb1 artifact; a retained
			 * book_memory_context is delivered only when the host can place its recorded fence within the reader's
			 * current boundary, otherwise it fails rather than being redacted. export seals the same artifact into this
			 * activation's resource queue as a read-only `context` ResourceRef bound to the durable source clock: any
			 * later tracked source change, reading-position change or retirement revokes reads/saves of that handle,
			 * while a native write already dispatched keeps its receipt. Aborted/retired callers receive no late result. */
			context: {
				history(query: ContextBundleHistoryQuery, options?: PluginCallOptions): Promise<ContextBundleHistoryPage>;
				read(query: ContextBundleReadQuery, options?: PluginCallOptions): Promise<ContextBundle | null>;
				export(query: ContextBundleReadQuery, options?: PluginCallOptions): Promise<ResourceRef>;
			};
			/** Memory 2.3: inspect the generated summary and provenance, separately from curated profile().
			 * Summary pages count UTF-16 units (4000 default, 16000 max); provenance pages count rows
			 * (25 default, 100 max; historical ID sizes are unbounded). Pin every page kind to pctx1.
			 * Stale text is inspectable, never current context. Invalid blocks expose no content.
			 * Current means source-consistent, not semantic verification or completed consolidation.
			 * entityEvidence IDs include proposed no-ops, not proof of emitted events. Read grant;
			 * no source text, transcripts, raw traits, registry writes or automatic inference. */
			profileContext(query?: ProfileInspectionQuery, options?: PluginCallOptions): Promise<ProfileInspectionPage>;
			/** Global explicit identities, not book-digest characters. Row-bounded, revision-pinned pages.
			 * Memory 2.2 adds canonicalDefinition from the same snapshot. Historical field sizes are not bounded. Aborted/retired callers receive no late page. */
			entities(query?: EntityQuery, options?: PluginCallOptions): Promise<EntityPage>;
			/** The event-backed summary projection; read grant, bounded revision-pinned pages. */
			profile(query?: UserProfileQuery): Promise<UserProfilePage>;
			inspect(id: string): Promise<MemorySnapshot | null>;
			classification(bookId: string): Promise<BookClassificationSnapshot | null>;
			getGraphTask(bookId: string, taskId: string): Promise<BookGraphTaskSnapshot>;
			listGraphTasks(bookId: string): Promise<BookGraphTaskSnapshot[]>;
			search(input: MemoryQuery): Promise<MemoryRecord[]>;
			page(input: MemoryPageQuery): Promise<MemoryPage>;
			/** memory >=2.6 only exposes current-source digests; chapter results carry contentVersion for navigation. */
			bookGraph(bookId: string, query?: BookGraphQuery): Promise<BookGraphResult>;
		};
		commands?: {
			/** Memory 2.1: resolve an original member or merge known resolved classes using an observed
			 * entities1 revision. Present the exact change for confirmation first. Retains original
			 * definitions/aliases, may sync to other devices. No blind conflict retry. Cancellation
			 * prevents dispatch only; dispatched writes drain to their actual receipt. A transport
			 * timeout or lost Worker leaves the outcome unknown: reread, never retry blindly. */
			decideEntity(input: EntityDecision, options?: PluginCallOptions): Promise<EntityDecisionReceipt>;
			/** Memory 2.4: assemble one recipe from its current durable sources behind the host's own scope, privacy
			 * and spoiler authority, publish it as an immutable `context.bundlePublished` version and return the
			 * artifact. Requires memory:write plus read access to the recipe's source domains. changed=false means the
			 * identical content version already existed. Concurrent source changes reject assembly instead of mixing
			 * reads; cancellation before native dispatch prevents publication, afterwards the call drains to the real
			 * receipt. This is a versioned export artifact, not a backup, transcript or prompt. May sync. */
			context: {
				capture(selector: ContextBundleSelector, options?: PluginCallOptions): Promise<ContextBundleCaptureReceipt>;
			};
			/** Replace the event-backed summary using the observed profile2 revision.
			 * Present the complete candidate for user confirmation before calling.
			 * Empty text clears the summary, not memories or historical copies. */
			updateProfile(input: UserProfileChange): Promise<UserProfileReceipt>;
			/** Memory 2.5: confirm the full summary AND seeds before calling. Reuse the same
			 * owner-local submissionId and exact candidate after a lost receipt; a different
			 * candidate requires a new id and renewed confirmation. Atomic, event-backed. */
			completeOnboarding(input: OnboardingChange, options?: PluginCallOptions): Promise<OnboardingReceipt>;
			mutate(input: MemoryMutation): Promise<MemoryMutationReceipt>;
			classify(input: BookClassificationChange): Promise<BookClassificationReceipt>;
			startGraphTask(bookId: string, mode: "catch-up" | "rebuild", options?: BookGraphTaskOptions): Promise<BookGraphTaskSnapshot>;
			cancelGraphTask(bookId: string, taskId: string): Promise<BookGraphTaskSnapshot>;
			retryGraphTask(bookId: string, taskId: string, options?: BookGraphTaskOptions): Promise<BookGraphTaskSnapshot>;
		};
		events: {
			/** Initial snapshot, then changed results/errors; bounded polling, not an event log.
			 * Plugins 1.5 supplies a separate reaction delivery, including graph task updates. */
			observe(query: MemoryObservationQuery, handler: PluginObservationHandler<MemoryObservation>): PluginDisposable;
		};
	};
	settings: PluginSettingsDomain;
};
/** Persisted payload bytes, excluding identifiers, indexes, SQLite allocation,
 * reserved host document collections and encrypted credential values. */
export type PluginStorageUsage = {
	kv: {
		items: number;
		valueBytes: number;
	};
	documents: {
		items: number;
		valueBytes: number;
	};
	assets: {
		items: number;
		valueBytes: number;
	};
};
export type PluginStoragePolicy = {
	usage: PluginStorageUsage;
	kv: {
		roaming: "preference-events";
		localOnlyKeys: string[];
		backup: "complete";
		uninstall: "retain";
		maxBytes: null;
	};
	documents: {
		roaming: "none";
		backup: "complete";
		uninstall: "delete";
		maxBytes: null;
		putMaxDocumentBytes: null;
		applyMaxDocumentBytes: number;
		applyMaxBatchBytes: number;
		applyMaxChanges: number;
	};
	secrets: {
		roaming: "none";
		backup: "excluded";
		uninstall: "retain";
		maxBytes: null;
		usage: null;
	};
	assets: {
		roaming: "none";
		backup: "complete";
		uninstall: "delete";
		maxBytes: number;
		maxItems: number;
		maxItemBytes: number;
	};
	/** Eligibility is not delivery: this query does not inspect remote sync. */
	syncStatus: "not-measured";
};
export type PluginStorage = {
	/** Storage 2.5: own persisted usage and actual per-store policy. Null quota
	 * means no enforced total limit, not unlimited disk. Call flush first when
	 * awaiting this activation's pending writes. No names or secret values.
	 * Complete backup refers to full app backup, not reading/OPML exports. */
	policy(): Promise<PluginStoragePolicy>;
	get<T = unknown>(key: string): T | null;
	/** 2.4: keys up to 1024 UTF-16 units, no NUL. Settle accepted writes, then read this private key from SQLite, not
	 * the optimistic mirror. Corrupt JSON rejects; null means absent or JSON null. */
	getDurable<T = unknown>(key: string): Promise<T | null>;
	/** Reads update optimistically; resolve only after the write is durable. */
	set(key: string, value: unknown): Promise<void>;
	remove(key: string): Promise<void>;
	/** Wait for outstanding writes in this plugin's namespace. */
	flush(): Promise<void>;
	/**
	 * A named document collection — structured plugin-private data one tier
	 * above the KV (queryable, per-document, optionally book-anchored). Backed
	 * by the app's local store; lifecycle belongs to the plugin (uninstall
	 * clears it). `bookId`/`anchor` are provenance INDEXES, not ownership —
	 * documents survive the referenced book's deletion.
	 */
	collection(name: string): PluginDocumentCollection;
	/** Storage 2.1: atomically compare and apply 1..100 private document changes.
	 * Every expected revision is checked before any write. Does not include KV,
	 * core domain events, files, or another plugin's documents. */
	applyDocuments(changes: PluginDocumentChange[]): Promise<PluginDocumentCommit>;
	/** Storage 2.2: initial and changed private document query snapshots, including
	 * errors/recovery. At most 64 active observers per activation; reads and
	 * callbacks settle before the next one-second poll. Not a replayable write
	 * stream. Dispose or plugin retirement stops delivery; sequence is not CAS. */
	observeDocuments<T = unknown>(query: PluginDocumentObservationQuery, handler: PluginObservationHandler<PluginDocumentObservation<T>>): PluginDisposable;
	/**
	 * Fires when this plugin's namespace is written from OUTSIDE the plugin —
	 * its settings page, the reading agent, another surface editing the same
	 * object. Settings-key changes can also echo after own writes. Serial callbacks
	 * receive a reaction credential; use withEvent to preserve causes. No initial
	 * callback; intermediate changes coalesce. Use it
	 * to re-read (or re-derive from) settings you would otherwise have cached
	 * at activate().
	 */
	onChange(handler: PluginObservationHandler<{
		kind: "changed";
	}>, options?: {
		ruleId?: string;
	}): PluginDisposable;
};
export type PluginMigrationStorage = Omit<PluginStorage, "onChange" | "observeDocuments" | "policy">;
export type PluginLifecyclePhase = "activating" | "migrating" | "active";
export type PluginMigration = {
	fromVersion: number;
	toVersion: number;
	direction: "upgrade" | "downgrade";
};
export type PluginMigrationContext = {
	readonly manifest: Readonly<PluginManifest>;
	readonly lifecycle: {
		readonly phase: "migrating";
	};
	readonly storage: PluginMigrationStorage;
	/** Logging 1.0: own structured diagnostics only; no access to other services. */
	readonly logging: PluginLoggingService;
};
export type PluginExportFile = {
	/** Suggested basename shown by the host save dialog. */
	filename: string;
	/**
	 * UTF-8 text (CSV, JSON, Markdown, …) or raw bytes for binary formats
	 * (.apkg, images, EPUB, …).
	 */
	content: string | Uint8Array | ArrayBuffer;
	mimeType?: string;
};
export type PluginDocument<T = unknown> = {
	id: string;
	data: T;
	bookId?: string;
	anchor?: string;
	/** ISO timestamp of the last write. */
	updatedAt: string;
	/** Storage 2.1: opaque local write identity, including same-value writes. */
	revision: string;
};
export type PluginDocumentChange = {
	collection: string;
	id: string;
	/** null requires absence; a revision requires that exact existing write. */
	expectedRevision: string | null;
} & ({
	kind: "put";
	data: unknown;
	bookId?: string;
	anchor?: string;
} | {
	kind: "delete";
} | {
	kind: "check";
});
export type PluginDocumentCommit = {
	status: "conflict";
	index: number;
} | {
	status: "applied";
	documents: Array<{
		collection: string;
		id: string;
		revision: string | null;
	}>;
};
export type PluginDocumentPage<T = unknown> = {
	status: "stale-cursor";
} | {
	status: "ready";
	items: PluginDocument<T>[];
	nextCursor: string | null;
};
export type PluginDocumentPageFilter = {
	bookId?: string;
	limit?: number;
	oldestFirst?: boolean;
	cursor?: string;
	/** Storage 2.3: literal substring of any JSON key/scalar value, including
	 * nested arrays/objects. Unicode lowercase matching, no tokenization,
	 * regex, accent folding or metadata search. Trimmed empty means no filter.
	 * Max 1024 UTF-8 bytes, no control characters. Search precedes pagination;
	 * cursors bind the normalized query. Also supported by observeDocuments. */
	query?: string;
};
export type PluginDocumentObservationQuery = {
	collection: string;
} & ({
	kind: "get";
	id: string;
} | {
	kind: "page";
	filter?: PluginDocumentPageFilter;
});
export type PluginDocumentObservationResult<T = unknown> = {
	kind: "get";
	document: PluginDocument<T> | null;
} | {
	kind: "page";
	page: PluginDocumentPage<T>;
};
export type PluginDocumentObservation<T = unknown> = {
	sequence: number;
} & ({
	status: "ready";
	result: PluginDocumentObservationResult<T>;
} | {
	status: "error";
	errorCode: string;
});
export type PluginDocumentCollection = {
	put(id: string, data: unknown, options?: {
		bookId?: string;
		anchor?: string;
	}): Promise<void>;
	get<T = unknown>(id: string): Promise<PluginDocument<T> | null>;
	delete(id: string): Promise<void>;
	/** Newest-first by default. */
	list<T = unknown>(filter?: {
		bookId?: string;
		limit?: number;
		oldestFirst?: boolean;
	}): Promise<PluginDocument<T>[]>;
	/** Storage 2.1: 1..200 rows (default 50), 4 MiB JSON per page.
	 * Cursors bind namespace/filter/order and expire on any collection write.
	 * On stale-cursor restart rather than combining different snapshots. */
	page<T = unknown>(filter?: PluginDocumentPageFilter): Promise<PluginDocumentPage<T>>;
};
export type PluginAgentScope = {
	kind: "global";
	threadId: string;
} | {
	kind: "book";
	bookId: string;
};
export type PluginAgentContextBlock = {
	title?: string;
	content: string;
};
export type PluginAgentContextProvider = {
	id: string;
	contexts?: Array<PluginAgentScope["kind"]>;
	/** 1.1: explicit durable intention source for context bundles, not prompt text.
	 * Preparation settles migrations/writes; read must use committed storage and
	 * must not generate text or return an optimistic cache. */
	readingIntent?: {
		scopes: Array<"user" | "book">;
		prepare(scope: ReadingIntentScope): Promise<void>;
		read(scope: ReadingIntentScope): Promise<ReadingIntentSnapshot>;
	};
	provide(input: {
		scope: PluginAgentScope;
		userText: string;
	}): PluginAgentContextBlock[] | Promise<PluginAgentContextBlock[]>;
};
export type PluginAgentRetrievalItem = {
	title?: string;
	content: string;
	location?: string;
};
export type PluginAgentRetrievalProvider = {
	id: string;
	label: string;
	description: string;
	contexts?: Array<PluginAgentScope["kind"]>;
	retrieve(input: {
		scope: PluginAgentScope;
		query: string;
		limit: number;
	}): PluginAgentRetrievalItem[] | Promise<PluginAgentRetrievalItem[]>;
};
export type PluginMemoryCandidate = {
	scope: "user" | "global" | "book";
	kind: "fact" | "preference" | "insight" | "summary";
	content: string;
};
export type PluginMemoryCandidateReceipt = MemoryCandidateReceipt;
export type PluginMemoryCandidateProvider = {
	id: string;
	contexts?: Array<PluginAgentScope["kind"]>;
	propose(input: {
		requestId: string;
		scope: PluginAgentScope;
		userText: string;
		assistantText: string;
	}): PluginMemoryCandidate[] | Promise<PluginMemoryCandidate[]>;
	/** Best-effort, once per settled proposal batch while this registration is active.
	 * Saved means the host write succeeded, not that memory will never be changed.
	 * No callback is guaranteed after retirement, process exit, or a failed propose.
	 */
	onResult?(receipt: PluginMemoryCandidateReceipt): void | Promise<void>;
};
/** One device's dense batch range as the remote currently holds it. */
export type PluginSyncBatchListing = Array<{
	deviceId: string;
	count: number;
}>;
/**
 * A live connection to one remote mailbox, produced by `open()` from the
 * plugin's current settings. All methods may be called repeatedly and
 * concurrently within one session.
 */
export type PluginSyncTransportSession = {
	/**
	 * Stable identity of the remote mailbox (derive it from the normalized
	 * endpoint + account + base path). The host binds the local push/pull
	 * bookkeeping to it: a different `endpointId` after connect means "this is
	 * another mailbox" and sync refuses until the user reconnects.
	 */
	endpointId: string;
	/** Idempotently stop this session, abort its work and release its resources.
	 * After close starts, no new operation may start. Already committed remote
	 * effects are not undone. The host releases callback handles after closing. */
	close(): Promise<void>;
	/** Cheap reachability + credential check; used by the connect flow. */
	probe(): Promise<void>;
	/** Read a named meta object; null when it does not exist. */
	getMeta(name: string): Promise<Uint8Array | null>;
	/** Create-only write: `"exists"` (leaving the remote untouched) when the
	 *  object is already there — first writer wins. */
	putMetaIfAbsent(name: string, bytes: Uint8Array): Promise<"stored" | "exists">;
	listEventBatches(): Promise<PluginSyncBatchListing>;
	getEventBatch(deviceId: string, index: number): Promise<SealedEventWire[]>;
	/** Append one immutable batch; must fail rather than overwrite an existing
	 *  index. */
	putEventBatch(deviceId: string, index: number, events: SealedEventWire[]): Promise<void>;
	putBlob(key: string, bytes: Uint8Array): Promise<void>;
	getBlob(key: string): Promise<Uint8Array | null>;
	putBlobPart(key: string, index: number, parts: number, bytes: Uint8Array): Promise<void>;
	commitBlob(key: string, parts: number): Promise<void>;
	getBlobPart(key: string, index: number): Promise<Uint8Array>;
};
export type PluginSyncTransport = {
	/** Unique within the plugin. */
	id: string;
	/** Backend name shown in Settings → Data & Sync (e.g. "WebDAV"). */
	label: PluginText;
	/**
	 * Build a session from the plugin's CURRENT settings. Must not touch the
	 * network (that is `probe`'s job); throw a descriptive error when required
	 * settings are missing.
	 */
	open(): Promise<PluginSyncTransportSession>;
};
/** readaware://plugin/<pluginId>/<handlerId>?key=value, delivered only after
 * host confirmation. Namespaces cannot intercept login/billing/system links.
 * Link parameters are untrusted input, never authorization or secret grants. */
export type PluginUriRequest = {
	parameters: {
		key: string;
		value: string;
	}[];
};
export type PluginUriHandler = {
	id: string;
	state?: PluginActionState;
	open(request: PluginUriRequest): PluginViewResult | Promise<PluginViewResult>;
};
/** Runtime theme images are owned private assets, never URLs or CSS. The host
 * decodes a bounded raster copy. Only selecting this theme applies it. */
export type PluginRuntimeTheme = PluginThemeContribution & {
	readerBackground?: {
		assetKey: string;
		assetRevision: string;
		/** 0 = invisible, 1 = opaque. */
		opacity: number;
		/** Black overlay on the image only: 0 = unchanged, 1 = black. */
		dim: number;
	};
};
/** A snapshot of a selectable base's palette and typography, without image
 * URLs or assets. Fonts remain references to their owning plugin. */
export type PluginReaderThemeBase = {
	ref: string;
	name: PluginText;
	polarity: PluginThemePolarity;
	reader: NonNullable<PluginThemeContribution["reader"]>;
};
export type PluginContributions = {
	/** One custom settings page per plugin. Uses the ordinary declarative view
	 * renderer, with the same activation/callback ownership as header actions. */
	settingsPage?: {
		register(page: {
			view(): PluginView | Promise<PluginView>;
		}): PluginDisposable;
	};
	/** Themes 1.1: staged, activation-owned themes; replacing an id replaces its
	 * image too. Invalid/missing assets reject before replacing the live theme. */
	themes?: {
		/** Themes 1.2: built-in and active plugin reader bases, excluding image
		 * themes. Saved copies do not change when the original theme changes. */
		readerBases(): Promise<PluginReaderThemeBase[]>;
		register(theme: PluginRuntimeTheme): Promise<PluginDisposable>;
	};
	uriHandlers: {
		register(handler: PluginUriHandler): PluginActionRegistration;
	};
	selectionActions: {
		register(action: PluginSelectionAction): PluginActionRegistration;
	};
	headerActions: {
		register(action: PluginHeaderAction): PluginActionRegistration;
	};
	contextActions: {
		register(action: PluginContextAction): PluginActionRegistration;
	};
	commands: {
		register(command: PluginCommand): PluginActionRegistration;
	};
	settingsOptions: {
		register(fieldId: string, provider: (values: PluginFormValues) => PluginSelectOption[] | Promise<PluginSelectOption[]>): PluginDisposable;
	};
	voiceProviders: {
		register(provider: PluginVoiceProvider): PluginDisposable;
	};
	contentProviders: {
		register(provider: {
			id: string;
			load(key: string): Promise<PluginBookContent>;
		}): PluginDisposable;
	};
	agentTools?: {
		register(tool: PluginToolDefinition): PluginActionRegistration;
	};
	agentContextProviders?: {
		register(provider: PluginAgentContextProvider): PluginDisposable;
	};
	agentRetrievalProviders?: {
		register(provider: PluginAgentRetrievalProvider): PluginDisposable;
	};
	memoryCandidateProviders?: {
		register(provider: PluginMemoryCandidateProvider): PluginDisposable;
	};
	syncTransports?: {
		register(transport: PluginSyncTransport): PluginDisposable;
	};
};
export type PluginLogEntry = {
	level: "debug" | "info" | "warn" | "error";
	/** Stable developer event name, never user content, a URL, a path or a secret. */
	event: string;
	/** Stable machine-readable failure code, not error.message or stack. */
	errorCode?: string;
	/** Up to 12 numeric/boolean measurements; no text, arrays or nested objects. */
	fields?: Record<string, number | boolean>;
};
export type PluginLogReceipt = {
	status: "accepted";
} | {
	status: "disabled";
} | {
	status: "rate-limited";
	retryAfterMs: number;
};
export type PluginLoggingService = {
	/** Logging 1.0: accepted means forwarded to the best-effort host logger,
	 * not durably stored or uploaded. Allowed during activation and migration.
	 * Debug is development-console-only. Retired activations cannot write. */
	write(entry: PluginLogEntry): Promise<PluginLogReceipt>;
	policy(): Promise<{
		levels: PluginLogEntry["level"][];
		maxEntryChars: number;
		maxFields: number;
		perPluginLimit: number;
		appLimit: number;
		windowMs: number;
		delivery: "best-effort";
	}>;
};
export type PluginInferenceInput = {
	prompt: string;
	/** llm 1.5: up to four sealed image resource IDs owned by this activation.
	 * Native PNG decode, 8 MiB each/16 MiB total; original-book/context exports rejected.
	 * Sends pixels to the selected vision-capable model, never URLs or arbitrary bytes. */
	images?: {
		resourceId: string;
	}[];
	/** llm 1.4: optional caller-generated ID (1..64 ASCII letters/digits/_/-).
	 * Retains metadata independently of the cancellable RPC. IDs must be unique
	 * among retained requests; this is not a retry/idempotency key. */
	requestId?: string;
	system?: string;
	model?: "fast" | "smart";
	/** Keep book fragments here: host privacy filtering and live revocation apply. */
	readingContext?: ModelReadingContext;
	/** Cancellation reaches host inference; no remote rollback guarantee. */
	signal?: AbortSignal;
	/** Integer milliseconds, 1..110000, default 60000; covers structured retries. */
	timeoutMs?: number;
	/** llm 1.3: positive integer <= 65536, requested separately for each attempt.
	 * Model/account/provider limits may be stricter. Omit to retain account defaults.
	 * This is not a total token/cost budget or a guarantee of provider compliance. */
	maxOutputTokens?: number;
	/** llm 1.6: total requested output-token budget across structured retries, 1..131072.
	 * Unknown/zero output usage consumes that attempt's full reservation. Provider billing may differ. */
	maxTotalOutputTokens?: number;
	/** llm 1.6: aggregate UTF-16 output across attempts/stream deltas, 1..262144 (default).
	 * Text input including schema/retry feedback is limited to 262144 UTF-16 units per attempt. */
	maxOutputChars?: number;
};
export type PluginHostServices = {
	storage: PluginStorage;
	logging: PluginLoggingService;
	secrets: {
		get(key: string): Promise<string | null>;
		set(key: string, value: string): Promise<void>;
		remove(key: string): Promise<void>;
	};
	ui: {
		/** UI 1.11: main-window metadata and explicit user intents. No close, paths, title or arbitrary windows. */
		window?: {
			snapshot(): Promise<HostWindowSnapshot>;
			/** UI 1.17: reaction delivery remains valid until the callback settles. */
			observe(handler: PluginObservationHandler<HostWindowObservation>, options?: {
				ruleId?: string;
			}): PluginDisposable;
			control(request: HostWindowRequest): Promise<HostWindowReceipt>;
		};
		/** UI 1.4: native navigation/shelf commands. UI 1.5: typed open-book/open-collection args. Never arbitrary menu/plugin IDs. */
		commands?: {
			list(): Promise<HostCommandSnapshot>;
			/** UI 1.16: serial/coalesced snapshots with a reaction delivery and optional stable ruleId. */
			observe(handler: PluginObservationHandler<HostCommandObservation>, options?: {
				ruleId?: string;
			}): PluginDisposable;
			/** Library write plus each command's setting grant; opening/leaving a reader needs reading:write. */
			execute?(request: HostCommandRequest): Promise<HostCommandReceipt>;
		};
		/** UI 1.15: library read grants expose a workspace projection. Book-restricted
		 * projections filter selection before pagination/counting, explicitly mark
		 * withheld collection/search fields, and retain an actor-local concurrency
		 * token. Collection-wide navigation requires all-books access; supplied
		 * selections/open-book commands must name only the authorized book. */
		workspace?: {
			snapshot(query?: WorkspaceQuery): Promise<WorkspaceSnapshot>;
			/** UI 1.16: use the separate reaction delivery even for null/retired snapshots. */
			observe(query: WorkspaceQuery, handler: PluginObservationHandler<WorkspaceSnapshot | null>, options?: {
				ruleId?: string;
			}): PluginDisposable;
			/** Library write grant; leaving an active reader additionally requires reading:write. */
			navigate?(target: WorkspaceTarget, expectedRevision?: number): Promise<WorkspaceReceipt>;
		};
		showToast(message: PluginToast): void;
		exportFile(file: PluginExportFile): Promise<boolean>;
		/** UI 1.7, requires service:network. Explicit user intent only; HTTP(S), no credentials or local schemes. */
		openExternal?(url: string): Promise<void>;
		/** Updates only this activation's visible frame. Revision is a nonnegative, increasing safe integer.
		 * Receipt confirms host acceptance, not paint; updates cannot navigate or replace the subscription. */
		publishView(channel: PluginViewChannel, update: PluginViewUpdate): Promise<PluginViewUpdateReceipt>;
		/** Requires reading:read (write includes read). No book content is returned. */
		reader?: {
			/** UI 1.12: already-open native image viewer. No URL, bytes, alt text or implicit opening. */
			image?: {
				snapshot(): Promise<ReaderImageSnapshot | null>;
				/** Plugins 1.6 supplies a separate reaction delivery, including closed/null snapshots. */
				observe(handler: PluginObservationHandler<ReaderImageSnapshot | null>): PluginDisposable;
				/** reading:write; exact current viewer ID required. Pan deltas are fractions of its viewport. */
				control?(request: ReaderImageRequest): Promise<ReaderImageReceipt>;
				/** UI 1.13: library read + reading write; opens an embedded image in the current book. */
				open?(query: BookImageQuery, guard?: ReadingSessionGuard): Promise<ReaderImageOpenReceipt>;
			};
			snapshot(): Promise<ReaderPanelsSnapshot | null>;
			/** Plugins 1.6 supplies a separate reaction delivery; callbacks are serial and coalesced. */
			observe(handler: PluginObservationHandler<ReaderPanelsSnapshot | null>): PluginDisposable;
			/** Requires reading:write. Opening reveals controls; completion waits for persistence and DOM commit. */
			setPanel?(panel: ReaderPanel, open: boolean, guard?: ReadingSessionGuard): Promise<ReaderPanelReceipt>;
			/** Persist a shared TOC/chat width (integer 240..640 CSS px); does not open it or focus. */
			setWidth?(panel: ResizableReaderPanel, width: number, guard?: ReadingSessionGuard): Promise<ReaderPanelReceipt>;
			/** UI 1.14, reading:write. Focus an already visible semantic target, without opening or dismissing UI.
			 * not-focused is not success; close your own dialog before returning focus. */
			focus?(target: ReaderFocusTarget, guard?: ReadingSessionGuard): Promise<ReaderFocusReceipt>;
			/** UI 1.8: also needs library:read. Open book only; resolved preview waits for DOM commit. */
			previewReference?(query: BookReferenceQuery, guard?: ReadingSessionGuard): Promise<ReaderReferencePreviewReceipt>;
			/** Only this activation's current preview ID; never closes a native or other owner's note. */
			closeReferencePreview?(id: string): Promise<ReaderReferenceCloseReceipt>;
		};
	};
	schedules: {
		bind(scheduleId: string, run: (context: PluginScheduleRun, delivery?: PluginReactionEvent) => void | Promise<void>): PluginDisposable;
		/** Schedules 2: enqueue one declared deferred task. Persists before acknowledgement.
		 * 1 second..7 days; idle means 5 seconds without host input. Never runs while closed.
		 * The most recent request ID is retained for retry; changed input conflicts, another queued ID is busy.
		 * A dispatched request is never automatically replayed after a crash. Inspect interrupted and decide explicitly. */
		defer(id: string, input: PluginDeferredRequest, options?: PluginCallOptions): Promise<PluginDeferredReceipt>;
		/** Cancel exactly the queued ID, not an in-flight callback or a replacement request. */
		cancelDeferred(id: string, requestId: string, options?: PluginCallOptions): Promise<PluginDeferredReceipt>;
		/** Bound schedules owned by this plugin only, with the latest persisted attempt/outcome. */
		list(query?: Omit<PluginScheduleQuery, "pluginId">): Promise<PluginSchedulePage>;
		observe(query: Omit<PluginScheduleQuery, "pluginId">, handler: PluginObservationHandler<PluginSchedulePage>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		/** Pause/resume persist; run bypasses pause/cadence once. Neither pause nor cancellation undoes dispatched callback effects. */
		control(id: string, action: "pause" | "resume" | "run"): Promise<PluginScheduleReceipt>;
	};
	plugins: {
		/** Plugins 1.8: authorized service contracts; discovery does not execute providers. */
		listServices(query?: PluginServiceQuery, options?: PluginCallOptions): Promise<PluginServicePage>;
		/** Executes one declared export in a fresh restricted Worker. No live-root closures,
		 * callbacks, binary handles, automatic retries, or resources surviving the call. */
		callService(request: PluginServiceCall, options?: PluginCallOptions): Promise<PluginServiceReceipt>;
		/** Registered identities across extension points, never provider callbacks,
		 * data, settings or a grant to invoke another plugin. Offset pages may change. */
		contributions(query?: PluginContributionQuery): Promise<PluginContributionPage>;
		observeContributions(query: PluginContributionQuery, handler: PluginObservationHandler<PluginContributionPage>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		/** Public installed metadata only, no settings, paths, secrets or raw errors. */
		list(query?: PluginDirectoryQuery): Promise<PluginDirectoryPage>;
		/** Plugins 1.10: serial reaction deliveries with stable rule IDs; reload offset pages after changes. */
		observe(query: PluginDirectoryQuery, handler: PluginObservationHandler<PluginDirectoryPage>, options?: {
			ruleId?: string;
		}): PluginDisposable;
	};
	maintenance: {
		/** Maintenance 1.3: reveal native AI test controls; only the user's click starts inference. */
		requestConnectionTest(options?: PluginCallOptions): Promise<ConnectionTestReceipt>;
		/** Reveals a host backup button and awaits the user's click and file dialog.
		 * Both directions use the complete encrypted archive (host-only password);
		 * import adds host review and confirmation, then reload. Retired v1 JSON
		 * library backups are rejected. No passwords, bytes or paths are returned. */
		requestBackup(action: BackupAction, options?: PluginCallOptions): Promise<BackupReceipt>;
		snapshot(): Promise<HostMaintenanceSnapshot>;
		observe(handler: PluginObservationHandler<HostMaintenanceSnapshot>, options?: {
			ruleId?: string;
		}): PluginDisposable;
		/** Reveals the host's controls only; export/send/install still require native user actions. */
		/** Maintenance 1.4 adds data-location: shows the directory in host UI, never returns its path or opens the file manager.
		 * Also reveals updates/diagnostics/plugins/backup-import/backup-export/delete-data/ai-connection.
		 * Does not click controls, open file dialogs, approve installation or bypass typed DELETE. */
		openSettings(surface: HostMaintenanceSurface): ReturnType<HostMaintenancePort["openSettings"]>;
		/** Requires service:network. Uses the host release feed; no caller-supplied URL or silent installation. */
		checkForUpdates?(): Promise<HostMaintenanceSnapshot>;
	};
	/** Requires service:diagnostics. Counts or host-confirmed report outcomes only. */
	diagnostics?: {
		/** Diagnostics 1.2: opens host confirmation; a committed repair requires reload. */
		requestProjectionRepair(options?: PluginCallOptions): Promise<ProjectionRepairReceipt>;
		requestReport(action: DiagnosticsReportAction, options?: PluginCallOptions): Promise<DiagnosticsReportReceipt>;
		verifyProjections(options?: PluginCallOptions): Promise<ProjectionVerification>;
	};
	resources: {
		/** Resources 1.4: reader-selected, read-only directory grants; four per activation, one hour.
		 * No ambient paths. Listings are live; openDirectoryFile seals the current file bytes. */
		pickDirectory(): Promise<{
			cancelled: boolean;
			directory: ResourceDirectoryRef | null;
		}>;
		listDirectory(id: string, query?: ResourceDirectoryQuery): Promise<ResourceDirectoryPage>;
		openDirectoryFile(id: string, relativePath: string): Promise<ResourceRef>;
		releaseDirectory(id: string): Promise<void>;
		/** Resources 1.3: own local binary assets, retained across activations.
		 * Only full backups include them; uninstall deletes them. No sync. */
		assets: {
			policy(options?: PluginCallOptions): Promise<PluginAssetPolicy>;
			list(query?: PluginAssetQuery, options?: PluginCallOptions): Promise<PluginAssetPage>;
			get(key: string, options?: PluginCallOptions): Promise<PluginAsset | null>;
			store(resourceId: string, input: PluginAssetWrite, options?: PluginCallOptions): Promise<PluginAssetReceipt>;
			open(key: string, expectedRevision: string, options?: PluginCallOptions): Promise<ResourceRef>;
			delete(key: string, expectedRevision: string, options?: PluginCallOptions): Promise<{
				deleted: true;
				cleanupPending: boolean;
			}>;
		};
		pick(options?: ResourcePickOptions): Promise<{
			cancelled: boolean;
			resources: ResourceRef[];
		}>;
		/** Requires library:read. Original local file only; no implicit remote download. */
		openBook?(bookId: string): Promise<ResourceRef | null>;
		/** Resources 1.1; requires library:read. No extraction/download when the cover is unavailable. */
		openCover?(bookId: string): Promise<ResourceRef | null>;
		create(options: ResourceCreateOptions): Promise<ResourceRef>;
		stat(id: string): Promise<ResourceRef>;
		read(id: string, offset: number, length: number): Promise<ResourceChunk>;
		append(id: string, offset: number, data: Uint8Array | ArrayBuffer): Promise<ResourceRef>;
		commit(id: string): Promise<ResourceRef>;
		save(id: string, filename?: string): Promise<{
			saved: boolean;
		}>;
		/** Resources 1.5: host confirmation then OS association for a temporary document/media copy.
		 * No edit-back, arbitrary program/path, or context bundles. True is dispatch, not rendering. */
		openAssociated(id: string, options?: PluginCallOptions): Promise<{
			opened: boolean;
		}>;
		/** Also aborts uncommitted writes. */
		release(id: string): Promise<void>;
	};
	/** Requires service:sync; no keys, account identifiers, billing tickets or raw event access. */
	sync?: Omit<HostSyncPort, "backlog" | "account" | "requestSync" | "openSettings" | "requestFlow"> & {
		/** Events and blobs waiting to be pushed. */
		backlog(): ReturnType<HostSyncPort["backlog"]>;
		/** Explicit remote read of the account's tier, usage and limits; null without an account.
		 * No email, account ID, keys, session or billing ticket. */
		account(): ReturnType<HostSyncPort["account"]>;
		/** Runs one sync round on the configured backend (relay or a transport plugin such as
		 * WebDAV) and resolves when it has finished: `completed`, or `already-running` when a
		 * round was in progress (not queued again). Rejects with a coded error when no round can
		 * start (`ui/unavailable`) or the round fails (classified failures carry `sync/*` codes). */
		requestSync(): ReturnType<HostSyncPort["requestSync"]>;
		/** Opens the host Data & Sync page; not a login, disconnect or purchase. */
		openSettings(): ReturnType<HostSyncPort["openSettings"]>;
		/** Host-owned connect, disconnect, account deletion, upgrade or billing flow. Waits for the
		 * final local outcome or external handoff; cancellation cannot undo a started operation. */
		requestFlow(request: HostSyncFlowRequest, options?: PluginCallOptions): ReturnType<HostSyncPort["requestFlow"]>;
		/** Delivers each new sync snapshot (state, progress, completed cycles) while the handle lives. */
		observe(handler: PluginObservationHandler<HostSyncSnapshot>, options?: {
			ruleId?: string;
		}): PluginDisposable;
	};
	/** Persistent scoped reload hints, available under the existing read grants. */
	changes: {
		/** Open before loading a baseline. Persist the returned cursor only after
		 * processing each page. Expired cursors require a new baseline. Notices are
		 * conservative reload hints, not events or values; settings hints cover the
		 * authorized requested paths in a shared storage namespace. */
		open(query: ChangesQuery, options?: PluginCallOptions): Promise<{
			cursor: string;
		}>;
		read(query: ChangesQuery, cursor: string, limit?: number, options?: PluginCallOptions): Promise<ChangesPage>;
	};
	jobs: {
		/** jobs 1.1: event-bound starts preserve their source through restart. Every
		 * causal event subscription must have a stable ruleId. Unnamed reactions
		 * and isolated service invocations cannot create saved jobs. */
		start(plan: DurableJobPlan, options?: PluginCallOptions): Promise<DurableJobSnapshot>;
		get(id: string, options?: PluginCallOptions): Promise<DurableJobSnapshot>;
		list(query?: {
			offset?: number;
			limit?: number;
		}, options?: PluginCallOptions): Promise<{
			jobs: DurableJobSnapshot[];
			nextOffset: number | null;
		}>;
		control(id: string, action: DurableJobControl, options?: PluginCallOptions): Promise<DurableJobSnapshot>;
	};
	/** Local semantic transactions. Preview does not execute; commit consumes the
	 * frozen preview once. Query the receipt after an unknown response before retrying. */
	transactions: {
		preview(operations: AtomicOperation[], options?: PluginCallOptions): Promise<AtomicPreview>;
		commit(previewId: string, options?: PluginCallOptions): Promise<AtomicReceipt>;
		previewUndo(receiptId: string, options?: PluginCallOptions): Promise<AtomicPreview>;
		receipt(receiptId: string, options?: PluginCallOptions): Promise<AtomicReceipt | null>;
	};
	session: {
		/** Session 2.11: inspect host command permissions/workspace guards and plugin service contract/authority/capacity (Agent approval remains required), export metadata/save entry and clipboard/browser entry availability (no OS access probe), window support/capacity/target state, sync connection/credentials/provider, inference, book-targeted playback/mode, text preparation and graph prerequisites without executing
		 * or probing. Missing permission returns only the permission condition.
		 * Unknown remote health is not a local refusal or a success guarantee. */
		operationAvailability(query: OperationAvailabilityQuery, options?: PluginCallOptions): Promise<OperationAvailability>;
		/** Fresh non-sensitive metadata; contains no reading or account state. */
		environment(): Promise<HostEnvironmentSnapshot>;
		/** Delivers an initial snapshot, then changed revisions. Disposed on unload. */
		/** Session 2.7: locale effects retain their requester; other system facts keep independent sources. */
		observeEnvironment(handler: (snapshot: HostEnvironmentSnapshot, delivery?: PluginReactionEvent) => void | Promise<void>, options?: {
			ruleId?: string;
		}): PluginDisposable;
	};
	network?: {
		/** Network 2.0: this activation's immutable authorization and transport limits.
		 * All-origins authorization is ["*"], not a guarantee of endpoint reachability. */
		policy(): Promise<PluginNetworkAccess & {
			maxRedirects: number;
			maxBodyBytes: number;
			timeoutMs: number;
			maxStreamBytes: number;
			maxChunkBytes: number;
			maxConcurrentRequests: number;
			maxHostConcurrentRequests: number;
			cumulative: {
				windowMs: number;
				maxOwnerRequests: number;
				maxHostRequests: number;
				maxOwnerBytes: number;
				maxHostBytes: number;
				maxOwners: number;
			};
			retry: {
				maxRetries: number;
				baseDelayMs: number;
				maxDelayMs: number;
				statuses: readonly number[];
			};
		}>;
		/** Native HTTP; Request/init semantics and cancellation survive the Worker bridge.
		 * Bodies are buffered up to 64 MiB per direction. Calls have a 120s deadline;
		 * an abort does not undo a remote side effect already committed by the server.
		 * Network 2.0 requires networkAccess for the initial URL and each redirect.
		 * HTTPS -> HTTP redirects are denied. At most 10 redirects; manual returns
		 * the 3xx response, error rejects. Cross-origin hops drop authorization,
		 * proxy-authorization, cookie and referer; custom secret headers are the
		 * plugin's responsibility (use redirect:error for authenticated endpoints).
		 * Host/content-length are transport-owned. No implicit retry or cookie jar.
		 * Network 2.2: options.retry="safe" opts GET/HEAD without a body into at most
		 * two retries across the whole redirect chain, before response headers are
		 * returned. Other methods and all body reads are never replayed. The original
		 * deadline includes backoff; Retry-After above 30s returns the HTTP response.
		 * Attempts/uploads/read chunks share per-owner and host cumulative quotas;
		 * reactivation does not reset owner debt. policy() reports exact limits.
		 * Transport failures carry plugin/network-failed; explicit deadlines carry
		 * plugin/network-timeout, aborts plugin/cancelled. Existing structured codes
		 * survive unchanged. Unclassified native errors are not guessed from prose.
		 * HTTP error statuses still return Response; the consumer decides success. */
		fetch(input: string | URL | Request, init?: RequestInit, options?: {
			retry?: "none" | "safe";
		}): Promise<Response>;
		/** Network 2.1: headers first; download at most 1 GiB without buffering the
		 * whole response. Uploads remain capped at 64 MiB. 8 active requests per
		 * activation / 32 host-wide, shared with fetch; no hidden durable queue.
		 * Optional safe retry applies only before this opening receipt, as in fetch.
		 * init.signal cancels OPENING only; after receipt use closeStream to cancel.
		 * Close in finally if not reading to EOF. 120s absolute lifetime, including
		 * headers/redirects/reads; unload cancels and drains native resources. */
		openStream(input: string | URL | Request, init?: RequestInit, options?: {
			retry?: "none" | "safe";
		}): Promise<PluginNetworkStream>;
		/** Sequential, non-replayable reads. offset must equal bytes already delivered.
		 * One outstanding read per stream; maxBytes defaults to 64 KiB, max 1 MiB.
		 * A lost read receipt is not safely retryable: close and restart explicitly. */
		readStream(id: string, offset: number, maxBytes?: number): Promise<PluginNetworkChunk>;
		/** Idempotent for this activation's released/unknown IDs. Aborts pending reads;
		 * does not undo remote effects or remove data already saved by the plugin. */
		closeStream(id: string): Promise<void>;
	};
	llm?: {
		/** Plugin inference limits, not billing quotas. maxOutputTokensLimit since 1.3. */
		policy(): Promise<{
			defaultTimeoutMs: number;
			maxTimeoutMs: number;
			perPluginLimit: number;
			appLimit: number;
			maxOutputTokensLimit: number;
			maxImageCount: number;
			maxImageBytes: number;
			maxImageTotalBytes: number;
			maxTotalOutputTokensLimit: number;
			maxOutputCharsLimit: number;
			maxInputChars: number;
		}>;
		ask(input: PluginInferenceInput & {
			schema?: never;
			onText?: (delta: string) => void;
		}): Promise<string>;
		ask(input: PluginInferenceInput & {
			schema: Record<string, unknown>;
			onText?: never;
		}): Promise<unknown>;
		/** llm 1.3: same execution as ask, with per-attempt metadata on success.
		 * Includes structured retries; failure/cancellation rejects, not a billing receipt. */
		askDetailed(input: PluginInferenceInput & {
			schema?: never;
			onText?: (delta: string) => void;
		}): Promise<InferenceResult<string>>;
		askDetailed(input: PluginInferenceInput & {
			schema: Record<string, unknown>;
			onText?: never;
		}): Promise<InferenceResult>;
		/** llm 1.6: last 64 named requests in this plugin's local private storage.
		 * Initial metadata commits before inference dispatch; no prompt/output is retained.
		 * Includes backup/rollback and uninstall cleanup, not roaming or billing history.
		 * requestAvailable identifies this activation's handle. An older unsettled record
		 * has interrupted=true: status is last observed, not proof it still runs remotely.
		 * No automatic retry/resume; historical IDs cannot control another activation.
		 * Late terminal usage is persisted; unknown/evicted IDs return null. */
		getRequest(requestId: string): Promise<InferenceRequestReceipt | null>;
		listRequests(): Promise<InferenceRequestReceipt[]>;
		/** Requests cancellation independently of the ask RPC. The returned snapshot
		 * may still be running; query again for its outcome and provider settlement. */
		cancelRequest(requestId: string): Promise<InferenceRequestReceipt | null>;
	};
	clipboard?: {
		writeText(text: string): Promise<void>;
		/** Clipboard 1.1. This activation's sealed resource; raster decode stays in the host. */
		writeImage(resourceId: string): Promise<ResourceImageReceipt>;
	};
};
/** The actor-scoped capability view handed to `activate()`. */
export type PluginContext = {
	/** Plugins 1.2: bind automatic follow-up calls to a delivered domain/settings
	 * event. Use this context for every resulting operation, including after
	 * await. Existing permissions, object grants, resources and task owners remain
	 * unchanged. New calls after the callback settles are rejected; accepted work
	 * retains its cause. A cycle token rejects operations with plugin/event-cycle.
	 * Independent user actions use the original activation context. Plugins 1.3
	 * also accepts the second callback argument from settings.observe,
	 * library/conversations.observeInvalidation and storage.observeDocuments.
	 * Plugins 1.4 adds annotations.events.observe, retaining causes through query
	 * retries and remote/restore invalidation. The snapshot contains no token.
	 * Plugins 1.5 also accepts memory.events.observe deliveries. */
	withEvent(event: PluginReactionEvent | undefined): PluginContext;
	/** Plugins 1.7: bind an existing contribution registration's updateState or
	 * disposal to this delivery. Only handles owned by this activation are valid;
	 * subscription/resource disposables are not contribution registrations.
	 * Every operation rechecks the delivery lease. User actions use the original
	 * handle, and automatic callbacks await the bound operation before returning. */
	withEvent<T extends PluginDisposable>(event: PluginReactionEvent | undefined, registration: T): PluginEventRegistration<T>;
	readonly manifest: Readonly<PluginManifest>;
	readonly appVersion: string;
	readonly locale: string;
	/** Stable identity shared by event-bound contexts from this activation. */
	readonly lifecycle: {
		readonly phase: PluginLifecyclePhase;
	};
	/** Only capabilities visible to this plugin actor, with host-side versions. */
	readonly capabilities: Readonly<PluginCapabilityView>;
	/** The immutable object grant selected by the user for this activation. */
	readonly grants: Readonly<{
		book: PluginBookAccess;
	}>;
	domains: PluginDomains;
	contributions: PluginContributions;
	services: PluginHostServices;
};
/**
 * The default export of a plugin's entry module — `migrate` and `services` are
 * methods of this object, not named exports. It runs in a Worker with no DOM;
 * the JavaScript floor is Chrome 107 / Safari 16 with ES2024 built-ins
 * polyfilled. `Intl` APIs beyond that floor are whatever the system WebView
 * provides, so feature-test them.
 */
export type PluginModule = {
	activate(ctx: PluginContext): void | Promise<void>;
	/** Runs without activate(), in a fresh realm with intersected permissions/settings/
	 * network and a host-fixed book grant. Return bounded JSON matching the manifest. */
	services?: Record<string, (ctx: PluginContext, input: unknown) => unknown | Promise<unknown>>;
	/** Runs with storage-only authority before a changed data schema is committed. */
	migrate?(ctx: PluginMigrationContext, migration: PluginMigration): void | Promise<void>;
	deactivate?(): void | Promise<void>;
};

export {};
