PGDMP  $                    |           localcrag_dev    16.2 (Homebrew)    16.2 (Homebrew) s    )           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            *           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            +           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            ,           1262    16388    localcrag_dev    DATABASE     o   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false            X           1247    722394    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            [           1247    722402    menuitempositionenum    TYPE     M   CREATE TYPE public.menuitempositionenum AS ENUM (
    'BOTTOM',
    'TOP'
);
 '   DROP TYPE public.menuitempositionenum;
       public          felixengelmann    false            ^           1247    722408    menuitemtypeenum    TYPE     �   CREATE TYPE public.menuitemtypeenum AS ENUM (
    'MENU_PAGE',
    'TOPO',
    'NEWS',
    'YOUTUBE',
    'INSTAGRAM',
    'ASCENTS'
);
 #   DROP TYPE public.menuitemtypeenum;
       public          felixengelmann    false            a           1247    722422    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �            1259    722433    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259    722436    areas    TABLE     �  CREATE TABLE public.areas (
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
    ascent_count integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259    722443    ascents    TABLE     W  CREATE TABLE public.ascents (
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
    area_id uuid NOT NULL
);
    DROP TABLE public.ascents;
       public         heap    felixengelmann    false            �            1259    722448    crags    TABLE     �  CREATE TABLE public.crags (
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
    ascent_count integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259    722455    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259    722458    instance_settings    TABLE     b  CREATE TABLE public.instance_settings (
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
    bar_chart_color character varying(30) DEFAULT '`rgb(213, 30, 38)'::character varying NOT NULL
);
 %   DROP TABLE public.instance_settings;
       public         heap    felixengelmann    false            �            1259    722468 
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
       public         heap    felixengelmann    false            �            1259    722475    lines    TABLE     �  CREATE TABLE public.lines (
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
    morpho boolean DEFAULT false NOT NULL
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    865    856            �            1259    722485 
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
       public         heap    felixengelmann    false    862    859            �            1259    722489 
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
       public         heap    felixengelmann    false            �            1259    722494    posts    TABLE       CREATE TABLE public.posts (
    title character varying(120) NOT NULL,
    text text,
    slug character varying NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.posts;
       public         heap    felixengelmann    false            �            1259    722499    regions    TABLE     '  CREATE TABLE public.regions (
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
       public         heap    felixengelmann    false            �            1259    722505    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259    722508    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    227            -           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    228            �            1259    722509    sectors    TABLE       CREATE TABLE public.sectors (
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
    ascent_count integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259    722516    topo_images    TABLE     |  CREATE TABLE public.topo_images (
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
       public         heap    felixengelmann    false            �            1259    722522    users    TABLE     �  CREATE TABLE public.users (
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
       public         heap    felixengelmann    false                       2604    722531    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    228    227                      0    722433    alembic_version 
   TABLE DATA                 public          felixengelmann    false    215   �                 0    722436    areas 
   TABLE DATA                 public          felixengelmann    false    216   I�                 0    722443    ascents 
   TABLE DATA                 public          felixengelmann    false    217   ��                 0    722448    crags 
   TABLE DATA                 public          felixengelmann    false    218   ަ                 0    722455    files 
   TABLE DATA                 public          felixengelmann    false    219   9�                 0    722458    instance_settings 
   TABLE DATA                 public          felixengelmann    false    220   ժ                 0    722468 
   line_paths 
   TABLE DATA                 public          felixengelmann    false    221   ��                 0    722475    lines 
   TABLE DATA                 public          felixengelmann    false    222   ��                 0    722485 
   menu_items 
   TABLE DATA                 public          felixengelmann    false    223   ��                 0    722489 
   menu_pages 
   TABLE DATA                 public          felixengelmann    false    224   G�                  0    722494    posts 
   TABLE DATA                 public          felixengelmann    false    225   e�       !          0    722499    regions 
   TABLE DATA                 public          felixengelmann    false    226   ��       "          0    722505    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    227   0�       $          0    722509    sectors 
   TABLE DATA                 public          felixengelmann    false    229   /�       %          0    722516    topo_images 
   TABLE DATA                 public          felixengelmann    false    230   |�       &          0    722522    users 
   TABLE DATA                 public          felixengelmann    false    231   ��       .           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 6, true);
          public          felixengelmann    false    228                       2606    722533 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    215                       2606    722535    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    216                       2606    722537    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    216            !           2606    722539    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    216            #           2606    722541    ascents ascents_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_id_key;
       public            felixengelmann    false    217            %           2606    722543    ascents ascents_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_pkey;
       public            felixengelmann    false    217            '           2606    722545    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    218            )           2606    722547    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    218            +           2606    722549    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    218            -           2606    722551    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    219            /           2606    722553    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    219            1           2606    722555 *   instance_settings instance_settings_id_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_id_key UNIQUE (id);
 T   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_id_key;
       public            felixengelmann    false    220            3           2606    722557 (   instance_settings instance_settings_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_pkey;
       public            felixengelmann    false    220            5           2606    722559    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    221            7           2606    722561    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    221    221    221            9           2606    722563    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    222            ;           2606    722565    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    222            =           2606    722567    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    222            ?           2606    722569    menu_items menu_items_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_id_key;
       public            felixengelmann    false    223            A           2606    722571    menu_pages menu_pages_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_id_key;
       public            felixengelmann    false    224            C           2606    722573    menu_pages menu_pages_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_pkey;
       public            felixengelmann    false    224            E           2606    722575    menu_pages menu_pages_slug_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_slug_key UNIQUE (slug);
 H   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_slug_key;
       public            felixengelmann    false    224            G           2606    722577    posts posts_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_id_key;
       public            felixengelmann    false    225            I           2606    722579    posts posts_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_pkey;
       public            felixengelmann    false    225            K           2606    722581    posts posts_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_slug_key;
       public            felixengelmann    false    225            M           2606    722583    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    226            O           2606    722585    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    226            Q           2606    722587 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    227            S           2606    722589    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    229            U           2606    722591    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    229            W           2606    722593    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    229            Y           2606    722595    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    230            [           2606    722597    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    230    230    230            ]           2606    722599    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    231            _           2606    722601    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    231            a           2606    722603    users users_new_email_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_new_email_key UNIQUE (new_email);
 C   ALTER TABLE ONLY public.users DROP CONSTRAINT users_new_email_key;
       public            felixengelmann    false    231            c           2606    722605    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    231            e           2606    722607    users users_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.users DROP CONSTRAINT users_slug_key;
       public            felixengelmann    false    231            f           2606    722608    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    3679    216    231            g           2606    722613 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    216    219    3629            h           2606    722618    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    216    229    3667            i           2606    722623    ascents ascents_area_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_area_id_fkey;
       public          felixengelmann    false    216    3613    217            j           2606    722628    ascents ascents_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_crag_id_fkey;
       public          felixengelmann    false    3623    218    217            k           2606    722773 "   ascents ascents_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_created_by_id_fkey;
       public          felixengelmann    false    217    231    3679            l           2606    722638    ascents ascents_line_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 F   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_line_id_fkey;
       public          felixengelmann    false    222    217    3641            m           2606    722643    ascents ascents_sector_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ascents
    ADD CONSTRAINT ascents_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 H   ALTER TABLE ONLY public.ascents DROP CONSTRAINT ascents_sector_id_fkey;
       public          felixengelmann    false    217    229    3667            n           2606    722648    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    218    3679    231            o           2606    722653 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    3629    218    219            p           2606    722658    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    219    231    3679            q           2606    722663 9   instance_settings instance_settings_auth_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_auth_bg_image_id_fkey FOREIGN KEY (auth_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_auth_bg_image_id_fkey;
       public          felixengelmann    false    219    3629    220            r           2606    722668 9   instance_settings instance_settings_favicon_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_favicon_image_id_fkey FOREIGN KEY (favicon_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_favicon_image_id_fkey;
       public          felixengelmann    false    3629    220    219            s           2606    722673 6   instance_settings instance_settings_logo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_logo_image_id_fkey FOREIGN KEY (logo_image_id) REFERENCES public.files(id);
 `   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_logo_image_id_fkey;
       public          felixengelmann    false    219    220    3629            t           2606    722678 9   instance_settings instance_settings_main_bg_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT instance_settings_main_bg_image_id_fkey FOREIGN KEY (main_bg_image_id) REFERENCES public.files(id);
 c   ALTER TABLE ONLY public.instance_settings DROP CONSTRAINT instance_settings_main_bg_image_id_fkey;
       public          felixengelmann    false    220    3629    219            u           2606    722683 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    3679    221    231            v           2606    722688 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    222    3641    221            w           2606    722693 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    3673    221    230            x           2606    722698    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    216    3613    222            y           2606    722703    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    222    231    3679            z           2606    722708 (   menu_items menu_items_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_created_by_id_fkey;
       public          felixengelmann    false    223    231    3679            {           2606    722713 '   menu_items menu_items_menu_page_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_page_id_fkey FOREIGN KEY (menu_page_id) REFERENCES public.menu_pages(id);
 Q   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_menu_page_id_fkey;
       public          felixengelmann    false    3649    223    224            |           2606    722718 (   menu_pages menu_pages_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 R   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_created_by_id_fkey;
       public          felixengelmann    false    3679    224    231            }           2606    722723    posts posts_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_created_by_id_fkey;
       public          felixengelmann    false    225    231    3679            ~           2606    722728 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    3679    231    226                       2606    722733    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    229    3623    218            �           2606    722738 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    229    3679    231            �           2606    722743 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    229    3629    219            �           2606    722748 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    216    230    3613            �           2606    722753 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    231    3679    230            �           2606    722758 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    3629    219    230            �           2606    722763    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    231    219    3629            �           2606    722768    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    231    3679    231               F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�PO5K6OL4�47J6U״��� �/�         c  x���OKA���)�6
֤�Tw�lDP���l j�ӵ5:8�.��C>}z�@D��S�W�~����|�3���7��C/u;i{0?.��7������h?�+������T�m���c�X���$%T��Q,��b"⬂��[��h\Z���X[L�ͯrs�@� Y"��I���2z�Ϳik��
Qmt9@�� ��(�8n�w,�d����M�����C
�S�򢓹v�d~�F3���a6?�_\Ã>�jVc�;�_��f�G2�/�Ͽ�/�.`p�3��7s7�YRNZ�m���@���8t��K�:RL�>���AN��5��(�ɕ�e��#�>��o�	�Jr8²��\��X���g           x�]P�JC1��+��(t�n�I6�T�B�T���1�۠PD|���^�,;���0��~�|6����y)����SՏ�4�����~�5T]j#5�	�A�@���$Pe1��Ӥ���u��Ȫ���C��/��o����q��آe@
W��*�%�E����BS�yԪ����/���9�*�g'�{֤Xj�r)@��������̹T�.AE���Xh�DA}�3�p�Q�+�^H��|��T�T�<���
�hsw��nkK��D�-����l�x[b�         K  x���Mk1�����l�c���ˊP��X��I6����^���b�-XK/��}�}f2[��K6�-�ؾ��2�BM�{���v�}ٔ��*î�����pJ�:�Q<�MK�Tkvl؅<�.wU<�y\�mu�w��!����VC�^��垷��B7 ˰/D_鞐B���j:ML�PZ�
�.�6( �4�`�-<
䮝�wxm��-⵶��봓���.�'�*O\v^�������O�'+7e��ޯ*/	�����E�O\�ͽ�H�e:*g-^q����in�����������g$��-�#�M R&"�u�.�6q���,Y�t> ����         �  x�ŕ�kA���W��Up��L2��O>�VJm}�̯R9zŞ���ګ�x(B��d6;��O���||��t::9}7]}+��:��U��>�<>{�q:\$� R�x��űTr�K����ϧE��a�$ZB�S�HdwOΎ�-gӯ7��m~o!d��jGu(û":\"�d	q� va��[��CW׿-O�i�.}8d�R��\�,<
Y<{qp�W�9*)��ptXruJ�9U�4Pl��� ��e�%��C��Yo�֛鐞�W�7�G.���V���R{�P����#v��} QyI���$Iz�������"Pۣ<,	�d���^�������m�]��|�`[�~�(U�\FF��c��x(r]�.�{
[' ���0>"�.P�q�5��3��z���q�<�`��>@�,1M���h�j+�C���K�5��⃳�W��[`;/#����4������C��A���򰗢տi��MJ�}�O�aJ�YU�)'1z'��)�@);h����ia�<�|O�x��O�i�uZu���o߿�>�2���KT��j�ab�������O��2%�:Rw҆���648kX�b���e?�4۟ =d�F7?�A�se�`^�CԚ.W�A�|��V�-�GBpp�L�*         �   x�}�M�@����<���j�t�P6�ԠS���&����}Z���a&���X@�xLUS�U��l^Ǻ�����s��"�kO�+b@}p*#d�wY�+9=�@V
� �?AtJ6�^�%�nꡕw�� 7��;���L���`y1�[����{]Y.�����&��0���=         �  x���OkA���s��vS���ד�!�I��H��4���o�a��!�R���t�ｺ����x;]^�~����9?�_�>���~L��_�]�Lo�q�:I�11*��4�*�
�g���tΫh.�WԞZ���AШsú�}Vʰ�T2fEub��Ē]���=�T��`H7��L��YU
�CEU�?�C�a���рc�����}ٍd܍��T��{�� KjFm�YA�v���<�mY�\3J�P�����UhP8Ɛ�Sב�gI��&����\�L�� �}wv�2��1^�2/�A����{�a�Yo�*��!��d����׊}GڎѠ*�Ԝ�����S?"����H��Ph�d�yǲ4�DF����*�k���N�b�p�-`v�������Ҡ�"m��XC74�Ns����k�!��p���M�>��d���э,C�����8Is��؊]��DƘ��⁒�J{�0��ZZ5�W��*��B�����2�	q[t�K� ���qv�6�m         �  x��R]o�0}�0y	Hu;��1�iTT�XR^B���jn僂��7����@B��^����s�t~���*�u/�Vyf[��H��y
�Y��Z�S��ԧs���jv�hp@��Y}:�g������>aZ�͹�J�$�P�X@�5�+�P*�!�A1$�rF$�1���!A8��A"%*B�R���@A� F1ƱϽ F#���˥� J�iu�[SٚA� S<�$����n�C7����׹h���l�i������Y��z�p��S䴯uӺ�"��Q�'zkt�}��1��4���Uo,��?�� *rT@�4b
AMs��!E�-��1������@4F(Fԋ"NC�/N����v���!�{m����|��N��8n���R� �F�ӿ�!�'ߝ�"s_~p��81p6]W��l����U��R{�����S��o��uT=����3N��✏�~����x[��r�=\         �  x����j[1��~
��B�i4�t�	�7��-]�B�)�6�_9���4x%	q���w���4_�q��%}��s������>��Yn����b���w�ŧ��v��q�w�|�\[�`U2��:g�Q8��f����O�Q�� K2�2���#C�rs7H7䇠B�/w�ͦK���T�\�Ѫ����9�oꏟg��$�#9%��N���	R�l�S��������XH����A0��	m�(&\Lhip��5�5#N��x���hof*�SU�h�	��V"�J��]��AI��W�6�����N'?"A��@F����
�Ԗ%����ҧc�ٻlZ�=,�gz{rd��JL�R{���K����CT�����+��w���3�9��_��}�mQ�� ��=���In/W�^��/�l���-9           x����J�@��}�bvQp����R,l�Vf&'m�	!? ^�w⍙.,�]��{�0O�ެs���Ҏ�P���f|n�{�t�mWr�u�aߏutE�E����#����`Ր�ܓ_�xq�.�e����6`iM�TxԀ *��p��	ǎ3.(K(�`��X���L�z�eSR$�Ȓ�Œ
$u�UTcM��F�7��o�;7`Ӈ�8�a�r�x��f��ZTHΦ'p�su�u��)����RMd�ԣ�T& �w���g�R��* ��l�	�F            x��лN�0�Oq�ROq|�]�"�E%\��l;�	�(��c��p
�����G��η�����=4�}�ܬ9t}�7��j�ɝ�j�m��b�L!Y4�ۡ��UJc}}����r����6�|od��ΘA)�@�E�
�Q�ZI�v�QB9�����	�39c\�,�i��lb'�)%z�r�D��%J��
�SNtrq5Y�����Q���b:�O/{(������{{�=��\y}��q������*��P93o����QEȴ��)�L�DQ��d�	�K~�      !   �   x�=�=�0��=�"[Z�o�NIAcw�aDK�����.^xNm��u����/?O!{���.�]����A��m�"N\�u�o���Q*�#��r��Kȏ�R+)Iyqw�o��
�� �#$�vIA�P��@�F�
s����1���,      "   �   x����JD1���\�ٍ���M�W.f1 #8�[i�DQ����w��d��o8��N��p�]޿��_~����a�_~_?�����q9Ëe�Zn�0M	��Ɛ�LÌgߞ_m��V��-��T:�IK�FA�Us
�Up�S��<�0Mpj�֮ �$O+�2�S��n���z��Ph�)*�\E�:�]�+"(�H��mB"�AB�+�����R���h>^c6}P�?u���F�(      $   =  x����j1��>En���I2I&V�<H�B�ޓlV���{��E[J��	����?�t���/�t�|c�6�qP���5�x��&v���?�~އ�Z9A�=(NEP<yp�$툰�t)�8G�Z!3G�{#�ZHC�xD�Iȗ`��L�!�!�@�S�u���2#4*"]��R�I1�R�p�QP"����Y�����w��M�1�"n|Ӥ����0��j��K��昶�����~�+p�x�� ��"q� p�!Y��(��(ȅ�.�P��
��ݥ��x�{������A�A:^�Yhn:.!U�/t��7�E6���go�7      %     x����JC1E������S�I&�ԕ�.�'��m�I3RPZP��Tp#"nf3�^.g�6���0N������Ǻx;�O��<����n�[m��y#�I��d��k���j��9��f�[p������z���4vLA�S�p��9a-�s���2;�9h_.:��\|^FZ�H���sڭ��3�ҬO�}Z(	R�¦{{��W�������l5a�Ԡ�Ob�(ª[q��bB����Do	DC�^�ɰ�l!/0���g������      &   6  x�͐�N�0��}
"�:x�].@	RKHE77'���M#���P@p@�Ҋ�5���k�ݰ�͸��<q�4�3����2�]p�cΨ��B���L�j��T�&�0��*�	""	X�9�#�(��A�  o�6���R�z�d6�fcM���Byw�dvT�����t���ޛ�L���i�&���j�t��j��g'�v�%�S�n�r�[�ڥk=��f12n��`hJtcܤ(��l?�un� �G�������%����-o�����y���rrX��X�ɿp�~��a��cY�{Z��e��NJ��9�8     