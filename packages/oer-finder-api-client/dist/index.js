import a from "openapi-fetch";
function f(r, e) {
  return a({
    baseUrl: r.replace(/\/$/, ""),
    // Remove trailing slash
    headers: e == null ? void 0 : e.headers,
    fetch: e == null ? void 0 : e.fetch
  });
}
export {
  f as createOerClient
};
