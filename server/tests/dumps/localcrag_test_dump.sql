PGDMP     	    '                {           localcrag_dev    14.7 (Homebrew)    14.7 (Homebrew) B    i           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            j           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            k           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            l           1262    68766542    localcrag_dev    DATABASE     X   CREATE DATABASE localcrag_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';
    DROP DATABASE localcrag_dev;
                felixengelmann    false                        3079    68766544 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                   false            m           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                        false    2            J           1247    88328815    linetypeenum    TYPE     T   CREATE TYPE public.linetypeenum AS ENUM (
    'BOULDER',
    'SPORT',
    'TRAD'
);
    DROP TYPE public.linetypeenum;
       public          felixengelmann    false            �            1259    88328821    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap    felixengelmann    false            �            1259    88328824    areas    TABLE     z  CREATE TABLE public.areas (
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
       public         heap    felixengelmann    false            �            1259    88328829    crags    TABLE     w  CREATE TABLE public.crags (
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
       public         heap    felixengelmann    false            �            1259    88328834    files    TABLE     �  CREATE TABLE public.files (
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
       public         heap    felixengelmann    false            �            1259    88328837    lines    TABLE     .  CREATE TABLE public.lines (
    name character varying(120) NOT NULL,
    description text,
    video character varying(120) NOT NULL,
    grade integer NOT NULL,
    type public.linetypeenum NOT NULL,
    sitstart boolean NOT NULL,
    eliminate boolean NOT NULL,
    traverse boolean NOT NULL,
    classic boolean NOT NULL,
    linepath json NOT NULL,
    area_id uuid NOT NULL,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL
);
    DROP TABLE public.lines;
       public         heap    felixengelmann    false    842            �            1259    88328842    regions    TABLE       CREATE TABLE public.regions (
    name character varying(120) NOT NULL,
    description text,
    id uuid NOT NULL,
    time_created timestamp without time zone,
    time_updated timestamp without time zone,
    created_by_id uuid,
    slug character varying NOT NULL
);
    DROP TABLE public.regions;
       public         heap    felixengelmann    false            �            1259    88328847    revoked_tokens    TABLE     `   CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);
 "   DROP TABLE public.revoked_tokens;
       public         heap    felixengelmann    false            �            1259    88328850    revoked_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.revoked_tokens_id_seq;
       public          felixengelmann    false    216            n           0    0    revoked_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;
          public          felixengelmann    false    217            �            1259    88328851    sectors    TABLE     p  CREATE TABLE public.sectors (
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
       public         heap    felixengelmann    false            �            1259    88328856    users    TABLE     �  CREATE TABLE public.users (
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
       public         heap    felixengelmann    false            �           2604    88328862    revoked_tokens id    DEFAULT     v   ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);
 @   ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
       public          felixengelmann    false    217    216            ]          0    88328821    alembic_version 
   TABLE DATA                 public          felixengelmann    false    210   [T       ^          0    88328824    areas 
   TABLE DATA                 public          felixengelmann    false    211   �T       _          0    88328829    crags 
   TABLE DATA                 public          felixengelmann    false    212   V       `          0    88328834    files 
   TABLE DATA                 public          felixengelmann    false    213   �W       a          0    88328837    lines 
   TABLE DATA                 public          felixengelmann    false    214   ~Y       b          0    88328842    regions 
   TABLE DATA                 public          felixengelmann    false    215   �Y       c          0    88328847    revoked_tokens 
   TABLE DATA                 public          felixengelmann    false    216   =Z       e          0    88328851    sectors 
   TABLE DATA                 public          felixengelmann    false    218   �Z       f          0    88328856    users 
   TABLE DATA                 public          felixengelmann    false    219   \       o           0    0    revoked_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 2, true);
          public          felixengelmann    false    217            �           2606    88328864 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public            felixengelmann    false    210            �           2606    88328866    areas areas_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_id_key;
       public            felixengelmann    false    211            �           2606    88328868    areas areas_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_pkey;
       public            felixengelmann    false    211            �           2606    88328870    areas areas_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_slug_key;
       public            felixengelmann    false    211            �           2606    88328872    crags crags_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_id_key;
       public            felixengelmann    false    212            �           2606    88328874    crags crags_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_pkey;
       public            felixengelmann    false    212            �           2606    88328876    crags crags_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_slug_key;
       public            felixengelmann    false    212            �           2606    88328878    files files_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
       public            felixengelmann    false    213            �           2606    88328880    files files_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
       public            felixengelmann    false    213            �           2606    88328882    lines lines_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_id_key;
       public            felixengelmann    false    214            �           2606    88328884    lines lines_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_pkey;
       public            felixengelmann    false    214            �           2606    88328886    lines lines_slug_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_slug_key UNIQUE (slug);
 >   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_slug_key;
       public            felixengelmann    false    214            �           2606    88328888    regions regions_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_id_key;
       public            felixengelmann    false    215            �           2606    88328890    regions regions_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_pkey;
       public            felixengelmann    false    215            �           2606    88328892    regions regions_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_slug_key;
       public            felixengelmann    false    215            �           2606    88328894 "   revoked_tokens revoked_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
       public            felixengelmann    false    216            �           2606    88328896    sectors sectors_id_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_id_key UNIQUE (id);
 @   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_id_key;
       public            felixengelmann    false    218            �           2606    88328898    sectors sectors_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_pkey;
       public            felixengelmann    false    218            �           2606    88328900    sectors sectors_slug_key 
   CONSTRAINT     S   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
 B   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_slug_key;
       public            felixengelmann    false    218            �           2606    88328902    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            felixengelmann    false    219            �           2606    88328904    users users_id_key 
   CONSTRAINT     K   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);
 <   ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
       public            felixengelmann    false    219            �           2606    88328906    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            felixengelmann    false    219            �           2606    88328907    areas areas_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_created_by_id_fkey;
       public          felixengelmann    false    211    3520    219            �           2606    88328912 "   areas areas_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_portrait_image_id_fkey;
       public          felixengelmann    false    213    211    3494            �           2606    88328917    areas areas_sector_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id);
 D   ALTER TABLE ONLY public.areas DROP CONSTRAINT areas_sector_id_fkey;
       public          felixengelmann    false    218    211    3512            �           2606    88328922    crags crags_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_created_by_id_fkey;
       public          felixengelmann    false    212    3520    219            �           2606    88328927 "   crags crags_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 L   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_portrait_image_id_fkey;
       public          felixengelmann    false    212    3494    213            �           2606    88328932    crags crags_region_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.crags
    ADD CONSTRAINT crags_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);
 D   ALTER TABLE ONLY public.crags DROP CONSTRAINT crags_region_id_fkey;
       public          felixengelmann    false    215    212    3504            �           2606    88328937    files files_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
       public          felixengelmann    false    213    219    3520            �           2606    88328942    lines lines_area_id_fkey    FK CONSTRAINT     w   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);
 B   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_area_id_fkey;
       public          felixengelmann    false    211    214    3482            �           2606    88328947    lines lines_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.lines DROP CONSTRAINT lines_created_by_id_fkey;
       public          felixengelmann    false    214    219    3520            �           2606    88328952 "   regions regions_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.regions DROP CONSTRAINT regions_created_by_id_fkey;
       public          felixengelmann    false    215    219    3520            �           2606    88328957    sectors sectors_crag_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_crag_id_fkey FOREIGN KEY (crag_id) REFERENCES public.crags(id);
 F   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_crag_id_fkey;
       public          felixengelmann    false    218    212    3488            �           2606    88328962 "   sectors sectors_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 L   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_created_by_id_fkey;
       public          felixengelmann    false    219    218    3520            �           2606    88328967 &   sectors sectors_portrait_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_portrait_image_id_fkey FOREIGN KEY (portrait_image_id) REFERENCES public.files(id);
 P   ALTER TABLE ONLY public.sectors DROP CONSTRAINT sectors_portrait_image_id_fkey;
       public          felixengelmann    false    218    213    3494            �           2606    88328972    users users_avatar_id_fkey    FK CONSTRAINT     {   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);
 D   ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
       public          felixengelmann    false    3494    219    213            �           2606    88328977    users users_created_by_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
       public          felixengelmann    false    219    219    3520            ]   F   x���v
