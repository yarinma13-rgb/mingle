#!/usr/bin/env python3
"""Build Myfxbook leadership training deck — Hebrew, dark brand theme."""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import nsmap
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Emu, Inches, Pt

# Brand
ORANGE = RGBColor(0xF8, 0x98, 0x00)
ORANGE_DIM = RGBColor(0xC4, 0x78, 0x00)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BLACK = RGBColor(0x00, 0x00, 0x00)
BG = RGBColor(0x0A, 0x0A, 0x0A)
CARD = RGBColor(0x16, 0x16, 0x16)
CARD_ALT = RGBColor(0x1E, 0x1E, 0x1E)
MUTED = RGBColor(0xA8, 0xA8, 0xA8)
LINE = RGBColor(0x2E, 0x2E, 0x2E)
SOFT = RGBColor(0xE8, 0xE8, 0xE8)

FONT = "Arial"
W = Inches(13.333)
H = Inches(7.5)

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "docs" / "presentations" / "myfxbook-logo.jpg"
OUT = ROOT / "docs" / "presentations" / "פיתוח-מנהלים-וראשי-צוותים-Myfxbook.pptx"


def _set_run_font(run, size, bold=False, color=WHITE, name=FONT):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name


def _rtl_para(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    pPr.set("rtl", "1")
    # eastAsia / bidi hints help PowerPoint render Hebrew correctly
    for child in list(pPr):
        if child.tag.endswith("}rtl"):
            return
    rtl = OxmlElement("a:rtl")
    rtl.set("val", "1")


def add_textbox(
    slide,
    left,
    top,
    width,
    height,
    text,
    *,
    size=18,
    bold=False,
    color=WHITE,
    align=PP_ALIGN.RIGHT,
    anchor=MSO_ANCHOR.TOP,
    font=FONT,
):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor])
    except Exception:
        pass
    lines = text.split("\n") if isinstance(text, str) else list(text)
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        pPr = p._p.get_or_add_pPr()
        pPr.set("rtl", "1")
        run = p.add_run()
        run.text = line
        _set_run_font(run, size, bold=bold, color=color, name=font)
    return box


def add_rect(slide, left, top, width, height, fill, *, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1.25)
    return shape


def add_round(slide, left, top, width, height, fill, *, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    # slightly tighter radius
    try:
        shape.adjustments[0] = 0.08
    except Exception:
        pass
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1.25)
    return shape


def paint_bg(slide):
    add_rect(slide, 0, 0, W, H, BG)


def header_bar(slide, title: str, subtitle: str | None = None):
    add_rect(slide, 0, 0, W, Inches(0.08), ORANGE)
    add_textbox(
        slide,
        Inches(0.55),
        Inches(0.28),
        Inches(12.2),
        Inches(0.55),
        title,
        size=26,
        bold=True,
        color=WHITE,
        align=PP_ALIGN.RIGHT,
    )
    if subtitle:
        add_textbox(
            slide,
            Inches(0.55),
            Inches(0.82),
            Inches(12.2),
            Inches(0.35),
            subtitle,
            size=13,
            color=MUTED,
            align=PP_ALIGN.RIGHT,
        )
    # thin divider
    add_rect(slide, Inches(0.55), Inches(1.2), Inches(12.2), Pt(1.5), LINE)


def footer(slide, page: int, total: int = 13):
    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(0.45), Inches(7.05), height=Inches(0.28))
    add_textbox(
        slide,
        Inches(10.5),
        Inches(7.05),
        Inches(2.4),
        Inches(0.3),
        f"{page} / {total}",
        size=11,
        color=MUTED,
        align=PP_ALIGN.LEFT,
    )


def accent_number(slide, left, top, num: str, size=28):
    add_round(slide, left, top, Inches(0.55), Inches(0.55), ORANGE)
    add_textbox(
        slide,
        left,
        top + Inches(0.05),
        Inches(0.55),
        Inches(0.45),
        num,
        size=size,
        bold=True,
        color=BLACK,
        align=PP_ALIGN.CENTER,
        anchor=MSO_ANCHOR.MIDDLE,
    )


def style_chart_dark(chart):
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    try:
        chart.legend.font.size = Pt(11)
        chart.legend.font.color.rgb = WHITE
        chart.legend.font.name = FONT
    except Exception:
        pass
    plot = chart.plots[0]
    plot.has_data_labels = True
    try:
        dls = plot.data_labels
        dls.font.size = Pt(11)
        dls.font.color.rgb = WHITE
        dls.font.bold = True
    except Exception:
        pass


