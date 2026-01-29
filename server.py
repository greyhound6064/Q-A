#!/usr/bin/env python3
import http.server
import socketserver
import os

# 현재 디렉토리로 변경 (스크립트 파일의 디렉토리)
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

# 서버 설정
PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

print(f"Starting server on http://localhost:{PORT}")
print(f"Serving files from: {current_dir}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Server is running. Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")