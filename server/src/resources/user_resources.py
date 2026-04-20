import re
from collections import Counter, defaultdict
from datetime import datetime
from uuid import uuid4

import pytz
from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import func
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from helpers.user_helpers import create_user
from marshmallow_schemas.auth_response_schema import auth_response_schema
from marshmallow_schemas.simple_message_schema import simple_message_schema
from marshmallow_schemas.user_schema import user_list_schema, user_schema
from messages.marshalling_objects import AuthResponse, SimpleMessage
from messages.messages import ResponseMessage
from models.area import Area
from models.ascent import Ascent
from models.comment import Comment
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.enums.user_promotion_enum import UserPromotionEnum
from models.gallery_image import GalleryImage
from models.instance_settings import InstanceSettings
from models.line import Line
from models.post import Post
from models.ranking import Ranking
from models.reaction import Reaction
from models.sector import Sector
from models.user import User
from util.auth import get_access_token_claims
from util.email import (
    send_change_email_address_email,
    send_create_user_email,
    send_user_registered_email,
)
from util.password_util import generate_password
from util.regexes import email_regex
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims
from webargs_schemas.change_password_args import change_password_args
from webargs_schemas.new_email_args import new_email_args
from webargs_schemas.user_args import (
    user_args,
    user_promotion_args,
    user_registration_args,
)


def _hardest_grade_bump(hardest: dict, line: Line, display_user_grades: bool) -> None:
    """Track max displayed line grade per (line_type, grade_scale)."""
    gv = line.user_grade_value if display_user_grades else line.author_grade_value
    if gv is None or gv <= 0:
        return
    line_type = line.type.value if line.type is not None else None
    if not line_type or not line.grade_scale:
        return
    key = (line_type, line.grade_scale)
    prev = hardest.get(key)
    if prev is None or gv > prev:
        hardest[key] = gv


def _hardest_grades_to_list(hardest: dict) -> list:
    return [{"lineType": lt, "gradeScale": scale, "gradeValue": val} for (lt, scale), val in sorted(hardest.items())]


class GetUser(MethodView):
    def get(self, user_slug):
        return jsonify(user_schema.dump(User.find_by_slug(user_slug))), 200


class ChangePassword(MethodView):
    @jwt_required()
    def put(self):
        """
        Changes the requesting users password.
        """
        data = parser.parse(change_password_args, request)
        user = User.find_by_email(get_jwt_identity())
        if not user:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
        if User.verify_hash(data["oldPassword"], user.password):
            if len(data["newPassword"]) < 8:
                raise BadRequest(ResponseMessage.PASSWORD_TOO_SHORT.value)
            user.password = User.generate_hash(data["newPassword"])
            db.session.add(user)
            db.session.commit()
            simple_message = SimpleMessage(ResponseMessage.PASSWORD_CHANGED.value)
            return simple_message_schema.dump(simple_message), 201
        else:
            raise Unauthorized(ResponseMessage.OLD_PASSWORD_INCORRECT.value)


class GetUsers(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self):
        """
        Returns the list of users.
        """
        return jsonify(user_list_schema.dump(User.return_all(order_by=[User.firstname.asc, User.lastname.asc]))), 200


class GetEmailTaken(MethodView):
    def get(self, email):
        """
        Checks if the given email is already taken.
        :param email: Email of the user to check.
        """
        user = User.find_by_email(email.lower())
        return jsonify(user is not None), 200


class ResendUserCreateMail(MethodView):

    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, user_id):
        """
        Resends the user created mail for a user. The password is re-generated in this step. Only works for
        inactive users.
        """
        user: User = User.find_by_id(user_id)

        if user.activated:
            raise BadRequest(ResponseMessage.USER_ALREADY_ACTIVATED.value)

        password = generate_password()
        user.password = User.generate_hash(password)
        db.session.add(user)
        db.session.commit()
        send_create_user_email(password, user)

        return jsonify(None)


