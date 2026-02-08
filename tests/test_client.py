from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        def handle_console(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(log_entry)
        page.on('console', handle_console)

        # Navigate
        page.goto('http://localhost:8000/opencode-client.html')
        page.wait_for_load_state('networkidle')

        # Click connect
        page.click('text=连接')
        page.wait_for_timeout(2000)

        # Click new session
        page.click('text=新建会话')
        page.wait_for_timeout(3000)

        # Wait for textarea
        page.wait_for_selector('textarea:not([disabled])')
        page.wait_for_timeout(500)

        # Type message
        page.fill('textarea', '列出桌面文件')
        page.wait_for_timeout(500)

        # Click send
        page.click('text=发送')

        # Wait for response
        page.wait_for_timeout(20000)

        # Screenshot
        page.screenshot(path='test_result.png')
        print("\nScreenshot saved to test_result.png")

        # Print console summary
        print("\n=== Console Summary ===")
        part_updates = [log for log in console_logs if '[PART]' in log]
        for log in part_updates[:20]:  # First 20 part updates
            print(log)

        browser.close()

if __name__ == '__main__':
    main()
