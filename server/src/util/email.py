import smtplib
import ssl
from email.message import Message
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import html2text
from flask import current_app, render_template

from i18n.change_email_address_mail import change_email_address_mail
from i18n.comment_created_mail import comment_created_mail
from i18n.comment_reply_mail import comment_reply_mail
from i18n.create_user_mail import create_user_mail
from i18n.project_climbed_mail import project_climbed_mail
from i18n.reset_password_mail import reset_password_mail
from i18n.user_registered_mail import user_registered_mail
from models.area import Area
from models.comment import Comment
from models.crag import Crag
from models.line import Line
from models.post import Post
from models.region import Region
from models.sector import Sector
from models.user import User


def _frontend_url(path: str) -> str:
    path = path.lstrip("/")
    return f"{current_app.config['FRONTEND_HOST']}/{path}"


def build_i18n_keyword_arg_dict(locale, i18n_source_dict):
    """
    Builds a dictionary of i18n keys for email template rendering.
    :param locale: Locale to use in the mail.
    :param i18n_source_dict: Source dictionary that contains the translations.
    :return: Dictionary that has keys in the format of 'i18n_<key>' and translated string as values.
    """
    i18n_keyword_arg_dict = {}
    for key, value in i18n_source_dict[locale].items():
        i18n_keyword_arg_dict["i18n_{}".format(key)] = value
    return i18n_keyword_arg_dict


def send_generic_mail(msg):
    """
    Sends the passed mail.
    :param msg: Mail to send.
    """

    if current_app.config["PRINT_MAILS_TO_CONSOLE"]:
        print_decoded_email_parts(msg)
        return

    smtp_type = current_app.config.get("SMTP_TYPE", "").lower()
    if smtp_type not in ["smtps", "starttls", "plain", "disabled"]:
        print(f"WARNING: Invalid SMTP_TYPE set ({smtp_type!r}), defaulting to 'disabled'")
        smtp_type = "disabled"

    if smtp_type == "starttls":  # pragma: no cover
        context = ssl.create_default_context()
        with smtplib.SMTP(current_app.config["SMTP_HOST"], current_app.config["SMTP_PORT"]) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(current_app.config["SMTP_USER"], current_app.config["SMTP_PASSWORD"])
            server.sendmail(msg["From"], msg["To"], msg.as_string())
    elif smtp_type == "smtps":
        with smtplib.SMTP_SSL(current_app.config["SMTP_HOST"], current_app.config["SMTP_PORT"]) as server:
            server.login(current_app.config["SMTP_USER"], current_app.config["SMTP_PASSWORD"])
            server.sendmail(msg["From"], msg["To"], msg.as_string())
            server.quit()
    elif smtp_type == "plain":
        with smtplib.SMTP(current_app.config["SMTP_HOST"], current_app.config["SMTP_PORT"]) as server:
            server.login(current_app.config["SMTP_USER"], current_app.config["SMTP_PASSWORD"])
            server.sendmail(msg["From"], msg["To"], msg.as_string())
            server.quit()


def prepare_message(user: User, i18n_dict_source):
    """
    Prepares the default message.
    :param user: User that triggered the mail that was sent.
    :param i18n_dict_source: Translation source dict.
    :return: Tuple of message object and translation dict.
    """
    i18n_keyword_arg_dict = build_i18n_keyword_arg_dict(user.account_settings.language, i18n_dict_source)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = i18n_keyword_arg_dict["i18n_subject"]
    msg["From"] = current_app.config["SYSTEM_EMAIL"]
    return msg, i18n_keyword_arg_dict


def send_forgot_password_email(user: User):
    """
    Sends a reset password mail to the user.
    :param user: User to send the reset mail to.
    """
    msg, i18n_keyword_arg_dict = prepare_message(user, reset_password_mail)
    msg["To"] = user.email
    action_link = _frontend_url(f"reset-password/{user.reset_password_hash}")
    template = render_template(
        "reset-password-mail.html",
        name="{} {}".format(user.firstname, user.lastname),
        action_link=action_link,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))

    send_generic_mail(msg)


def send_change_email_address_email(user: User):
    """
    Sends a change email address mail to the user.
    :param user: User to send the change email address mail to.
    """
    msg, i18n_keyword_arg_dict = prepare_message(user, change_email_address_mail)
    msg["To"] = user.email
    action_link = _frontend_url(f"change-email/{user.new_email_hash}")
    template = render_template(
        "change-email-address-mail.html",
        name="{} {}".format(user.firstname, user.lastname),
        action_link=action_link,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))

    send_generic_mail(msg)


def send_create_user_email(password: str, created_user: User):
    """
    Sends a reset password mail to the user.
    """
    msg, i18n_keyword_arg_dict = prepare_message(created_user, create_user_mail)
    msg["To"] = created_user.email
    action_link = _frontend_url("activate-account")
    template = render_template(
        "create-user-mail.html",
        firstname=created_user.firstname,
        lastname=created_user.lastname,
        action_link=action_link,
        password=password,
        email=created_user.email,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))

    send_generic_mail(msg)