# ─── Slides ───────────────────────────────────────────────────────────────────


def slide_01_title(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    # left orange panel
    add_rect(slide, 0, 0, Inches(0.18), H, ORANGE)
    # decorative soft block
    add_rect(slide, Inches(9.8), 0, Inches(3.55), H, RGBColor(0x12, 0x12, 0x12))

    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(0.7), Inches(1.1), width=Inches(4.2))

    add_textbox(
        slide,
        Inches(0.7),
        Inches(2.5),
        Inches(8.5),
        Inches(1.2),
        "מנהיגות מקדמת ומשוב בזמן אמת",
        size=36,
        bold=True,
        color=WHITE,
        align=PP_ALIGN.RIGHT,
    )
    add_rect(slide, Inches(6.9), Inches(3.75), Inches(2.3), Pt(4), ORANGE)
    add_textbox(
        slide,
        Inches(0.7),
        Inches(4.0),
        Inches(8.5),
        Inches(1.1),
        "סנכרון ציפיות · חיבור לתמונה הגדולה · שגרת ניהול מנצחת\nסדנה לראשי צוותים בעולמות הפיתוח והטכני",
        size=16,
        color=MUTED,
        align=PP_ALIGN.RIGHT,
    )
    add_textbox(
        slide,
        Inches(0.7),
        Inches(6.5),
        Inches(8.5),
        Inches(0.4),
        "Myfxbook  |  פיתוח מנהלים וראשי צוותים",
        size=13,
        color=ORANGE,
        align=PP_ALIGN.RIGHT,
    )


def slide_02_styles(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "סגנונות ניהול: התאמת הגישה לעובד ולשלב", "שלושה מודלים — גמישות, שירות, תוצאות")

    cards = [
        ("01", "ניהול מצבי", "Situational", "התאמה אישית לפי מוכנות, מקצועיות וביטחון במשימה. רמת הכוונה ותמיכה משתנה."),
        ("02", "מנהיגות משרתת", "Servant", "שאלה מרכזית: \"איך אני עוזר לך להצליח?\" הסרת חסמים, כלים וגיבוי."),
        ("03", "ניהול מבוסס תוצאות", "MBO", "מגדירים את ה\"מה\". חופש ב\"איך\". מדדי הצלחה ומועדי בקרה ברורים."),
    ]
    lefts = [Inches(0.55), Inches(4.55), Inches(8.55)]
    for left, (num, title, eng, body) in zip(lefts, cards):
        add_round(slide, left, Inches(1.55), Inches(3.7), Inches(4.5), CARD, line=LINE)
        add_rect(slide, left, Inches(1.55), Inches(3.7), Inches(0.12), ORANGE)
        accent_number(slide, left + Inches(2.9), Inches(1.9), num, size=16)
        add_textbox(slide, left + Inches(0.25), Inches(1.9), Inches(2.5), Inches(0.45), title, size=18, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, left + Inches(0.25), Inches(2.4), Inches(3.2), Inches(0.35), eng, size=12, color=ORANGE, align=PP_ALIGN.RIGHT)
        add_textbox(slide, left + Inches(0.25), Inches(3.0), Inches(3.2), Inches(2.5), body, size=14, color=SOFT, align=PP_ALIGN.RIGHT)

    # bottom insight bar
    add_round(slide, Inches(0.55), Inches(6.25), Inches(12.2), Inches(0.6), CARD_ALT)
    add_textbox(
        slide,
        Inches(0.8),
        Inches(6.35),
        Inches(11.7),
        Inches(0.4),
        "עיקרון מנחה: אין סגנון אחד נכון — בוחרים לפי האדם, המשימה והשלב.",
        size=14,
        bold=True,
        color=ORANGE,
        align=PP_ALIGN.RIGHT,
    )
    footer(slide, 2)


