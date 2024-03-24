PGDMP     0                    |            localcrag_dev    14.11 (Homebrew)    14.11 (Homebrew) d    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            �           1262    68766542    localcrag_dev    DATABASE     X   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false                        3079 	   134374132 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                   false            �           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                        false    2            O           1247 	   134542618    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false                       1247 	   134542898    menuitempositionenum    TYPE     M   CREATE TYPE public.menuitempositionenum AS ENUM (
    'BOTTOM',
    'TOP'
);
 '   DROP TYPE public.menuitempositionenum;
       public          felixengelmann    false            |           1247 	   134542887    menuitemtypeenum    TYPE     y   CREATE TYPE public.menuitemtypeenum AS ENUM (
    'MENU_PAGE',
    'TOPO',
    'NEWS',
    'YOUTUBE',
    'INSTAGRAM'
);
 #   DROP TYPE public.menuitemtypeenum;
       public          felixengelmann    false            R           1247 	   134542626    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �            1259 	   134542637    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259 	   134542640    areas    TABLE     �  CREATE TABLE public.areas (
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
    short_description text
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259 	   134542646    crags    TABLE     �  CREATE TABLE public.crags (
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
    portrait_image_id uuid,
    order_index integer DEFAULT 0 NOT NULL,
    lat double precision,
    lng double precision
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259 	   134542652    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259 	   134542655 
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
       public         heap    felixengelmann    false            �            1259 	   134542662    lines    TABLE     �  CREATE TABLE public.lines (
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
    child_friendly boolean DEFAULT false NOT NULL
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    847    850            �            1259 	   134542903 
   menu_items    TABLE     P  CREATE TABLE public.menu_items (
    type public.menuitemtypeenum NOT NULL,
    "position" public.menuitempositionenum NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    menu_page_id uuid,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.menu_items;
       public         heap    felixengelmann    false    892    895            �            1259 	   134542872 
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
       public         heap    felixengelmann    false            �            1259 	   134542671    posts    TABLE       CREATE TABLE public.posts (
    title character varying(120) NOT NULL,
    text text,
    slug character varying NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid
);
    DROP TABLE public.posts;
       public         heap    felixengelmann    false            �            1259 	   134542676    regions    TABLE       CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL,
    rules text
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259 	   134542681    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259 	   134542684    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    218            �           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    219            �            1259 	   134542685    sectors    TABLE     �  CREATE TABLE public.sectors (
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
    rules text
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259 	   134542691    topo_images    TABLE     |  CREATE TABLE public.topo_images (
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
       public         heap    felixengelmann    false            �            1259 	   134542697    users    TABLE     �  CREATE TABLE public.users (
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
       public         heap    felixengelmann    false            �           2604 	   134542703    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    219    218            �          0 	   134542637    alembic_version 
   TABLE DATA                 public          felixengelmann    false    210   ·       �          0 	   134542640    areas 
   TABLE DATA                 public          felixengelmann    false    211   $�       �          0 	   134542646    crags 
   TABLE DATA                 public          felixengelmann    false    212   ��       �          0 	   134542652    files 
   TABLE DATA                 public          felixengelmann    false    213   �       �          0 	   134542655 
   line_paths 
   TABLE DATA                 public          felixengelmann    false    214   ��       �          0 	   134542662    lines 
   TABLE DATA                 public          felixengelmann    false    215   ��       �          0 	   134542903 
   menu_items 
   TABLE DATA                 public          felixengelmann    false    224   �       �          0 	   134542872 
   menu_pages 
   TABLE DATA                 public          felixengelmann    false    223   @�       �          0 	   134542671    posts 
   TABLE DATA                 public          felixengelmann    false    216   ^�       �          0 	   134542676    regions 
   TABLE DATA                 public          felixengelmann    false    217   ��       �          0 	   134542681    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    218   ,�       �          0 	   134542685    sectors 
   TABLE DATA                 public          felixengelmann    false    220   ��       �          0 	   134542691    topo_images 
   TABLE DATA                 public          felixengelmann    false    221   E�       �          0 	   134542697    users 
   TABLE DATA                 public          felixengelmann    false    222   a�       �           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 4, true);
          public          felixengelmann    false    219            �           2606 	   134542705 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    210            �           2606 	   134542707    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    211            �           2606 	   134542709    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    211            �           2606 	   134542711    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    211            �           2606 	   134542713    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    212            �           2606 	   134542715    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    212            �           2606 	   134542717    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    212            �           2606 	   134542719    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    213            �           2606 	   134542721    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    213            �           2606 	   134542723    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    214            �           2606 	   134542725    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    214    214    214            �           2606 	   134542727    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    215            �           2606 	   134542729    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    215            �           2606 	   134542731    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    215                        2606 	   134542910    menu_items menu_items_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_id_key;
       public            felixengelmann    false    224            �           2606 	   134542922    menu_pages menu_pages_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_id_key;
       public            felixengelmann    false    223            �           2606 	   134542878    menu_pages menu_pages_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_pkey;
       public            felixengelmann    false    223            �           2606 	   134542880    menu_pages menu_pages_slug_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_slug_key UNIQUE (slug);
 H   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_slug_key;
       public            felixengelmann    false    223            �           2606 	   134542733    posts posts_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_id_key;
       public            felixengelmann    false    216            �           2606 	   134542735    posts posts_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_pkey;
       public            felixengelmann    false    216            �           2606 	   134542737    posts posts_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_slug_key;
       public            felixengelmann    false    216            �           2606 	   134542739    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    217            �           2606 	   134542741    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    217            �           2606 	   134542743    regions regions_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_slug_key;
       public            felixengelmann    false    217            �           2606 	   134542745 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    218            �           2606 	   134542747    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    220            �           2606 	   134542749    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    220            �           2606 	   134542751    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    220            �           2606 	   134542753    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    221            �           2606 	   134542755    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    221    221    221            �           2606 	   134542757    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    222            �           2606 	   134542759    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    222            �           2606 	   134542761    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    222                       2606 	   134542762    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    211    3574    222                       2606 	   134542767 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    213    3534    211                       2606 	   134542772    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    3562    220    211                       2606 	   134542777    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    3574    222    212                       2606 	   134542782 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    212    3534    213                       2606 	   134542787    crags crags_region_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);
 D   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_region_id_fkey;
       public          felixengelmann    false    212    217    3554                       2606 	   134542792    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    213    222    3574                       2606 	   134542797 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    214    222    3574            	           2606 	   134542802 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    214    215    3542            
           2606 	   134542807 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    221    3568    214                       2606 	   134542812    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    3522    211    215                       2606 	   134542817    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    3574    222    215                       2606 	   134542911 (   menu_items menu_items_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_created_by_id_fkey;
       public          felixengelmann    false    224    3574    222                       2606 	   134542916 '   menu_items menu_items_menu_page_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_page_id_fkey FOREIGN KEY (menu_page_id) REFERENCES public.menu_pages(id);
 Q   ALTER TABLE ONLY public.menu_items DROP CONSTRAINT menu_items_menu_page_id_fkey;
       public          felixengelmann    false    3580    224    223                       2606 	   134542881 (   menu_pages menu_pages_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.menu_pages
    ADD CONSTRAINT menu_pages_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.menu_pages DROP CONSTRAINT menu_pages_created_by_id_fkey;
       public          felixengelmann    false    3574    222    223                       2606 	   134542822    posts posts_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.posts DROP CONSTRAINT posts_created_by_id_fkey;
       public          felixengelmann    false    222    3574    216                       2606 	   134542827 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    222    217    3574                       2606 	   134542832    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    212    3528    220                       2606 	   134542837 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    220    222    3574                       2606 	   134542842 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    220    213    3534                       2606 	   134542847 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    3522    211    221                       2606 	   134542852 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    221    3574    222                       2606 	   134542857 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    213    221    3534                       2606 	   134542862    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    222    3534    213                       2606 	   134542867    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    222    3574    222            �   F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�P��0M656H257HV״��� yg8      �   b  x���MO1�����J��c�l��@�)
��דYX�l���__/��JP���y��Y�o�n��r}wm�/��jFm���jsukN�����YGs����������������}�O�j�C�;�_/Of��2��R�}ݟ���U�iN��+_OS�4fI9eh�7��/�r+��qh�W��,��ƥ���*RL���z�Z����cZk[��t�:A������S�rV'��j�m����%MȑO9k��
Qmt9@�� �k)�8��{#!O�P��,���/�f���w�`�Ss��v�05��	Y���$%T��Q,��b"*\���+�)�����gM�
�#�;*��~�ݨn      �   ^  x����JC1��}����\&ɤ���X*x�O.���rJ7>�9^���$��c���lqsq}+f��+����6MR�ˍ�?��]܈��Y߮�2>���ɜ�ege����m�O[�L��'o���F\�ey�vI։F��$�T�@e�R���8p�1�5��5ei�r4PX�D/��ڀ���P8�jj��I/��.����(���6PB��(Y`�D���ef�]��m��S�!��-cJ�M���'`�30K������/���h����_umZ�j{G�����]���P�rm%�L��.{搣�F��Z7�F[o��;}����O:�sd���S C݁���5&2J�+��H��T��*      �   �  x�ŕ�kA���W��Up��L2��O>�VJm}�̯R9zŞ���ګ�x(B��d6;��O���||��t::9}7]}+��:��U��>�<>{�q:\$� R�x��űTr�K����ϧE��a�$ZB�S�HdwOΎ�-gӯ7��m~o!d��jGu(û":\"�d	q� va��[��CW׿-O�i�.}8d�R��\�,<
Y<{qp�W�9*)��ptXruJ�9U�4Pl��� ��e�%��C��Yo�֛鐞�W�7�G.���V���R{�P����#v��} QyI���$Iz�������"Pۣ<,	�d���^�������m�]��|�`[�~�(U�\FF��c��x(r]�.�{
[' ���0>"�.P�q�5��3��z���q�<�`��>@�,1M���h�j+�C���K�5��⃳�W��[`;/#����4������C��A���򰗢տi��MJ�}�O�aJ�YU�)'1z'��)�@);h����ia�<�|O�x��O�i�uZu���o߿�>�2���KT��j�ab�������O��2%�:Rw҆���648kX�b���e?�4۟ =d�F7?�A�se�`^�CԚ.W�A�|��V�-�GBpp�L�*      �   �  x���OkA���s��vS���ד�!�I��H��4���o�a��!�R���t�ｺ����x;]^�~����9?�_�>���~L��_�]�Lo�q�:I�11*��4�*�
�g���tΫh.�WԞZ���AШsú�}Vʰ�T2fEub��Ē]���=�T��`H7��L��YU
�CEU�?�C�a���рc�����}ٍd܍��T��{�� KjFm�YA�v���<�mY�\3J�P�����UhP8Ɛ�Sב�gI��&����\�L�� �}wv�2��1^�2/�A����{�a�Yo�*��!��d����׊}GڎѠ*�Ԝ�����S?"����H��Ph�d�yǲ4�DF����*�k���N�b�p�-`v�������Ҡ�"m��XC74�Ns����k�!��p���M�>��d���э,C�����8Is��؊]��DƘ��⁒�J{�0��ZZ5�W��*��B�����2�	q[t�K� ���qv�6�m      �   �  x�Œ�n�0��{&'�N�8NC�V���Ēr���Fs�(?t��8��p(� 6$$Nl������ǋU:���b�]�f��T�)+݁��r=O�C7ku�hw
ܓ�tn5P��V��w2kNG��b�<�_�e!L�L��b�I(B, �:�+I(�qR���Q�|�@�"L�/G�J��P�����>��G3�Q�q�s�`ʂȪ��ri=(���:҅�S�;I� S<Ⅴ���������~�5���\4v��l�,Y����f=�,�E��naڴZ�����.�n��/�7�S�VTW��5<�g��"Q��2B-_�V�:ȵ_p�巐�cx3'��Iw��vǰ���ǧզ���6[QU�\};�e/�f�ӽ�%�'?�_d���7��5N�M�7]<��v;��AjO���N�j�������Cv�*q����������o _g2�
a3�      �   �  x����j[1��~��s��f��hҕ&l�_�t���ڼ�8wQ�W���;̙���~���~���/��S�뷗ǧ�����i�=�û�n�?>ޯ�����v��i�o�?|�\[�`U2��:g�Q8�ӧf����O�Q�� K2�2����G��7H7�ǠBҋ��v�[���T�\�Ѫ����9������'fJ��5|�����"�;Gye�51�"�m�`����EQL�����H���똛���$��ߦ�ȨNU�}\2$Z��+5�vyFG%��_��t����7j:+	R'2���$W�,�`'�H�v�>c�F������j��m�Z�1Q�	Xj�4i��`�j�n{e��~����l�2}�U��=*�����^�i���r@����#/� ԋ$      �     x����J�@��}�bvQp����R,l�Vf&'m�	!? ^�w⍙.,�]��{�0O�ެs���Ҏ�P���f|n�{�t�mWr�u�aߏutE�E����#����`Ր�ܓ_�xq�.�e����6`iM�TxԀ *��p��	ǎ3.(K(�`��X���L�z�eSR$�Ȓ�Œ
$u�UTcM��F�7��o�;7`Ӈ�8�a�r�x��f��ZTHΦ'p�su�u��)����RMd�ԣ�T& �w���g�R��* ��l�	�F      �     x��лN�0�Oq�ROq|�]�"�E%\��l;�	�(��c��p
�����G��η�����=4�}�ܬ9t}�7��j�ɝ�j�m��b�L!Y4�ۡ��UJc}}����r����6�|od��ΘA)�@�E�
�Q�ZI�v�QB9�����	�39c\�,�i��lb'�)%z�r�D��%J��
�SNtrq5Y�����Q���b:�O/{(������{{�=��\y}��q������*��P93o����QEȴ��)�L�DQ��d�	�K~�      �   �   x�5��
�0D�~Eni�+I�Ȇ�z� {71A�����/�͔USԎ������OcH��9.��7�;q�u���q�LSd��{���BG�:���JJR^��qUk�\j̈� �č����Ly C�G���۟�u���$I~Й.�      �   �   x��нNC1@��>E���Q��N"����D+��	�
��Ox���μ�m��n����E?�����|}4{;�N�u���ٹ�s+��҂ݔ�J�b)���H�����4�[C]K��B�$@!gX�+�j���
���8T��55�PJUY$u��^��P�q�-h86�LMǐ���E$����OrcS      �   :  x����j1��>Ev��ؓ�$9�"��B:(T�>�dT��8�Ƨo)�PJ�$�����l1yY��l9g�S�m�I����X�&v�_čo�T�~׿c��a\�z��Sj�昶�T����ƾ���ø���r<��8zP�ʠx���I�a�Z*�	G���ڊ�j��\�8	Rq�\J&p(M^���٪(2#4*"]��R֤��W�p�QP"�n���x�;EG5߯�A�A:^��h�	���� ї:s����}�M���<����=]	2��V��QNlrQ^iH/��ٞ�"$ :u}{��_�^~�_#�z�Î�>      �     x����JC1E������S�I&�ԕ�.�'��m�I3RPZP��Tp#"nf3�^.g�6���0N������Ǻx;�O��<����n�[m��y#�I��d��k���j��9��f�[p������z���4vLA�S�p��9a-�s���2;�9h_.:��\|^FZ�H���sڭ��3�ҬO�}Z(	R�¦{{��W�������l5a�Ԡ�Ob�(ª[q��bB����Do	DC�^�ɰ�l!/0���g������      �   %  x�ՐMO�@����=4�&l��G�ŋ�V-�%���ٖ-_Tj#�{i�ă�1� �wf򾓙<Q��Dq�e��Y�ԕ�T`��A�G��(�P]@�s�r.x�QL�����c�����X��(al��)w����j�0�,,B�]�-N�CĔ^�^��a���%�<,�r�l��P��d�D�4~fq���3=It[5��:W&ߨ�y�Wm�j�rƺ����m�&���P��m�����j�J?�G2��IGi�K��h��g��G���H����J�;���/X�Z�I�-     