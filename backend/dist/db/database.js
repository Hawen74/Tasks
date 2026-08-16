import { Pool } from "pg";
import "dotenv/config"; // using environment variables.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
pool.connect((err, client, release) => {
    if (err) {
        console.error("Failed to connect database:", err);
        return;
    }
    console.log("Successfully connected to database.");
    release();
});
export default pool;
//# sourceMappingURL=database.js.map