def slide_03_merger(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "הובלת צוות לאחר איחוד", "ארבעה מפתחות להצלחה — זהות, אמון, בהירות, סנכרון")

    items = [
        ("זהות ושפה משותפת", "נורמות עבודה וערכים אחידים לכל הצוות המאוחד."),
        ("פירוק מחנות", "שילוב ותיקים וחדשים; אחריות שאינה חופפת."),
        ("ביטחון פסיכולוגי", "מקום בטוח לחששות, הקשבה וסנכרון ציפיות מחודש."),
        ("בהירות בממשקים", "מי מחליט, למי פונים, ואיך מדווחים."),
    ]
    # 2x2 grid
    positions = [
        (Inches(0.55), Inches(1.55)),
        (Inches(6.7), Inches(1.55)),
        (Inches(0.55), Inches(4.15)),
        (Inches(6.7), Inches(4.15)),
    ]
    for i, ((left, top), (title, body)) in enumerate(zip(positions, items), 1):
        add_round(slide, left, top, Inches(5.85), Inches(2.3), CARD, line=LINE)
        add_rect(slide, left, top, Inches(0.12), Inches(2.3), ORANGE)
        accent_number(slide, left + Inches(5.05), top + Inches(0.3), str(i), size=16)
        add_textbox(slide, left + Inches(0.4), top + Inches(0.35), Inches(4.4), Inches(0.45), title, size=18, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, left + Inches(0.4), top + Inches(1.0), Inches(5.0), Inches(0.9), body, size=14, color=MUTED, align=PP_ALIGN.RIGHT)
    footer(slide, 3)


def slide_04_big_picture(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "חיבור העובד לתמונה הגדולה", "מהמשמעות האישית — לראייה המערכתית")

    # left column — personal
    add_round(slide, Inches(0.55), Inches(1.55), Inches(5.9), Inches(5.1), CARD, line=LINE)
    add_rect(slide, Inches(0.55), Inches(1.55), Inches(5.9), Inches(0.55), ORANGE)
    add_textbox(slide, Inches(0.75), Inches(1.62), Inches(5.5), Inches(0.4), "משמעות אישית ומחויבות", size=16, bold=True, color=BLACK, align=PP_ALIGN.RIGHT)
    bullets = [
        ("ה\"למה\" לפני ה\"איך\"", "הבנת ההשפעה על לקוחות ויעדי הארגון מגבירה מחויבות."),
        ("התפתחות מקצועית", "עמידה ביעדים בונה ניסיון, מוניטין וצמיחה אישית."),
    ]
    y = Inches(2.4)
    for t, b in bullets:
        add_textbox(slide, Inches(0.9), y, Inches(5.2), Inches(0.35), t, size=15, bold=True, color=ORANGE, align=PP_ALIGN.RIGHT)
        add_textbox(slide, Inches(0.9), y + Inches(0.4), Inches(5.2), Inches(0.9), b, size=13, color=SOFT, align=PP_ALIGN.RIGHT)
        y += Inches(1.5)

    # right column — systemic
    add_round(slide, Inches(6.7), Inches(1.55), Inches(5.9), Inches(5.1), CARD, line=LINE)
    add_rect(slide, Inches(6.7), Inches(1.55), Inches(5.9), Inches(0.55), WHITE)
    add_textbox(slide, Inches(6.9), Inches(1.62), Inches(5.5), Inches(0.4), "ראייה מערכתית בצוות המאוחד", size=16, bold=True, color=BLACK, align=PP_ALIGN.RIGHT)
    bullets2 = [
        ("הבנת ממשקים", "מי מושפע במורד השרשרת? איך האיחוד מחזק את החברה?"),
        ("שבירת סילו", "כולם חותרים לאותה מטרה עסקית — לא מתחרים על טריטוריה."),
    ]
    y = Inches(2.4)
    for t, b in bullets2:
        add_textbox(slide, Inches(7.05), y, Inches(5.2), Inches(0.35), t, size=15, bold=True, color=ORANGE, align=PP_ALIGN.RIGHT)
        add_textbox(slide, Inches(7.05), y + Inches(0.4), Inches(5.2), Inches(0.9), b, size=13, color=SOFT, align=PP_ALIGN.RIGHT)
        y += Inches(1.5)
    footer(slide, 4)


