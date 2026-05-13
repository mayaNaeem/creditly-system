import { ServerResponse } from 'http';

process.env.NG_ALLOWED_HOSTS ||= 'localhost,127.0.0.1,localhost:4000,127.0.0.1:4000';

const CSP_HEADER = "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; connect-src 'self' http: https: ws: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline' http: https:;";

const originalSetHeader = ServerResponse.prototype.setHeader;
ServerResponse.prototype.setHeader = function (name, value) {
  if (typeof name === 'string' && name.toLowerCase() === 'content-security-policy') {
    return originalSetHeader.call(this, name, CSP_HEADER);
  }
  return originalSetHeader.call(this, name, value);
};

const { reqHandler } = await import('./dist/creditly-system/server/server.mjs');

const port = process.env.PORT || 4000;
reqHandler.listen(port, () => {
  console.log(`Wrapper SSR listening on http://localhost:${port}`);
  console.log(`NG_ALLOWED_HOSTS=${process.env.NG_ALLOWED_HOSTS}`);
});
