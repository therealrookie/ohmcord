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

CREATE FUNCTION get_expired_brainstorm_ids() RETURNS TABLE(brainstorm_id INT) AS $$
BEGIN
    RETURN QUERY 
    SELECT brainstorm_id FROM brainstorm WHERE timestamp < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql; 


CREATE FUNCTION get_expired_brainstorm_contribution_ids(expired_brainstorm_ids INT[]) 
RETURNS TABLE(contribution_id INT) AS $$
BEGIN
    RETURN QUERY 
    SELECT contribution_id FROM brainstorm_contributions 
    WHERE brainstorm_id = ANY(expired_brainstorm_ids);
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION delete_expired_brainstorm() RETURNS TRIGGER AS $$
DECLARE
    expired_brainstorm_ids INT[];
    expired_contribution_ids INT[];
BEGIN
    -- Get expired brainstorm IDs
    SELECT array_agg(brainstorm_id) INTO expired_brainstorm_ids 
    FROM get_expired_brainstorm_ids();
    
    -- Get expired contribution IDs
    SELECT array_agg(contribution_id) INTO expired_contribution_ids 
    FROM get_expired_brainstorm_contribution_ids(expired_brainstorm_ids);

    -- Delete linked data
    DELETE FROM brainstorm_contribution_positions WHERE contribution_id = ANY(expired_contribution_ids);
    DELETE FROM brainstorm_contribution_scoring WHERE contribution_id = ANY(expired_contribution_ids);
    DELETE FROM brainstorm_contributions WHERE brainstorm_id = ANY(expired_brainstorm_ids);
    DELETE FROM brainstorm_messages WHERE brainstorm_id = ANY(expired_brainstorm_ids);

    -- Delete expired brainstorm entries
    DELETE FROM brainstorm WHERE brainstorm_id = ANY(expired_brainstorm_ids);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER expired_brainstorm_trigger
    AFTER INSERT ON brainstorm
    EXECUTE FUNCTION delete_expired_brainstorm();
    