class DeleteUser(MethodView):  # pragma: no cover

    @jwt_required()
    @check_auth_claims(admin=True)
    def delete(self, user_id):
        """
        Deletes a User.
        :param user_id: ID of the User to delete.
        """

        user_to_delete: User = User.find_by_id(user_id)
        request_user = User.find_by_email(get_jwt_identity())

        if user_to_delete.id == request_user.id:
            # Own user can only be deleted via account settings
            raise BadRequest(ResponseMessage.CANNOT_DELETE_OWN_USER.value)

        if user_to_delete.admin and not request_user.superadmin:
            raise Unauthorized(ResponseMessage.ONLY_SUPERADMINS_CAN_DELETE_OTHER_ADMINS.value)

        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify(None), 204


class UpdateAccount(MethodView):

    @jwt_required()
    def put(self):
        user_data = parser.parse(user_args, request)
        user = User.find_by_email(get_jwt_identity())  # You can only edit your own user!

        email_canonical = user_data["email"].lower()
        user_by_email = User.find_by_email(email_canonical)
        if user_by_email and user_by_email.id != user.id:
            # => The email exists for a user that is not the edited user
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, email_canonical):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        user.avatar_id = user_data["avatar"]
        user.firstname = user_data["firstname"]
        user.lastname = user_data["lastname"]

        if user.email != email_canonical:
            user.new_email = email_canonical
            user.new_email_hash = uuid4()
            user.new_email_hash_created = datetime.now()
            send_change_email_address_email(user)

        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user), 200


class ChangeEmail(MethodView):
    def put(self):
        data = parser.parse(new_email_args, request)
        user = User.find_by_new_email_hash(data["newEmailHash"])
        if not user:
            raise Unauthorized(ResponseMessage.NEW_EMAIL_HASH_INVALID.value)
        if not user.activated:
            raise Unauthorized(ResponseMessage.USER_NOT_ACTIVATED.value)
        now = datetime.now(pytz.utc)
        hash_age = now - user.new_email_hash_created
        # Hash must be younger than 24 hours
        if divmod(hash_age.total_seconds(), 60 * 60 * 24)[0] > 0.0:
            raise Unauthorized(ResponseMessage.NEW_EMAIL_HASH_INVALID.value)
        user.email = user.new_email
        user.new_email_hash = None
        user.new_email_hash_created = None
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(identity=user.email, additional_claims=get_access_token_claims(user))
        refresh_token = create_refresh_token(identity=user.email)
        auth_response = AuthResponse(
            ResponseMessage.EMAIL_CHANGED.value, user, access_token=access_token, refresh_token=refresh_token
        )
        return auth_response_schema.dump(auth_response), 200


class RegisterUser(MethodView):

    def post(self):
        user_data = parser.parse(user_registration_args, request)
        email_canonical = user_data["email"].lower()

        if User.find_by_email(email_canonical):
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, email_canonical):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        created_user = create_user(user_data)
        admins = User.get_admins()
        user_count = User.get_user_count()
        for admin in admins:
            send_user_registered_email(created_user, admin, user_count)

        return user_schema.dump(created_user), 201


class PromoteUser(MethodView):

    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, user_id):
        promotion_data = parser.parse(user_promotion_args, request)
        own_user = User.find_by_email(get_jwt_identity())
        user: User = User.find_by_id(user_id)

        if user.superadmin:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

        if own_user.id == user.id:
            raise Conflict(ResponseMessage.CANNOT_PROMOTE_OWN_USER.value)

        # We always set multiple properties, so we can later easily check permissions by a single bool value
        if promotion_data["promotionTarget"] == UserPromotionEnum.USER:
            user.admin = False
            user.moderator = False
            user.member = False
        if promotion_data["promotionTarget"] == UserPromotionEnum.MEMBER:
            user.admin = False
            user.moderator = False
            user.member = True
        if promotion_data["promotionTarget"] == UserPromotionEnum.MODERATOR:
            user.admin = False
            user.moderator = True
            user.member = True
        if promotion_data["promotionTarget"] == UserPromotionEnum.ADMIN:
            user.admin = True
            user.moderator = True
            user.member = True

        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user), 200


