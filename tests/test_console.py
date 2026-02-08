#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        def handle_console(msg):
            print(f"[CONSOLE {msg.type}] {msg.text}")

        page.on('console', handle_console)

        print("=== Navigating to page ===")
        page.goto('http://localhost:8000/opencode-client.html')
        page.wait_for_load_state('networkidle')

        print("\n=== Clicking Connect ===")
        page.click('button:has-text("连接")')
        page.wait_for_timeout(2000)

        print("\n=== Clicking New Session ===")
        page.click('button:has-text("新建会话")')
        page.wait_for_timeout(3000)

        print("\n=== Waiting for textarea ===")
        page.wait_for_selector('textarea:not([disabled])', timeout=10000)

        print("\n=== Sending message: 列出桌面文件 ===")
        page.fill('textarea', '列出桌面文件')
        page.wait_for_timeout(500)

        print("\n=== Clicking Send ===")
        page.click('button:has-text("发送")')

        print("\n=== Waiting for response (20 seconds) ===")
        page.wait_for_timeout(20000)

        print("\n=== Taking screenshot ===")
        page.screenshot(path='/tmp/opencode_test.png')
        print("Screenshot saved to /tmp/opencode_test.png")

        browser.close()

if __name__ == '__main__':
    main()