Q���W((M��L�K�I�M�L�/K-*���Ss�	uV�P�461�H5KN�43R״��� zMJ      ^   \  x���MK#A���}����]5Y����OWj��q&��=<,�ԥ�z��Y�o.�o�r}{ev/��jFm���|uwyc�����YGs�o�����������Owg�}�[���,�v�7�/Of�~2�}R�����]�*�4��ו��)m���24�@���@���8�ӯ�� ��G����b)&J�u}�Z����cZk[��t�:A������S�rV'��j�m����&�ȁ�������6���JɵY�y�}���'r(��!������[y0E���Q;y�
?�`,A�J�� *F�(�o0�H�����������0@a�|`(�����g      _   U  x���KK1F���U�;f���A��b�Ъ��Ǵ2-Sf�_�JQ���@�Ås���l�(������K���� �oO��8߶����1���l��͇�ms�f#��xG������{�9�U���$�b@�L0��BXU���I8p�!���T��R��!������qJ*ҁR�ĉ*'�V:��u��X�LiP�
���-�X{6��*�B�[��yߵǟ$��i6�1V��K�,����/�ϯF�?��m�v��q�k��c�����gr:@FJ����Y�:��}
�jbl��2���o���}�/9������z� C��Vl+�IC������      `   �  x�œKkA���s[�������)CƁ�q�4��d��?��;dI8�����J�g��������O��1�����Vm3�|8�>���}�"	9��A��f�,z��9"pD�Rd��{������|x�m����ow�V�"K��8[GȖ:T2C�.��������c{֞V�_�
{U�Ьu`��EM{fbg���Gg�>I�R�{g�$�Rr.t�q�܃�O�$�d��"���|خ�ӱ����'�3�4�j��V̥5���k��}�����xC����$�q�g�k
���N�rZ
�a,�|sw{�V��:7z���s����0DBa���)'_�W�U{b�%{6"
��z(����i4s%e2���13����}w̩ʁ4��u�4ғ������(<B�^S���.�fI=��4�KT@C���p��y�UFK~"�	îL���_� ����>>�c�5y�w� �d���}��Q      a   
   x���          b   �   x�5�1�0��_�--�I_�N��������i�������]Y�EcYY�+{��<���ӺDv�T]Ѳ�!�i�'��:ρ5_��Ay��!��� $��F@�����psuWU��RcF�G&l���>39��
�o�~��s�$��-=      c   �   x���9
�@ �>��.
~��φ�E��`��̟DQq;��6�|����B?n��M�SZ>��v.����>�a��w��k9�l��P3!�w�g�UUrF#jj�&���i�R�\�T� J� "'�DVq�Ȉ�[���n1�      e   4  x����j1��>En�Bc'�d3�"��A�(T�=�fU������	��=�
�!̗����r=۰�r�b��a��П.{���5�+�a��>��;���g�kw���.�/���vǮ��Nϳ;�jey �pt�8�^����2jK�� 4TG�#x�"!�Gõ��Y�9	Rq0\J&p"�t�
�I�嶪#4*"��hc�IAs�l��@����^����w�Lu?��Bp^Z^�i�4�[�\B��DW���i���ؕ�m�y�(�*�%n�����LN��$U:��oQzf�4� h����=}��t��'      f   %  x�ՐMO�@����=4�&l��G�ŋ�V-�%���ٖ-_Tj#�{i�ă�1� �wf򾓙<Q��Dq�e��Y�ԕ�T`��A�G��(�P]@�s�r.x�QL�����c�����X��(al��)w����j�0�,,B�]�-N�CĔ^�^��a���%�<,�r�l��P��d�D�4~fq���3=It[5��:W&ߨ�y�Wm�j�rƺ����m�&���P��m�����j�J?�G2��IGi�K��h��g��G���H����J�;���/X�Z�I�-     