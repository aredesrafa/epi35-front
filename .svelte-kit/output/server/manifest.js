export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "epi35-front/_app",
	assets: new Set([".nojekyll","favicon.png","favicon.svg","logo-icon.svg","logo-text.svg"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.gbhKO5A5.js",app:"_app/immutable/entry/app.B6ecrqJb.js",imports:["_app/immutable/entry/start.gbhKO5A5.js","_app/immutable/chunks/Fp-ZB4VO.js","_app/immutable/chunks/BwBa27U2.js","_app/immutable/chunks/sdCM-dK-.js","_app/immutable/entry/app.B6ecrqJb.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BwBa27U2.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/epi35-front/","/epi35-front/catalogo","/epi35-front/configuracoes","/epi35-front/estoque","/epi35-front/fichas","/epi35-front/notas","/epi35-front/relatorios","/epi35-front/relatorios/auditoria"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
