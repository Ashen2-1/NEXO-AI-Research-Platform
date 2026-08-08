import pool from "../db.js";

const DAILY_AI_QUESTION_LIMIT = 30; //每天可以问30个问题
const DAILY_FILE_UPLOAD_LIMIT = 5; //每天可以上传5个files

export const getOrCreateTodayUsage = async (userId) => {
    const result = await pool.query(
        `
        insert into user_daily_usage (user_id, usage_date)
        values ($1, current_date)
        on conflict (user_id, usage_date)
        do update set updated_at = now()
        returning *
        `,
        [userId]
    );

    return result.rows[0];
};

export const checkAiQuestionLimit = async (userId) => {
    const usage = await getOrCreateTodayUsage(userId);

    if (usage.ai_questions >= DAILY_AI_QUESTION_LIMIT) {
        const error = new Error(
            `Daily AI question limit reached. Please try again tomorrow.`
        );
        error.statusCode = 429;
        throw error;
    }

    return usage;
};

export const incrementAiQuestions = async (userId) => {
    await pool.query(
        `
        update user_daily_usage
        set ai_questions = ai_questions + 1,
            updated_at = now()
        where user_id = $1
          and usage_date = current_date
        `,
        [userId]
    );
};

export const checkFileUploadLimit = async (userId) => {
    const usage = await getOrCreateTodayUsage(userId);

    if (usage.file_uploads >= DAILY_FILE_UPLOAD_LIMIT) {
        const error = new Error(
            `Daily file upload limit reached. Please try again tomorrow.`
        );
        error.statusCode = 429;
        throw error;
    }

    return usage;
};

export const incrementFileUploads = async (userId) => {
    await pool.query(
        `
        update user_daily_usage
        set file_uploads = file_uploads + 1,
            updated_at = now()
        where user_id = $1
          and usage_date = current_date
        `,
        [userId]
    );
};