class GetUserGrades(MethodView):

    def get(self, user_slug):
        instance_settings = InstanceSettings.return_it()
        user_id = User.get_id_by_slug(user_slug)
        grade_col = Line.user_grade_value if instance_settings.display_user_grades else Line.author_grade_value
        query = (
            db.session.query(Line.type, Line.grade_scale, grade_col, Ascent.flash)
            .join(Ascent, Ascent.line_id == Line.id)
            .filter(Ascent.created_by_id == user_id, Line.archived.is_(False))
        )
        if not get_show_secret():
            query = query.filter(Line.secret.is_(False))
        result = query.all()
        response_data = {
            LineTypeEnum.BOULDER.value: defaultdict(Counter),
            LineTypeEnum.SPORT.value: defaultdict(Counter),
            LineTypeEnum.TRAD.value: defaultdict(Counter),
        }
        flash_data = {
            LineTypeEnum.BOULDER.value: defaultdict(Counter),
            LineTypeEnum.SPORT.value: defaultdict(Counter),
            LineTypeEnum.TRAD.value: defaultdict(Counter),
        }
        for lineType, gradeScale, gradeValue, flash in result:
            response_data[lineType.value][gradeScale].update({gradeValue: 1})
            if flash:
                flash_data[lineType.value][gradeScale].update({gradeValue: 1})

        return jsonify({"distribution": response_data, "flashDistribution": flash_data}), 200


