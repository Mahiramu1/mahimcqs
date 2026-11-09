import json
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import ProxyHandler, build_opener

from playwright.sync_api import sync_playwright
from reportlab.pdfgen.canvas import Canvas


def check_study_app(page, pdf_path):
    base = "http://127.0.0.1:3987"
    with build_opener(ProxyHandler({})).open(base + "/api/health") as response:
        assert json.load(response)["ok"]
    page.goto(base)
    page.get_by_role("button", name="Start biology quiz").click()
    for index, answer in enumerate([1, 0, 2, 3]):
        page.locator(f'input[name="practice-{index}"]').nth(answer).check()
    page.get_by_role("button", name="Score quiz").click()
    page.get_by_text("Score: 4 / 4").wait_for()
    page.locator("input[type=file]").set_input_files(pdf_path)
    page.wait_for_function("document.querySelector('textarea')?.value.includes('First page')")
    page.get_by_role("button", name="Next", exact=True).click()
    page.wait_for_function("document.querySelector('textarea')?.value.includes('Second page')")


with TemporaryDirectory() as directory, sync_playwright() as playwright:
    pdf_path = Path(directory) / "reader.pdf"
    pdf = Canvas(str(pdf_path))
    for text in ["First page of the test document.", "Second page of the test document."]:
        pdf.drawString(72, 750, text)
        pdf.showPage()
    pdf.save()
    chrome = shutil.which("google-chrome") or shutil.which("chromium")
    browser = playwright.chromium.launch(executable_path=chrome)
    try:
        check_study_app(browser.new_page(), pdf_path)
    finally:
        browser.close()