def slide_05_tenure(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "ותק מול אחריות", "ממלכודת הותק — לבעלות אמיתית")

    # Before / After comparison
    add_round(slide, Inches(0.55), Inches(1.5), Inches(5.9), Inches(3.35), CARD, line=LINE)
    add_textbox(slide, Inches(0.8), Inches(1.7), Inches(5.4), Inches(0.4), "✗  המלכודת", size=18, bold=True, color=MUTED, align=PP_ALIGN.RIGHT)
    add_textbox(
        slide,
        Inches(0.8),
        Inches(2.3),
        Inches(5.4),
        Inches(2.2),
        "ותק ← תחושת \"מקום מובטח\"\nתוספת אחריות נתפסת כעונש\nהימנעות ממשוב ← עיוורון ופער ציפיות",
        size=15,
        color=SOFT,
        align=PP_ALIGN.RIGHT,
    )

    add_round(slide, Inches(6.7), Inches(1.5), Inches(5.9), Inches(3.35), CARD, line=ORANGE)
    add_textbox(slide, Inches(6.95), Inches(1.7), Inches(5.4), Inches(0.4), "✓  שינוי הדיסקט", size=18, bold=True, color=ORANGE, align=PP_ALIGN.RIGHT)
    add_textbox(
        slide,
        Inches(6.95),
        Inches(2.3),
        Inches(5.4),
        Inches(2.2),
        "ותק = ערך וניסיון — לא חסינות\nאחריות = יוקרה, חניכה והשפעה\nותיק כמוביל תהליך — לא \"כבר עשה את שלו\"",
        size=15,
        color=SOFT,
        align=PP_ALIGN.RIGHT,
    )

    # 3 action steps as table-like strip
    steps = [
        ("Re-alignment", "שיחת סנכרון ציפיות", "מדדי הצלחה והתפוקות של היום"),
        ("Empowerment", "מינוף כמנטור", "אחריות כהערכה — שימור ידע"),
        ("Micro-Feedback", "משוב בזמן אמת", "שיקוף רציף בלי הפתעות"),
    ]
    x = Inches(0.55)
    for eng, he, desc in steps:
        add_round(slide, x, Inches(5.1), Inches(3.9), Inches(1.45), CARD_ALT)
        add_textbox(slide, x + Inches(0.2), Inches(5.2), Inches(3.5), Inches(0.3), eng, size=11, color=ORANGE, align=PP_ALIGN.RIGHT)
        add_textbox(slide, x + Inches(0.2), Inches(5.5), Inches(3.5), Inches(0.35), he, size=14, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, x + Inches(0.2), Inches(5.9), Inches(3.5), Inches(0.45), desc, size=12, color=MUTED, align=PP_ALIGN.RIGHT)
        x += Inches(4.1)
    footer(slide, 5)


def slide_06_micro_feedback(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "בארגון קטן: מתריעים מוקדם", "מיקרו-משוב במקום שגרה מכבידה")

    # pie chart — time allocation metaphor
    chart_data = CategoryChartData()
    chart_data.categories = ["מיקרו-משוב (3 דק')", "שגרה פורמלית כבדה", "כיבוי שריפות"]
    chart_data.add_series("השקעת זמן ניהולי", (25, 35, 40))

    chart = slide.shapes.add_chart(
        XL_CHART_TYPE.PIE,
        Inches(0.5),
        Inches(1.55),
        Inches(5.8),
        Inches(4.8),
        chart_data,
    ).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    try:
        chart.legend.font.size = Pt(12)
        chart.legend.font.color.rgb = WHITE
        chart.legend.font.name = FONT
    except Exception:
        pass
    plot = chart.plots[0]
    plot.has_data_labels = True
    try:
        plot.data_labels.font.size = Pt(12)
        plot.data_labels.font.bold = True
        plot.data_labels.font.color.rgb = WHITE
        plot.data_labels.number_format = '0"%"'
    except Exception:
        pass
    # color series points
    try:
        from pptx.oxml.ns import qn
        ser = chart.series[0]
        colors = [ORANGE, RGBColor(0x66, 0x66, 0x66), RGBColor(0x33, 0x33, 0x33)]
        for i, c in enumerate(colors):
            pt = ser.points[i]
            solid = OxmlElement("a:solidFill")
            srgb = OxmlElement("a:srgbClr")
            srgb.set("val", f"{c[0]:02X}{c[1]:02X}{c[2]:02X}")
            solid.append(srgb)
            spPr = pt._element.get_or_add_spPr()
            # clear existing solidFill
            for child in list(spPr):
                if child.tag.endswith("solidFill"):
                    spPr.remove(child)
            spPr.insert(0, solid)
    except Exception as e:
        print("pie color warn:", e)

    # right side messaging
    add_round(slide, Inches(6.6), Inches(1.55), Inches(6.1), Inches(2.2), CARD, line=LINE)
    add_textbox(slide, Inches(6.85), Inches(1.75), Inches(5.6), Inches(0.4), "הבעיה", size=14, bold=True, color=MUTED, align=PP_ALIGN.RIGHT)
    add_textbox(
        slide,
        Inches(6.85),
        Inches(2.25),
        Inches(5.6),
        Inches(1.2),
        "שגרת משוב שבועית כבדה הופכת למעמסה בירוקרטית בקצב מהיר — ולא מחזיקה מעמד.",
        size=15,
        color=SOFT,
        align=PP_ALIGN.RIGHT,
    )

    add_round(slide, Inches(6.6), Inches(4.0), Inches(6.1), Inches(2.5), CARD, line=ORANGE)
    add_textbox(slide, Inches(6.85), Inches(4.2), Inches(5.6), Inches(0.4), "הפתרון · 3 דקות", size=14, bold=True, color=ORANGE, align=PP_ALIGN.RIGHT)
    add_textbox(
        slide,
        Inches(6.85),
        Inches(4.7),
        Inches(5.6),
        Inches(1.5),
        "זיהיתם סטייה? מעירים מיד.\nלא שומרים בבטן. לא מחכים לשריפה.\nהתרעה מוקדמת חוסכת שעות ניהול בהמשך.",
        size=15,
        color=SOFT,
        align=PP_ALIGN.RIGHT,
    )
    footer(slide, 6)