class GetUserStatistics(MethodView):
    """Aggregate climbing, social, and moderation stats for the public user profile."""

    def get(self, user_slug):
        user_id = User.get_id_by_slug(user_slug)
        instance_settings = InstanceSettings.return_it()
        display_user_grades = bool(instance_settings.display_user_grades)

        ascents_query = (
            db.session.query(Ascent, Line)
            .join(Line, Ascent.line_id == Line.id)
            .filter(Ascent.created_by_id == user_id, Line.archived.is_(False))
        )
        if not get_show_secret():
            ascents_query = ascents_query.filter(Line.secret.is_(False))
        pairs = ascents_query.all()

        hardest_ascent: dict = {}
        hardest_flash: dict = {}
        hardest_fa: dict = {}

        ascents_per_year: dict[str, int] = {}
        total = 0
        flash_count = 0
        fa_count = 0
        soft_count = 0
        hard_count = 0
        upgrades = 0
        downgrades = 0
        biggest_upgrade_grades = 0
        biggest_downgrade_grades = 0

        for ascent, line in pairs:
            total += 1
            _hardest_grade_bump(hardest_ascent, line, display_user_grades)
            if ascent.flash:
                flash_count += 1
                _hardest_grade_bump(hardest_flash, line, display_user_grades)
            if ascent.fa:
                fa_count += 1
                _hardest_grade_bump(hardest_fa, line, display_user_grades)
            if ascent.soft:
                soft_count += 1
            if ascent.hard:
                hard_count += 1
            if ascent.ascent_date is not None:
                y = str(ascent.ascent_date.year)
                ascents_per_year[y] = ascents_per_year.get(y, 0) + 1

            ref = line.user_grade_value if display_user_grades else line.author_grade_value
            if ref > 0 and ascent.grade_value > 0:
                if ascent.grade_value > ref:
                    upgrades += 1
                    biggest_upgrade_grades = max(biggest_upgrade_grades, ascent.grade_value - ref)
                elif ascent.grade_value < ref:
                    downgrades += 1
                    biggest_downgrade_grades = max(biggest_downgrade_grades, ref - ascent.grade_value)

        flash_percent = round((flash_count / total) * 100, 1) if total else 0.0
        soft_percent = round((soft_count / total) * 100, 1) if total else 0.0
        hard_percent = round((hard_count / total) * 100, 1) if total else 0.0

        global_rank_top10_by_line_type = {}
        global_rank_top50_by_line_type = {}
        global_rank_total_count_by_line_type = {}
        for lt in LineTypeEnum:
            rankings = Ranking.query.filter(
                Ranking.crag_id.is_(None),
                Ranking.sector_id.is_(None),
                Ranking.secret.is_(False),
                Ranking.type == lt,
            ).all()
            rankings_top10 = list(rankings)
            rankings_top10.sort(
                key=lambda r: (r.top_10 or 0, r.top_50 or 0, r.total_count or 0),
                reverse=True,
            )
            rank_top10 = None
            for idx, r in enumerate(rankings_top10):
                if r.user_id == user_id:
                    rank_top10 = idx + 1
                    break
            global_rank_top10_by_line_type[lt.value] = rank_top10

            rankings_top50 = list(rankings)
            rankings_top50.sort(
                key=lambda r: (r.top_50 or 0, r.top_10 or 0, r.total_count or 0),
                reverse=True,
            )
            rank_top50 = None
            for idx, r in enumerate(rankings_top50):
                if r.user_id == user_id:
                    rank_top50 = idx + 1
                    break
            global_rank_top50_by_line_type[lt.value] = rank_top50

            rankings_total = list(rankings)
            rankings_total.sort(
                key=lambda r: (r.total_count or 0, r.top_10 or 0, r.top_50 or 0),
                reverse=True,
            )
            rank_total = None
            for idx, r in enumerate(rankings_total):
                if r.user_id == user_id:
                    rank_total = idx + 1
                    break
            global_rank_total_count_by_line_type[lt.value] = rank_total

        comments_count = (
            db.session.query(func.count(Comment.id))
            .filter(Comment.created_by_id == user_id, Comment.is_deleted.is_(False))
            .scalar()
        )
        # Emoji reactions this user placed (Reaction.created_by_id), not reactions on their own content.
        reactions_count = db.session.query(func.count(Reaction.id)).filter(Reaction.created_by_id == user_id).scalar()
        gallery_images_uploaded = (
            db.session.query(func.count(GalleryImage.id)).filter(GalleryImage.created_by_id == user_id).scalar()
        )

        moderation = {
            "cragsCreated": Crag.query.filter(Crag.created_by_id == user_id).count(),
            "sectorsCreated": Sector.query.filter(Sector.created_by_id == user_id).count(),
            "areasCreated": Area.query.filter(Area.created_by_id == user_id).count(),
            "linesCreated": Line.query.filter(Line.created_by_id == user_id).count(),
            "postsWritten": Post.query.filter(Post.created_by_id == user_id).count(),
        }

        payload = {
            "ascentsPerYear": dict(sorted(ascents_per_year.items(), key=lambda kv: kv[0])),
            "ascentTotals": {
                "total": total,
                "flashCount": flash_count,
                "flashPercent": flash_percent,
                "faCount": fa_count,
                "upgradeCount": upgrades,
                "downgradeCount": downgrades,
                "biggestUpgradeGrades": biggest_upgrade_grades,
                "biggestDowngradeGrades": biggest_downgrade_grades,
                "hardestAscentGrades": _hardest_grades_to_list(hardest_ascent),
                "hardestFlashGrades": _hardest_grades_to_list(hardest_flash),
                "hardestFaGrades": _hardest_grades_to_list(hardest_fa),
                "softPercent": soft_percent,
                "hardPercent": hard_percent,
            },
            "globalRankByLineType": global_rank_top10_by_line_type,
            "globalRankTop50ByLineType": global_rank_top50_by_line_type,
            "globalRankTotalCountByLineType": global_rank_total_count_by_line_type,
            "social": {
                "commentsCount": int(comments_count or 0),
                "reactionsCount": int(reactions_count or 0),
                "galleryImagesUploaded": int(gallery_images_uploaded or 0),
            },
            "moderation": moderation,
        }
        return jsonify(payload), 200
