import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pool from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.resolve(__dirname, "../migrations");

const runMigrations = async () => {
    const client = await pool.connect();

    try {
        await client.query(`
            create table if not exists public.schema_migrations (
                filename text primary key,
                applied_at timestamp without time zone not null default now()
            )
        `);

        const filenames = (await fs.readdir(migrationsDirectory))
            .filter((filename) => filename.endsWith(".sql"))
            .sort();

        for (const filename of filenames) {
            const applied = await client.query(
                `select 1
                 from public.schema_migrations
                 where filename = $1`,
                [filename]
            );

            if (applied.rows.length > 0) {
                console.log(`Skipping already applied migration: ${filename}`);
                continue;
            }

            const sql = await fs.readFile(
                path.join(migrationsDirectory, filename),
                "utf8"
            );

            await client.query("begin");

            try {
                await client.query(sql);
                await client.query(
                    `insert into public.schema_migrations (filename)
                     values ($1)`,
                    [filename]
                );
                await client.query("commit");
                console.log(`Applied migration: ${filename}`);
            } catch (error) {
                await client.query("rollback");
                throw error;
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
};

runMigrations().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
});
