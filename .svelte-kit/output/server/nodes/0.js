import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CnzHzoCF.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BwBa27U2.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/DrvROEWj.js","_app/immutable/chunks/sdCM-dK-.js","_app/immutable/chunks/B4jT6VfR.js","_app/immutable/chunks/DkbI4hHk.js","_app/immutable/chunks/C_50p_lB.js","_app/immutable/chunks/nUJJkf83.js","_app/immutable/chunks/Fp-ZB4VO.js","_app/immutable/chunks/LLLOfjKj.js"];
export const stylesheets = ["_app/immutable/assets/0.C25McktA.css"];
export const fonts = [];