def slide_07_sbi(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "מודל פידבק אפקטיבי: S-B-I", "Situation ← Behavior ← Impact  ·  קוראים מימין לשמאל")

    # RTL visual order: S on the right, then B, then I
    steps = [
        ("I", "Impact", "ההשפעה", "השלכות על צוות/לקוח + דרך פעולה משותפת.\n\"גרם לעיכוב במסירה — איך מונעים בפעם הבאה?\""),
        ("B", "Behavior", "ההתנהגות", "פעולה נצפית בלבד — בלי שיפוט אופי.\n\"המסמך נשלח ללא בדיקה\" ≠ \"אתה לא אחראי\""),
        ("S", "Situation", "הסיטואציה", "עובדות בזמן ובמקום — בלי הכללות.\n\"בפגישת הצוות הבוקר…\" / \"בגרסה ששוחררה אתמול…\""),
    ]
    x = Inches(0.55)
    for idx, (letter, eng, he, body) in enumerate(steps):
        border = ORANGE if letter == "S" else LINE
        add_round(slide, x, Inches(1.5), Inches(3.9), Inches(3.5), CARD, line=border)
        add_round(slide, x + Inches(1.45), Inches(1.75), Inches(1.0), Inches(1.0), ORANGE)
        add_textbox(slide, x + Inches(1.45), Inches(1.9), Inches(1.0), Inches(0.7), letter, size=28, bold=True, color=BLACK, align=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.2), Inches(2.95), Inches(3.5), Inches(0.3), eng, size=12, color=ORANGE, align=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.2), Inches(3.3), Inches(3.5), Inches(0.35), he, size=16, bold=True, align=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.25), Inches(3.75), Inches(3.4), Inches(1.1), body, size=12, color=MUTED, align=PP_ALIGN.CENTER)
        if idx < 2:
            arrow = slide.shapes.add_shape(
                MSO_SHAPE.LEFT_ARROW,
                x + Inches(3.95),
                Inches(3.1),
                Inches(0.28),
                Inches(0.28),
            )
            arrow.fill.solid()
            arrow.fill.fore_color.rgb = ORANGE
            arrow.line.fill.background()
        x += Inches(4.15)

    # goals strip
    goals = ["שיפור ביצועים", "התפתחות מקצועית", "העצמת ביטחון", "תקשורת פתוחה"]
    x = Inches(0.55)
    for g in goals:
        add_round(slide, x, Inches(5.3), Inches(2.95), Inches(0.85), CARD_ALT)
        add_textbox(slide, x + Inches(0.15), Inches(5.5), Inches(2.65), Inches(0.45), f"✓  {g}", size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        x += Inches(3.15)
    footer(slide, 7)


def slide_08_peopleforce_table(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "מעבר ל-PeopleForce", "מ-Google Sheets לתהליך ניהולי אחיד")

    rows = [
        ("פרמטר", "בעבר · Sheets", "היום · PeopleForce", "הערך הניהולי"),
        ("אחידות", "מילוי לא אחיד", "הכנה + דיאלוג", "סטנדרט לכל ר\"צ"),
        ("הכנה", "אלתור תוך כדי", "ניתוח מראש", "משוב מבוסס עובדות"),
        ("חוויית עובד", "מילוי טפסים", "שיחה פתוחה", "מחוברות ואמון"),
        ("תיעוד", "מסמכים מפוזרים", "תיק עובד מרוכז", "מעקב לאורך מחזורים"),
    ]

    table = slide.shapes.add_table(len(rows), 4, Inches(0.55), Inches(1.55), Inches(12.2), Inches(4.6)).table
    widths = [Inches(2.0), Inches(3.3), Inches(3.5), Inches(3.4)]
    for i, w in enumerate(widths):
        table.columns[i].width = w

    for r, row in enumerate(rows):
        for c, text in enumerate(row):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.RIGHT
            pPr = p._p.get_or_add_pPr()
            pPr.set("rtl", "1")
            run = p.add_run()
            run.text = text
            is_header = r == 0
            _set_run_font(run, 13 if is_header else 12, bold=is_header or c == 0, color=BLACK if is_header else WHITE)
            # fill
            fill = cell.fill
            fill.solid()
            if is_header:
                fill.fore_color.rgb = ORANGE
            elif r % 2 == 0:
                fill.fore_color.rgb = CARD_ALT
            else:
                fill.fore_color.rgb = CARD
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE

    add_textbox(
        slide,
        Inches(0.55),
        Inches(6.4),
        Inches(12.2),
        Inches(0.4),
        "המטרה: לא עוד \"מילוי טפסים\" — אלא דיאלוג מקצועי שמתועד ומוביל לפעולה.",
        size=13,
        bold=True,
        color=ORANGE,
        align=PP_ALIGN.RIGHT,
    )
    footer(slide, 8)


def slide_09_two_stages(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "מודל המשוב החדש: שני שלבים", "הכנה נפרדת · פגישה נפרדת")

    # Stage 1
    add_round(slide, Inches(0.55), Inches(1.55), Inches(5.9), Inches(5.0), CARD, line=LINE)
    add_rect(slide, Inches(0.55), Inches(1.55), Inches(5.9), Inches(0.7), ORANGE)
    add_textbox(slide, Inches(0.8), Inches(1.7), Inches(5.4), Inches(0.45), "שלב 1 · הכנה ב-PeopleForce", size=18, bold=True, color=BLACK, align=PP_ALIGN.RIGHT)
    s1 = [
        ("מילוי לבד ובנחת", "הערכה מובנית לפני הפגישה"),
        ("מיקוד כפול", "שימור + שיפור — עם דוגמאות"),
        ("הגעה מוכנים", "בלי שליפות מהמותן"),
    ]
    y = Inches(2.55)
    for i, (t, b) in enumerate(s1, 1):
        accent_number(slide, Inches(5.6), y, str(i), size=14)
        add_textbox(slide, Inches(0.85), y, Inches(4.5), Inches(0.35), t, size=15, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, Inches(0.85), y + Inches(0.35), Inches(4.5), Inches(0.45), b, size=13, color=MUTED, align=PP_ALIGN.RIGHT)
        y += Inches(1.15)

    # Stage 2
    add_round(slide, Inches(6.7), Inches(1.55), Inches(5.9), Inches(5.0), CARD, line=LINE)
    add_rect(slide, Inches(6.7), Inches(1.55), Inches(5.9), Inches(0.7), WHITE)
    add_textbox(slide, Inches(6.95), Inches(1.7), Inches(5.4), Inches(0.45), "שלב 2 · פגישה בארבע עיניים", size=18, bold=True, color=BLACK, align=PP_ALIGN.RIGHT)
    s2 = [
        ("שיחה — לא טפסים", "פנים אל פנים, מכבד ומעצים"),
        ("הקשבה אמיתית", "מה העובד רוצה לשפר / לקבל?"),
        ("סגירת הסכמות", "תוכנית פעולה עם יעדים מדידים"),
    ]
    y = Inches(2.55)
    for i, (t, b) in enumerate(s2, 1):
        accent_number(slide, Inches(11.75), y, str(i), size=14)
        add_textbox(slide, Inches(7.0), y, Inches(4.5), Inches(0.35), t, size=15, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, Inches(7.0), y + Inches(0.35), Inches(4.5), Inches(0.45), b, size=13, color=MUTED, align=PP_ALIGN.RIGHT)
        y += Inches(1.15)
    footer(slide, 9)


def slide_10_routine_cycle(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "שגרת הניהול והמשוב", "מעגל רציף המותאם לארגון שלנו")

    # Visual RTL: stage 01 on the right → 04 on the left
    phases = [
        ("04", "מעקב והסרת חסמים", "בדיקת התקדמות ותמיכה במימוש."),
        ("03", "פגישת דיאלוג", "פידבק, הקשבה וסגירת יעדים."),
        ("02", "הכנה ב-PeopleForce", "הערכה: נקודות לשימור ולשיפור."),
        ("01", "התרעה בזמן אמת", "פער? מיקרו-משוב של 3 דק' באותו יום."),
    ]
    x = Inches(0.4)
    for i, (num, title, body) in enumerate(phases):
        is_start = num == "01"
        add_round(slide, x, Inches(2.0), Inches(2.85), Inches(3.6), CARD, line=ORANGE if is_start else LINE)
        add_round(slide, x + Inches(0.95), Inches(2.25), Inches(0.95), Inches(0.95), ORANGE if is_start or num == "03" else WHITE)
        add_textbox(
            slide,
            x + Inches(0.95),
            Inches(2.4),
            Inches(0.95),
            Inches(0.7),
            num,
            size=18,
            bold=True,
            color=BLACK,
            align=PP_ALIGN.CENTER,
        )
        add_textbox(slide, x + Inches(0.15), Inches(3.45), Inches(2.55), Inches(0.7), title, size=14, bold=True, align=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.15), Inches(4.25), Inches(2.55), Inches(1.1), body, size=12, color=MUTED, align=PP_ALIGN.CENTER)
        if i < 3:
            arrow = slide.shapes.add_shape(
                MSO_SHAPE.LEFT_ARROW,
                x + Inches(2.9),
                Inches(3.5),
                Inches(0.35),
                Inches(0.35),
            )
            arrow.fill.solid()
            arrow.fill.fore_color.rgb = ORANGE
            arrow.line.fill.background()
        x += Inches(3.2)

    add_round(slide, Inches(0.55), Inches(5.95), Inches(12.2), Inches(0.7), CARD_ALT)
    add_textbox(
        slide,
        Inches(0.8),
        Inches(6.1),
        Inches(11.7),
        Inches(0.4),
        "המעגל לא נעצר אחרי הפגישה — מעקב והסרת חסמים הם חלק מהשגרה.",
        size=14,
        bold=True,
        color=ORANGE,
        align=PP_ALIGN.RIGHT,
    )
    footer(slide, 10)


