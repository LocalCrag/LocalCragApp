PGDMP     4    5                |            localcrag_dev    14.8 (Homebrew)    14.8 (Homebrew) Q    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    68766542    localcrag_dev    DATABASE     X   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false                        3079    68766544 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                   false            �           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                        false    2            L           1247 	   133566439    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            p           1247 	   133566653    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �            1259 	   133566445    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259 	   133566448    areas    TABLE     z  CREATE TABLE public.areas (
    name character varying(120) NOT NULL,
    description text,
    lat double precision,
    lng double precision,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    portrait_image_id uuid,
    sector_id uuid NOT NULL,
    slug character varying NOT NULL
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259 	   133566453    crags    TABLE     w  CREATE TABLE public.crags (
    name character varying(120) NOT NULL,
    description text,
    rules text,
    region_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying(120) NOT NULL,
    short_description text,
    portrait_image_id uuid
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259 	   133566458    files    TABLE     �  CREATE TABLE public.files (
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    original_filename character varying(120) NOT NULL,
    filename character varying(120) NOT NULL,
    width integer,
    height integer,
    thumbnail_xs boolean,
    thumbnail_s boolean,
    thumbnail_m boolean,
    thumbnail_l boolean,
    thumbnail_xl boolean,
    created_by_id uuid
);
    DROP TABLE public.files;
       public         heap    felixengelmann    false            �            1259 	   133566461 
   line_paths    TABLE       CREATE TABLE public.line_paths (
    line_id uuid NOT NULL,
    topo_image_id uuid NOT NULL,
    path json NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.line_paths;
       public         heap    felixengelmann    false            �            1259 	   133566466    lines    TABLE     �  CREATE TABLE public.lines (
    name character varying(120) NOT NULL,
    description text,
    video character varying(120),
    type public.linetypeenum NOT NULL,
    eliminate boolean NOT NULL,
    traverse boolean NOT NULL,
    area_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL,
    rating integer,
    fa_year integer,
    fa_name character varying(120),
    highball boolean NOT NULL,
    no_topout boolean NOT NULL,
    roof boolean NOT NULL,
    slab boolean NOT NULL,
    vertical boolean NOT NULL,
    overhang boolean NOT NULL,
    athletic boolean NOT NULL,
    technical boolean NOT NULL,
    endurance boolean NOT NULL,
    cruxy boolean NOT NULL,
    dyno boolean NOT NULL,
    jugs boolean NOT NULL,
    sloper boolean NOT NULL,
    pockets boolean NOT NULL,
    crack boolean NOT NULL,
    dihedral boolean NOT NULL,
    compression boolean NOT NULL,
    arete boolean NOT NULL,
    crimps boolean NOT NULL,
    pinches boolean NOT NULL,
    grade_name character varying(120) NOT NULL,
    grade_scale character varying(120) NOT NULL,
    starting_position public.startingpositionenum NOT NULL
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    880    844            �            1259 	   133566471    regions    TABLE       CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259 	   133566476    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259 	   133566479    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    217            �           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    218            �            1259 	   133566480    sectors    TABLE     p  CREATE TABLE public.sectors (
    name character varying(120) NOT NULL,
    description text NOT NULL,
    crag_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    short_description text,
    slug character varying(120) NOT NULL,
    portrait_image_id uuid
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259 	   133566485    topo_images    TABLE     �   CREATE TABLE public.topo_images (
    area_id uuid NOT NULL,
    file_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.topo_images;
       public         heap    felixengelmann    false            �            1259 	   133566488    users    TABLE     �  CREATE TABLE public.users (
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    password character varying(120) NOT NULL,
    email character varying(120) NOT NULL,
    firstname character varying(120),
    lastname character varying(120),
    locked boolean,
    activated boolean,
    activated_at timestamp without time zone,
    reset_password_hash character varying(120),
    reset_password_hash_created timestamp with time zone,
    language character varying DEFAULT 'de'::character varying NOT NULL,
    color_scheme character varying NOT NULL,
    created_by_id uuid,
    avatar_id uuid,
    deleted boolean,
    deleted_at timestamp without time zone
);
    DROP TABLE public.users;
       public         heap    felixengelmann    false            �           2604 	   133566494    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    218    217            v          0 	   133566445    alembic_version 
   TABLE DATA                 public          felixengelmann    false    210   Tl       w          0 	   133566448    areas 
   TABLE DATA                 public          felixengelmann    false    211   �l       x          0 	   133566453    crags 
   TABLE DATA                 public          felixengelmann    false    212   n       y          0 	   133566458    files 
   TABLE DATA                 public          felixengelmann    false    213   {o       z          0 	   133566461 
   line_paths 
   TABLE DATA                 public          felixengelmann    false    214   r       {          0 	   133566466    lines 
   TABLE DATA                 public          felixengelmann    false    215   �s       |          0 	   133566471    regions 
   TABLE DATA                 public          felixengelmann    false    216   Yu       }          0 	   133566476    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    217   �u                 0 	   133566480    sectors 
   TABLE DATA                 public          felixengelmann    false    219   �v       �          0 	   133566485    topo_images 
   TABLE DATA                 public          felixengelmann    false    220   �w       �          0 	   133566488    users 
   TABLE DATA                 public          felixengelmann    false    221   �x       �           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 2, true);
          public          felixengelmann    false    218            �           2606 	   133566496 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    210            �           2606 	   133566498    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    211            �           2606 	   133566500    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    211            �           2606 	   133566502    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    211            �           2606 	   133566504    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    212            �           2606 	   133566506    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    212            �           2606 	   133566508    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    212            �           2606 	   133566510    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    213            �           2606 	   133566512    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    213            �           2606 	   133566514    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    214            �           2606 	   133566516    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    214    214    214            �           2606 	   133566518    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    215            �           2606 	   133566520    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    215            �           2606 	   133566522    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    215            �           2606 	   133566524    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    216            �           2606 	   133566526    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    216            �           2606 	   133566528    regions regions_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_slug_key;
       public            felixengelmann    false    216            �           2606 	   133566530 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    217            �           2606 	   133566532    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    219            �           2606 	   133566534    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    219            �           2606 	   133566536    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    219            �           2606 	   133566538    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    220            �           2606 	   133566540    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    220    220    220            �           2606 	   133566542    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    221            �           2606 	   133566544    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    221            �           2606 	   133566546    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    221            �           2606 	   133566547    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    211    221    3539            �           2606 	   133566552 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    213    3505    211            �           2606 	   133566557    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    211    219    3527            �           2606 	   133566562    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    3539    221    212            �           2606 	   133566567 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    213    3505    212            �           2606 	   133566572    crags crags_region_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);
 D   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_region_id_fkey;
       public          felixengelmann    false    3519    216    212            �           2606 	   133566577    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    3539    213    221            �           2606 	   133566582 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    214    3539    221            �           2606 	   133566587 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    214    215    3513            �           2606 	   133566592 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    214    220    3533            �           2606 	   133566597    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    3493    215    211            �           2606 	   133566602    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    221    215    3539            �           2606 	   133566607 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    216    3539    221            �           2606 	   133566612    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    212    3499    219            �           2606 	   133566617 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    219    3539    221            �           2606 	   133566622 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    219    3505    213            �           2606 	   133566627 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    3493    211    220            �           2606 	   133566632 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    221    3539    220            �           2606 	   133566637 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    3505    220    213            �           2606 	   133566642    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    3505    213    221            �           2606 	   133566647    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    221    3539    221            v   F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�POL2JK1�HK224S״��� �v�      w   \  x���MK#A���}����]5Y����OWj��q&��=<,�ԥ�z��Y�o.�o�r}{ev/��jFm���|uwyc�����YGs�o�����������Owg�}�[���,�v�7�/Of�~2�}R�����]�*�4��ו��)m���24�@���@���8�ӯ�� ��G����b)&J�u}�Z����cZk[��t�:A������S�rV'��j�m����&�ȁ�������6���JɵY�y�}���'r(��!������[y0E���Q;y�
?�`,A�J�� *F�(�o0�H�����������0@a�|`(�����g      x   U  x���KK1F���U�;f���A��b�Ъ��Ǵ2-Sf�_�JQ���@�Ås���l�(������K���� �oO��8߶����1���l��͇�ms�f#��xG������{�9�U���$�b@�L0��BXU���I8p�!���T��R��!������qJ*ҁR�ĉ*'�V:��u��X�LiP�
���-�X{6��*�B�[��yߵǟ$��i6�1V��K�,����/�ϯF�?��m�v��q�k��c�����gr:@FJ����Y�:��}
�jbl��2���o���}�/9������z� C��Vl+�IC������      y   �  x�ŕ�kA���W��Up��L2��O>�VJm}�̯R9zŞ���ګ�x(B��d6;��O���||��t::9}7]}+��:��U��>�<>{�q:\$� R�x��űTr�K����ϧE��a�$ZB�S�HdwOΎ�-gӯ7��m~o!d��jGu(û":\"�d	q� va��[��CW׿-O�i�.}8d�R��\�,<
Y<{qp�W�9*)��ptXruJ�9U�4Pl��� ��e�%��C��Yo�֛鐞�W�7�G.���V���R{�P����#v��} QyI���$Iz�������"Pۣ<,	�d���^�������m�]��|�`[�~�(U�\FF��c��x(r]�.�{
[' ���0>"�.P�q�5��3��z���q�<�`��>@�,1M���h�j+�C���K�5��⃳�W��[`;/#����4������C��A���򰗢տi��MJ�}�O�aJ�YU�)'1z'��)�@);h����ia�<�|O�x��O�i�uZu���o߿�>�2���KT��j�ab�������O��2%�:Rw҆���648kX�b���e?�4۟ =d�F7?�A�se�`^�CԚ.W�A�|��V�-�GBpp�L�*      z   |  x���MkU1���WdwN�L���r�Ņrۺ��|`�HA���(B-.�&�7�w��/7W�o��r�.=���sy���~~l߿|K�^�]ݤWG�)���Ęss��*�
�+���)y��K�a��蹅�l�F���}T*0%�B��AQ��eJ,�Ő럓GF%@1:%��5��EU*�C���o�)e8&�4�Qz<n�n��J��X{�u��ܛdXr3j[�l�*T�P3pB;��8
J�q{���
�2�ĺe�Yr�Ь��o��0s|��p�?��(w3C�eد�[]���q�٬7x�}��T
ӔJ���c{�:|J15' �c瑩?s<��8R%�4"�ex�XQ&�������5��p'W���v,N�r���OV�      {   �  x�Œ]o�0���+�U@���#�S�P�ePQubI�E�sB��I�
������e�*$$nα��>G�<^���@�Uq��Qۭ	���}�/�Y����B��UB���={[zw�mc{��T}���:ó�i{�]�ah��t���ï�8�B��{5���ϯ��cڼ���so?�Z//�kw����G
 �Fh��J��\B�5�DW&�	����aiU�
�	�D���!.!�� �K��8"�
DɌF3�"N%cN]��K_+�L��=N�r=���R�����4�<J}��~7��n���;�����O`w����~���Oy���s�E�x9Y<�	����Ϝ���)�A	��	ʴ\���46�CI���֤JL�hAIg���ߣ��Ӈxt��)�'t�|u��M&w�#�      |   �   x�5�1�0��_�--�I_�N��������i�������]Y�EcYY�+{��<���ӺDv�T]Ѳ�!�i�'��:ρ5_��Ay��!��� $��F@�����psuWU��RcF�G&l���>39��
�o�~��s�$��-=      }   �   x���9
�@ �>��.
~��φ�E��`��̟DQq;��6�|����B?n��M�SZ>��v.����>�a��w��k9�l��P3!�w�g�UUrF#jj�&���i�R�\�T� J� "'�DVq�Ȉ�[���n1�         4  x����j1��>En�Bc'�d3�"��A�(T�=�fU������	��=�
�!̗����r=۰�r�b��a��П.{���5�+�a��>��;���g�kw���.�/���vǮ��Nϳ;�jey �pt�8�^����2jK�� 4TG�#x�"!�Gõ��Y�9	Rq0\J&p"�t�
�I�嶪#4*"��hc�IAs�l��@����^����w�Lu?��Bp^Z^�i�4�[�\B��DW���i���ؕ�m�y�(�*�%n�����LN��$U:��oQzf�4� h����=}��t��'      �     x����N1��>�m>%N�8eb�pҩH�eEv�J�Vޟ���ٟ����n����q�|�۩N������.��cx~X��p36Қ4)HF�ȍ@�VY�f͞��w�h�R
 &b�%��c
R�ꕋ��	hɝs�'���ّ�A��r��a�����:�:�)yb���aY:�)f2h�Y�V{�P�ʅM#����~5��*j�j�A9Z�+� Q8�U%��~^�Tu� zK *� �pN��w�<a&��ﮫ�7�y�      �   %  x�ՐMO�@����=4�&l��G�ŋ�V-�%���ٖ-_Tj#�{i�ă�1� �wf򾓙<Q��Dq�e��Y�ԕ�T`��A�G��(�P]@�s�r.x�QL�����c�����X��(al��)w����j�0�,,B�]�-N�CĔ^�^��a���%�<,�r�l��P��d�D�4~fq���3=It[5��:W&ߨ�y�Wm�j�rƺ����m�&���P��m�����j�J?�G2��IGi�K��h��g��G���H����J�;���/X�Z�I�-     