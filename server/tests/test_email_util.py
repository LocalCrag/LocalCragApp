from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import render_template

from app import app
from extensions import db
from i18n.mail_common import merge_mail_translations
from i18n.reset_password_mail import reset_password_mail
from models.comment import Comment
from models.instance_settings import InstanceSettings
from models.line import Line
from models.user import User
from util.email import (
    _apply_instance_branding,
    _html_to_plain_text,
    build_i18n_keyword_arg_dict,
    log_decoded_email_parts,
    send_comment_created_email,
    send_project_climbed_email,
    send_user_registered_email,
)


def test_mail_common_provides_shared_translations():
    merged = merge_mail_translations("en", reset_password_mail["en"])
    assert merged["hello"] == "Hello"
    assert merged["copyright"] == "© {copyright_owner} - All rights reserved."
    assert merged["greetings"] == "Your {instance_name} team"
    assert merged["subject"] == "Reset {instance_name} password"


def test_apply_instance_branding_injects_instance_name_and_copyright_owner():
    with app.app_context():
        settings = InstanceSettings.return_it()
        i18n_keyword_arg_dict = build_i18n_keyword_arg_dict("en", reset_password_mail)
        _apply_instance_branding(i18n_keyword_arg_dict)

        assert i18n_keyword_arg_dict["instance_name"] == settings.instance_name
        assert i18n_keyword_arg_dict["copyright_owner"] == settings.copyright_owner
        assert settings.copyright_owner in i18n_keyword_arg_dict["i18n_copyright"]
        assert settings.instance_name in i18n_keyword_arg_dict["i18n_subject"]
        assert settings.instance_name in i18n_keyword_arg_dict["i18n_greetings"]
        assert i18n_keyword_arg_dict["i18n_thanks"] == settings.mail_greeting
        assert "{instance_name}" not in i18n_keyword_arg_dict["i18n_subject"]
        assert "{instance_name}" not in i18n_keyword_arg_dict["i18n_greetings"]


def test_reset_password_mail_template_uses_instance_branding():
    with app.app_context():
        settings = InstanceSettings.return_it()
        i18n_keyword_arg_dict = build_i18n_keyword_arg_dict("en", reset_password_mail)
        _apply_instance_branding(i18n_keyword_arg_dict)

        html = render_template(
            "reset-password-mail.html",
            name="Jane Doe",
            action_link="https://example.com/reset",
            frontend_host="https://example.com",
            **i18n_keyword_arg_dict,
        )

        assert settings.instance_name in html
        assert settings.copyright_owner in html
        assert settings.mail_greeting in html
        assert 'class="email-masthead_name"' in html


def test_html_to_plain_text_strips_tags_and_script():
    html = "<p>Pass: <strong>secret123</strong></p><script>evil()</script><style>.x{}</style>"
    plain = _html_to_plain_text(html)
    assert "secret123" in plain
    assert "evil()" not in plain
    assert "<p>" not in plain


def test_log_decoded_email_parts_logs_markup_then_plain(caplog):
    import logging

    with app.app_context():
        # app.logger has propagate=False; attach caplog handler to capture its output.
        app.logger.addHandler(caplog.handler)
        caplog.set_level(logging.INFO, logger=app.logger.name)
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "x"
            msg.attach(MIMEText("<p>a <b>b</b></p>", "html", "utf-8"))
            log_decoded_email_parts(msg)
            out = caplog.text
            assert "--- Mail (with markup) ---" in out
            assert "<p>a <b>b</b></p>" in out
            assert "--- Mail (plain text) ---" in out
            plain_section = out.split("--- Mail (plain text) ---", 1)[1]
            assert "a" in plain_section and "b" in plain_section
            assert "<p>" not in plain_section
            assert "Could not decode part" not in out
        finally:
            app.logger.removeHandler(caplog.handler)


def test_comment_created_email_uses_receiver_language(client, smtp_mock):
    """Comment notification mails must follow the receiver's account language (#1224)."""
    from email import message_from_string

    author = User.find_by_email("member@localcrag.invalid.org")
    receiver = User.find_by_email("admin@localcrag.invalid.org")
    author.account_settings.language = "en"
    receiver.account_settings.language = "de"
    db.session.commit()

    line = Line.find_by_slug("the-vessel")
    comment = Comment(message="Locale check", object=line)
    db.session.add(comment)
    db.session.commit()

    send_comment_created_email(author, receiver, comment)

    raw = smtp_mock.return_value.__enter__.return_value.sendmail.call_args[0][2]
    mail = message_from_string(raw)
    assert mail["Subject"] == "Neuer Kommentar"
    html_part = mail.get_payload()[0]
    html = html_part.get_payload(decode=True).decode(html_part.get_content_charset() or "utf-8")
    assert "Es wurde ein neuer Kommentar erstellt von" in html
    assert "A new comment was posted by" not in html


def _assert_mail_uses_german_subject(smtp_mock, expected_subject: str, english_subject: str):
    from email import message_from_string

    raw = smtp_mock.return_value.__enter__.return_value.sendmail.call_args[0][2]
    mail = message_from_string(raw)
    assert mail["Subject"] == expected_subject
    assert english_subject not in mail["Subject"]


def test_user_registered_email_uses_receiver_language(client, smtp_mock):
    registered_user = User.find_by_email("member@localcrag.invalid.org")
    receiver = User.find_by_email("admin@localcrag.invalid.org")
    registered_user.account_settings.language = "en"
    receiver.account_settings.language = "de"
    db.session.commit()

    send_user_registered_email(registered_user, receiver, user_count=42)
    _assert_mail_uses_german_subject(smtp_mock, "Neuer Benutzer!", "New user")


def test_project_climbed_email_uses_receiver_language(client, smtp_mock):
    climber = User.find_by_email("member@localcrag.invalid.org")
    receiver = User.find_by_email("admin@localcrag.invalid.org")
    climber.account_settings.language = "en"
    receiver.account_settings.language = "de"
    db.session.commit()

    line = Line.find_by_slug("the-vessel")
    send_project_climbed_email(climber, receiver, "Done!", line)
    _assert_mail_uses_german_subject(smtp_mock, "Ein Projekt wurde geklettert!", "A project has been climbed!")
