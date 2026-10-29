import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name) ? args[args.indexOf(name)+1] : fallback;
const root = resolve(import.meta.dirname, '..', args.includes('--dist') ? 'dist' : '.');
const port = Number(option('--port',process.env.PORT || 5173));
const base = option('--base','/');
if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base) || !Number.isInteger(port) || port<1024 || port>65535) throw Error('Usa --base /nome-repository/ e una porta da 1024 a 65535.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpeg': 'image/jpeg', '.svg':'image/svg+xml' };
const server=http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(base!=='/' && requested===base.slice(0,-1)) {res.writeHead(308,{Location:base});res.end();return;}
    if(!requested.startsWith(base)) throw Error('Risorsa fuori dal sito');
    const name='/'+requested.slice(base.length);
    if (name.split('/').some(part => part.startsWith('.'))) throw Error('Forbidden');
    const path = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!path.startsWith(root + sep)) throw Error('Forbidden');
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Risorsa non disponibile');
  }
});
server.on('error',error=>{console.error(`Server non avviato sulla porta ${port}: ${error.message}`);process.exitCode=1;});
server.listen(port, '127.0.0.1', () => console.log(`Coach OS: http://127.0.0.1:${port}${base} — Ctrl+C per arrestare`));
