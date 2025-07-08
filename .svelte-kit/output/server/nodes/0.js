import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DbEYMVHT.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BwBa27U2.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/CW_GOkfj.js","_app/immutable/chunks/sdCM-dK-.js","_app/immutable/chunks/K6YgHZ2F.js","_app/immutable/chunks/CtS_W4lD.js","_app/immutable/chunks/C6wHvHr5.js","_app/immutable/chunks/Aei8ILbI.js","_app/immutable/chunks/D2-VM4sz.js","_app/immutable/chunks/BfNvYzkb.js"];
export const stylesheets = ["_app/immutable/assets/0.C25McktA.css"];
export const fonts = [];
