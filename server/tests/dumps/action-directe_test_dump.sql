--
-- PostgreSQL database dump
--

-- Dumped from database version 14.3
-- Dumped by pg_dump version 14.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.users DROP CONSTRAINT users_created_by_id_fkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_avatar_id_fkey;
ALTER TABLE ONLY public.files DROP CONSTRAINT files_created_by_id_fkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_id_key;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.revoked_tokens DROP CONSTRAINT revoked_tokens_pkey;
ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
ALTER TABLE ONLY public.files DROP CONSTRAINT files_id_key;
ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
ALTER TABLE public.revoked_tokens ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.users;
DROP SEQUENCE public.revoked_tokens_id_seq;
DROP TABLE public.revoked_tokens;
DROP TABLE public.files;
DROP TABLE public.alembic_version;
DROP SCHEMA public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: felixengelmann
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO felixengelmann;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: felixengelmann
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: felixengelmann
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO felixengelmann;

--
-- Name: files; Type: TABLE; Schema: public; Owner: felixengelmann
--

CREATE TABLE public.files (
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


ALTER TABLE public.files OWNER TO felixengelmann;

--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: felixengelmann
--

CREATE TABLE public.revoked_tokens (
    id integer NOT NULL,
    jti character varying(120)
);


ALTER TABLE public.revoked_tokens OWNER TO felixengelmann;

--
-- Name: revoked_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: felixengelmann
--

CREATE SEQUENCE public.revoked_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.revoked_tokens_id_seq OWNER TO felixengelmann;

--
-- Name: revoked_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: felixengelmann
--

ALTER SEQUENCE public.revoked_tokens_id_seq OWNED BY public.revoked_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: felixengelmann
--

CREATE TABLE public.users (
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


ALTER TABLE public.users OWNER TO felixengelmann;

--
-- Name: revoked_tokens id; Type: DEFAULT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.revoked_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_tokens_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: felixengelmann
--

INSERT INTO public.alembic_version VALUES ('2c6af51b763d');


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: felixengelmann
--

INSERT INTO public.files VALUES ('6137f55a-6201-45ab-89c5-6e9c29739d61', '2022-09-22 19:55:03.664355', NULL, 'test.jpg', 'ed22745d-ce4a-49f1-b9af-d29918d07923.jpg', 200, 200, true, true, false, false, false, '1543885f-e9ef-48c5-a396-6c898fb42409');


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: felixengelmann
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: felixengelmann
--

INSERT INTO public.users VALUES ('1543885f-e9ef-48c5-a396-6c898fb42409', '2022-09-22 19:55:03.664355', NULL, '$pbkdf2-sha256$29000$MCbk/L.39h4DwBjjXEuJcQ$m5s68Cmla14ixyWpobRVRU9J7Nq5NbCOxa85.0ZL0Ks', 'action-directe@fengelmann.de', 'Felix', 'Engelmann', false, true, NULL, NULL, NULL, 'de', 'LARA_LIGHT_TEAL', NULL, NULL, NULL, NULL);
INSERT INTO public.users VALUES ('2543885f-e9ef-48c5-a396-6c898fb42409', '2022-09-22 19:55:03.664355', NULL, '$pbkdf2-sha256$29000$MCbk/L.39h4DwBjjXEuJcQ$m5s68Cmla14ixyWpobRVRU9J7Nq5NbCOxa85.0ZL0Ks', 'action-directe2@fengelmann.de', 'Felix', 'Engelmann', false, true, NULL, NULL, NULL, 'de', 'LARA_LIGHT_TEAL', NULL, NULL, NULL, NULL);
INSERT INTO public.users VALUES ('3543885f-e9ef-48c5-a396-6c898fb42409', '2022-09-22 19:55:03.664355', NULL, '$pbkdf2-sha256$29000$MCbk/L.39h4DwBjjXEuJcQ$m5s68Cmla14ixyWpobRVRU9J7Nq5NbCOxa85.0ZL0Ks', 'action-directe3@fengelmann.de', 'Felix', 'Engelmann', false, false, NULL, NULL, NULL, 'de', 'LARA_LIGHT_TEAL', NULL, NULL, NULL, NULL);


--
-- Name: revoked_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: felixengelmann
--

SELECT pg_catalog.setval('public.revoked_tokens_id_seq', 1, false);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: files files_id_key; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_id_key UNIQUE (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_id_key; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: files files_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: users users_avatar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.files(id);


--
-- Name: users users_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: felixengelmann
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

