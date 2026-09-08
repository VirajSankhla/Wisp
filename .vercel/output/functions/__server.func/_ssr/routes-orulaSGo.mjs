import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as formatDistanceToNowStrict } from "../_libs/date-fns.mjs";
import { a as UserButton, c as useCurrentUserState, i as SignedOut, n as DesktopScene, o as WispMark, r as SignedIn, s as cn, t as Button } from "./gates-Bv8Y3TrQ.mjs";
import { a as Search, c as Pin, d as CloudOff, f as CircleHelp, i as Smartphone, l as Download, o as QrCode, p as ChevronLeft, r as Trash2, s as Plus, t as X, u as Cloud } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as isStaleWrite, i as clampNoteTime, n as authMiddleware, o as noteFromParsed, r as backupSchema, s as noteSchema, t as BACKUP_KIND } from "./schema-C1plirbH.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { t as renderSVG } from "../_libs/uqr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-orulaSGo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var listNotes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1dcf70a1722ebc3930865cdaa4175ef71d73f64ad9f432c9ec9ff7ef684fe2b7"));
var upsertNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => noteSchema.parse(input)).handler(createSsrRpc("e78c2f532e390e54d95e521d0d8844a3a23ea4b9937fc7f812104c6218f7a030"));
/**
* Drop anything that is not a well-shaped note, then clamp absurd future
* timestamps. Never throws — a bad row is skipped so a failed sync cannot
* wipe or corrupt the local set.
*/
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
/** First-run examples that teach the heading-first, tag-on-search model. */
function sampleNotes(now = Date.now()) {
	const a = note({
		id: "wisp-sample-heading",
		heading: "Headings are the whole index",
		body: "The list only shows this line — what the note is about. Open it when you need the rest.\n\nTags stay out of the way. Search a word, or type #howto, to filter.",
		tags: ["wisp", "howto"],
		updatedAt: now - 72e4
	});
	const b = note({
		id: "wisp-sample-ideas",
		heading: "Ideas worth stealing later",
		body: "If capturing a thought takes three clicks, the thought is already gone. Keep Wisp at the edge of the screen and write the heading first.",
		tags: ["ideas", "product"],
		updatedAt: now - 288e4
	});
	const c = note({
		id: "wisp-sample-edge",
		heading: "Tuck this to the edge",
		body: "On a laptop, click the desk beside this panel and Wisp collapses to a handle. On a phone, swipe in from the right edge to bring it back.\n\nN new note · / or Ctrl+K search · Esc tuck · ? for the guide (install, backup, devices, shortcuts).",
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
function AuthChip() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-8 w-28 animate-pulse rounded-md bg-fg/6",
		"aria-hidden": "true"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 items-center gap-2",
		children: [
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cloud, {
				className: "size-3.5 shrink-0 text-muted",
				"aria-hidden": "true"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudOff, {
				className: "size-3.5 shrink-0 text-subtle",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate text-xs text-muted",
				children: user ? "Synced" : "On this device"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0 [&_span.text-sm]:max-w-[7rem] [&_span.text-sm]:truncate",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/login",
				className: "shrink-0 text-xs font-medium text-accent underline-offset-4 hover:underline",
				children: "Sync"
			}) })
		]
	});
}
function pairingQrSvg(payload) {
	return renderSVG(payload, {
		border: 2,
		blackColor: "#12110F",
		whiteColor: "#F3EFE7"
	});
}
var ALGO = { name: "Ed25519" };
function bytesToB64(bytes) {
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64ToBytes(b64) {
	const pad = "=".repeat((4 - b64.length % 4) % 4);
	const normalized = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(normalized);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
function randomBytes(n) {
	const out = new Uint8Array(n);
	crypto.getRandomValues(out);
	return out;
}
function toB64(bytes) {
	return bytesToB64(bytes);
}
function fromB64(b64) {
	return b64ToBytes(b64);
}
function guessDeviceName() {
	if (typeof navigator === "undefined") return "Wisp";
	const ua = navigator.userAgent;
	let os = "this device";
	if (/Windows/i.test(ua)) os = "Windows";
	else if (/Mac OS X/i.test(ua)) os = "macOS";
	else if (/Android/i.test(ua)) os = "Android";
	else if (/iPhone|iPad/i.test(ua)) os = "iOS";
	else if (/Linux/i.test(ua)) os = "Linux";
	return `Wisp on ${os}`;
}
async function generateIdentity(name = guessDeviceName()) {
	const pair = await crypto.subtle.generateKey(ALGO, true, ["sign", "verify"]);
	const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
	const privateKey = await crypto.subtle.exportKey("jwk", pair.privateKey);
	return {
		id: crypto.randomUUID(),
		name,
		publicKey,
		privateKey,
		createdAt: Date.now()
	};
}
async function importPrivate(jwk) {
	return crypto.subtle.importKey("jwk", jwk, ALGO, false, ["sign"]);
}
async function importPublic(jwk) {
	return crypto.subtle.importKey("jwk", jwk, ALGO, false, ["verify"]);
}
async function signPayload(privateKey, payload) {
	const key = await importPrivate(privateKey);
	const sig = await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(payload));
	return bytesToB64(new Uint8Array(sig));
}
async function verifyPayload(publicKey, payload, signature) {
	try {
		const key = await importPublic(publicKey);
		const sig = b64ToBytes(signature);
		return await crypto.subtle.verify(ALGO, key, sig, new TextEncoder().encode(payload));
	} catch {
		return false;
	}
}
function publicKeyFingerprint(jwk) {
	return `${jwk.kty ?? ""}:${jwk.crv ?? ""}:${jwk.x ?? ""}`;
}
function canonicalJson(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(",")}]`;
	const obj = value;
	return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}
var ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var OFFER_TTL_MS = 3e5;
/** 80 bits of entropy as WSP-XXXX-XXXX-XXXX-XXXX. Pairing only — never a device password. */
function formatPairingCode(bytes) {
	let bits = 0;
	let acc = 0;
	let out = "";
	for (const b of bytes) {
		acc = acc << 8 | b;
		bits += 8;
		while (bits >= 5) {
			bits -= 5;
			out += ALPHABET[acc >> bits & 31];
		}
	}
	if (bits > 0) out += ALPHABET[acc << 5 - bits & 31];
	const body = out.slice(0, 16);
	return `WSP-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}
