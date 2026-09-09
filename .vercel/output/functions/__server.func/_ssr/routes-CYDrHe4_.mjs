import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Search, c as Pin, d as CircleHelp, f as ChevronLeft, i as Smartphone, l as Download, o as QrCode, p as Check, r as Trash2, s as Plus, t as X, u as Copy } from "../_libs/lucide-react.mjs";
import { a as object, i as number, n as boolean, o as string, r as literal, t as array } from "../_libs/zod.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as renderSVG } from "../_libs/uqr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CYDrHe4_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CLOCK_SKEW_MS = 3e5;
function clampNoteTime(clientTs, now = Date.now()) {
	if (!Number.isFinite(clientTs) || clientTs < 0) return now;
	const max = now + CLOCK_SKEW_MS;
	return clientTs > max ? max : Math.floor(clientTs);
}
function isStaleWrite(incoming, existing) {
	if (existing == null) return false;
	return incoming < existing;
}
var noteSchema = object({
	id: string().min(1).max(80),
	heading: string().max(240),
	body: string().max(2e4),
	tags: array(string().min(1).max(40)).max(24),
	pinned: boolean(),
	updatedAt: number().int().nonnegative(),
	deletedAt: number().int().nonnegative().nullable()
});
var BACKUP_KIND = "wisp.backup.v1";
var backupSchema = object({
	kind: literal(BACKUP_KIND),
	exportedAt: number().int().nonnegative(),
	notes: array(noteSchema)
});
function noteFromParsed(data) {
	return {
		id: data.id,
		heading: data.heading,
		body: data.body,
		tags: data.tags,
		pinned: data.pinned,
		updatedAt: data.updatedAt,
		deletedAt: data.deletedAt
	};
}
function sanitizeNote(input, now = Date.now()) {
	const parsed = noteSchema.safeParse(input);
	if (!parsed.success) return null;
	const note = noteFromParsed(parsed.data);
	const updatedAt = clampNoteTime(note.updatedAt, now);
	const deletedAt = note.deletedAt == null ? null : clampNoteTime(note.deletedAt, now);
	return {
		...note,
		updatedAt,
		deletedAt
	};
}
function mergeNotes(local, incoming, now = Date.now()) {
	if (!Array.isArray(incoming)) return {
		notes: local,
		applied: 0,
		skipped: 0
	};
	const notes = { ...local };
	let applied = 0;
	let skipped = 0;
	for (const item of incoming) {
		const next = sanitizeNote(item, now);
		if (!next) {
			skipped += 1;
			continue;
		}
		const existing = notes[next.id];
		if (existing && isStaleWrite(next.updatedAt, existing.updatedAt)) {
			skipped += 1;
			continue;
		}
		notes[next.id] = next;
		applied += 1;
	}
	return {
		notes,
		applied,
		skipped
	};
}
function note(partial) {
	return {
		pinned: false,
		deletedAt: null,
		...partial
	};
}
var SAMPLE_IDS = [
	"wisp-sample-heading",
	"wisp-sample-ideas",
	"wisp-sample-edge"
];
function sampleNotes(now = Date.now()) {
	const a = note({
		id: "wisp-sample-heading",
		heading: "Headings are the whole index",
		body: "The list only shows this line. Open it when you need the rest.\n\nTags stay out of the way. Search a word, or type #howto, to filter.",
		tags: ["wisp", "howto"],
		updatedAt: now - 72e4
	});
	const b = note({
		id: "wisp-sample-ideas",
		heading: "Ideas worth stealing later",
		body: "If capturing a thought takes three clicks, the thought is already gone. Keep Wisp at the edge and write the heading first.",
		tags: ["ideas", "product"],
		updatedAt: now - 288e4
	});
	const c = note({
		id: "wisp-sample-edge",
		heading: "Tuck this to the edge",
		body: "On a laptop, click the desk beside this panel and Wisp collapses to a handle. On a phone, swipe in from the right edge to bring it back.\n\nN new note · / search · Esc tuck · ? guide.",
		tags: ["howto"],
		updatedAt: now - 54e5,
		pinned: true
	});
	return {
		[a.id]: a,
		[b.id]: b,
		[c.id]: c
	};
}
function now() {
	return Date.now();
}
var useNotesStore = create()(persist((set, get) => ({
	notes: {},
	selectedId: null,
	query: "",
	activeTag: null,
	panelOpen: true,
	searchOpen: false,
	guideOpen: false,
	devicesOpen: false,
	hasHydrated: false,
	setHasHydrated: (value) => set({ hasHydrated: value }),
	seedIfEmpty: () => {
		if (Object.keys(get().notes).length > 0) return;
		set({ notes: sampleNotes() });
	},
	setQuery: (query) => set({ query }),
	setActiveTag: (tag) => set({
		activeTag: tag,
		searchOpen: true
	}),
	setSelectedId: (id) => set({
		selectedId: id,
		guideOpen: false,
		devicesOpen: false
	}),
	setPanelOpen: (open) => set({
		panelOpen: open,
		...open ? {} : {
			selectedId: null,
			searchOpen: false,
			guideOpen: false,
			devicesOpen: false
		}
	}),
	setSearchOpen: (open) => set({
		searchOpen: open,
		guideOpen: false,
		devicesOpen: false,
		...open ? {} : {
			query: "",
			activeTag: null
		}
	}),
	setGuideOpen: (open) => set({
		guideOpen: open,
		...open ? {
			selectedId: null,
			searchOpen: false,
			devicesOpen: false,
			panelOpen: true
		} : {}
	}),
	setDevicesOpen: (open) => set({
		devicesOpen: open,
		...open ? {
			selectedId: null,
			searchOpen: false,
			guideOpen: false,
			panelOpen: true
		} : {}
	}),
	createNote: () => {
		const id = crypto.randomUUID();
		const note = {
			id,
			heading: "",
			body: "",
			tags: [],
			pinned: false,
			updatedAt: now(),
			deletedAt: null
		};
		set((s) => ({
			notes: {
				...s.notes,
				[id]: note
			},
			selectedId: id,
			panelOpen: true,
			query: "",
			activeTag: null,
			searchOpen: false,
			guideOpen: false,
			devicesOpen: false
		}));
		return id;
	},
	updateNote: (id, patch) => {
		const existing = get().notes[id];
		if (!existing || existing.deletedAt) return;
		const next = {
			...existing,
			...patch,
			updatedAt: now()
		};
		set((s) => ({ notes: {
			...s.notes,
			[id]: next
		} }));
	},
	deleteNote: (id) => {
		const existing = get().notes[id];
		if (!existing) return;
		const next = {
			...existing,
			deletedAt: now(),
			updatedAt: now()
		};
		set((s) => ({
			notes: {
				...s.notes,
				[id]: next
			},
			selectedId: s.selectedId === id ? null : s.selectedId
		}));
	},
	restoreNote: (note) => {
		set((s) => ({ notes: {
			...s.notes,
			[note.id]: note
		} }));
	},
	importNotes: (incoming) => {
		let applied = 0;
		let skipped = 0;
		set((s) => {
			const result = mergeNotes(s.notes, incoming);
			applied = result.applied;
			skipped = result.skipped;
			return { notes: result.notes };
		});
		return {
			applied,
			skipped
		};
	},
	clearStarterNotes: () => {
		set((s) => {
			const notes = { ...s.notes };
			const ts = now();
			for (const id of SAMPLE_IDS) if (notes[id] && !notes[id].deletedAt) notes[id] = {
				...notes[id],
				deletedAt: ts,
				updatedAt: ts
			};
			return {
				notes,
				selectedId: s.selectedId && SAMPLE_IDS.includes(s.selectedId) ? null : s.selectedId
			};
		});
	},
	mergeRemote: (remote) => {
		let applied = 0;
		let skipped = 0;
		set((s) => {
			const result = mergeNotes(s.notes, remote);
			applied = result.applied;
			skipped = result.skipped;
			return { notes: result.notes };
		});
		return {
			applied,
			skipped
		};
	},
	snapshot: (id) => get().notes[id]
}), {
	name: "wisp.notes.v1",
	storage: createJSONStorage(() => localStorage),
	partialize: (state) => ({
		notes: state.notes,
		panelOpen: state.panelOpen
	}),
	skipHydration: true
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function DesktopScene({ panelOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "wisp-desk pointer-events-none absolute inset-0 overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wisp-grain absolute inset-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("absolute top-[18%] left-[12%] max-w-md transition-opacity duration-300 ease-smooth", panelOpen ? "opacity-100" : "opacity-40"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-display text-4xl leading-tight tracking-tight text-fg/90 md:text-5xl",
				children: [
					"Write it down.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"Let it sit at the edge."
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-sm text-sm leading-relaxed text-muted",
				children: "No account. No Google. No X. A heading, a tuck, and a connection code when you want the same memory on another screen."
			})]
		})]
	});
}
function WispMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		fill: "none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M12 3c-2.4 3.2-6.6 7.2-6.6 11.2A6.6 6.6 0 0 0 12 20.8 6.6 6.6 0 0 0 18.6 14.2C18.6 10.2 14.4 6.2 12 3Z",
			stroke: "currentColor",
			strokeWidth: "1.6",
			strokeLinejoin: "round"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M12 8.2c-1.2 1.7-3.2 3.7-3.2 5.7A3.2 3.2 0 0 0 12 17.1a3.2 3.2 0 0 0 3.2-3.2c0-2-2-4-3.2-5.7Z",
			fill: "currentColor",
			opacity: "0.85"
		})]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			outline: "border border-border-strong bg-transparent text-fg hover:bg-fg/6",
			ghost: "bg-transparent text-muted hover:bg-fg/6 hover:text-fg"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-9 rounded-lg px-3 text-xs",
			icon: "size-10",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function parseQuery(raw) {
	const tags = [];
	return {
		text: raw.replace(/#([^\s#]+)/g, (_, tag) => {
			tags.push(tag.toLowerCase());
			return " ";
		}).replace(/\s+/g, " ").trim(),
		tags
	};
}
function noteMatches(note, query, activeTag) {
	if (note.deletedAt) return false;
	const { text, tags } = parseQuery(query);
	if (activeTag && !note.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())) return false;
	for (const tag of tags) if (!note.tags.some((t) => t.toLowerCase() === tag)) return false;
	if (!text) return true;
	return `${note.heading} ${note.body} ${note.tags.join(" ")}`.toLowerCase().includes(text.toLowerCase());
}
function collectTags(notes) {
	const set = /* @__PURE__ */ new Map();
	for (const note of notes) {
		if (note.deletedAt) continue;
		for (const tag of note.tags) {
			const key = tag.toLowerCase();
			if (!set.has(key)) set.set(key, tag);
		}
	}
	return [...set.values()].sort((a, b) => a.localeCompare(b));
}
function visibleNotes(notes, query, activeTag) {
	return Object.values(notes).filter((n) => noteMatches(n, query, activeTag)).sort((a, b) => {
		if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		return b.updatedAt - a.updatedAt;
	});
}
function randomBytes(n) {
	const out = new Uint8Array(n);
	crypto.getRandomValues(out);
	return out;
}
function toB64(bytes) {
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64(b64) {
	const pad = "=".repeat((4 - b64.length % 4) % 4);
	const normalized = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(normalized);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
function asSource(bytes) {
	return bytes;
}
var CODE_PREFIX = "WISP.";
var OFFER_TTL_MS = 3e5;
var VERSION = 1;
var SECRET_BYTES = 48;
var PACKED_LEN = 53;
var PairingError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "PairingError";
	}
};
/**
* A ~77-character one-time connection code.
* Format: WISP.<base64url of version + expiry + 48 random bytes>
* Valid 5 minutes. Not a permanent password — the app derives a vault key
* from it and then forgets the code.
*/
function encodeConnectionCode(secret, now = Date.now(), ttlMs = OFFER_TTL_MS) {
	if (secret.length !== SECRET_BYTES) throw new PairingError("Bad connection secret");
	const expSec = Math.floor((now + ttlMs) / 1e3);
	const packed = new Uint8Array(PACKED_LEN);
	packed[0] = VERSION;
	packed[1] = expSec >>> 24 & 255;
	packed[2] = expSec >>> 16 & 255;
	packed[3] = expSec >>> 8 & 255;
	packed[4] = expSec & 255;
	packed.set(secret, 5);
	return `${CODE_PREFIX}${toB64(packed)}`;
}
function mintConnectionCode(now = Date.now(), ttlMs = OFFER_TTL_MS) {
	const secret = randomBytes(SECRET_BYTES);
	return {
		code: encodeConnectionCode(secret, now, ttlMs),
		secret,
		exp: now + ttlMs
	};
}
function normalizeConnectionCode(raw) {
	return raw.trim().replace(/\s+/g, "");
}
function parseConnectionCode(raw, now = Date.now()) {
	const text = normalizeConnectionCode(raw);
	if (!text.startsWith("WISP.")) throw new PairingError("That is not a Wisp connection code");
	let packed;
	try {
		packed = fromB64(text.slice(5));
	} catch {
		throw new PairingError("That code is damaged");
	}
	if (packed.length !== PACKED_LEN || packed[0] !== VERSION) throw new PairingError("That is not a Wisp connection code");
	const exp = ((packed[1] << 24 | packed[2] << 16 | packed[3] << 8 | packed[4]) >>> 0) * 1e3;
	if (now > exp) throw new PairingError("This connection code has expired");
	return {
		secret: packed.slice(5),
		exp
	};
}
function pairingQrSvg(payload) {
	return renderSVG(payload, {
		border: 2,
		blackColor: "#12110F",
		whiteColor: "#F3EFE7"
	});
}
var VAULT_KEY = "wisp.vault.v1";
function readJson(key) {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
var HKDF_SALT = new TextEncoder().encode("wisp.pair.v1");
var HKDF_INFO = new TextEncoder().encode("notes-vault");
async function deriveVaultKey(secret) {
	const base = await crypto.subtle.importKey("raw", asSource(secret), "HKDF", false, ["deriveKey"]);
	return crypto.subtle.deriveKey({
		name: "HKDF",
		hash: "SHA-256",
		salt: HKDF_SALT,
		info: HKDF_INFO
	}, base, {
		name: "AES-GCM",
		length: 256
	}, true, ["encrypt", "decrypt"]);
}
async function importVaultKey(jwk) {
	return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
function loadVault() {
	const row = readJson(VAULT_KEY);
	if (!row?.id || !row.key || !row.secret) return null;
	return row;
}
async function saveVaultFromSecret(secret) {
	const key = await deriveVaultKey(secret);
	const jwk = await crypto.subtle.exportKey("jwk", key);
	const row = {
		id: toB64(secret.slice(0, 8)),
		createdAt: Date.now(),
		key: jwk,
		secret: toB64(secret)
	};
	localStorage.setItem(VAULT_KEY, JSON.stringify(row));
	return row;
}
function clearVault() {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(VAULT_KEY);
}
function vaultSecret(vault) {
	return fromB64(vault.secret);
}
function hasVault() {
	return loadVault() != null;
}
var PEER_SYNC_KIND = "wisp.peer-sync.v1";
function stableNote(note) {
	return {
		id: note.id,
		heading: note.heading,
		body: note.body,
		tags: note.tags,
		pinned: note.pinned,
		updatedAt: note.updatedAt,
		deletedAt: note.deletedAt
	};
}
async function buildPeerSync(notes, now = Date.now()) {
	const vault = loadVault();
	if (!vault) throw new Error("This device is not connected yet");
	const key = await importVaultKey(vault.key);
	const payload = JSON.stringify(Object.values(notes).map(stableNote).filter((n) => noteSchema.safeParse(n).success));
	const iv = randomBytes(12);
	const cipher = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv: asSource(iv)
	}, key, new TextEncoder().encode(payload));
	return {
		v: 1,
		kind: PEER_SYNC_KIND,
		vaultId: vault.id,
		exportedAt: now,
		iv: toB64(iv),
		data: toB64(new Uint8Array(cipher))
	};
}
async function openPeerSync(raw) {
	if (!raw || typeof raw !== "object") return {
		ok: false,
		error: "Not a Wisp device snapshot"
	};
	const o = raw;
	if (o.v !== 1 || o.kind !== "wisp.peer-sync.v1" || typeof o.data !== "string") return {
		ok: false,
		error: "Not a Wisp device snapshot (wisp.peer-sync.v1)"
	};
	const vault = loadVault();
	if (!vault) return {
		ok: false,
		error: "Connect this device with a code first"
	};
	if (o.vaultId && o.vaultId !== vault.id) return {
		ok: false,
		error: "This snapshot is from a different Wisp connection"
	};
	try {
		const key = await importVaultKey(vault.key);
		const plain = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv: asSource(fromB64(o.iv))
		}, key, asSource(fromB64(o.data)));
		const notes = JSON.parse(new TextDecoder().decode(plain));
		if (!Array.isArray(notes)) return {
			ok: false,
			error: "Snapshot notes were unreadable"
		};
		return {
			ok: true,
			notes,
			exportedAt: o.exportedAt
		};
	} catch {
		return {
			ok: false,
			error: "Could not open that snapshot with this connection"
		};
	}
}
function triggerDownload$1(filename, blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
function downloadPeerSync(bundle) {
	triggerDownload$1(`wisp-sync-${new Date(bundle.exportedAt).toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
}
function DevicesPanel({ onBack }) {
	const [mode, setMode] = (0, import_react.useState)("home");
	const [connected, setConnected] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)("");
	const [qrSvg, setQrSvg] = (0, import_react.useState)("");
	const [paste, setPaste] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setConnected(hasVault());
	}, []);
	async function showCode() {
		setError(null);
		const existing = loadVault();
		let secret;
		if (existing) secret = vaultSecret(existing);
		else {
			secret = mintConnectionCode().secret;
			await saveVaultFromSecret(secret);
			setConnected(true);
		}
		const next = encodeConnectionCode(secret);
		setCode(next);
		setQrSvg(pairingQrSvg(next));
		setCopied(false);
		setMode("offer");
	}
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			toast("Code copied");
		} catch {
			toast("Select the code and copy it");
		}
	}
	async function enterCode() {
		setError(null);
		try {
			await saveVaultFromSecret(parseConnectionCode(paste).secret);
			setConnected(true);
			setMode("home");
			toast("Connected — this device shares that Wisp memory");
		} catch (err) {
			setError(err instanceof PairingError ? err.message : "Could not use that code");
		}
	}
	async function shareNotes() {
		try {
			downloadPeerSync(await buildPeerSync(useNotesStore.getState().notes));
			toast("Encrypted notes saved — open that file on the other device");
		} catch (err) {
			toast(err instanceof Error ? err.message : "Connect a device first");
		}
	}
	async function applySnapshot(raw) {
		const result = await openPeerSync(raw);
		if (!result.ok) {
			setError(result.error);
			toast(result.error);
			return;
		}
		const stats = useNotesStore.getState().mergeRemote(result.notes);
		setError(null);
		setMode("home");
		toast(stats.applied ? `Merged ${stats.applied} notes` : "Nothing newer in that snapshot");
	}
	async function onReceiveFile(file) {
		try {
			await applySnapshot(JSON.parse(await file.text()));
		} catch {
			const message = "Could not read that snapshot";
			setError(message);
			toast(message);
		}
	}
	const vault = loadVault();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1 px-2 pt-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon-sm",
				onClick: onBack,
				"aria-label": "Back to headings",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg tracking-tight",
				children: "Devices"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted",
			children: [
				mode === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Connect your own machines with a one-time code or QR. No Google. No X. No account."
						}),
						connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-subtle",
							children: [
								"This device is connected",
								vault ? ` · ${vault.id}` : "",
								"."
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Not connected yet." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void showCode(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-3.5" }), connected ? "Invite another device" : "Show a code"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => {
									setPaste("");
									setError(null);
									setMode("enter");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-3.5" }), "Enter a code"]
							})]
						}),
						connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 rounded-2xl bg-fg/4 px-3 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-fg",
									children: "Share memory"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Save an encrypted snapshot and open it on the other device. Both must have used the same connection code." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										onClick: () => void shareNotes(),
										children: "Save notes for the other device"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										variant: "outline",
										onClick: () => {
											setPaste("");
											setError(null);
											setMode("receive");
										},
										children: "Receive notes"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-xs text-subtle hover:text-fg",
									onClick: () => {
										clearVault();
										setConnected(false);
										toast("Connection forgotten on this device");
									},
									children: "Forget connection"
								})
							]
						}) : null
					]
				}) : null,
				mode === "offer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Scan this QR on your other device, or copy the code and paste it there. It expires in 5 minutes."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-56 overflow-hidden rounded-2xl",
							dangerouslySetInnerHTML: { __html: qrSvg }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all text-center font-mono text-xs leading-relaxed tracking-wide text-fg",
							children: code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void copyCode(),
								children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), copied ? "Copied" : "Copy code"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => setMode("home"),
								children: "Done"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "On the other screen: Devices → Enter a code. After that, save notes here and receive them there." })
					]
				}) : null,
				mode === "enter" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Paste the WISP.… code from your other device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: paste,
							onChange: (e) => setPaste(e.target.value),
							placeholder: "WISP.…",
							className: "h-24 w-full rounded-xl bg-fg/6 px-3 py-2 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void enterCode(),
								children: "Connect"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => setMode("home"),
								children: "Cancel"
							})]
						})
					]
				}) : null,
				mode === "receive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Open the encrypted snapshot from a device that used the same code."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							onClick: () => fileRef.current?.click(),
							children: "Choose file"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "application/json,.json",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (file) onReceiveFile(file);
							}
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "outline",
							onClick: () => {
								setError(null);
								setMode("home");
							},
							children: "Cancel"
						})
					]
				}) : null
			]
		})]
	});
}
function buildBackup(notes) {
	return {
		kind: BACKUP_KIND,
		exportedAt: Date.now(),
		notes: Object.values(notes).filter((n) => !n.deletedAt)
	};
}
function parseBackup(raw) {
	const parsed = backupSchema.safeParse(raw);
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return {
			ok: false,
			error: `Not a Wisp backup (${first?.path?.length ? first.path.join(".") : "file"}: ${first?.message ?? "invalid"})`
		};
	}
	return {
		ok: true,
		exportedAt: parsed.data.exportedAt,
		notes: parsed.data.notes.map(noteFromParsed)
	};
}
function noteToMarkdown(note) {
	const title = note.heading.trim() || "Untitled";
	const tags = note.tags.length ? `\n\n${note.tags.map((t) => `#${t}`).join(" ")}` : "";
	return `# ${title}\n\n${note.body.trim()}${tags}\n`;
}
function triggerDownload(filename, blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
function downloadBackup(notes) {
	const payload = buildBackup(notes);
	triggerDownload(`wisp-backup-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
}
function downloadMarkdown(note) {
	triggerDownload(`${(note.heading.trim() || "note").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "note"}.md`, new Blob([noteToMarkdown(note)], { type: "text/markdown" }));
}
function WispGuide({ onBack }) {
	const [tab, setTab] = (0, import_react.useState)("use");
	const fileRef = (0, import_react.useRef)(null);
	const notes = useNotesStore((s) => s.notes);
	const liveCount = Object.values(notes).filter((n) => !n.deletedAt).length;
	const hasStarters = SAMPLE_IDS.some((id) => notes[id] && !notes[id].deletedAt);
	async function onImportFile(file) {
		try {
			const parsed = parseBackup(JSON.parse(await file.text()));
			if (!parsed.ok) {
				toast(parsed.error);
				return;
			}
			const result = useNotesStore.getState().importNotes(parsed.notes);
			toast(result.applied ? `Merged ${result.applied} notes from backup` : "No newer notes in that backup");
		} catch {
			toast("Could not read that backup");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 px-2 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					size: "icon-sm",
					onClick: onBack,
					"aria-label": "Back to headings",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg tracking-tight",
					children: "Guide"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-1 px-4",
				children: [
					["use", "Use"],
					["install", "Install"],
					["backup", "Backup"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(id),
					className: cn("h-9 rounded-full px-3 text-xs font-medium transition-colors duration-150", tab === id ? "bg-accent text-accent-fg" : "bg-fg/6 text-muted hover:text-fg"),
					children: label
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted",
				children: [
					tab === "use" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-fg",
								children: "Wisp is a heading-first notebook. It works fully offline. There is no sign-in."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "N"
									}), " — new note"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "/ or Ctrl+K"
									}), " — search headings and #tags"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Esc"
									}), " — back, then tuck to the edge"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "?"
									}), " — this guide"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Phone: swipe in from the right. Laptop: click the desk to tuck." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Connect another screen with a code or QR — never with Google or X." })
								]
							}),
							hasStarters ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => {
									useNotesStore.getState().clearStarterNotes();
									toast("Starter notes removed");
								},
								children: "Remove starter notes"
							}) : null
						]
					}) : null,
					tab === "install" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-fg",
								children: "You can use Wisp as an app without an account store, an .exe, or an .apk. Install it from this page."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "Windows, Mac, Chromebook"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Chrome or Edge → the install icon in the address bar, or menu → Install Wisp. You get a standalone window. That is the app."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "Android"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Chrome menu → Install app / Add to Home screen. It opens full-screen and works offline."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "iPhone & iPad"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Safari only: Share → Add to Home Screen. iOS does not allow a third-party swipe-from-edge overlay or a sideloaded .ipa without Apple’s store. The home-screen icon is the honest path."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A classic .exe / .apk is a packaging step from the same project (Tauri / Capacitor). See the README if you want those files." })
						]
					}) : null,
					tab === "backup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-fg",
								children: [liveCount, " notes on this device. A backup is a JSON file you keep wherever you like."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										onClick: () => {
											downloadBackup(notes);
											toast("Backup downloaded");
										},
										children: "Download backup"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										size: "sm",
										onClick: () => fileRef.current?.click(),
										children: "Import backup"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										ref: fileRef,
										type: "file",
										accept: "application/json,.json",
										className: "hidden",
										onChange: (e) => {
											const file = e.target.files?.[0];
											e.target.value = "";
											if (file) onImportFile(file);
										}
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"Backups use ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "wisp.backup.v1"
								}),
								". Connected-device snapshots are encrypted and opened from Devices."
							] })
						]
					}) : null
				]
			})
		]
	});
}
function NoteEditor({ note, onBack, onChange, onDelete, onTogglePin }) {
	const headingRef = (0, import_react.useRef)(null);
	const [tagDraft, setTagDraft] = (0, import_react.useState)("");
	const [savedFlash, setSavedFlash] = (0, import_react.useState)(false);
	const skipFlash = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		const el = headingRef.current;
		if (el) {
			el.style.height = "auto";
			el.style.height = `${el.scrollHeight}px`;
			if (!note.heading) el.focus();
		}
	}, [note.id, note.heading]);
	(0, import_react.useEffect)(() => {
		if (skipFlash.current) {
			skipFlash.current = false;
			return;
		}
		setSavedFlash(true);
		const t = window.setTimeout(() => setSavedFlash(false), 900);
		return () => window.clearTimeout(t);
	}, [note.updatedAt]);
	(0, import_react.useEffect)(() => {
		skipFlash.current = true;
		setTagDraft("");
	}, [note.id]);
	function commitTag() {
		const next = tagDraft.trim().replace(/^#/, "").slice(0, 40);
		if (!next) {
			setTagDraft("");
			return;
		}
		if (note.tags.length >= 24) {
			setTagDraft("");
			return;
		}
		if (!note.tags.some((t) => t.toLowerCase() === next.toLowerCase())) onChange({ tags: [...note.tags, next] });
		setTagDraft("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 px-2 pt-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						size: "icon-sm",
						onClick: onBack,
						"aria-label": "Back to headings",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("ml-1 text-xs text-subtle transition-opacity duration-300", savedFlash ? "opacity-100" : "opacity-0"),
						children: "Saved"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon-sm",
								onClick: () => {
									downloadMarkdown(note);
									toast("Markdown downloaded");
								},
								"aria-label": "Download as Markdown",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon-sm",
								onClick: onTogglePin,
								"aria-label": note.pinned ? "Unpin" : "Pin",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: cn("size-4", note.pinned ? "fill-pin text-pin" : "") })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								size: "icon-sm",
								onClick: onDelete,
								"aria-label": "Delete note",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				ref: headingRef,
				value: note.heading,
				onChange: (e) => onChange({ heading: e.target.value.slice(0, 240) }),
				placeholder: "Heading",
				rows: 1,
				maxLength: 240,
				className: "mt-1 min-h-12 w-full resize-none bg-transparent px-4 font-display text-display-note leading-tight tracking-tight text-fg placeholder:text-subtle focus:outline-none",
				onInput: (e) => {
					const el = e.currentTarget;
					el.style.height = "auto";
					el.style.height = `${el.scrollHeight}px`;
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: note.body,
				onChange: (e) => onChange({ body: e.target.value.slice(0, 2e4) }),
				placeholder: "The rest, if you need it.",
				maxLength: 2e4,
				className: "min-h-32 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-fg placeholder:text-subtle focus:outline-none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium tracking-wide text-subtle uppercase",
					children: "Tags — used in search, hidden in the list"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-1.5",
					children: [note.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex h-8 items-center gap-1 rounded-full bg-fg/6 pl-2.5 pr-1 text-xs text-muted",
						children: [tag, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "grid size-6 place-items-center rounded-full hover:bg-fg/10 hover:text-fg",
							onClick: () => onChange({ tags: note.tags.filter((t) => t !== tag) }),
							"aria-label": `Remove ${tag}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
						})]
					}, tag)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: tagDraft,
						onChange: (e) => setTagDraft(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								commitTag();
							}
						},
						onBlur: commitTag,
						placeholder: note.tags.length ? "Add" : "Add a tag",
						className: "h-8 min-w-28 flex-1 bg-transparent text-xs text-fg placeholder:text-subtle focus:outline-none"
					})]
				})]
			})
		]
	});
}
function relativeTime(ts, now = Date.now()) {
	const diff = Math.max(0, now - ts);
	const min = Math.round(diff / 6e4);
	if (min < 1) return "now";
	if (min < 60) return `${min}m`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr}h`;
	const day = Math.round(hr / 24);
	if (day < 14) return `${day}d`;
	return new Date(ts).toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
}
function Row({ note, selected, onSelect }) {
	const heading = note.heading.trim() || "Untitled";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onSelect(note.id),
		className: cn("flex w-full items-baseline gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150", selected ? "bg-fg/8" : "hover:bg-fg/5"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 flex-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-2",
				children: [note.pinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, {
					className: "size-3 shrink-0 text-pin",
					strokeWidth: 2,
					"aria-label": "Pinned"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("truncate font-display text-note leading-snug tracking-tight", note.heading.trim() ? "text-fg" : "text-muted italic"),
					children: heading
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 font-sans text-xs tabular-nums text-subtle",
			children: relativeTime(note.updatedAt)
		})]
	}) });
}
function NoteList({ notes, selectedId, searching, onSelect }) {
	if (notes.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-xl text-fg",
			children: "Nothing here"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-xs text-sm leading-relaxed text-muted",
			children: searching ? "No headings or tags match. Clear search to see everything." : "Write a heading. That single line is the whole index."
		})]
	});
	const pinned = notes.filter((n) => n.pinned);
	const rest = notes.filter((n) => !n.pinned);
	const showHeads = pinned.length > 0 && rest.length > 0 && !searching;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col px-1 pb-2",
		children: [
			showHeads ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-subtle uppercase",
				children: "Pinned"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col",
				children: pinned.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					note,
					selected: note.id === selectedId,
					onSelect
				}, note.id))
			}),
			showHeads ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-subtle uppercase",
				children: "Latest"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col",
				children: rest.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					note,
					selected: note.id === selectedId,
					onSelect
				}, note.id))
			})
		]
	});
}
function WispPanel({ searchRef }) {
	const notes = useNotesStore((s) => s.notes);
	const selectedId = useNotesStore((s) => s.selectedId);
	const query = useNotesStore((s) => s.query);
	const activeTag = useNotesStore((s) => s.activeTag);
	const searchOpen = useNotesStore((s) => s.searchOpen);
	const guideOpen = useNotesStore((s) => s.guideOpen);
	const devicesOpen = useNotesStore((s) => s.devicesOpen);
	const hasHydrated = useNotesStore((s) => s.hasHydrated);
	const selected = selectedId ? notes[selectedId] : void 0;
	const showEditor = Boolean(selected && !selected.deletedAt);
	const list = (0, import_react.useMemo)(() => visibleNotes(notes, query, activeTag), [
		notes,
		query,
		activeTag
	]);
	const tags = (0, import_react.useMemo)(() => collectTags(Object.values(notes)), [notes]);
	(0, import_react.useEffect)(() => {
		if (searchOpen) searchRef.current?.focus();
	}, [searchOpen, searchRef]);
	function handleDelete(id) {
		const snap = useNotesStore.getState().snapshot(id);
		useNotesStore.getState().deleteNote(id);
		toast("Note removed", { action: {
			label: "Undo",
			onClick: () => {
				if (snap) useNotesStore.getState().restoreNote({
					...snap,
					deletedAt: null,
					updatedAt: Date.now()
				});
			}
		} });
	}
	const liveCount = Object.values(notes).filter((n) => !n.deletedAt).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-2 px-3 pt-3 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2 px-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WispMark, { className: "size-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg tracking-tight",
						children: "Wisp"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon-sm",
							"aria-label": devicesOpen ? "Close devices" : "Devices",
							onClick: () => useNotesStore.getState().setDevicesOpen(!devicesOpen),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon-sm",
							"aria-label": guideOpen ? "Close guide" : "Open guide",
							onClick: () => useNotesStore.getState().setGuideOpen(!guideOpen),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon-sm",
							"aria-label": searchOpen ? "Close search" : "Search",
							onClick: () => useNotesStore.getState().setSearchOpen(!searchOpen),
							children: searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon-sm",
							"aria-label": "New note",
							onClick: () => useNotesStore.getState().createNote(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
						})
					]
				})]
			}),
			searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "wisp-search",
						children: "Search notes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "wisp-search",
						ref: searchRef,
						value: query,
						onChange: (e) => useNotesStore.getState().setQuery(e.target.value),
						placeholder: "Search headings, or #tag",
						className: "h-11 w-full rounded-xl bg-fg/6 px-3 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30"
					}),
					tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: tags.map((tag) => {
							const on = activeTag?.toLowerCase() === tag.toLowerCase() || query.toLowerCase().includes(`#${tag.toLowerCase()}`);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => useNotesStore.getState().setActiveTag(on && activeTag === tag ? null : tag),
								className: cn("h-8 rounded-full px-3 text-xs transition-colors duration-150", on ? "bg-accent text-accent-fg" : "bg-fg/6 text-muted hover:text-fg"),
								children: tag
							}, tag);
						})
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: !hasHydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2 px-4 py-4",
					children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-11 overflow-hidden rounded-xl bg-fg/6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wisp-shimmer h-full w-full" })
					}, i))
				}) : devicesOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicesPanel, { onBack: () => useNotesStore.getState().setDevicesOpen(false) }) : guideOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WispGuide, { onBack: () => useNotesStore.getState().setGuideOpen(false) }) : showEditor && selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteEditor, {
					note: selected,
					onBack: () => useNotesStore.getState().setSelectedId(null),
					onChange: (patch) => useNotesStore.getState().updateNote(selected.id, patch),
					onDelete: () => handleDelete(selected.id),
					onTogglePin: () => useNotesStore.getState().updateNote(selected.id, { pinned: !selected.pinned })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteList, {
					notes: list,
					selectedId,
					searching: Boolean(query.trim() || activeTag),
					onSelect: (id) => useNotesStore.getState().setSelectedId(id)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex items-center justify-between gap-3 border-t border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [liveCount, " on this device"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden text-xs text-subtle sm:block",
					children: "N new · / search · ? guide"
				})]
			})
		]
	});
}
function isTypingTarget(el) {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
function WispApp() {
	const panelOpen = useNotesStore((s) => s.panelOpen);
	const noteCount = useNotesStore((s) => Object.values(s.notes).filter((n) => !n.deletedAt).length);
	const searchRef = (0, import_react.useRef)(null);
	const touchStart = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const unsub = useNotesStore.persist.onFinishHydration(() => {
			useNotesStore.getState().seedIfEmpty();
			useNotesStore.getState().setHasHydrated(true);
		});
		useNotesStore.persist.rehydrate();
		return unsub;
	}, []);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (e.key === "Escape") {
				const s = useNotesStore.getState();
				if (s.devicesOpen) {
					s.setDevicesOpen(false);
					return;
				}
				if (s.guideOpen) {
					s.setGuideOpen(false);
					return;
				}
				if (s.selectedId) {
					s.setSelectedId(null);
					return;
				}
				if (s.searchOpen) {
					s.setSearchOpen(false);
					return;
				}
				s.setPanelOpen(false);
				return;
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				useNotesStore.getState().setPanelOpen(true);
				useNotesStore.getState().setSearchOpen(true);
				return;
			}
			if (isTypingTarget(e.target)) return;
			if (e.key === "n" || e.key === "N") {
				e.preventDefault();
				useNotesStore.getState().createNote();
			} else if (e.key === "/") {
				e.preventDefault();
				useNotesStore.getState().setPanelOpen(true);
				useNotesStore.getState().setSearchOpen(true);
			} else if (e.key === "?") {
				e.preventDefault();
				const s = useNotesStore.getState();
				s.setGuideOpen(!s.guideOpen);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	function onTouchStart(e) {
		const t = e.changedTouches[0];
		if (!t) return;
		touchStart.current = {
			x: t.clientX,
			y: t.clientY
		};
	}
	function onTouchEnd(e) {
		const start = touchStart.current;
		touchStart.current = null;
		const t = e.changedTouches[0];
		if (!start || !t) return;
		const dx = t.clientX - start.x;
		const dy = t.clientY - start.y;
		if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
		const fromRight = start.x > window.innerWidth - 56;
		if (!panelOpen && dx < 0 && fromRight) useNotesStore.getState().setPanelOpen(true);
		else if (panelOpen && dx > 0) useNotesStore.getState().setPanelOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh overflow-hidden bg-bg text-fg",
		onTouchStart,
		onTouchEnd,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopScene, { panelOpen }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute inset-0 z-0",
				"aria-label": "Tuck Wisp to the edge",
				onClick: () => useNotesStore.getState().setPanelOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("wisp-handle absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-stretch overflow-hidden rounded-l-2xl bg-bg-elevated/90 text-accent shadow-panel backdrop-blur-md transition-[transform,opacity] duration-300 ease-smooth", panelOpen ? "pointer-events-none z-10 translate-x-full opacity-0" : "z-30 translate-x-0 opacity-100"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => useNotesStore.getState().createNote(),
						"aria-label": "New note",
						className: "grid h-11 w-11 place-items-center hover:bg-fg/6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => useNotesStore.getState().setPanelOpen(true),
						"aria-label": "Open Wisp",
						className: "grid h-14 w-11 place-items-center hover:bg-fg/6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WispMark, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pb-2 text-center text-xs tabular-nums text-muted",
						children: noteCount
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("wisp-scrim absolute inset-0 z-10 bg-bg/40 transition-opacity duration-300 ease-smooth md:bg-transparent", panelOpen ? "opacity-100 md:pointer-events-none md:opacity-0" : "pointer-events-none opacity-0"),
				onClick: () => useNotesStore.getState().setPanelOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: cn("wisp-panel absolute inset-y-0 right-0 z-20 flex w-full flex-col md:w-panel", "p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]", "transition-transform duration-300 ease-smooth", panelOpen ? "translate-x-0" : "translate-x-full"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-bg-panel shadow-panel backdrop-blur-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WispPanel, { searchRef })
				})
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WispApp, {});
}
//#endregion
export { Home as component };
