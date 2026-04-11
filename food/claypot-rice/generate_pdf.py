#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate a PDF with AI and Reality sections for claypot-rice content
"""

from fpdf import FPDF
import os

BASE_DIR = "/Users/ke/Documents/GitProjects/FoodICH/food/claypot-rice"

# AI section files (name -> (md_file, image_file))
AI_FILES = [
    ("彩虹蔬果臘口味煲仔飯", "caihong.md", "caihong.png"),
    ("臘腸處理", "lachang.md", "lachang.png"),
    ("排骨食材", "paigu.md", "paigu.png"),
    ("泰國椰香雞肉煲仔飯", "taiguo.md", "taiguo.png"),
    ("窩蛋牛肉飯", "wodanniu.md", "wodanniu.png"),
    ("星空漸層紫薯煲仔飯", "xingkong.md", "xingkong.png"),
]

REALITY_FILES = [
    ("米粒風乾", "rice-dry.MD", "rice-dry.png"),
    ("觀察火力", "人去转观察火力.MD", "人去转观察火力.png"),
    ("漏勺瀝乾", "漏勺.MD", "漏勺.png"),
    ("火山石傳熱", "火山石.MD", "火山石.png"),
    ("白飯處理", "白饭.MD", "白饭.PNG"),
    ("臘腸飯成品", "腊肠饭.MD", "腊肠饭.png"),
]


class ClaypotPDF(FPDF):
    def __init__(self):
        super().__init__()
        # Add Chinese font
        self.add_font("Chinese", "", "/System/Library/Fonts/STHeiti Medium.ttc")
        self.add_font("Chinese", "B", "/System/Library/Fonts/STHeiti Medium.ttc")

    def section_title(self, title):
        self.set_font("Chinese", "B", 14)
        self.set_text_color(139, 69, 19)
        self.cell(0, 8, title, align="C")
        self.ln(6)

    def item_title(self, title):
        self.set_font("Chinese", "B", 9)
        self.set_text_color(0, 0, 0)
        self.cell(0, 5, title, ln=True)
        self.ln(1)

    def content_text(self, text):
        self.set_font("Chinese", "", 7)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 3.5, text)
        self.ln(1)

    def add_image_small(self, image_path, w=60):
        if os.path.exists(image_path):
            try:
                self.image(image_path, w=w)
            except Exception as e:
                self.content_text(f"[圖片載入失敗: {e}]")


def read_md_file(filepath):
    """Read markdown file and return content"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        return f"[無法讀取文件: {e}]"


def create_pdf():
    pdf = ClaypotPDF()
    pdf.set_auto_page_break(auto=False)
    pdf.set_margins(10, 10, 10)

    # ========== AI Section - Page 1 ==========
    pdf.add_page()
    pdf.section_title("AI 創意食譜")
    pdf.set_font("Chinese", "", 6)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 3, "主廚借助人工智慧所構思的創意食譜，嘗試在傳統風味與現代健康理念之間取得平衡。", align="C")
    pdf.ln(5)

    col_width = 95
    start_y = pdf.get_y()

    for i, (title, md_file, img_file) in enumerate(AI_FILES):
        col = i % 2
        row = i // 2

        x = 10 + col * col_width
        y = start_y + row * 85

        pdf.set_xy(x, y)

        md_path = os.path.join(BASE_DIR, "AI", md_file)
        img_path = os.path.join(BASE_DIR, "AI", img_file)

        pdf.item_title(title)

        # Image
        pdf.set_xy(x, pdf.get_y())
        pdf.add_image_small(img_path, w=55)
        img_y = pdf.get_y()

        # Text below image
        pdf.set_xy(x + 58, y + 5)
        content = read_md_file(md_path)
        # Truncate long content
        if len(content) > 350:
            content = content[:350] + "..."
        pdf.content_text(content)

    # ========== Reality Section - Page 2 ==========
    pdf.add_page()
    pdf.section_title("實際操作記錄")
    pdf.set_font("Chinese", "", 6)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 3, "記錄煲仔飯製作過程中的實際操作技巧與心得。", align="C")
    pdf.ln(5)

    start_y = pdf.get_y()

    for i, (title, md_file, img_file) in enumerate(REALITY_FILES):
        col = i % 2
        row = i // 2

        x = 10 + col * col_width
        y = start_y + row * 85

        pdf.set_xy(x, y)

        md_path = os.path.join(BASE_DIR, "Reality", md_file)
        img_path = os.path.join(BASE_DIR, "Reality", img_file)

        pdf.item_title(title)

        # Image
        pdf.set_xy(x, pdf.get_y())
        pdf.add_image_small(img_path, w=55)

        # Text below image
        pdf.set_xy(x + 58, y + 5)
        content = read_md_file(md_path)
        if len(content) > 350:
            content = content[:350] + "..."
        pdf.content_text(content)

    # Output PDF
    output_path = os.path.join(BASE_DIR, "claypot-rice-guide.pdf")
    pdf.output(output_path)
    print(f"PDF 已生成: {output_path}")
    return output_path


if __name__ == "__main__":
    create_pdf()
