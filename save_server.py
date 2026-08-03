#!/usr/bin/env python3
"""결과 저장 서버 — index.html을 띄우고, 사용자가 '결과 저장'을 누르면
프로젝트 폴더의 responses/ 에 JSON 파일로 저장한다.

사용법:
    python save_server.py            # http://127.0.0.1:8899
    python save_server.py 9000       # 포트 지정

저장 위치:
    responses/20260803-142530-A-SHP.json   ← 응답 1건당 파일 1개
    responses/_all.jsonl                    ← 전체 누적(한 줄에 한 건, 분석용)

종료: Ctrl+C
"""
import datetime
import json
import pathlib
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent
OUTDIR = ROOT / "responses"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path.rstrip("/").lstrip("/") != "save":
            self.send_error(404, "not found")
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 1_000_000:
            self.send_error(400, "bad length")
            return

        try:
            record = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_error(400, "invalid json")
            return

        # 파일명은 서버가 정한다(클라이언트 값을 경로에 그대로 쓰지 않는다)
        code = re.sub(r"[^A-Za-z0-9\-]", "", str(record.get("type", {}).get("code", "unknown")))[:16] or "unknown"
        ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        name = f"{ts}-{code}.json"

        OUTDIR.mkdir(exist_ok=True)
        record.setdefault("saved_by", "save_server.py")
        (OUTDIR / name).write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        with (OUTDIR / "_all.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        print(f"  ✓ 저장: responses/{name}  ({record.get('type', {}).get('name', '')})")

        body = json.dumps({"ok": True, "file": f"responses/{name}"}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # 개발 편의: 항상 최신 HTML을 받도록 캐시 끔
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # 접속 로그는 생략, 저장 로그만 출력


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    OUTDIR.mkdir(exist_ok=True)
    with ThreadingHTTPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"법원경매 투자성향 테스트 — 결과 저장 서버")
        print(f"  브라우저에서 열기 : http://127.0.0.1:{port}/index.html")
        print(f"  저장 위치         : {OUTDIR}")
        print(f"  종료              : Ctrl+C\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n종료했습니다.")


if __name__ == "__main__":
    main()
