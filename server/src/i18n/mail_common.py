mail_common = {
    "de": {
        "hello": "Hallo",
        "copyright": "© {copyright_owner} - Alle Rechte vorbehalten.",
        "greetings": "Dein {instance_name} Team",
    },
    "en": {
        "hello": "Hello",
        "copyright": "© {copyright_owner} - All rights reserved.",
        "greetings": "Your {instance_name} team",
    },
    "fr": {
        "hello": "Bonjour",
        "copyright": "© {copyright_owner} - Tous droits réservés.",
        "greetings": "Votre équipe {instance_name}",
    },
    "it": {
        "hello": "Ciao",
        "copyright": "© {copyright_owner} - Tutti i diritti riservati.",
        "greetings": "Il team {instance_name}",
    },
    "nl": {
        "hello": "Hallo",
        "copyright": "© {copyright_owner} - Alle rechten voorbehouden.",
        "greetings": "Je {instance_name}-team",
    },
}


def merge_mail_translations(locale, mail_translations):
    """Merge shared mail strings with mail-specific translations (mail-specific wins)."""
    return {**mail_common.get(locale, {}), **mail_translations}
