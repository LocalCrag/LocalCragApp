PGDMP  !    0                |           localcrag_dev    16.2 (Homebrew)    16.2 (Homebrew) �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    16388    localcrag_dev    DATABASE     o   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false                        3079    2182044    citext 	   EXTENSION     :   CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
    DROP EXTENSION citext;
                   false            �           0    0    EXTENSION citext    COMMENT     S   COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';
                        false    3                        3079    1210036    fuzzystrmatch 	   EXTENSION     A   CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;
    DROP EXTENSION fuzzystrmatch;
                   false            �           0    0    EXTENSION fuzzystrmatch    COMMENT     ]   COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';
                        false    2            �           1247    3332262    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            �           1247    3332729    mapmarkertype    TYPE     �   CREATE TYPE public.mapmarkertype AS ENUM (
    'TOPO_IMAGE',
    'AREA',
    'SECTOR',
    'CRAG',
    'PARKING',
    'ACCESS_POINT',
    'OTHER'
);
     DROP TYPE public.mapmarkertype;
       public          felixengelmann    false            �           1247    3332270    menuitempositionenum    TYPE     M   CREATE TYPE public.menuitempositionenum AS ENUM (
    'BOTTOM',
    'TOP'
);
 '   DROP TYPE public.menuitempositionenum;
       public          felixengelmann    false            �           1247    3332276    menuitemtypeenum    TYPE     �   CREATE TYPE public.menuitemtypeenum AS ENUM (
    'MENU_PAGE',
    'TOPO',
    'NEWS',
    'YOUTUBE',
    'INSTAGRAM',
    'ASCENTS',
    'RANKING'
);
 #   DROP TYPE public.menuitemtypeenum;
       public          felixengelmann    false            �           1247    3332292    searchableitemtypeenum    TYPE     t   CREATE TYPE public.searchableitemtypeenum AS ENUM (
    'CRAG',
    'SECTOR',
    'AREA',
    'LINE',
    'USER'
);
 )   DROP TYPE public.searchableitemtypeenum;
       public          felixengelmann    false            �           1247    3332304    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �           1247    3332316    todopriorityenum    TYPE     U   CREATE TYPE public.todopriorityenum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);
 #   DROP TYPE public.todopriorityenum;
       public          felixengelmann    false            -           1255    3332323    parse_websearch(text)    FUNCTION     �   CREATE FUNCTION public.parse_websearch(search_query text) RETURNS tsquery
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT parse_websearch('pg_catalog.simple', search_query);
$$;
 9   DROP FUNCTION public.parse_websearch(search_query text);
       public          felixengelmann    false            �            1255    3332324     parse_websearch(regconfig, text)    FUNCTION       CREATE FUNCTION public.parse_websearch(config regconfig, search_query text) RETURNS tsquery
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT
    string_agg(
        (
            CASE
                WHEN position('''' IN words.word) > 0 THEN CONCAT(words.word, ':*')
                ELSE words.word
            END
        ),
        ' '
    )::tsquery
FROM (
    SELECT trim(
        regexp_split_to_table(
            websearch_to_tsquery(config, lower(search_query))::text,
            ' '
        )
    ) AS word
) AS words
$$;
 K   DROP FUNCTION public.parse_websearch(config regconfig, search_query text);
       public          felixengelmann    false            �            1259    3332325    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259    3332328    areas    TABLE     �  CREATE TABLE public.areas (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    portrait_image_id uuid,
    sector_id uuid NOT NULL,
    slug character varying NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    short_description text,
    secret boolean DEFAULT false
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259    3332335    ascents    TABLE     v  CREATE TABLE public.ascents (
    line_id uuid NOT NULL,
    flash boolean NOT NULL,
    fa boolean NOT NULL,
    soft boolean NOT NULL,
    hard boolean NOT NULL,
    grade_name character varying(120) NOT NULL,
    grade_scale character varying(120) NOT NULL,
    rating integer,
    comment text,
    year integer,
    date date,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid NOT NULL,
    with_kneepad boolean NOT NULL,
    crag_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    area_id uuid NOT NULL,
    ascent_date date NOT NULL
);
    DROP TABLE public.ascents;
       public         heap    felixengelmann    false            �            1259    3332340    crags    TABLE     �  CREATE TABLE public.crags (
    name character varying(120) NOT NULL,
    description text,
    rules text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying(120) NOT NULL,
    short_description text,
    portrait_image_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259    3332347    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259    3332350    instance_settings    TABLE     �  CREATE TABLE public.instance_settings (
    id uuid NOT NULL,
    time_updated timestamp without time zone,
    instance_name character varying(120) NOT NULL,
    copyright_owner character varying(120) NOT NULL,
    youtube_url character varying(120),
    instagram_url character varying(120),
    logo_image_id uuid,
    favicon_image_id uuid,
    auth_bg_image_id uuid,
    main_bg_image_id uuid,
    arrow_color character varying(7) DEFAULT '#FFE016'::character varying NOT NULL,
    arrow_text_color character varying(7) DEFAULT '#000000'::character varying NOT NULL,
    arrow_highlight_color character varying(7) DEFAULT '#FF0000'::character varying NOT NULL,
    arrow_highlight_text_color character varying(7) DEFAULT '#FFFFFF'::character varying NOT NULL,
    bar_chart_color character varying(30) DEFAULT '`rgb(213, 30, 38)'::character varying NOT NULL,
    matomo_tracker_url character varying(120),
    matomo_site_id character varying(120)
);
 %   DROP TABLE public.instance_settings;
       public         heap    felixengelmann    false            �            1259    3332360 
   line_paths    TABLE     b  CREATE TABLE public.line_paths (
    line_id uuid NOT NULL,
    topo_image_id uuid NOT NULL,
    path json NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    order_index_for_line integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.line_paths;
       public         heap    felixengelmann    false            �            1259    3332367    lines    TABLE       CREATE TABLE public.lines (
    name character varying(120) NOT NULL,
    description text,
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
    starting_position public.startingpositionenum NOT NULL,
    mantle boolean DEFAULT false NOT NULL,
    videos json,
    lowball boolean DEFAULT false NOT NULL,
    bad_dropzone boolean DEFAULT false NOT NULL,
    child_friendly boolean DEFAULT false NOT NULL,
    morpho boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false,
    grade_value integer NOT NULL
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    932    920            �            1259    3332743    map_markers    TABLE     �  CREATE TABLE public.map_markers (
    lat double precision,
    lng double precision,
    type public.mapmarkertype NOT NULL,
    name character varying(120),
    description text,
    crag_id uuid,
    sector_id uuid,
    area_id uuid,
    topo_image_id uuid,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.map_markers;
       public         heap    felixengelmann    false    998            �            1259    3332378 
   menu_items    TABLE     q  CREATE TABLE public.menu_items (
    type public.menuitemtypeenum NOT NULL,
    "position" public.menuitempositionenum NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    menu_page_id uuid,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    icon character varying(120)
);
    DROP TABLE public.menu_items;
       public         heap    felixengelmann    false    923    926            �            1259    3332382 
   menu_pages    TABLE       CREATE TABLE public.menu_pages (
    title character varying(120) NOT NULL,
    text text,
    slug character varying NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.menu_pages;
       public         heap    felixengelmann    false            �            1259    3332387    posts    TABLE       CREATE TABLE public.posts (
    title character varying(120) NOT NULL,
    text text,
    slug character varying NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.posts;
       public         heap    felixengelmann    false            �            1259    3332392    rankings    TABLE     3  CREATE TABLE public.rankings (
    id uuid NOT NULL,
    crag_id uuid,
    sector_id uuid,
    user_id uuid NOT NULL,
    top_10 integer,
    type public.linetypeenum NOT NULL,
    top_values json DEFAULT '[]'::json,
    total_count integer,
    secret boolean DEFAULT false NOT NULL,
    top_50 integer
);
    DROP TABLE public.rankings;
       public         heap    felixengelmann    false    920            �            1259    3332399    regions    TABLE     �   CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    rules text
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259    3332404    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259    3332407    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    230            �           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    231            �            1259    3332408    searchables    TABLE     �   CREATE TABLE public.searchables (
    name character varying(120) NOT NULL,
    type public.searchableitemtypeenum NOT NULL,
    id uuid NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.searchables;
       public         heap    felixengelmann    false    929            �            1259    3332412    sectors    TABLE     �  CREATE TABLE public.sectors (
    name character varying(120) NOT NULL,
    description text,
    crag_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    short_description text,
    slug character varying(120) NOT NULL,
    portrait_image_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    rules text,
    secret boolean DEFAULT false
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259    3332419    todos    TABLE     E  CREATE TABLE public.todos (
    crag_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    area_id uuid NOT NULL,
    line_id uuid NOT NULL,
    priority public.todopriorityenum NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.todos;
       public         heap    felixengelmann    false    935            �            1259    3332422    topo_images    TABLE     H  CREATE TABLE public.topo_images (
    area_id uuid NOT NULL,
    file_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    description text,
    title character varying(120)
);
    DROP TABLE public.topo_images;
       public         heap    felixengelmann    false            �            1259    3332428    users    TABLE     �  CREATE TABLE public.users (
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    password character varying(120) NOT NULL,
    email character varying(120) NOT NULL,
    firstname character varying(120),
    lastname character varying(120),
    activated boolean,
    activated_at timestamp without time zone,
    reset_password_hash character varying(120),
    reset_password_hash_created timestamp with time zone,
    language character varying DEFAULT 'de'::character varying NOT NULL,
    created_by_id uuid,
    avatar_id uuid,
    admin boolean DEFAULT false NOT NULL,
    member boolean DEFAULT false NOT NULL,
    new_email character varying(120),
    new_email_hash character varying(120),
    new_email_hash_created timestamp with time zone,
    moderator boolean DEFAULT false NOT NULL,
    slug character varying NOT NULL,
    superadmin boolean DEFAULT false NOT NULL
);
    DROP TABLE public.users;
       public         heap    felixengelmann    false            �           2604    3332438    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    231    230            �          0    3332325    alembic_version 
   TABLE DATA           6   COPY public.alembic_version (version_num) FROM stdin;
    public          felixengelmann    false    217   ^�       �          0    3332328    areas 
   TABLE DATA           �   COPY public.areas (name, description, id, time_created, time_updated, created_by_id, portrait_image_id, sector_id, slug, order_index, short_description, secret) FROM stdin;
    public          felixengelmann    false    218   ��       �          0    3332335    ascents 
   TABLE DATA           �   COPY public.ascents (line_id, flash, fa, soft, hard, grade_name, grade_scale, rating, comment, year, date, id, time_created, time_updated, created_by_id, with_kneepad, crag_id, sector_id, area_id, ascent_date) FROM stdin;
    public          felixengelmann    false    219   ��       �          0    3332340    crags 
   TABLE DATA           �   COPY public.crags (name, description, rules, id, time_created, time_updated, created_by_id, slug, short_description, portrait_image_id, order_index, secret) FROM stdin;
    public          felixengelmann    false    220   ��       �          0    3332347    files 
   TABLE DATA           �   COPY public.files (id, time_created, time_updated, original_filename, filename, width, height, thumbnail_xs, thumbnail_s, thumbnail_m, thumbnail_l, thumbnail_xl, created_by_id) FROM stdin;
    public          felixengelmann    false    221   ��       �          0    3332350    instance_settings 
   TABLE DATA           E  COPY public.instance_settings (id, time_updated, instance_name, copyright_owner, youtube_url, instagram_url, logo_image_id, favicon_image_id, auth_bg_image_id, main_bg_image_id, arrow_color, arrow_text_color, arrow_highlight_color, arrow_highlight_text_color, bar_chart_color, matomo_tracker_url, matomo_site_id) FROM stdin;
    public          felixengelmann    false    222   �       �          0    3332360 
   line_paths 
   TABLE DATA           �   COPY public.line_paths (line_id, topo_image_id, path, id, time_created, time_updated, created_by_id, order_index, order_index_for_line) FROM stdin;
    public          felixengelmann    false    223   ��       �          0    3332367    lines 
   TABLE DATA           �  COPY public.lines (name, description, type, eliminate, traverse, area_id, id, time_created, time_updated, created_by_id, slug, rating, fa_year, fa_name, highball, no_topout, roof, slab, vertical, overhang, athletic, technical, endurance, cruxy, dyno, jugs, sloper, pockets, crack, dihedral, compression, arete, crimps, pinches, grade_name, grade_scale, starting_position, mantle, videos, lowball, bad_dropzone, child_friendly, morpho, secret, grade_value) FROM stdin;
    public          felixengelmann    false    224   r�       �          0    3332743    map_markers 
   TABLE DATA           �   COPY public.map_markers (lat, lng, type, name, description, crag_id, sector_id, area_id, topo_image_id, id, time_created, time_updated, created_by_id) FROM stdin;
    public          felixengelmann    false    237   �       �          0    3332378 
   menu_items 
   TABLE DATA           �   COPY public.menu_items (type, "position", order_index, menu_page_id, id, time_created, time_updated, created_by_id, icon) FROM stdin;
    public          felixengelmann    false    225   ��       �          0    3332382 
   menu_pages 
   TABLE DATA           f   COPY public.menu_pages (title, text, slug, id, time_created, time_updated, created_by_id) FROM stdin;
    public          felixengelmann    false    226   	�       �          0    3332387    posts 
   TABLE DATA           a   COPY public.posts (title, text, slug, id, time_created, time_updated, created_by_id) FROM stdin;
    public          felixengelmann    false    227   ��       �          0    3332392    rankings 
   TABLE DATA           z   COPY public.rankings (id, crag_id, sector_id, user_id, top_10, type, top_values, total_count, secret, top_50) FROM stdin;
    public          felixengelmann    false    228   ��       �          0    3332399    regions 
   TABLE DATA           j   COPY public.regions (name, description, id, time_created, time_updated, created_by_id, rules) FROM stdin;
    public          felixengelmann    false    229   �       �          0    3332404    revoked_tokens 
   TABLE DATA           1   COPY public.revoked_tokens (id, jti) FROM stdin;
    public          felixengelmann    false    230   ��       �          0    3332408    searchables 
   TABLE DATA           =   COPY public.searchables (name, type, id, secret) FROM stdin;
    public          felixengelmann    false    232   8�       �          0    3332412    sectors 
   TABLE DATA           �   COPY public.sectors (name, description, crag_id, id, time_created, time_updated, created_by_id, short_description, slug, portrait_image_id, order_index, rules, secret) FROM stdin;
    public          felixengelmann    false    233   ��       �          0    3332419    todos 
   TABLE DATA           ~   COPY public.todos (crag_id, sector_id, area_id, line_id, priority, id, time_created, time_updated, created_by_id) FROM stdin;
    public          felixengelmann    false    234   ��       �          0    3332422    topo_images 
   TABLE DATA           �   COPY public.topo_images (area_id, file_id, id, time_created, time_updated, created_by_id, order_index, description, title) FROM stdin;
    public          felixengelmann    false    235   ��       �          0    3332428    users 
   TABLE DATA           3  COPY public.users (id, time_created, time_updated, password, email, firstname, lastname, activated, activated_at, reset_password_hash, reset_password_hash_created, language, created_by_id, avatar_id, admin, member, new_email, new_email_hash, new_email_hash_created, moderator, slug, superadmin) FROM stdin;
    public          felixengelmann    false    236   ��       �           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 6, true);
          public          felixengelmann    false    231            �           2606    3332440 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    217            �           2606    3332442    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    218            �           2606    3332444    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    218            �           2606    3332446    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    218            �           2606    3332448    ascents ascents_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_id_key;
       public            felixengelmann    false    219            �           2606    3332450    ascents ascents_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_pkey;
       public            felixengelmann    false    219            �           2606    3332452    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    220            �           2606    3332454    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    220            �           2606    3332456    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    220            �           2606    3332458    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    221            �           2606    3332460    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    221            �           2606    3332462 *   instance_settings instance_settings_id_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_id_key UNIQUE (id);
 T   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_id_key;
       public            felixengelmann    false    222            �           2606    3332464 (   instance_settings instance_settings_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_pkey;
       public            felixengelmann    false    222            �           2606    3332466    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    223            �           2606    3332468    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    223    223    223            �           2606    3332470    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    224            �           2606    3332472    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    224            �           2606    3332474    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    224            �           2606    3332778    map_markers map_markers_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_id_key;
       public            felixengelmann    false    237            �           2606    3332749    map_markers map_markers_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_pkey;
       public            felixengelmann    false    237            �           2606    3332476    menu_items menu_items_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_id_key;
       public            felixengelmann    false    225            �           2606    3332478    menu_pages menu_pages_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_id_key;
       public            felixengelmann    false    226            �           2606    3332480    menu_pages menu_pages_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_pkey;
       public            felixengelmann    false    226            �           2606    3332482    menu_pages menu_pages_slug_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_slug_key UNIQUE (slug);
 H   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_slug_key;
       public            felixengelmann    false    226            �           2606    3332484    posts posts_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_id_key;
       public            felixengelmann    false    227            �           2606    3332486    posts posts_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_pkey;
       public            felixengelmann    false    227            �           2606    3332488    posts posts_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_slug_key;
       public            felixengelmann    false    227            �           2606    3332490    rankings rankings_id_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_id_key UNIQUE (id);
 B   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_id_key;
       public            felixengelmann    false    228            �           2606    3332492    rankings rankings_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_pkey;
       public            felixengelmann    false    228            �           2606    3332494    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    229            �           2606    3332496    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    229            �           2606    3332498 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    230            �           2606    3332500    searchables searchables_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.searchables
    ADD CONSTRAINT searchables_pkey PRIMARY KEY (type, id);
 F   ALTER TABLE ONLY public.searchables DROP CONSTRAINT searchables_pkey;
       public            felixengelmann    false    232    232            �           2606    3332502    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    233            �           2606    3332504    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    233            �           2606    3332506    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    233            �           2606    3332776    todos todos_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_id_key;
       public            felixengelmann    false    234            �           2606    3332508    todos todos_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_pkey;
       public            felixengelmann    false    234            �           2606    3332510    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    235            �           2606    3332512    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    235    235    235            �           2606    3332514    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    236            �           2606    3332516    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    236            �           2606    3332518    users users_new_email_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_new_email_key UNIQUE (new_email);
 C   ALTER TABLE ONLY public.users DROP CONSTRAINT users_new_email_key;
       public            felixengelmann    false    236            �           2606    3332520    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    236            �           2606    3332522    users users_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.users DROP CONSTRAINT users_slug_key;
       public            felixengelmann    false    236            �           2606    3332523    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    3822    236    218            �           2606    3332528 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    3762    218    221            �           2606    3332533    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    233    3806    218            �           2606    3332538    ascents ascents_area_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_area_id_fkey;
       public          felixengelmann    false    218    3746    219            �           2606    3332543    ascents ascents_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_crag_id_fkey;
       public          felixengelmann    false    3756    220    219            �           2606    3332548 "   ascents ascents_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_created_by_id_fkey;
       public          felixengelmann    false    219    3822    236            �           2606    3332553    ascents ascents_line_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_line_id_fkey;
       public          felixengelmann    false    219    3774    224                        2606    3332558    ascents ascents_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 H   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_sector_id_fkey;
       public          felixengelmann    false    3806    219    233                       2606    3332563    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    220    3822    236                       2606    3332568 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    3762    220    221                       2606    3332573    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    236    3822    221                       2606    3332578 9   instance_settings instance_settings_auth_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_auth_bg_image_id_fkey FOREIGN KEY (auth_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_auth_bg_image_id_fkey;
       public          felixengelmann    false    222    221    3762                       2606    3332583 9   instance_settings instance_settings_favicon_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_favicon_image_id_fkey FOREIGN KEY (favicon_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_favicon_image_id_fkey;
       public          felixengelmann    false    222    3762    221                       2606    3332588 6   instance_settings instance_settings_logo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_logo_image_id_fkey FOREIGN KEY (logo_image_id) REFERENCES public.files(id);
 `   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_logo_image_id_fkey;
       public          felixengelmann    false    3762    222    221                       2606    3332593 9   instance_settings instance_settings_main_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_main_bg_image_id_fkey FOREIGN KEY (main_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_main_bg_image_id_fkey;
       public          felixengelmann    false    3762    221    222                       2606    3332598 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    236    223    3822            	           2606    3332603 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    224    3774    223            
           2606    3332608 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    3816    223    235                       2606    3332613    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    218    3746    224                       2606    3332618    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    3822    224    236            "           2606    3332750 $   map_markers map_markers_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_area_id_fkey;
       public          felixengelmann    false    237    218    3746            #           2606    3332755 $   map_markers map_markers_crag_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 N   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_crag_id_fkey;
       public          felixengelmann    false    237    3756    220            $           2606    3332760 *   map_markers map_markers_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 T   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_created_by_id_fkey;
       public          felixengelmann    false    237    3822    236            %           2606    3332765 &   map_markers map_markers_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 P   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_sector_id_fkey;
       public          felixengelmann    false    3806    237    233            &           2606    3332770 *   map_markers map_markers_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.map_markers
    ADD CONSTRAINT map_markers_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 T   ALTER TABLE ONLY public.map_markers DROP CONSTRAINT map_markers_topo_image_id_fkey;
       public          felixengelmann    false    237    235    3816                       2606    3332623 (   menu_items menu_items_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_created_by_id_fkey;
       public          felixengelmann    false    3822    236    225                       2606    3332628 '   menu_items menu_items_menu_page_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_page_id_fkey FOREIGN KEY (menu_page_id) REFERENCES public.menu_pages(id);
 Q   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_menu_page_id_fkey;
       public          felixengelmann    false    225    226    3782                       2606    3332633 (   menu_pages menu_pages_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_created_by_id_fkey;
       public          felixengelmann    false    236    226    3822                       2606    3332638    posts posts_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_created_by_id_fkey;
       public          felixengelmann    false    236    227    3822                       2606    3332643    rankings rankings_crag_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 H   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_crag_id_fkey;
       public          felixengelmann    false    3756    228    220                       2606    3332648     rankings rankings_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 J   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_sector_id_fkey;
       public          felixengelmann    false    233    3806    228                       2606    3332653    rankings rankings_user_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_user_id_fkey;
       public          felixengelmann    false    236    228    3822                       2606    3332658 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    236    229    3822                       2606    3332663    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    3756    220    233                       2606    3332668 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    233    3822    236                       2606    3332673 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    233    3762    221                       2606    3332678    todos todos_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_area_id_fkey;
       public          felixengelmann    false    234    218    3746                       2606    3332683    todos todos_crag_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 B   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_crag_id_fkey;
       public          felixengelmann    false    220    3756    234                       2606    3332688    todos todos_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_created_by_id_fkey;
       public          felixengelmann    false    236    3822    234                       2606    3332693    todos todos_line_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 B   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_line_id_fkey;
       public          felixengelmann    false    234    3774    224                       2606    3332698    todos todos_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.todos DROP CONSTRAINT todos_sector_id_fkey;
       public          felixengelmann    false    234    233    3806                       2606    3332703 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    218    235    3746                       2606    3332708 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    3822    236    235                       2606    3332713 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    221    3762    235                        2606    3332718    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    3762    236    221            !           2606    3332723    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    3822    236    236            �      x�K�H�L�0N5OJJ����� 1�|      �     x���=n�@F��)�����B
J���x��`aldH��>KHE�f�7�{�n���ä�yɃ�b�BFz�B�b��!D"NY�r�y0��+�+Z"��NY��.,��"D�K
.���Á���Il�ЧL�d!��.���A����gﯥy[��-/z;�r�_��a:]���yǏ|�?Y�Oe���ϳ>���3߮_.�1IL1AO��ƹ;�P"˾<'�U-F����u<+�`;� �h��R`d���味@��@́G�y��o���-R��      �   �   x�M�;N�1�����xe'~e;((鑶�G���@��T�7c���E�1�oRV�v��^v���������W��x-��R�2 iIg��[�j����3���Br'����X��H��ˡ���>OD�
:������#&K�0�����A�)ݝ���J��8��}D��6�Iޣ���Ѐau``��ŞF�O������_��I8      �     x��ѽN�@���y�����Ў �.��6J�T]��� &K�e���8L�qH'�>o�d<�v[.�8�!^�C{���ϕ��ys_�N�i,�������u�K�&B���*�$]�"�#*�� zк�i��ʺNm�U�g�[2!�
�K
ɂv�R�P#iBV�+��u���UE点�c��'�䁲�j�ڬzU�E�;�w?㗶HLdCB=G4r4P�w�r�]߯,w=j��>.Q�8�;C���J@�'�3� �J<נpvﻦi� q��      �   ?  x���Mj1���S�2Y�)IU���@L!0�ҟq09�{B��V�������$��	b@�Dڒ����!AJ4�t����f�D����x:/�o��T�zh-����=�F�P4�]� �y�1�	��0t̀���7Q��^�ld�Z�91`--�� x��W6��쬸&X1.�J���^�Ώ���}^n��(4 E[,�cmcHf4��"�i����o��̒7����#q���\��Kڴ.�aŸ�>��>�}���� ~J�?� ��7�RgRA�]r��e
�azQ�HɷB��ao�0�դ�c�vD�WE/��' Z�������Q�h.��f��E�}R�l�GRGlEBԘ��ۂp��������3-#o�cZH$%|[��1���'�-C�L1&����g���s�,<q�4�teS�u� ���Hk��E�e����g��������}�|����E�/	�����l��^�B���g$> û�S��&��}��H�WҤz߽L������_��?��<
�&H�s�
S͋�H�������;�;�o�����ޖ=�      �   �   x�]�1�0��_�`ڗ���U��K��vHLI[�o#��q�qppRkC[eŃ��RM(�ue���(������`��G��%̑?�'�yO���OY�P֐������V�T�pq��~��qW�L�A/�G�K�v�ͭ�$�挱72�      �   �  x����q1�ϫ*T�����"Ҁ���쿄@�����s��	~��;�:p5c�&h�F�j�'�0�%69c�m3�B���tj��<e`no�nW��$`h�"z���PG��U��=�1+z�r�/�j�u3%��D��?��)Ǻ���Ըu����o.���ltx6�C[ m8�E���o$��\��wɎ�	�����J]�E#��$vm�Ӛ푱�P��`�K&���(��m�Q������M�!���oW�N
����`�OH��hw�``�zA�,�Xݮ�	db#���o4�;��6fK9����G�D�gR~���mLX��;�-1ұ�6a�Z��佭A��ոۛ���4;��G-/*��T�S>A�G��~�E��~��O_b��K�.��y����a�
w��&G�9��R����bb���pE�����p  ���?��r���>      �   �  x��QMo�0=;�"䌳ŎJ�V�**�]N!۱�U�I�u�"�?����]������3�f��,��x�N�n@g���iܐ^���nvv=���tc�/�f�9���������7Va�.��L:�5���x[�$�,U��e��:Ʊ�+�`�D� ��H	T���W��S�a)�
��+%y��3*%����q���XX��7��B�݁��?C~臮\��O�w�lu�F.��h��������9��@�w�x��+�&��lB��f��~����0��n;��`ׯ���o�{;��>γ�i6�q.����w2B�����MkXlZ��ݰՍK���y��Z0���:�Oh,��&�_ڲ4�x�?�
�S��
���ӄǿ���?�� �j~sp���I��!h�q      �   e   x�E�1�0�f�/�l��Y;t�$��z�О4�D܈
ZC{(������{��-� t`�'8fI��������д�A�C̯�VOb�p��Z�Vk� ���      �   o  x����nAE��W��r����H!��0`���?!�-c5j���sp���v�z?�]��m߷�-^�H�[.X!!#p�[F�T����������JHQ���1��?0� ���ɍl��-(S��� NU GWК<�������C\&-hЙҡ�	JW�(��9�Ѣ��#�5�q@
& ��h!}7��2�N�'��}[�3�f�-I��Ђ�j�U(����v"�A5�W'�Q�������r�c"C�|�`��!Y����j9��gc\mV�3쟷�����|=�GT�\@�Ͻ�\���HK��W�Gt[��>C�]~��/5O�M�϶݀��4��J��Ց�A庪	�<�\O��_Ƥ��      �   �   x���;N�0Ekg��~�{4���i�(���g&���ؑ�a'l������=^�j]/l?nFZxmtn�Ɖ?���������Ư�M!S�Tpt�5���!�3>3)��@j�~��S�wh���t��h�)@�
h�D,��/IK-BwM5���L����˲N�?p�������齢�$��۰-v�F	���Ф7�A�>`L�Et�>p껮{8�it      �   �   x��ϽN�0��9y
�s�����ʎDK�󗜁4��۱�b8AL,����~�����i^��^��Ҝ���Z�G6���i����xi>j?5�[m"r�!�ѤA�0:�U�����R� 4���	��(�۵Z��:Cr)��A�΀	���Tܵ�{(l���if�QV�J։��io�VZ�P�v�P7ac��d�5��(�(F��k̝�����V�{o��m�}@a�      �     x���ANE1E���Z��ML�����������F$�{�@�c:�
�Љ:�E>���U�R�tAz.
�x�:�m���������������{бv�4��:ȘA��b��MrS�<M��M�=��6ZMm�y���P���|�ա�\������c����:��Q��SMu3�7�T,a��e�	_ ���}�5�i����eC�tU(�
�B4X{�٘Vh{��7�����w��c�2 -:9�Dģ?���t��?�7��      �   h   x��=
�0�:9�^`�L�	_.��bi������^�f���p����ۺ���!Ij����:HX#3b�.n��Xet�e{�R�r�Ԑ1�D	�y~�z�o��      �   �   x���!ߚ[����}D0���Tw5�ȵI�f0��Bx
,��2Y�>��>������6c�D��rB��lrGe�tc!�� խ�a.��NʱZ�����+^������.m�p*f@�l��/L&́��O�v%r���o�hC`�G[$�xJ�}��?�:t      �   {  x���M�A�u�}��/�2	BB3R2�ؔ]�Ik��	��SQ�	�|����&׫�ϟ�F�k�d����7�A�Հ'2-qJT�j��lp�nR�lj��VM��|&(�H��F�;}Z�2ȴ�d�ڟƽBv�4��� XC��ǔ��}���v�m8�+�?�e�����c��H��$[���~;3�D�%ӯ�3�Iu�/�'���3BJƂ/�I�g�Ft�X2��|)}�r+��5��U ����:"IR�) ����2m�2񪎧�G)&G {�M��Q���\�^�a��E�b\ֶ���}��M����|�y�5�˫��ʲ�/��L�1�d���s9Bd���[��߬����~}���~�Ů�      �     x��P�NC1�s������8�]UXA0�vIr��\�>�~=�Xʂ*Y�e��ߋ���\*/P�5��x*4�بA�Ʉf9�0�d]q������cv��}�	�mXbZ/"�7�7cy��@E��N�%B�,�
9B1���醾�6|�]>�u>�O�:�_���YOuw�}����z��P�����H�L�'��X�l��	B�-�����DK{-<��p������gs��U���&J����EH��ߐ(O���w6�a~ �Tx�      �      x������ � �      �   �   x��λ�1 �X[�5@�_�r�`R�/�:���o[��=!�o��@F�9ȥZ	[�
�'�"s;�IL�l��0� �8��a8I�������S�)��dn�~52w+�sױ�c�١/�^�|���u�o���W��]��.����=��v�X	��A�:Dʂ
���^����#_��O~?��� +�\`      �      x��ӻN�0��y�Y|9ǵ;!BJ	��.N����Q�W�
1���Pك���>ɀ �FGs�;
:Cj�QTe�h�� f�`BPf�nz�=&#�@"n+�(W�s�B��H�N�'h=�U(c,�����0�f�g��C�e�݄%�J�ea9�7o��U:�ݚA7y�$��7Vc���&�*�E�l�p��j����h�����oH�3"'۷���k����	�O��� ��"i~"O��"�� �|M��"�	D[�}�� �{yĿF�B��N"<�8
����|)     