function mintPairingCode() {
	return {
		code: formatPairingCode(randomBytes(10)),
		secret: toB64(randomBytes(32))
	};
}
function normalizePairingCode(raw) {
	return raw.trim().toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^WSP/, "WSP-").replace(/^WSP-([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})$/, "WSP-$1-$2-$3-$4");
}
var OFFER_KIND = "wisp.pair.offer.v1";
var ACCEPT_KIND = "wisp.pair.accept.v1";
var PairingError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "PairingError";
	}
};
function createOffer(identity, now = Date.now(), ttlMs = OFFER_TTL_MS) {
	const { code, secret } = mintPairingCode();
	return {
		offer: {
			v: 1,
			kind: OFFER_KIND,
			code,
			device: {
				id: identity.id,
				name: identity.name,
				publicKey: identity.publicKey
			},
			nonce: toB64(randomBytes(24)),
			exp: now + ttlMs
		},
		secret,
		used: false
	};
}
function encodeEnvelope(value) {
	return `WISP1.${toB64(new TextEncoder().encode(JSON.stringify(value)))}`;
}
function decodeEnvelope(raw) {
	const text = raw.trim();
	if (text.startsWith("WISP1.")) {
		const json = new TextDecoder().decode(fromB64(text.slice(6)));
		return JSON.parse(json);
	}
	return JSON.parse(text);
}
function isOffer(value) {
	if (!value || typeof value !== "object") return false;
	const o = value;
	return o.v === 1 && o.kind === "wisp.pair.offer.v1" && typeof o.code === "string";
}
function isAccept(value) {
	if (!value || typeof value !== "object") return false;
	const o = value;
	return o.v === 1 && o.kind === "wisp.pair.accept.v1" && typeof o.sig === "string";
}
function parseOffer(raw) {
	const value = decodeEnvelope(raw);
	if (!isOffer(value)) throw new PairingError("That is not a Wisp pairing offer");
	return {
		...value,
		code: normalizePairingCode(value.code)
	};
}
function parseAccept(raw) {
	const value = decodeEnvelope(raw);
	if (!isAccept(value)) throw new PairingError("That is not a Wisp pairing confirmation");
	return {
		...value,
		code: normalizePairingCode(value.code)
	};
}
function acceptPayload(accept) {
	return canonicalJson({
		v: accept.v,
		kind: accept.kind,
		code: accept.code,
		nonce: accept.nonce,
		device: accept.device
	});
}
async function makeAccept(identity, offer, now = Date.now()) {
	if (now > offer.exp) throw new PairingError("This pairing code has expired");
	if (offer.device.id === identity.id) throw new PairingError("You cannot pair a device with itself");
	const unsigned = {
		v: 1,
		kind: ACCEPT_KIND,
		code: offer.code,
		nonce: offer.nonce,
		device: {
			id: identity.id,
			name: identity.name,
			publicKey: identity.publicKey
		}
	};
	const sig = await signPayload(identity.privateKey, acceptPayload(unsigned));
	return {
		...unsigned,
		sig
	};
}
async function consumeAccept(stored, accept, now = Date.now()) {
	if (stored.used) throw new PairingError("This pairing code was already used");
	if (now > stored.offer.exp) throw new PairingError("This pairing code has expired");
	if (normalizePairingCode(accept.code) !== stored.offer.code) throw new PairingError("Pairing code does not match");
	if (accept.nonce !== stored.offer.nonce) throw new PairingError("Pairing nonce does not match");
	if (accept.device.id === stored.offer.device.id) throw new PairingError("You cannot pair a device with itself");
	const unsigned = {
		v: accept.v,
		kind: accept.kind,
		code: accept.code,
		nonce: accept.nonce,
		device: accept.device
	};
	if (!await verifyPayload(accept.device.publicKey, acceptPayload(unsigned), accept.sig)) throw new PairingError("Pairing confirmation signature is invalid");
	stored.used = true;
	return accept.device;
}
/**
* Signed note snapshots between already-paired devices.
*
* This is not live P2P and it does not need a Wisp relay. After two machines
* trust each other, one writes a `wisp.peer-sync.v1` file, the other opens it.
* The signature is checked against the Ed25519 key stored at pairing time.
*
* Notes in the file are plaintext (same as a backup). The signature answers
* "did this come from a device I already paired?", not "is this encrypted".
*/
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
function unsignedPayload(bundle) {
	return canonicalJson({
		v: bundle.v,
		kind: bundle.kind,
		from: bundle.from,
		exportedAt: bundle.exportedAt,
		notes: bundle.notes
	});
}
function asPublicDevice(value) {
	if (!value || typeof value !== "object") return null;
	const o = value;
	if (typeof o.id !== "string" || !o.id) return null;
	if (typeof o.name !== "string" || !o.name) return null;
	if (!o.publicKey || typeof o.publicKey !== "object") return null;
	return {
		id: o.id,
		name: o.name,
		publicKey: o.publicKey
	};
}
function asPeerSync(value) {
	if (!value || typeof value !== "object") return null;
	const o = value;
	if (o.v !== 1 || o.kind !== "wisp.peer-sync.v1") return null;
	if (typeof o.sig !== "string" || !o.sig) return null;
	if (typeof o.exportedAt !== "number" || !Number.isFinite(o.exportedAt)) return null;
	if (!Array.isArray(o.notes)) return null;
	const from = asPublicDevice(o.from);
	if (!from) return null;
	return {
		v: 1,
		kind: PEER_SYNC_KIND,
		from,
		exportedAt: o.exportedAt,
		notes: o.notes,
		sig: o.sig
	};
}
async function buildPeerSync(identity, notes, now = Date.now()) {
	const payloadNotes = Object.values(notes).map(stableNote).filter((n) => noteSchema.safeParse(n).success);
	const unsigned = {
		v: 1,
		kind: PEER_SYNC_KIND,
		from: {
			id: identity.id,
			name: identity.name,
			publicKey: identity.publicKey
		},
		exportedAt: now,
		notes: payloadNotes
	};
	const sig = await signPayload(identity.privateKey, unsignedPayload(unsigned));
	return {
		...unsigned,
		sig
	};
}
async function verifyPeerSync(raw, trusted) {
	const bundle = asPeerSync(raw);
	if (!bundle) return {
		ok: false,
		error: "Not a Wisp device snapshot (wisp.peer-sync.v1)"
	};
	const peer = trusted.find((d) => d.id === bundle.from.id);
	if (!peer) return {
		ok: false,
		error: "This snapshot is not from a device you have paired"
	};
	if (publicKeyFingerprint(peer.publicKey) !== publicKeyFingerprint(bundle.from.publicKey)) return {
		ok: false,
		error: "Device key does not match the paired key"
	};
	const unsigned = {
		v: bundle.v,
		kind: bundle.kind,
		from: bundle.from,
		exportedAt: bundle.exportedAt,
		notes: bundle.notes
	};
	if (!await verifyPayload(peer.publicKey, unsignedPayload(unsigned), bundle.sig)) return {
		ok: false,
		error: "Snapshot signature is invalid"
	};
	return {
		ok: true,
		bundle
	};
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
	const slug = bundle.from.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
	const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 10);
	triggerDownload$1(`wisp-from-${slug || "device"}-${stamp}.json`, new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
}
var DEVICE_KEY = "wisp.device.v1";
var TRUST_KEY = "wisp.trusted.v1";
var OFFER_KEY = "wisp.pairing.offer.v1";
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
function writeJson(key, value) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(key, JSON.stringify(value));
}
async function loadIdentity() {
	const existing = readJson(DEVICE_KEY);
	if (existing?.id && existing.privateKey && existing.publicKey) return existing;
	const created = await generateIdentity();
	writeJson(DEVICE_KEY, created);
	return created;
}
function listTrusted() {
	return readJson(TRUST_KEY) ?? [];
}
function rememberTrusted(device, now = Date.now()) {
	const row = {
		...device,
		pairedAt: now
	};
	const next = listTrusted().filter((d) => d.id !== device.id);
	next.push(row);
	writeJson(TRUST_KEY, next);
	return row;
}
function forgetTrusted(id) {
	writeJson(TRUST_KEY, listTrusted().filter((d) => d.id !== id));
}
function saveOpenOffer(stored) {
	writeJson(OFFER_KEY, stored);
}
function loadOpenOffer() {
	return readJson(OFFER_KEY);
}
function clearOpenOffer() {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(OFFER_KEY);
}
async function startOffer() {
	const stored = createOffer(await loadIdentity());
	saveOpenOffer(stored);
	return {
		offer: stored.offer,
		qr: encodeEnvelope(stored.offer),
		code: stored.offer.code
	};
}
function DevicesPanel({ onBack }) {
	const [mode, setMode] = (0, import_react.useState)("home");
	const [trusted, setTrusted] = (0, import_react.useState)([]);
	const [code, setCode] = (0, import_react.useState)("");
	const [qrSvg, setQrSvg] = (0, import_react.useState)("");
	const [replySvg, setReplySvg] = (0, import_react.useState)("");
	const [replyText, setReplyText] = (0, import_react.useState)("");
	const [paste, setPaste] = (0, import_react.useState)("");
	const [pendingOffer, setPendingOffer] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("Wisp");
	const [error, setError] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	function refreshTrusted() {
		setTrusted(listTrusted());
	}
	(0, import_react.useEffect)(() => {
		refreshTrusted();
		loadIdentity().then((id) => setName(id.name));
	}, []);
	async function showOffer() {
		setError(null);
		const started = await startOffer();
		setCode(started.code);
		setQrSvg(pairingQrSvg(started.qr));
		setMode("offer");
	}
	async function onPasteOffer() {
		setError(null);
		try {
			const offer = parseOffer(paste);
			setPendingOffer(offer);
			setMode("confirm");
		} catch (err) {
			setError(err instanceof PairingError ? err.message : "Could not read that code");
		}
	}
	async function confirmConnect() {
		if (!pendingOffer) return;
		setError(null);
		try {
			const accept = await makeAccept(await loadIdentity(), pendingOffer);
			rememberTrusted(pendingOffer.device);
			refreshTrusted();
			const encoded = encodeEnvelope(accept);
			setReplyText(encoded);
			setReplySvg(pairingQrSvg(encoded));
			setMode("reply");
		} catch (err) {
			setError(err instanceof PairingError ? err.message : "Pairing failed");
		}
	}
	async function finishHost() {
		setError(null);
		try {
			const stored = loadOpenOffer();
			if (!stored) throw new PairingError("No open pairing on this device");
			const peer = await consumeAccept(stored, parseAccept(paste));
			rememberTrusted(peer);
			clearOpenOffer();
			refreshTrusted();
			setMode("connected");
			toast(`Connected to ${peer.name}`);
		} catch (err) {
			setError(err instanceof PairingError ? err.message : "Could not confirm pairing");
		}
	}
	async function shareNotes() {
		downloadPeerSync(await buildPeerSync(await loadIdentity(), useNotesStore.getState().notes));
		toast("Signed notes saved — open that file on the other device");
	}
	async function applySnapshot(raw) {
		const result = await verifyPeerSync(raw, listTrusted());
		if (!result.ok) {
			setError(result.error);
			toast(result.error);
			return;
		}
		const stats = useNotesStore.getState().mergeRemote(result.bundle.notes);
		setError(null);
		setMode("home");
		toast(stats.applied ? `Merged ${stats.applied} notes from ${result.bundle.from.name}` : `Nothing newer from ${result.bundle.from.name}`);
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
	async function onReceivePaste() {
		try {
			await applySnapshot(JSON.parse(paste));
		} catch {
			setError("Paste the JSON snapshot from the other device");
		}
	}
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
							children: "Pair your own machines. No account required. After they trust each other, save a signed snapshot and open it on the other device — that is how they share memory today."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-subtle",
							children: name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void showOffer(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-3.5" }), "Connect a device"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => {
									setPaste("");
									setError(null);
									setMode("scan");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-3.5" }), "I have a code"]
							})]
						}),
						trusted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No paired devices yet." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: trusted.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-2 rounded-xl bg-fg/5 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate text-fg",
									children: d.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-xs text-subtle hover:text-fg",
									onClick: () => {
										forgetTrusted(d.id);
										refreshTrusted();
									},
									children: "Forget"
								})]
							}, d.id))
						}),
						trusted.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 rounded-2xl bg-fg/4 px-3 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-fg",
									children: "Share memory"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"This writes a ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "wisp.peer-sync.v1"
									}),
									" ",
									"file signed by this device. The other machine only accepts it if it already paired with this key. Not live sync."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										onClick: () => void shareNotes(),
										children: "Save signed notes"
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
							children: "Scan this with Wisp on your other device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-56 overflow-hidden rounded-2xl",
							dangerouslySetInnerHTML: { __html: qrSvg }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center font-mono text-xs tracking-wide text-fg",
							children: code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "After they confirm, paste their reply below so this machine can trust them too." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: paste,
							onChange: (e) => setPaste(e.target.value),
							placeholder: "Paste confirmation",
							className: "h-20 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
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
								onClick: () => void finishHost(),
								children: "Confirm"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => {
									clearOpenOffer();
									setMode("home");
								},
								children: "Cancel"
							})]
						})
					]
				}) : null,
				mode === "scan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Paste the QR payload or the pairing code envelope."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: paste,
							onChange: (e) => setPaste(e.target.value),
							placeholder: "WISP1.…",
							className: "h-24 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
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
								onClick: () => void onPasteOffer(),
								children: "Continue"
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
				mode === "confirm" && pendingOffer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-xl text-fg",
							children: [
								"Connect to “",
								pendingOffer.device.name,
								"”?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This stores a trusted key for that device. It is not an account." }),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => {
									setPendingOffer(null);
									setMode("home");
								},
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void confirmConnect(),
								children: "Connect"
							})]
						})
					]
				}) : null,
				mode === "reply" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Connected. Show this to the other device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-56 overflow-hidden rounded-2xl",
							dangerouslySetInnerHTML: { __html: replySvg }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							readOnly: true,
							value: replyText,
							className: "h-20 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg focus:outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							onClick: () => setMode("connected"),
							children: "Done"
						})
					]
				}) : null,
				mode === "connected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl text-fg",
							children: "Connected"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The devices trust each other. Save a signed notes file on one and receive it on the other to share memory. Live transport is not in this build — failed pairing never touches existing notes." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								onClick: () => void shareNotes(),
								children: "Save signed notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => setMode("home"),
								children: "Back to devices"
							})]
						})
					]
				}) : null,
				mode === "receive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Open a signed snapshot from a device you already paired."
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Or paste the JSON." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: paste,
							onChange: (e) => setPaste(e.target.value),
							placeholder: "{\"kind\":\"wisp.peer-sync.v1\",…}",
							className: "h-24 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
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
								onClick: () => void onReceivePaste(),
								children: "Merge"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								onClick: () => {
									setError(null);
									setMode("home");
								},
								children: "Cancel"
							})]
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
								children: "Wisp is a heading-first notebook. The list is an index. Tags exist for search, not decoration. It works fully offline, with no account."
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "On a phone, swipe in from the right edge. On a laptop, click the desk to tuck, the handle to open." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Pair devices, then save a signed snapshot to share memory without an account." })
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
								children: "The same Wisp installs as an app. No store listing required."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "Phone (Android)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Chrome menu → Install app / Add to Home screen. It opens full-screen, works offline, and keeps your notes on the device."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "iPhone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Safari Share → Add to Home Screen. iOS does not allow a third-party swipe-from-edge overlay; the home-screen icon is the honest path."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "Windows / Mac / ChromeOS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Chrome or Edge → the install icon in the address bar, or menu → Install Wisp. You get a standalone window. Pair a device, or sign in, only if you want another screen to share memory."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								children: "Later: a real .exe / .apk"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1",
								children: "Wrap this same UI in Tauri (desktop, data folder you choose) or Capacitor (Android). That is a packaging step, not a rewrite."
							})] })
						]
					}) : null,
					tab === "backup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-fg",
								children: [liveCount, " notes on this device. A backup is a JSON file you can keep wherever you like — including a folder on D: — and import on another screen."]
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
								"Only files with kind ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "wisp.backup.v1"
								}),
								" ",
								"are accepted as backups. A paired-device snapshot uses",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "wisp.peer-sync.v1"
								}),
								" and is opened from Devices, not here. Sign-in sync stays optional."
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
function relativeTime(ms, from = Date.now()) {
	if (from - ms < 45e3) return "now";
	try {
		return formatDistanceToNowStrict(ms, { addSuffix: true });
	} catch {
		return "";
	}
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthChip, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden text-xs text-subtle sm:block",
					children: "N new · / search · ? guide"
				})]
			})
		]
	});
}
var PUSH_DEBOUNCE_MS = 450;
var pending = /* @__PURE__ */ new Set();
var pushTimer = null;
var lastPushed = /* @__PURE__ */ new Map();
function queuePush(note) {
	pending.add(note.id);
	if (pushTimer) clearTimeout(pushTimer);
	pushTimer = setTimeout(() => {
		flushPush();
	}, PUSH_DEBOUNCE_MS);
}
async function flushPush() {
	const ids = [...pending];
	pending.clear();
	const { notes } = useNotesStore.getState();
	for (const id of ids) {
		const note = notes[id];
		if (!note) continue;
		if (lastPushed.get(id) === note.updatedAt) continue;
		try {
			await upsertNote({ data: note });
			lastPushed.set(id, note.updatedAt);
		} catch {
			pending.add(id);
		}
	}
}
function isTypingTarget(el) {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
function WispApp() {
	const panelOpen = useNotesStore((s) => s.panelOpen);
	const hasHydrated = useNotesStore((s) => s.hasHydrated);
	const noteCount = useNotesStore((s) => Object.values(s.notes).filter((n) => !n.deletedAt).length);
	const { user } = useCurrentUserState();
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
		if (!hasHydrated || !user) return;
		let cancelled = false;
		(async () => {
			try {
				const remote = await listNotes();
				if (cancelled) return;
				if (!Array.isArray(remote)) return;
				useNotesStore.getState().mergeRemote(remote);
				const { notes } = useNotesStore.getState();
				for (const note of Object.values(notes)) queuePush(note);
			} catch {}
		})();
		return () => {
			cancelled = true;
		};
	}, [hasHydrated, user]);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		return useNotesStore.subscribe((state, prev) => {
			if (state.notes === prev.notes) return;
			for (const note of Object.values(state.notes)) {
				const before = prev.notes[note.id];
				if (!before || before.updatedAt !== note.updatedAt) queuePush(note);
			}
		});
	}, [user]);
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
				className: cn("wisp-handle absolute top-1/2 right-0 z-30 flex -translate-y-1/2 flex-col items-stretch overflow-hidden rounded-l-2xl bg-bg-elevated/90 text-accent shadow-panel backdrop-blur-md transition-opacity duration-300 ease-smooth", panelOpen ? "pointer-events-none invisible opacity-0" : "opacity-100"),
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
