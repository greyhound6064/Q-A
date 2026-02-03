#!/usr/bin/env python3
import http.server
import socketserver
import os

# 현재 디렉토리로 변경 (스크립트 파일의 디렉토리)
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

# 커스텀 핸들러 클래스 (MIME 타입 설정)
class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # XML 파일에 대한 올바른 MIME 타입 설정
        if self.path.endswith('.xml'):
            self.send_header('Content-Type', 'application/xml; charset=utf-8')
        # robots.txt에 대한 MIME 타입 설정
        elif self.path.endswith('robots.txt'):
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
        super().end_headers()

# 서버 설정
PORT = 8000
Handler = CustomHTTPRequestHandler

print(f"Starting server on http://localhost:{PORT}")
print(f"Serving files from: {current_dir}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Server is running. Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")