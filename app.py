#!/usr/bin/env python3
"""
Local web server for the passphrase cipher (encryption.py), built entirely
on the Python standard library — no pip install, no Flask, nothing extra.

Usage:
    python3 app.py            # serves on http://127.0.0.1:8000
    python3 app.py 4443       # or pick your own port

Then open the printed URL in a browser. Everything runs locally; nothing
leaves the machine.
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import encryption  # must sit in the same folder as this file

STATIC_DIR = Path(__file__).resolve().parent
INDEX_FILE = STATIC_DIR / "index.html"


class CipherHandler(BaseHTTPRequestHandler):
    server_version = "CipherServer/1.0"

    # ---- helpers -----------------------------------------------------

    def _send_bytes(self, status: int, content_type: str, body: bytes):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: dict):
        self._send_bytes(status, "application/json; charset=utf-8",
                          json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def _send_html(self, status: int, html_text: str):
        self._send_bytes(status, "text/html; charset=utf-8", html_text.encode("utf-8"))

    # ---- routes --------------------------------------------------------

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            try:
                self._send_html(200, INDEX_FILE.read_text(encoding="utf-8"))
            except FileNotFoundError:
                self._send_html(500, "<h1>index.html not found next to app.py</h1>")
        else:
            self._send_html(404, "<h1>404 Not Found</h1>")

    def do_POST(self):
        if self.path not in ("/api/encode", "/api/decode"):
            self._send_json(404, {"error": "Unknown endpoint"})
            return

        length = int(self.headers.get("Content-Length", 0) or 0)
        raw_body = self.rfile.read(length) if length else b""

        try:
            data = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        passphrase = data.get("passphrase", "")
        text = data.get("text", "")

        try:
            if self.path == "/api/encode":
                result = encryption.encode(passphrase, text)
            else:
                result = encryption.decode(passphrase, text)
            self._send_json(200, {"result": result})
        except Exception as exc:
            self._send_json(400, {"error": str(exc)})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("127.0.0.1", port), CipherHandler)
    print(f"Serving on http://127.0.0.1:{port}  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.shutdown()


if __name__ == "__main__":
    main()
