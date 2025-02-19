CREATE TABLE brainstorm (
    brainstorm_id SERIAL PRIMARY KEY,
    theme VARCHAR(255),
    end_time_ms BIGINT,
    url VARCHAR(255)
);

CREATE TABLE brainstorm_messages (
    brainstorm_message_id SERIAL PRIMARY KEY,
    brainstorm_id INTEGER,
    message_id VARCHAR(255)
);

CREATE TABLE brainstorm_contributions (
    contribution_id SERIAL PRIMARY KEY,
    brainstorm_id INTEGER,
    contribution VARCHAR(255),
    score INTEGER
);

CREATE TABLE brainstorm_contribution_scoring (
    scoring_id SERIAL PRIMARY KEY,
    contribution_id INTEGER,
    discord_user_id VARCHAR(255),
    clicks INTEGER
);

CREATE TABLE brainstorm_contribution_positions (
    position_id SERIAL PRIMARY KEY,
    contribution_id INTEGER,
    x_pos INTEGER,
    y_pos INTEGER
);

CREATE TABLE question_sessions (
    questions_session_id SERIAL PRIMARY KEY,
    topic VARCHAR(255),
    url VARCHAR(255)
);

CREATE TABLE question_contributions (
    question_id SERIAL PRIMARY KEY,
    questions_session_id INTEGER,
    question VARCHAR(255)
);

CREATE TABLE question_answers (
    answer_id SERIAL PRIMARY KEY,
    question_id INTEGER,
    answer VARCHAR(255)
);

CREATE TABLE quiz (
    quiz_id SERIAL PRIMARY KEY,
    quiz_title VARCHAR(255),
    visibility INTEGER,
    url VARCHAR(255),
    started INTEGER,
    finished INTEGER
);

CREATE TABLE quiz_questions (
    quiz_question_id SERIAL PRIMARY KEY,
    quiz_id INTEGER,
    quiz_question VARCHAR(255),
    multiple_answers boolean,
    attempts INTEGER,
    correct INTEGER
);

CREATE TABLE quiz_answers (
    quiz_answer_id SERIAL PRIMARY KEY,
    quiz_question_id INTEGER,
    quiz_answer VARCHAR(255),
    is_correct boolean
);

CREATE TABLE quiz_participants (
    participants_id SERIAL PRIMARY KEY,
    quiz_id INTEGER,
    participant_discord_id VARCHAR(255),
    start_time_ms BIGINT,
    end_time_ms BIGINT,
    correct_answers INTEGER,
    question_status INTEGER
);

CREATE TABLE polls (
    poll_id SERIAL PRIMARY KEY,
    hash_route VARCHAR(255),
    question VARCHAR(255),
    multiple_answers boolean,
    duration INTEGER
    );

CREATE TABLE poll_answers (
    answer_id SERIAL PRIMARY KEY,
    poll_id INTEGER,
    emoji VARCHAR(255),
    answer VARCHAR(255)
);