def send_user_registered_email(registered_user: User, receiver: User, user_count: int):
    msg, i18n_keyword_arg_dict = prepare_message(registered_user, user_registered_mail)
    msg["To"] = receiver.email
    action_link = _frontend_url(f"users/{registered_user.slug}")
    template = render_template(
        "user-registered-mail.html",
        firstname=registered_user.firstname,
        lastname=registered_user.lastname,
        action_link=action_link,
        admin=receiver.firstname,
        frontend_host=current_app.config["FRONTEND_HOST"],
        user_count=user_count,
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))

    send_generic_mail(msg)


def send_project_climbed_email(climber: User, receiver: User, message: str, line: Line):
    msg, i18n_keyword_arg_dict = prepare_message(climber, project_climbed_mail)
    msg["To"] = receiver.email
    action_link_project = _frontend_url(
        f"topo/{line.area.sector.crag.slug}/{line.area.sector.slug}/{line.area.slug}/{line.slug}"
    )
    action_link_user = _frontend_url(f"users/{climber.slug}")
    template = render_template(
        "project-climbed-mail.html",
        message=message,
        action_link_project=action_link_project,
        action_link_user=action_link_user,
        admin=receiver.firstname,
        climber_mail=climber.email,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))

    send_generic_mail(msg)


def _build_comment_action_link(comment: Comment) -> str:
    """Return a frontend link matching the commented object to view the conversation."""
    obj = comment.object
    # Lines
    if isinstance(obj, Line):
        return _frontend_url(
            f"topo/{obj.area.sector.crag.slug}/{obj.area.sector.slug}/{obj.area.slug}/{obj.slug}/comments#{comment.id}"
        )
    # Areas
    if isinstance(obj, Area):
        return _frontend_url(f"topo/{obj.sector.crag.slug}/{obj.sector.slug}/{obj.slug}/comments#{comment.id}")
    # Sectors
    if isinstance(obj, Sector):
        return _frontend_url(f"topo/{obj.crag.slug}/{obj.slug}/comments#{comment.id}")
    # Crags
    if isinstance(obj, Crag):
        return _frontend_url(f"topo/{obj.slug}/comments#{comment.id}")
    # Region
    if isinstance(obj, Region):
        return _frontend_url(f"topo/comments#{comment.id}")
    # Blog posts
    if isinstance(obj, Post):
        return _frontend_url(f"news/{obj.slug}#{comment.id}")
    # Fallback
    return current_app.config["FRONTEND_HOST"]


def send_comment_created_email(author: User, receiver: User, comment: Comment):
    msg, i18n_keyword_arg_dict = prepare_message(author, comment_created_mail)
    msg["To"] = receiver.email
    action_link = _build_comment_action_link(comment)
    template = render_template(
        "comment-created-mail.html",
        receiver_firstname=receiver.firstname,
        author_name=f"{author.firstname} {author.lastname}".strip(),
        message=comment.message or "",
        action_link=action_link,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))
    send_generic_mail(msg)


def send_comment_reply_email(replier: User, receiver: User, comment: Comment):
    msg, i18n_keyword_arg_dict = prepare_message(replier, comment_reply_mail)
    msg["To"] = receiver.email
    action_link = _build_comment_action_link(comment)
    template = render_template(
        "comment-reply-mail.html",
        receiver_firstname=receiver.firstname,
        author_name=f"{replier.firstname} {replier.lastname}".strip(),
        message=comment.message or "",
        action_link=action_link,
        frontend_host=current_app.config["FRONTEND_HOST"],
        **i18n_keyword_arg_dict,
    )
    msg.attach(MIMEText(template, "html"))
    send_generic_mail(msg)


def _html_to_plain_text(html: str) -> str:
    """HTML email body to readable text for console (uses html2text)."""
    h = html2text.HTML2Text()
    h.body_width = 0  # keep long URLs on one line
    h.ignore_images = True
    h.single_line_break = True
    return h.handle(html).strip()


def _print_decoded_email_parts_once(email_message: Message, *, strip_html: bool) -> None:
    if email_message.is_multipart():
        for part in email_message.walk():
            content_disposition = part.get("Content-Disposition")
            if content_disposition is not None:
                # This is an attachment (may be multipart, e.g. forwarded message)
                print(f"Attachment: {part.get_filename()}")
                continue
            content_type = part.get_content_type()
            if part.is_multipart():
                # Inner MIME containers have no single raw body; walk() yields leaves next.
                continue
            try:
                charset = part.get_content_charset() or "utf-8"
                raw = part.get_payload(decode=True)
                if raw is None:
                    continue
                body = raw.decode(charset)
                if strip_html and content_type == "text/html":
                    body = _html_to_plain_text(body)
                print(f"Content Type: {content_type}\nBody:\n{body}\n")
            except Exception as e:
                print(f"Could not decode part: {e}")
    else:
        charset = email_message.get_content_charset() or "utf-8"
        raw = email_message.get_payload(decode=True)
        if raw is None:
            print("Body:\n(empty)\n")
            return
        body = raw.decode(charset)
        ct = email_message.get_content_type()
        if strip_html and ct == "text/html":
            body = _html_to_plain_text(body)
        print(f"Body:\n{body}\n")


def print_decoded_email_parts(email_message: Message):
    """
    Print all parts of an email message twice: first as decoded HTML (with markup), then the same
    bodies run through html2text so values like temporary passwords are easy to spot in the console.
    """
    print("--- Mail (with markup) ---")
    _print_decoded_email_parts_once(email_message, strip_html=False)
    print("--- Mail (plain text) ---")
    _print_decoded_email_parts_once(email_message, strip_html=True)
