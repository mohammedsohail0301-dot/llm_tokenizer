#!/usr/bin/env python3
"""
Lightweight development server for LLM Tokenizer Studio.
Runs using Python standard library (zero external dependencies required).
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class TokenizerHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching control for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct MIME types for modern ES modules and assets
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

def find_available_port(start_port=8000, max_attempts=10):
    import socket
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def run_server():
    port = find_available_port(PORT)
    handler = TokenizerHTTPRequestHandler
    
    # Allow socket reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print("-" * 60)
        print(" LLM Tokenizer & 3D Embedding Studio - Local Server")
        print("-" * 60)
        print(f" Local URL   : {url}")
        print(f" Directory   : {DIRECTORY}")
        print(f" Endpoints   : Tokenizer, Vocabulary, 3D Embeddings, BPE Lab")
        print("-" * 60)
        print(" Press Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()
