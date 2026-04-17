from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from util.email import _html_to_plain_text, print_decoded_email_parts


def test_html_to_plain_text_strips_tags_and_script():
    html = "<p>Pass: <strong>secret123</strong></p><script>evil()</script><style>.x{}</style>"
    plain = _html_to_plain_text(html)
    assert "secret123" in plain
    assert "evil()" not in plain
    assert "<p>" not in plain


def test_print_decoded_email_parts_prints_then_plain(capsys):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "x"
    msg.attach(MIMEText("<p>a <b>b</b></p>", "html", "utf-8"))
    print_decoded_email_parts(msg)
    out = capsys.readouterr().out
    assert "--- Mail (with markup) ---" in out
    assert "<p>a <b>b</b></p>" in out
    assert "--- Mail (plain text) ---" in out
    plain_section = out.split("--- Mail (plain text) ---", 1)[1]
    assert "a" in plain_section and "b" in plain_section
    assert "<p>" not in out.split("--- Mail (plain text) ---", 1)[1]
    assert "Could not decode part" not in out
