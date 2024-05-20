PGDMP      +                |           localcrag_dev    16.2 (Homebrew)    16.2 (Homebrew) �    T           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            U           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            V           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            W           1262    16388    localcrag_dev    DATABASE     o   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false                        3079    1210036    fuzzystrmatch 	   EXTENSION     A   CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;
    DROP EXTENSION fuzzystrmatch;
                   false            X           0    0    EXTENSION fuzzystrmatch    COMMENT     ]   COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';
                        false    2            h           1247    1607370    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            k           1247    1607378    menuitempositionenum    TYPE     M   CREATE TYPE public.menuitempositionenum AS ENUM (
    'BOTTOM',
    'TOP'
);
 '   DROP TYPE public.menuitempositionenum;
       public          felixengelmann    false            n           1247    1607384    menuitemtypeenum    TYPE     �   CREATE TYPE public.menuitemtypeenum AS ENUM (
    'MENU_PAGE',
    'TOPO',
    'NEWS',
    'YOUTUBE',
    'INSTAGRAM',
    'ASCENTS',
    'RANKING'
);
 #   DROP TYPE public.menuitemtypeenum;
       public          felixengelmann    false            q           1247    1607400    searchableitemtypeenum    TYPE     t   CREATE TYPE public.searchableitemtypeenum AS ENUM (
    'CRAG',
    'SECTOR',
    'AREA',
    'LINE',
    'USER'
);
 )   DROP TYPE public.searchableitemtypeenum;
       public          felixengelmann    false            t           1247    1607412    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �            1255    1607423    parse_websearch(text)    FUNCTION     �   CREATE FUNCTION public.parse_websearch(search_query text) RETURNS tsquery
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT parse_websearch('pg_catalog.simple', search_query);
$$;
 9   DROP FUNCTION public.parse_websearch(search_query text);
       public          felixengelmann    false            �            1255    1607424     parse_websearch(regconfig, text)    FUNCTION       CREATE FUNCTION public.parse_websearch(config regconfig, search_query text) RETURNS tsquery
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
       public          felixengelmann    false            �            1259    1607425    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259    1607428    areas    TABLE       CREATE TABLE public.areas (
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
    slug character varying NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    short_description text,
    ascent_count integer DEFAULT 0 NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259    1607436    ascents    TABLE     v  CREATE TABLE public.ascents (
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
       public         heap    felixengelmann    false            �            1259    1607441    crags    TABLE     	  CREATE TABLE public.crags (
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
    lat double precision,
    lng double precision,
    ascent_count integer DEFAULT 0 NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259    1607449    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259    1607452    instance_settings    TABLE     �  CREATE TABLE public.instance_settings (
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
       public         heap    felixengelmann    false            �            1259    1607462 
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
       public         heap    felixengelmann    false            �            1259    1607469    lines    TABLE       CREATE TABLE public.lines (
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
    ascent_count integer DEFAULT 0 NOT NULL,
    morpho boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    872    884            �            1259    1607481 
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
       public         heap    felixengelmann    false    878    875            �            1259    1607485 
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
       public         heap    felixengelmann    false            �            1259    1607490    posts    TABLE       CREATE TABLE public.posts (
    title character varying(120) NOT NULL,
    text text,
    slug character varying NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.posts;
       public         heap    felixengelmann    false            �            1259    1607495    rankings    TABLE     3  CREATE TABLE public.rankings (
    id uuid NOT NULL,
    crag_id uuid,
    sector_id uuid,
    user_id uuid NOT NULL,
    top_10 integer,
    top_25 integer,
    top_10_fa integer,
    total integer,
    total_fa integer,
    type public.linetypeenum NOT NULL,
    top_values json DEFAULT '[]'::json,
    top_fa_values json DEFAULT '[]'::json,
    top_10_exponential integer,
    top_25_exponential integer,
    total_exponential integer,
    total_fa_exponential integer,
    total_count integer,
    total_fa_count integer,
    top_10_fa_exponential integer
);
    DROP TABLE public.rankings;
       public         heap    felixengelmann    false    872            �            1259    1607502    regions    TABLE     '  CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    rules text,
    ascent_count integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259    1607508    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259    1607511    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    229            Y           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    230            �            1259    1607512    searchables    TABLE     �   CREATE TABLE public.searchables (
    name character varying(120) NOT NULL,
    type public.searchableitemtypeenum NOT NULL,
    id uuid NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.searchables;
       public         heap    felixengelmann    false    881            �            1259    1607516    sectors    TABLE     &  CREATE TABLE public.sectors (
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
    lat double precision,
    lng double precision,
    rules text,
    ascent_count integer DEFAULT 0 NOT NULL,
    secret boolean DEFAULT false
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259    1607524    topo_images    TABLE     |  CREATE TABLE public.topo_images (
    area_id uuid NOT NULL,
    file_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    lat double precision,
    lng double precision,
    description text,
    title character varying(120)
);
    DROP TABLE public.topo_images;
       public         heap    felixengelmann    false            �            1259    1607530    users    TABLE     �  CREATE TABLE public.users (
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
    slug character varying NOT NULL
);
    DROP TABLE public.users;
       public         heap    felixengelmann    false            0           2604    1607539    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    230    229            ?          0    1607425    alembic_version 
   TABLE DATA                 public          felixengelmann    false    216   ˺       @          0    1607428    areas 
   TABLE DATA                 public          felixengelmann    false    217   !�       A          0    1607436    ascents 
   TABLE DATA                 public          felixengelmann    false    218   ��       B          0    1607441    crags 
   TABLE DATA                 public          felixengelmann    false    219   ��       C          0    1607449    files 
   TABLE DATA                 public          felixengelmann    false    220    �       D          0    1607452    instance_settings 
   TABLE DATA                 public          felixengelmann    false    221   ��       E          0    1607462 
   line_paths 
   TABLE DATA                 public          felixengelmann    false    222   ��       F          0    1607469    lines 
   TABLE DATA                 public          felixengelmann    false    223   ��       G          0    1607481 
   menu_items 
   TABLE DATA                 public          felixengelmann    false    224   ��       H          0    1607485 
   menu_pages 
   TABLE DATA                 public          felixengelmann    false    225   T�       I          0    1607490    posts 
   TABLE DATA                 public          felixengelmann    false    226   r�       J          0    1607495    rankings 
   TABLE DATA                 public          felixengelmann    false    227   ��       K          0    1607502    regions 
   TABLE DATA                 public          felixengelmann    false    228   ��       L          0    1607508    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    229   U�       N          0    1607512    searchables 
   TABLE DATA                 public          felixengelmann    false    231   T�       O          0    1607516    sectors 
   TABLE DATA                 public          felixengelmann    false    232   �       P          0    1607524    topo_images 
   TABLE DATA                 public          felixengelmann    false    233   p�       Q          0    1607530    users 
   TABLE DATA                 public          felixengelmann    false    234   ��       Z           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 6, true);
          public          felixengelmann    false    230            ;           2606    1607541 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    216            =           2606    1607543    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    217            ?           2606    1607545    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    217            A           2606    1607547    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    217            C           2606    1607549    ascents ascents_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_id_key;
       public            felixengelmann    false    218            E           2606    1607551    ascents ascents_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_pkey;
       public            felixengelmann    false    218            G           2606    1607553    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    219            I           2606    1607555    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    219            K           2606    1607557    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    219            M           2606    1607559    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    220            O           2606    1607561    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    220            Q           2606    1607563 *   instance_settings instance_settings_id_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_id_key UNIQUE (id);
 T   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_id_key;
       public            felixengelmann    false    221            S           2606    1607565 (   instance_settings instance_settings_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_pkey;
       public            felixengelmann    false    221            U           2606    1607567    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    222            W           2606    1607569    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    222    222    222            Y           2606    1607571    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    223            [           2606    1607573    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    223            ]           2606    1607575    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    223            _           2606    1607577    menu_items menu_items_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_id_key;
       public            felixengelmann    false    224            a           2606    1607579    menu_pages menu_pages_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_id_key;
       public            felixengelmann    false    225            c           2606    1607581    menu_pages menu_pages_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_pkey;
       public            felixengelmann    false    225            e           2606    1607583    menu_pages menu_pages_slug_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_slug_key UNIQUE (slug);
 H   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_slug_key;
       public            felixengelmann    false    225            g           2606    1607585    posts posts_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_id_key;
       public            felixengelmann    false    226            i           2606    1607587    posts posts_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_pkey;
       public            felixengelmann    false    226            k           2606    1607589    posts posts_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_slug_key;
       public            felixengelmann    false    226            m           2606    1607591    rankings rankings_id_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_id_key UNIQUE (id);
 B   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_id_key;
       public            felixengelmann    false    227            o           2606    1607593    rankings rankings_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_pkey;
       public            felixengelmann    false    227            q           2606    1607595    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    228            s           2606    1607597    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    228            u           2606    1607599 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    229            w           2606    1607601    searchables searchables_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.searchables
    ADD CONSTRAINT searchables_pkey PRIMARY KEY (type, id);
 F   ALTER TABLE ONLY public.searchables DROP CONSTRAINT searchables_pkey;
       public            felixengelmann    false    231    231            y           2606    1607603    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    232            {           2606    1607605    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    232            }           2606    1607607    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    232                       2606    1607609    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    233            �           2606    1607611    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    233    233    233            �           2606    1607613    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    234            �           2606    1607615    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    234            �           2606    1607617    users users_new_email_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_new_email_key UNIQUE (new_email);
 C   ALTER TABLE ONLY public.users DROP CONSTRAINT users_new_email_key;
       public            felixengelmann    false    234            �           2606    1607619    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    234            �           2606    1607621    users users_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.users DROP CONSTRAINT users_slug_key;
       public            felixengelmann    false    234            �           2606    1607622    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    3717    217    234            �           2606    1607627 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    220    217    3661            �           2606    1607632    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    232    3705    217            �           2606    1607637    ascents ascents_area_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_area_id_fkey;
       public          felixengelmann    false    218    217    3645            �           2606    1607642    ascents ascents_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_crag_id_fkey;
       public          felixengelmann    false    219    3655    218            �           2606    1607647 "   ascents ascents_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_created_by_id_fkey;
       public          felixengelmann    false    234    218    3717            �           2606    1607652    ascents ascents_line_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_line_id_fkey;
       public          felixengelmann    false    223    218    3673            �           2606    1607657    ascents ascents_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 H   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_sector_id_fkey;
       public          felixengelmann    false    218    3705    232            �           2606    1607662    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    3717    234    219            �           2606    1607667 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    3661    219    220            �           2606    1607672    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    234    3717    220            �           2606    1607677 9   instance_settings instance_settings_auth_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_auth_bg_image_id_fkey FOREIGN KEY (auth_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_auth_bg_image_id_fkey;
       public          felixengelmann    false    221    3661    220            �           2606    1607682 9   instance_settings instance_settings_favicon_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_favicon_image_id_fkey FOREIGN KEY (favicon_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_favicon_image_id_fkey;
       public          felixengelmann    false    221    3661    220            �           2606    1607687 6   instance_settings instance_settings_logo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_logo_image_id_fkey FOREIGN KEY (logo_image_id) REFERENCES public.files(id);
 `   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_logo_image_id_fkey;
       public          felixengelmann    false    220    221    3661            �           2606    1607692 9   instance_settings instance_settings_main_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_main_bg_image_id_fkey FOREIGN KEY (main_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_main_bg_image_id_fkey;
       public          felixengelmann    false    3661    220    221            �           2606    1607697 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    234    3717    222            �           2606    1607702 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    3673    222    223            �           2606    1607707 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    233    222    3711            �           2606    1607712    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    223    217    3645            �           2606    1607717    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    234    223    3717            �           2606    1607722 (   menu_items menu_items_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_created_by_id_fkey;
       public          felixengelmann    false    3717    224    234            �           2606    1607727 '   menu_items menu_items_menu_page_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_page_id_fkey FOREIGN KEY (menu_page_id) REFERENCES public.menu_pages(id);
 Q   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_menu_page_id_fkey;
       public          felixengelmann    false    225    224    3681            �           2606    1607732 (   menu_pages menu_pages_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_created_by_id_fkey;
       public          felixengelmann    false    225    3717    234            �           2606    1607737    posts posts_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_created_by_id_fkey;
       public          felixengelmann    false    3717    234    226            �           2606    1607742    rankings rankings_crag_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 H   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_crag_id_fkey;
       public          felixengelmann    false    3655    227    219            �           2606    1607747     rankings rankings_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 J   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_sector_id_fkey;
       public          felixengelmann    false    232    3705    227            �           2606    1607752    rankings rankings_user_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.rankings
    ADD CONSTRAINT rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.rankings DROP CONSTRAINT rankings_user_id_fkey;
       public          felixengelmann    false    234    227    3717            �           2606    1607757 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    3717    234    228            �           2606    1607762    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    219    232    3655            �           2606    1607767 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    234    232    3717            �           2606    1607772 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    232    220    3661            �           2606    1607777 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    217    3645    233            �           2606    1607782 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    233    234    3717            �           2606    1607787 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    220    233    3661            �           2606    1607792    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    220    234    3661            �           2606    1607797    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    234    3717    234            ?   F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�PO54�4M4MJ4�4Q״��� |�n      @   i  x���MkA���s���|hFZ7�������wdm�d�6뤇��ζ8�R(A�Nz_�}f�����7���Wsx�C/u;i{4߮67w�����h?�k����ji���ͩW,A�J�� *F�(��0qV�Y�`	|4.�|\y�-���W���9v��v�,��$H�w=��}�ZF�BT�]�f%��:�,��<�K( �ep'�4];������0�L�ˋN�z�˓���ЏO�y����j��s٣f=v�����lv�%�ߒ���pYt�s-�oj��U�4fI9ehɷ��^�N(������_!֑b��a���rB�q�FN�4.ӄ9p���O���P��	�=����/� "ۮ      A     x�]POK�1��S�<UaI���<M�0������0D����.ʼ�<���KV���u7�6����R�u�OU?ϧ�X����Pu��� 8&`
Y\��b�@��L���'����F}n��zu�yS}�wl��u�-2P�ҼWa,	,� ���(�ḅV��fk ?'�S�!b��L����Y�6`�]˥ �J�V�2&�3�Rٻmggt cq��I��Έ�QF�X�C:%��#�襒�r�/5�P G���vw[+�XZ�%R���%��q2�� ��e      B   Q  x����n�0E�|�wi%�:��ER�X�"*��~�8	�_ߤʂRuc/��h��l1�/�d�|g��o�����e�/�C�)�]Y�]�e�`?�R��laS����kv�O��79��]l�q[��]�Fz�h3��Gp���י!r��-'����R��W�'�PF5�l5�6L�PZ�r�.�6( �4�`��=
䮝�;����N��Z[��u�I�	��H��r�5\z^���.�i{��ϝɟZOr�:=!�_�^"PI��Fq	6�"q�ꨜ�xCi�W�������_���󧟑�{��u��� e2 �\���&_��e�?2;�O�_�9      C   �  x�ŕ�kA���W��Up��L2��O>�VJm}�̯R9zŞ���ګ�x(B��d6;��O���||��t::9}7]}+��:��U��>�<>{�q:\$� R�x��űTr�K����ϧE��a�$ZB�S�HdwOΎ�-gӯ7��m~o!d��jGu(û":\"�d	q� va��[��CW׿-O�i�.}8d�R��\�,<
Y<{qp�W�9*)��ptXruJ�9U�4Pl��� ��e�%��C��Yo�֛鐞�W�7�G.���V���R{�P����#v��} QyI���$Iz�������"Pۣ<,	�d���^�������m�]��|�`[�~�(U�\FF��c��x(r]�.�{
[' ���0>"�.P�q�5��3��z���q�<�`��>@�,1M���h�j+�C���K�5��⃳�W��[`;/#����4������C��A���򰗢տi��MJ�}�O�aJ�YU�)'1z'��)�@);h����ia�<�|O�x��O�i�uZu���o߿�>�2���KT��j�ab�������O��2%�:Rw҆���648kX�b���e?�4۟ =d�F7?�A�se�`^�CԚ.W�A�|��V�-�GBpp�L�*      D   �   x�}�O��0���<D�����ՓH�ۅ�x����6�IA��6+,����cx̶�e?{��oh���dP5ƊF�٠�US8��C��1�i*pJzC�i�bNE��F3�FΒ��P�����\K�֝(JN��5B���;�/�d��d���ˈ����[tr�+/�}��d�����,��ZX]k�Q�
���a^ ���d�y�/��L�      E   �  x���OkA���s��vS���ד�!�I��H��4���o�a��!�R���t�ｺ����x;]^�~����9?�_�>���~L��_�]�Lo�q�:I�11*��4�*�
�g���tΫh.�WԞZ���AШsú�}Vʰ�T2fEub��Ē]���=�T��`H7��L��YU
�CEU�?�C�a���рc�����}ٍd܍��T��{�� KjFm�YA�v���<�mY�\3J�P�����UhP8Ɛ�Sב�gI��&����\�L�� �}wv�2��1^�2/�A����{�a�Yo�*��!��d����׊}GڎѠ*�Ԝ�����S?"����H��Ph�d�yǲ4�DF����*�k���N�b�p�-`v�������Ҡ�"m��XC74�Ns����k�!��p���M�>��d���э,C�����8Is��؊]��DƘ��⁒�J{�0��ZZ5�W��*��B�����2�	q[t�K� ���qv�6�m      F   �  x�Œ�n�0���&7�Ns�q��*�N�)7!�qh57��o�/�C7ʴ�@B������>���t��\dh:��Q�)�ց]��A�Ƴ�d��Ym���C�U���r[o�5h�G�긗OΗ��Ʌ��6�G�S�+�����T�%�G�*t�bQ�?��*	N��19_�*E��Xɰ���P&H	ICD�r�8u��͜��`6�)ܟ��%s-Q(Jhػ���:���_o���}�g'������C��lx������^֋�25^T������?3kkj��뗕m�����v��3����ȡ�<�8p��Iذ܄�ࠩ�}�8�"�*��� $�`���|�As�������hR�3v#��Pn[w�����2�����/�?M�4;$���u��R�ڶj��h���]�)��f���^=}�D��&��]v�r��׮[k�{��7��^�5b��7�nB
      G   �  x����j[1��~
��B�i4�t�	�7��-]�B�)�6�_9���4x%	q���w���4_�q��%}��s������>��Yn����b���w�ŧ��v��q�w�|�\[�`U2��:g�Q8��f����O�Q�� K2�2���#C�rs7H7䇠B�/w�ͦK���T�\�Ѫ����9�oꏟg��$�#9%��N���	R�l�S��������XH����A0��	m�(&\Lhip��5�5#N��x���hof*�SU�h�	��V"�J��]��AI��W�6�����N'?"A��@F����
�Ԗ%����ҧc�ٻlZ�=,�gz{rd��JL�R{���K����CT�����+��w���3�9��_��}�mQ�� ��=���In/W�^��/�l���-9      H     x����J�@��}�bvQp����R,l�Vf&'m�	!? ^�w⍙.,�]��{�0O�ެs���Ҏ�P���f|n�{�t�mWr�u�aߏutE�E����#����`Ր�ܓ_�xq�.�e����6`iM�TxԀ *��p��	ǎ3.(K(�`��X���L�z�eSR$�Ȓ�Œ
$u�UTcM��F�7��o�;7`Ӈ�8�a�r�x��f��ZTHΦ'p�su�u��)����RMd�ԣ�T& �w���g�R��* ��l�	�F      I     x��лN�0�Oq�ROq|�]�"�E%\��l;�	�(��c��p
�����G��η�����=4�}�ܬ9t}�7��j�ɝ�j�m��b�L!Y4�ۡ��UJc}}����r����6�|od��ΘA)�@�E�
�Q�ZI�v�QB9�����	�39c\�,�i��lb'�)%z�r�D��%J��
�SNtrq5Y�����Q���b:�O/{(������{{�=��\y}��q������*��P93o����QEȴ��)�L�DQ��d�	�K~�      J     x�ՏKKCA���w7
F&3�L�+�.
��p#.�)E)����DA�D�9	�p�-���z;,���������9������r��7É�nIsU�V�r��� �v��p1g�r7�n�ɋp���IaH^�"*=�#�Ӎs�e�V��z����ֹ�/=�����8�^��aJ�0%r�x���e��j疭N��Sʅ�+�&�d=H�Z�������7Ԃ�*�f�`#hN-��.�~�X+�6�f3N�)��G�����-�l�ph�n      K   �   x�=�=�0��=�"[Z�o�NIAcw�aDK�����.^xNm��u����/?O!{���.�]����A��m�"N\�u�o���Q*�#��r��Kȏ�R+)Iyqw�o��
�� �#$�vIA�P��@�F�
s����1���,      L   �   x����JD1���\�ٍ���M�W.f1 #8�[i�DQ����w��d��o8��N��p�]޿��_~����a�_~_?�����q9Ëe�Zn�0M	��Ɛ�LÌgߞ_m��V��-��T:�IK�FA�Us
�Up�S��<�0Mpj�֮ �$O+�2�S��n���z��Ph�)*�\E�:�]�+"(�H��mB"�AB�+�����R���h>^c6}P�?u���F�(      N   �  x���M��0�{En���k,Nm)�Ҫ��.w�xB�I�v?gO��F��DQ�G���vw�N�vw�W��Z�x�4�9Q'�����is��=�F�\��C���m����U�q�k��,�n�@I���]�����/���EF8^FIY�{P��M�xc�����qYT�^���n�s%m_�d����<l��D6'`��X�XA���! 	��籽�d�V����ϡ�������=y��ŕ�e��@A��g�{�~��q�>�ӕk4�B�5؄�S�N��O5�91�;e����?=���N��P$\(�q�#����v����X�_��)
C KE%3z`C>��b�9]����=��u&��)��`.�IRQ{qqNO�H���6�w�~��5�������At��Q��\b3уg�ؐ����V���h�&.�{ b�      O   B  x����j1@�~Evӂ�7�+B.��B��LF;�3��뛩Hm�B�8��3�-&�K2�-�����6����&oO�j� w���*듬��� ��4 /�t (^���2�E��J��Z��0�8T�i.�S�k�q�:�C�C9'L�%8��"��Vy���@T%�6��R,a5�-�^r	�R��\��'�l�W����x�؛���Eظ��U�v]��a��j�s��������Ծ�+p�p�" ��"R�S��|4TV����?e�!�iH0�vY/���wU?F�yni!K��4�JK9D/J��*�T��;����} @��      P     x����JC1E������S�I&�ԕ�.�'��m�I3RPZP��Tp#"nf3�^.g�6���0N������Ǻx;�O��<����n�[m��y#�I��d��k���j��9��f�[p������z���4vLA�S�p��9a-�s���2;�9h_.:��\|^FZ�H���sڭ��3�ҬO�}Z(	R�¦{{��W�������l5a�Ԡ�Ob�(ª[q��bB����Do	DC�^�ɰ�l!/0���g������      Q   6  x�͐�N�0��}
"�:x�].@	RKHE77'���M#���P@p@�Ҋ�5���k�ݰ�͸��<q�4�3����2�]p�cΨ��B���L�j��T�&�0��*�	""	X�9�#�(��A�  o�6���R�z�d6�fcM���Byw�dvT�����t���ޛ�L���i�&���j�t��j��g'�v�%�S�n�r�[�ڥk=��f12n��`hJtcܤ(��l?�un� �G�������%����-o�����y���rrX��X�ɿp�~��a��cY�{Z��e��NJ��9�8     