def slide_11_impact(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "האימפקט של התרעה מוקדמת", "למה משוב מוקדם ומסודר שומר על הצוות")

    # big metric
    add_round(slide, Inches(0.55), Inches(1.55), Inches(4.2), Inches(4.9), CARD, line=ORANGE)
    add_textbox(slide, Inches(0.8), Inches(2.3), Inches(3.7), Inches(1.2), "3×", size=72, bold=True, color=ORANGE, align=PP_ALIGN.CENTER)
    add_textbox(
        slide,
        Inches(0.8),
        Inches(3.7),
        Inches(3.7),
        Inches(1.5),
        "ירידה צפויה\nבאירועי שריפה ומשבר\nכשמטפלים ביום היווצרות הפער",
        size=15,
        color=SOFT,
        align=PP_ALIGN.CENTER,
    )

    # bar chart — illustrative impact
    chart_data = CategoryChartData()
    chart_data.categories = ["בלי התרעה", "עם מיקרו-משוב", "עם PeopleForce"]
    chart_data.add_series("שעות ניהול על משברים (חודשי)", (18, 9, 6))

    chart = slide.shapes.add_chart(
        XL_CHART_TYPE.COLUMN_CLUSTERED,
        Inches(5.0),
        Inches(1.55),
        Inches(7.7),
        Inches(3.4),
        chart_data,
    ).chart
    chart.has_legend = False
    try:
        plot = chart.plots[0]
        plot.has_data_labels = True
        plot.data_labels.font.size = Pt(12)
        plot.data_labels.font.color.rgb = WHITE
        plot.data_labels.font.bold = True
        # series color
        ser = chart.series[0]
        solid = OxmlElement("a:solidFill")
        srgb = OxmlElement("a:srgbClr")
        srgb.set("val", "F89800")
        solid.append(srgb)
        spPr = ser._element.get_or_add_spPr()
        for child in list(spPr):
            if child.tag.endswith("solidFill"):
                spPr.remove(child)
        spPr.insert(0, solid)
    except Exception as e:
        print("bar color warn:", e)

    add_round(slide, Inches(5.0), Inches(5.15), Inches(7.7), Inches(1.3), CARD)
    add_textbox(
        slide,
        Inches(5.25),
        Inches(5.3),
        Inches(7.2),
        Inches(1.0),
        "מניעה במקום כיבוי + אקלים בטוח ושקוף =\nביצועים גבוהים בצוות המאוחד, בלי שחיקה מיותרת.",
        size=14,
        color=SOFT,
        align=PP_ALIGN.RIGHT,
    )
    footer(slide, 11)


