// swagger-ui-dist não publica tipos próprios; só usamos o helper `absolute-path` para achar a pasta de
// assets estáticos no filesystem (ver src/app/api/docs/assets/[...path]/route.ts).
declare module 'swagger-ui-dist/absolute-path' {
  function getAbsoluteFSPath(): string
  export default getAbsoluteFSPath
}
