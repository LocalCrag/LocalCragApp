import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app, render_template

from i18n.create_user_mail import create_user_mail
from i18n.reset_password_mail import reset_password_mail
from models.user import User


def build_i18n_keyword_arg_dict(locale, i18n_source_dict):
    """
    Builds a dictionary of i18n keys for email template rendering.
    :param locale: Locale to use in the mail.
    :param i18n_source_dict: Source dictionary that contains the translations.
    :return: Dictionary that has keys in the format of 'i18n_<key>' and translated string as values.
    """
    i18n_keyword_arg_dict = {}
    for key, value in i18n_source_dict[locale].items():
        i18n_keyword_arg_dict['i18n_{}'.format(key)] = value
    return i18n_keyword_arg_dict


def send_generic_mail(msg):
    """
    Sends the passed mail.
    :param msg: Mail to send.
    """

    if current_app.config['SMTP_PORT'] == '587':  # pragma: no cover
        context = ssl.create_default_context()
        with smtplib.SMTP(current_app.config['SMTP_HOST'], current_app.config['SMTP_PORT']) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASSWORD'])
            server.sendmail(msg['From'], msg['To'], msg.as_string())
    if current_app.config['SMTP_PORT'] == '465':
        with smtplib.SMTP_SSL(current_app.config['SMTP_HOST'], current_app.config['SMTP_PORT']) as server:
            server.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASSWORD'])
            server.sendmail(msg['From'], msg['To'], msg.as_string())
            server.quit()


def prepare_message(user: User, i18n_dict_source):
    """
    Prepares the default message.
    :param user: User that triggered the mail that was sent.
    :param i18n_dict_source: Translation source dict.
    :return: Tuple of message object and translation dict.
    """
    i18n_keyword_arg_dict = build_i18n_keyword_arg_dict(user.language.code, i18n_dict_source)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = i18n_keyword_arg_dict['i18n_subject']
    msg['From'] = current_app.config['SYSTEM_EMAIL']
    return msg, i18n_keyword_arg_dict


def send_forgot_password_email(user: User):
    """
    Sends a reset password mail to the user.
    :param user: User to send the reset mail to.
    """
    msg, i18n_keyword_arg_dict = prepare_message(user, reset_password_mail)
    msg['To'] = user.email
    action_link = '{}/reset-password/{}'.format(current_app.config['FRONTEND_HOST'], user.reset_password_hash)
    template = render_template('reset-password-mail.html', name='{} {}'.format(user.firstname, user.lastname),
                               action_link=action_link, **i18n_keyword_arg_dict)
    msg.attach(MIMEText(template, 'html'))

    send_generic_mail(msg)


def send_create_user_email(password: str, created_user: User):
    """
    Sends a reset password mail to the user.
    """
    msg, i18n_keyword_arg_dict = prepare_message(created_user, create_user_mail)
    msg['To'] = created_user.email
    action_link = '{}/activate-account'.format(current_app.config['FRONTEND_HOST'])
    template = render_template('create-user-mail.html', firstname=created_user.firstname,
                               lastname=created_user.lastname, action_link=action_link,
                               password=password, email=created_user.email,
                               **i18n_keyword_arg_dict)
    msg.attach(MIMEText(template, 'html'))

    send_generic_mail(msg)