def slide_12_golden_rules(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    header_bar(slide, "כללי זהב לנקודות לשיפור", "איך מעבירים ביקורת בצורה בונה")

    rules = [
        ("01", "פרטיות וכבוד", "תמיד בארבע עיניים — לעולם לא בפורום צוותי."),
        ("02", "הפרדה מאדם למעשה", "מבקרים תוצר או מתודולוגיה — לא את האישיות."),
        ("03", "שאלות פתוחות", "\"מה עבד טוב? מה פחות? איך הרגשת עם המשימה?\""),
        ("04", "צעדים וליווי", "\"מה הצעד הבא? אילו כלים אני מעמיד לרשותך?\""),
    ]
    positions = [
        (Inches(0.55), Inches(1.55)),
        (Inches(6.7), Inches(1.55)),
        (Inches(0.55), Inches(4.2)),
        (Inches(6.7), Inches(4.2)),
    ]
    for (left, top), (num, title, body) in zip(positions, rules):
        add_round(slide, left, top, Inches(5.85), Inches(2.35), CARD, line=LINE)
        add_round(slide, left + Inches(0.3), top + Inches(0.7), Inches(0.7), Inches(0.7), ORANGE)
        add_textbox(slide, left + Inches(0.3), top + Inches(0.82), Inches(0.7), Inches(0.5), num, size=14, bold=True, color=BLACK, align=PP_ALIGN.CENTER)
        add_textbox(slide, left + Inches(1.2), top + Inches(0.45), Inches(4.3), Inches(0.45), title, size=18, bold=True, align=PP_ALIGN.RIGHT)
        add_textbox(slide, left + Inches(1.2), top + Inches(1.1), Inches(4.3), Inches(0.9), body, size=14, color=MUTED, align=PP_ALIGN.RIGHT)
    footer(slide, 12)


def slide_13_close(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paint_bg(slide)
    add_rect(slide, 0, 0, Inches(0.18), H, ORANGE)
    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(4.2), Inches(0.9), width=Inches(4.8))

    add_textbox(
        slide,
        Inches(1.2),
        Inches(2.4),
        Inches(10.9),
        Inches(1.8),
        "\"מנהיגות אמיתית אינה נמדדת בשליטה,\nאלא ביכולת להעצים את האנשים שלך.\"",
        size=26,
        bold=True,
        color=WHITE,
        align=PP_ALIGN.CENTER,
    )
    add_rect(slide, Inches(5.5), Inches(4.4), Inches(2.3), Pt(4), ORANGE)
    add_textbox(
        slide,
        Inches(1.5),
        Inches(4.8),
        Inches(10.3),
        Inches(1.3),
        "מנהלים וראשי צוותים יקרים — המון בהצלחה.\nאתם הכוח המניע של החברה והמפתח לצמיחה של האנשים שלנו.",
        size=15,
        color=MUTED,
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        Inches(1.5),
        Inches(6.5),
        Inches(10.3),
        Inches(0.4),
        "Myfxbook  ·  פיתוח מנהלים וראשי צוותים",
        size=13,
        color=ORANGE,
        align=PP_ALIGN.CENTER,
    )


def main():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H

    slide_01_title(prs)
    slide_02_styles(prs)
    slide_03_merger(prs)
    slide_04_big_picture(prs)
    slide_05_tenure(prs)
    slide_06_micro_feedback(prs)
    slide_07_sbi(prs)
    slide_08_peopleforce_table(prs)
    slide_09_two_stages(prs)
    slide_10_routine_cycle(prs)
    slide_11_impact(prs)
    slide_12_golden_rules(prs)
    slide_13_close(prs)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT))
    print(f"Saved: {OUT}")
    print(f"Slides: {len(prs.slides)}")


if __name__ == "__main__":
    main()
