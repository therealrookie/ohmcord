--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: brainstorm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brainstorm (
    brainstorm_id integer NOT NULL,
    theme character varying(255),
    url character varying(255),
    end_time_ms bigint,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.brainstorm OWNER TO postgres;

--
-- Name: brainstorm_brainstorm_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brainstorm_brainstorm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brainstorm_brainstorm_id_seq OWNER TO postgres;

--
-- Name: brainstorm_brainstorm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brainstorm_brainstorm_id_seq OWNED BY public.brainstorm.brainstorm_id;


--
-- Name: brainstorm_contribution_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brainstorm_contribution_positions (
    position_id integer NOT NULL,
    contribution_id integer,
    x_pos integer,
    y_pos integer
);


ALTER TABLE public.brainstorm_contribution_positions OWNER TO postgres;

--
-- Name: brainstorm_contribution_positions_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brainstorm_contribution_positions_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brainstorm_contribution_positions_position_id_seq OWNER TO postgres;

--
-- Name: brainstorm_contribution_positions_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brainstorm_contribution_positions_position_id_seq OWNED BY public.brainstorm_contribution_positions.position_id;


--
-- Name: brainstorm_contribution_scoring; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brainstorm_contribution_scoring (
    scoring_id integer NOT NULL,
    contribution_id integer,
    discord_user_id character varying(255),
    clicks integer
);


ALTER TABLE public.brainstorm_contribution_scoring OWNER TO postgres;

--
-- Name: brainstorm_contribution_scoring_scoring_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brainstorm_contribution_scoring_scoring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brainstorm_contribution_scoring_scoring_id_seq OWNER TO postgres;

--
-- Name: brainstorm_contribution_scoring_scoring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brainstorm_contribution_scoring_scoring_id_seq OWNED BY public.brainstorm_contribution_scoring.scoring_id;


--
-- Name: brainstorm_contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brainstorm_contributions (
    contribution_id integer NOT NULL,
    brainstorm_id integer,
    contribution character varying(255),
    score integer
);


ALTER TABLE public.brainstorm_contributions OWNER TO postgres;

--
-- Name: brainstorm_contributions_contribution_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brainstorm_contributions_contribution_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brainstorm_contributions_contribution_id_seq OWNER TO postgres;

--
-- Name: brainstorm_contributions_contribution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brainstorm_contributions_contribution_id_seq OWNED BY public.brainstorm_contributions.contribution_id;


--
-- Name: brainstorm_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brainstorm_messages (
    brainstorm_message_id integer NOT NULL,
    brainstorm_id integer,
    message_id character varying(255)
);


ALTER TABLE public.brainstorm_messages OWNER TO postgres;

--
-- Name: brainstorm_messages_brainstorm_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brainstorm_messages_brainstorm_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brainstorm_messages_brainstorm_message_id_seq OWNER TO postgres;

--
-- Name: brainstorm_messages_brainstorm_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brainstorm_messages_brainstorm_message_id_seq OWNED BY public.brainstorm_messages.brainstorm_message_id;


--
-- Name: poll_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poll_answers (
    answer_id integer NOT NULL,
    poll_id integer,
    emoji character varying(255),
    answer character varying(255)
);


ALTER TABLE public.poll_answers OWNER TO postgres;

--
-- Name: poll_answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.poll_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_answers_answer_id_seq OWNER TO postgres;

--
-- Name: poll_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.poll_answers_answer_id_seq OWNED BY public.poll_answers.answer_id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.polls (
    poll_id integer NOT NULL,
    hash_route character varying(255),
    question character varying(255),
    multiple_answers boolean,
    duration integer
);


ALTER TABLE public.polls OWNER TO postgres;

--
-- Name: polls_poll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.polls_poll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polls_poll_id_seq OWNER TO postgres;

--
-- Name: polls_poll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.polls_poll_id_seq OWNED BY public.polls.poll_id;


--
-- Name: question_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_answers (
    answer_id integer NOT NULL,
    question_id integer,
    answer character varying(255)
);


ALTER TABLE public.question_answers OWNER TO postgres;

--
-- Name: question_answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_answers_answer_id_seq OWNER TO postgres;

--
-- Name: question_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_answers_answer_id_seq OWNED BY public.question_answers.answer_id;


--
-- Name: question_contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_contributions (
    question_id integer NOT NULL,
    question_session_id integer,
    question character varying(255),
    discord_message_id bigint
);


ALTER TABLE public.question_contributions OWNER TO postgres;

--
-- Name: question_contributions_contribution_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_contributions_contribution_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_contributions_contribution_id_seq OWNER TO postgres;

--
-- Name: question_contributions_contribution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_contributions_contribution_id_seq OWNED BY public.question_contributions.question_id;


--
-- Name: question_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_sessions (
    question_session_id integer NOT NULL,
    topic character varying(255),
    url character varying(255)
);


ALTER TABLE public.question_sessions OWNER TO postgres;

--
-- Name: question_sessions_brainstorm_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_sessions_brainstorm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_sessions_brainstorm_id_seq OWNER TO postgres;

--
-- Name: question_sessions_brainstorm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_sessions_brainstorm_id_seq OWNED BY public.question_sessions.question_session_id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz (
    quiz_id integer NOT NULL,
    quiz_title character varying(255),
    visibility integer,
    url character varying(255)
);


ALTER TABLE public.quiz OWNER TO postgres;

--
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_answers (
    quiz_answer_id integer NOT NULL,
    quiz_question_id integer,
    quiz_answer character varying(255),
    is_correct boolean
);


ALTER TABLE public.quiz_answers OWNER TO postgres;

--
-- Name: quiz_answers_quiz_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_answers_quiz_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_answers_quiz_answer_id_seq OWNER TO postgres;

--
-- Name: quiz_answers_quiz_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_answers_quiz_answer_id_seq OWNED BY public.quiz_answers.quiz_answer_id;


--
-- Name: quiz_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_participants (
    participants_id integer NOT NULL,
    quiz_id integer,
    participant_discord_id character varying(255),
    start_time_ms bigint,
    end_time_ms bigint,
    correct_answers integer,
    question_status integer
);


ALTER TABLE public.quiz_participants OWNER TO postgres;

--
-- Name: quiz_participants_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_participants_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_participants_participants_id_seq OWNER TO postgres;

--
-- Name: quiz_participants_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_participants_participants_id_seq OWNED BY public.quiz_participants.participants_id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_questions (
    quiz_question_id integer NOT NULL,
    quiz_id integer,
    quiz_question character varying(255),
    multiple_answers boolean,
    attempts integer,
    correct integer
);


ALTER TABLE public.quiz_questions OWNER TO postgres;

--
-- Name: quiz_questions_quiz_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_questions_quiz_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_questions_quiz_question_id_seq OWNER TO postgres;

--
-- Name: quiz_questions_quiz_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_questions_quiz_question_id_seq OWNED BY public.quiz_questions.quiz_question_id;


--
-- Name: quiz_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_quiz_id_seq OWNER TO postgres;

--
-- Name: quiz_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_quiz_id_seq OWNED BY public.quiz.quiz_id;


--
-- Name: brainstorm brainstorm_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm ALTER COLUMN brainstorm_id SET DEFAULT nextval('public.brainstorm_brainstorm_id_seq'::regclass);


--
-- Name: brainstorm_contribution_positions position_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_positions ALTER COLUMN position_id SET DEFAULT nextval('public.brainstorm_contribution_positions_position_id_seq'::regclass);


--
-- Name: brainstorm_contribution_scoring scoring_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_scoring ALTER COLUMN scoring_id SET DEFAULT nextval('public.brainstorm_contribution_scoring_scoring_id_seq'::regclass);


--
-- Name: brainstorm_contributions contribution_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contributions ALTER COLUMN contribution_id SET DEFAULT nextval('public.brainstorm_contributions_contribution_id_seq'::regclass);


--
-- Name: brainstorm_messages brainstorm_message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_messages ALTER COLUMN brainstorm_message_id SET DEFAULT nextval('public.brainstorm_messages_brainstorm_message_id_seq'::regclass);


--
-- Name: poll_answers answer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_answers ALTER COLUMN answer_id SET DEFAULT nextval('public.poll_answers_answer_id_seq'::regclass);


--
-- Name: polls poll_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polls ALTER COLUMN poll_id SET DEFAULT nextval('public.polls_poll_id_seq'::regclass);


--
-- Name: question_answers answer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_answers ALTER COLUMN answer_id SET DEFAULT nextval('public.question_answers_answer_id_seq'::regclass);


--
-- Name: question_contributions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_contributions ALTER COLUMN question_id SET DEFAULT nextval('public.question_contributions_contribution_id_seq'::regclass);


--
-- Name: question_sessions question_session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_sessions ALTER COLUMN question_session_id SET DEFAULT nextval('public.question_sessions_brainstorm_id_seq'::regclass);


--
-- Name: quiz quiz_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz ALTER COLUMN quiz_id SET DEFAULT nextval('public.quiz_quiz_id_seq'::regclass);


--
-- Name: quiz_answers quiz_answer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers ALTER COLUMN quiz_answer_id SET DEFAULT nextval('public.quiz_answers_quiz_answer_id_seq'::regclass);


--
-- Name: quiz_participants participants_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_participants ALTER COLUMN participants_id SET DEFAULT nextval('public.quiz_participants_participants_id_seq'::regclass);


--
-- Name: quiz_questions quiz_question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN quiz_question_id SET DEFAULT nextval('public.quiz_questions_quiz_question_id_seq'::regclass);


--
-- Data for Name: brainstorm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brainstorm (brainstorm_id, theme, url, end_time_ms, "timestamp") FROM stdin;
\.


--
-- Data for Name: brainstorm_contribution_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brainstorm_contribution_positions (position_id, contribution_id, x_pos, y_pos) FROM stdin;
\.


--
-- Data for Name: brainstorm_contribution_scoring; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brainstorm_contribution_scoring (scoring_id, contribution_id, discord_user_id, clicks) FROM stdin;
\.


--
-- Data for Name: brainstorm_contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brainstorm_contributions (contribution_id, brainstorm_id, contribution, score) FROM stdin;
\.


--
-- Data for Name: brainstorm_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brainstorm_messages (brainstorm_message_id, brainstorm_id, message_id) FROM stdin;
\.


--
-- Data for Name: poll_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poll_answers (answer_id, poll_id, emoji, answer) FROM stdin;
\.


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.polls (poll_id, hash_route, question, multiple_answers, duration) FROM stdin;
\.


--
-- Data for Name: question_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_answers (answer_id, question_id, answer) FROM stdin;
\.


--
-- Data for Name: question_contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_contributions (question_id, question_session_id, question, discord_message_id) FROM stdin;
\.


--
-- Data for Name: question_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_sessions (question_session_id, topic, url) FROM stdin;
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz (quiz_id, quiz_title, visibility, url) FROM stdin;
\.


--
-- Data for Name: quiz_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_answers (quiz_answer_id, quiz_question_id, quiz_answer, is_correct) FROM stdin;
\.


--
-- Data for Name: quiz_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_participants (participants_id, quiz_id, participant_discord_id, start_time_ms, end_time_ms, correct_answers, question_status) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_questions (quiz_question_id, quiz_id, quiz_question, multiple_answers, attempts, correct) FROM stdin;
\.


--
-- Name: brainstorm_brainstorm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brainstorm_brainstorm_id_seq', 1, false);


--
-- Name: brainstorm_contribution_positions_position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brainstorm_contribution_positions_position_id_seq', 1, false);


--
-- Name: brainstorm_contribution_scoring_scoring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brainstorm_contribution_scoring_scoring_id_seq', 1, false);


--
-- Name: brainstorm_contributions_contribution_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brainstorm_contributions_contribution_id_seq', 1, false);


--
-- Name: brainstorm_messages_brainstorm_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brainstorm_messages_brainstorm_message_id_seq', 1, false);


--
-- Name: poll_answers_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.poll_answers_answer_id_seq', 1, false);


--
-- Name: polls_poll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.polls_poll_id_seq', 1, false);


--
-- Name: question_answers_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_answers_answer_id_seq', 1, false);


--
-- Name: question_contributions_contribution_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_contributions_contribution_id_seq', 1, false);


--
-- Name: question_sessions_brainstorm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_sessions_brainstorm_id_seq', 1, false);


--
-- Name: quiz_answers_quiz_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_answers_quiz_answer_id_seq', 1, false);


--
-- Name: quiz_participants_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_participants_participants_id_seq', 1, false);


--
-- Name: quiz_questions_quiz_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_questions_quiz_question_id_seq', 1, false);


--
-- Name: quiz_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_quiz_id_seq', 1, false);


--
-- Name: brainstorm_contribution_positions brainstorm_contribution_positions_contribution_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_positions
    ADD CONSTRAINT brainstorm_contribution_positions_contribution_id_key UNIQUE (contribution_id);


--
-- Name: brainstorm_contribution_positions brainstorm_contribution_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_positions
    ADD CONSTRAINT brainstorm_contribution_positions_pkey PRIMARY KEY (position_id);


--
-- Name: brainstorm_contribution_scoring brainstorm_contribution_scoring_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_scoring
    ADD CONSTRAINT brainstorm_contribution_scoring_pkey PRIMARY KEY (scoring_id);


--
-- Name: brainstorm_contributions brainstorm_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contributions
    ADD CONSTRAINT brainstorm_contributions_pkey PRIMARY KEY (contribution_id);


--
-- Name: brainstorm_messages brainstorm_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_messages
    ADD CONSTRAINT brainstorm_messages_pkey PRIMARY KEY (brainstorm_message_id);


--
-- Name: brainstorm brainstorm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm
    ADD CONSTRAINT brainstorm_pkey PRIMARY KEY (brainstorm_id);


--
-- Name: poll_answers poll_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_answers
    ADD CONSTRAINT poll_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (poll_id);


--
-- Name: question_answers question_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_answers
    ADD CONSTRAINT question_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: question_contributions question_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_contributions
    ADD CONSTRAINT question_contributions_pkey PRIMARY KEY (question_id);


--
-- Name: question_sessions question_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_sessions
    ADD CONSTRAINT question_sessions_pkey PRIMARY KEY (question_session_id);


--
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (quiz_answer_id);


--
-- Name: quiz_participants quiz_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_participants
    ADD CONSTRAINT quiz_participants_pkey PRIMARY KEY (participants_id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (quiz_id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (quiz_question_id);


--
-- Name: brainstorm_contribution_scoring unique_contribution_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brainstorm_contribution_scoring
    ADD CONSTRAINT unique_contribution_user UNIQUE (contribution_id, discord_user_id);


--
-- PostgreSQL database dump complete
--

