PGDMP                         |            localcrag_dev    14.8 (Homebrew)    14.8 (Homebrew) Q    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
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
                        false    2            L           1247 	   133716289    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            O           1247 	   133716296    startingpositionenum    TYPE     v   CREATE TYPE public.startingpositionenum AS ENUM (
    'SIT',
    'STAND',
    'CROUCH',
    'FRENCH',
    'CANDLE'
);
 '   DROP TYPE public.startingpositionenum;
       public          felixengelmann    false            �            1259 	   133716307    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259 	   133716310    areas    TABLE     �  CREATE TABLE public.areas (
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
    order_index integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.areas;
       public         heap    felixengelmann    false            �            1259 	   133716316    crags    TABLE     �  CREATE TABLE public.crags (
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
    order_index integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.crags;
       public         heap    felixengelmann    false            �            1259 	   133716322    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259 	   133716325 
   line_paths    TABLE     -  CREATE TABLE public.line_paths (
    line_id uuid NOT NULL,
    topo_image_id uuid NOT NULL,
    path json NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    order_index integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.line_paths;
       public         heap    felixengelmann    false            �            1259 	   133716331    lines    TABLE       CREATE TABLE public.lines (
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
    videos json
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    844    847            �            1259 	   133716336    regions    TABLE       CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259 	   133716341    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259 	   133716344    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    217            �           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    218            �            1259 	   133716345    sectors    TABLE     �  CREATE TABLE public.sectors (
    name character varying(120) NOT NULL,
    description text NOT NULL,
    crag_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    short_description text,
    slug character varying(120) NOT NULL,
    portrait_image_id uuid,
    order_index integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.sectors;
       public         heap    felixengelmann    false            �            1259 	   133716351    topo_images    TABLE       CREATE TABLE public.topo_images (
    area_id uuid NOT NULL,
    file_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    order_index integer DEFAULT 0 NOT NULL
);
    DROP TABLE public.topo_images;
       public         heap    felixengelmann    false            �            1259 	   133716355    users    TABLE     �  CREATE TABLE public.users (
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
       public         heap    felixengelmann    false            �           2604 	   133716361    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    218    217            |          0 	   133716307    alembic_version 
   TABLE DATA                 public          felixengelmann    false    210   Jm       }          0 	   133716310    areas 
   TABLE DATA                 public          felixengelmann    false    211   �m       ~          0 	   133716316    crags 
   TABLE DATA                 public          felixengelmann    false    212   o                 0 	   133716322    files 
   TABLE DATA                 public          felixengelmann    false    213   up       �          0 	   133716325 
   line_paths 
   TABLE DATA                 public          felixengelmann    false    214   s       �          0 	   133716331    lines 
   TABLE DATA                 public          felixengelmann    false    215   �t       �          0 	   133716336    regions 
   TABLE DATA                 public          felixengelmann    false    216   sv       �          0 	   133716341    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    217   w       �          0 	   133716345    sectors 
   TABLE DATA                 public          felixengelmann    false    219   �w       �          0 	   133716351    topo_images 
   TABLE DATA                 public          felixengelmann    false    220   �x       �          0 	   133716355    users 
   TABLE DATA                 public          felixengelmann    false    221   	z       �           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 2, true);
          public          felixengelmann    false    218            �           2606 	   133716363 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    210            �           2606 	   133716365    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    211            �           2606 	   133716367    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    211            �           2606 	   133716369    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    211            �           2606 	   133716371    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    212            �           2606 	   133716373    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    212            �           2606 	   133716375    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    212            �           2606 	   133716377    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    213            �           2606 	   133716379    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    213            �           2606 	   133716381    line_paths line_paths_id_key 
   CONSTRAINT     U   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_id_key UNIQUE (id);
 F   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_id_key;
       public            felixengelmann    false    214            �           2606 	   133716383    line_paths line_paths_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_pkey PRIMARY KEY (line_id, topo_image_id, id);
 D   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_pkey;
       public            felixengelmann    false    214    214    214            �           2606 	   133716385    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    215            �           2606 	   133716387    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    215            �           2606 	   133716389    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    215            �           2606 	   133716391    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    216            �           2606 	   133716393    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    216            �           2606 	   133716395    regions regions_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_slug_key;
       public            felixengelmann    false    216            �           2606 	   133716397 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    217            �           2606 	   133716399    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    219            �           2606 	   133716401    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    219            �           2606 	   133716403    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    219            �           2606 	   133716405    topo_images topo_images_id_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_id_key UNIQUE (id);
 H   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_id_key;
       public            felixengelmann    false    220            �           2606 	   133716407    topo_images topo_images_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_pkey PRIMARY KEY (area_id, file_id, id);
 F   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_pkey;
       public            felixengelmann    false    220    220    220            �           2606 	   133716409    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    221            �           2606 	   133716411    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    221            �           2606 	   133716413    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    221            �           2606 	   133716414    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    211    221    3545            �           2606 	   133716419 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    3511    211    213            �           2606 	   133716424    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    3533    219    211            �           2606 	   133716429    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    3545    212    221            �           2606 	   133716434 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    3511    213    212            �           2606 	   133716439    crags crags_region_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);
 D   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_region_id_fkey;
       public          felixengelmann    false    212    3525    216            �           2606 	   133716444    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    221    213    3545            �           2606 	   133716449 (   line_paths line_paths_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_created_by_id_fkey;
       public          felixengelmann    false    214    3545    221            �           2606 	   133716454 "   line_paths line_paths_line_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id);
 L   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_line_id_fkey;
       public          felixengelmann    false    215    214    3519            �           2606 	   133716459 (   line_paths line_paths_topo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.line_paths
    ADD CONSTRAINT line_paths_topo_image_id_fkey FOREIGN KEY (topo_image_id) REFERENCES public.topo_images(id);
 R   ALTER TABLE ONLY public.line_paths DROP CONSTRAINT line_paths_topo_image_id_fkey;
       public          felixengelmann    false    3539    214    220            �           2606 	   133716464    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    215    211    3499            �           2606 	   133716469    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    215    221    3545            �           2606 	   133716474 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    221    216    3545            �           2606 	   133716479    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    219    212    3505            �           2606 	   133716484 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    221    219    3545            �           2606 	   133716489 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    213    3511    219            �           2606 	   133716494 $   topo_images topo_images_area_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_area_id_fkey;
       public          felixengelmann    false    211    220    3499            �           2606 	   133716499 *   topo_images topo_images_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 T   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_created_by_id_fkey;
       public          felixengelmann    false    221    220    3545            �           2606 	   133716504 $   topo_images topo_images_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.topo_images
    ADD CONSTRAINT topo_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);
 N   ALTER TABLE ONLY public.topo_images DROP CONSTRAINT topo_images_file_id_fkey;
       public          felixengelmann    false    213    220    3511            �           2606 	   133716509    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    3511    221    213            �           2606 	   133716514    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    221    3545    221            |   F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�P763�LL6M�41KR״��� {�k      }   ^  x���MK#A���}�
�lTw�D=B��OWjtp����a�=�z��U
��o���,�W��f���evϹ�jFm���tusqe~�����IGs�o��������̏w'�}���j�C�ݛ?Ϗf�z2|>���N�]�*�4��ו��)m���24�@���@���8�ӯ�� ��G����b)&J�u}�Z����cZk[��t�:A������S�rV'��j�m����&�ȁ�������6���JɵY�y��%!O�P��]�=8�-�+{��{Sl�3�����ꍍ%Yi@R@���&�B$�Oqᱲ��-����`(P 0�?�� ��`      ~   W  x���KKC1F���U��yL�I-���b��k?y���ܖ[��כ�R|�*��0p�|y}� �ˇ[����6MRϫ�x�X<^ߋ��e�n�2>���|�ݪ�˲K뾴q߭��^�#������{�ى��*��a�:�È��$`�
�b��V�t��9&�&@���,P�
ˠ\����R��
�ZMm�8����bQe��J(�%l��(PQ�íx���/?I�7lSl�>[��YJ�`�/UN����Z���k��������M�b(�M�����,29H&��C���zj�Dm��������_rD��w�� C����DFis�T=��v�         �  x�ŕ�kA���W��Up��L2��O>�VJm}�̯R9zŞ���ګ�x(B��d6;��O���||��t::9}7]}+��:��U��>�<>{�q:\$� R�x��űTr�K����ϧE��a�$ZB�S�HdwOΎ�-gӯ7��m~o!d��jGu(û":\"�d	q� va��[��CW׿-O�i�.}8d�R��\�,<
Y<{qp�W�9*)��ptXruJ�9U�4Pl��� ��e�%��C��Yo�֛鐞�W�7�G.���V���R{�P����#v��} QyI���$Iz�������"Pۣ<,	�d���^�������m�]��|�`[�~�(U�\FF��c��x(r]�.�{
[' ���0>"�.P�q�5��3��z���q�<�`��>@�,1M���h�j+�C���K�5��⃳�W��[`;/#����4������C��A���򰗢տi��MJ�}�O�aJ�YU�)'1z'��)�@);h����ia�<�|O�x��O�i�uZu���o߿�>�2���KT��j�ab�������O��2%�:Rw҆���648kX�b���e?�4۟ =d�F7?�A�se�`^�CԚ.W�A�|��V�-�GBpp�L�*      �   �  x���MkU1���WdW��0����u墋�+�֍�$�E
��w�"���n�x��<��rs��6�.�����p?���������˷������&��|[p�B��Q0w�-�mYa3���jJW���Z�����]kV��J�;��}*0%i�*���1�)q+���992*"h��0�)�������V�E�cO)������񸚘~�GR�2F��z��[6�%w���Y���\��jN�GnG���j�^���`�q���[f�[��e6�mp3A��7���������ۼD�r�K(7�UG�`\�za��B���;V�]�>kCBi+*j��j���3�S�Đ*I�`��/ɻ�ډ2)��Gv^׬Kǝ\��?$����c>~
ચ      �   �  x��R]o�0}�0y	Hu$q�ʴ U'�����84��D�����7�6e�����˽�������:�.�\�������F�u��d9x���:�΁{ҝfM��V��x'����g��yvi�׃��\�P@a)S�XJH"Q�HD����ː
�c��abx%�TTE2��-��BA���y�0��ެV��J*�bU����$qC�bV	��o��x��>=�_%���";�3�"]�Wl�}�x����|�T�W�T�w7��Z����y���ys%�If*�$�JT��Pc%
��*(�_�I��0�Op�G!o��M�p́�o��t}���;�4G]c?�n��.���,���eq�}�љz�$�َc7$��~��n�i���d�[��(�O?<a黸}1W�Rg�����Oo]�Kf��6�%�      �   �   x�5�1�0��_�--�I_�N��������i�������]Y�EcYY�+{��<���ӺDv�T]Ѳ�!�i�'��:ρ5_��Ay��!��� $��F@�����psuWU��RcF�G&l���>39��
�o�~��s�$��-=      �   �   x���9
�@ �>��.
~��φ�E��`��̟DQq;��6�|����B?n��M�SZ>��v.����>�a��w��k9�l��P3!�w�g�UUrF#jj�&���i�R�\�T� J� "'�DVq�Ȉ�[���n1�      �   6  x����j1��>En���I2I&V�<H���'٬
vw���7�������|����/V��5�/�Kv��aGM���ܰ��b3[���*�|ۦ����NN������Rw�]�e��� 'ϧi{"j�xYq��8�A���	��# �T&��"#>$˵����s��`��L�X�|F
���Ŧ(2#4*"]��R�IQs���&��*�Dp}���|�?EO5���A�A:^�y�<&8t\B
�D_�����`~��eHu��W�d�#n������d-^iH/���J����F ���U��]�?E8|ME�      �     x���1K�A����o��)w��.W'��R����\/RPZP��Wg�9O޼O����i?������eo���<_�/�w}������M7��ֲe-�@�[�T�[�%��n�{
���k�c���v	�Ik0�r�Ń
��2�PGr-Eǒ�4�+�	B�)�%�2�E�,<���f3�ȔDء��Z�R͐�Tq#�����?ۢel�;ԣ���J� �b��k��
edm�EϠ��"�pɎ�w۲��˟u�Н;�z�      �   %  x�ՐMO�@����=4�&l��G�ŋ�V-�%���ٖ-_Tj#�{i�ă�1� �wf򾓙<Q��Dq�e��Y�ԕ�T`��A�G��(�P]@�s�r.x�QL�����c�����X��(al��)w����j�0�,,B�]�-N�CĔ^�^��a���%�<,�r�l��P��d�D�4~fq���3=It[5��:W&ߨ�y�Wm�j�rƺ����m�&���P��m�����j�J?�G2��IGi�K��h��g��G���H����J�;���/X�Z�I�-     