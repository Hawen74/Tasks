    import express, {
        type NextFunction,
        type Request,
        type Response,
    } from "express";
    import cors from "cors";
    import jwt from "jsonwebtoken";
    import bcrypt from "bcrypt";
    import rateLimit from "express-rate-limit";
    import { z } from "zod";
    import pool from "./db/database.js";
    import type { Task, TaskInput } from "./types/types.js";

    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());


    // =====================================================
    // TYPES
    // =====================================================

    interface ApiError {
        error: string;
        code?: string;
        details?: unknown;
    }

    interface PaginatedResponse<T> {
        data: T[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }

    interface Input {
        email: string;
        password: string;
    }

    interface User {
        id: number;
        email: string;
        passwordHash: string;
        createdAt: string;
    }

    interface AuthPayload {
        userId: number;
        email: string;
    }


    // =====================================================
    // EXPRESS req.user
    // =====================================================

    declare global {
        namespace Express {
            interface Request {
                user?: AuthPayload;
            }
        }
    }


    // =====================================================
    // ZOD SCHEMAS
    // =====================================================

    const inputSchema = z.object({
        email: z.email(),
        password: z.string().min(
            8,
            "Password must be at least 8 characters"
        ),
    });

    const dataSchema = z.object({
        title: z.string(),
        description: z.string(),
        status: z.enum([
            "Created",
            "Doing",
            "Completed",
        ]),
    });

    const refreshTokenSchema = z.object({
        refreshToken: z.string().min(1),
    });


    // =====================================================
    // VALIDATE BODY
    // =====================================================

    function validateBody(schema: z.ZodSchema) {
        return (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    error: "Validation failed",
                    code: "VALIDATION_ERROR",
                    details: result.error.flatten().fieldErrors,
                });
            }

            req.body = result.data;

            next();
        };
    }


    // =====================================================
    // AUTH MIDDLEWARE
    // =====================================================

    function requireAuth(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        const authHeader = req.headers.authorization;

        const token = authHeader?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "No token provided",
                code: "AUTH_TOKEN_MISSING",
            });
        }

        try {
            const decodedData = jwt.verify(
                token,
                process.env.ACCESS_TOKEN!
            ) as AuthPayload;

            req.user = decodedData;

            next();
        } catch {
            return res.status(401).json({
                error: "Invalid or expired token",
                code: "AUTH_TOKEN_INVALID",
            });
        }
    }


    // =====================================================
    // SANITIZE USER
    // =====================================================

    function sanitizeUser(user: User) {
        const {
            passwordHash,
            ...safeUser
        } = user;

        return safeUser;
    }


    // =====================================================
    // RATE LIMITING
    // =====================================================

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            error: "Too many login attempts, try again later",
            code: "LOGIN_RATE_LIMITED",
        },
    });

    const signupLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            error: "Too many signup attempts, try again later",
            code: "SIGNUP_RATE_LIMITED",
        },
    });


    // =====================================================
    // REFRESH TOKEN STORE
    // =====================================================

    const refreshTokenSet = new Set<string>();

    // =====================================================
    // GUEST
    // =====================================================

    const GUEST_EMAIL = "guest@handcode.local";

    app.post("/guest", async (req, res) => {
        try {
            // 1. Check if guest already exists
            let result = await pool.query<User>(
                `
                SELECT
                    id,
                    email,
                    password_hash AS "passwordHash",
                    created_at AS "createdAt"
                FROM users
                WHERE email = $1
                `,
                [GUEST_EMAIL]
            );

            let guest = result.rows[0];

            // 2. Create guest if it doesn't exist
            if (!guest) {
                const passwordHash = await bcrypt.hash(
                    "guest",
                    10
                );

                result = await pool.query<User>(
                    `
                    INSERT INTO users (
                        email,
                        password_hash
                    )
                    VALUES ($1, $2)
                    RETURNING
                        id,
                        email,
                        password_hash AS "passwordHash",
                        created_at AS "createdAt"
                    `,
                    [
                        GUEST_EMAIL,
                        passwordHash
                    ]
                );

                guest = result.rows[0];
            }

            // 3. Create JWT payload
            const payload: AuthPayload = {
                userId: guest!.id,
                email: guest!.email,
            };

            // 4. Access token
            const accessToken = jwt.sign(
                payload,
                process.env.ACCESS_TOKEN!,
                {
                    expiresIn: "15m",
                }
            );

            // 5. Refresh token
            const refreshToken = jwt.sign(
                payload,
                process.env.REFRESH_TOKEN!,
                {
                    expiresIn: "7d",
                }
            );

            // 6. Store refresh token
            refreshTokenSet.add(refreshToken);

            // 7. Send tokens to frontend
            return res.status(200).json({
                accessToken,
                refreshToken,
                user: guest!.email,
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error: "Internal server error",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
    });

    // =====================================================
    // SIGNUP
    // =====================================================

    app.post(
        "/signup",
        signupLimiter,
        validateBody(inputSchema),
        async (
            req: Request<{}, {}, Input>,
            res: Response
        ) => {
            try {
                const {
                    email,
                    password,
                } = req.body;

                const result = await pool.query<User>(`
                    SELECT id
                    FROM users
                    WHERE email = $1
                `, [email]);

                if (result.rows.length > 0) {
                    return res.status(409).json({
                        error: "Email is already registered",
                        code: "EMAIL_ALREADY_EXISTS",
                    });
                }

                const passwordHash =
                    await bcrypt.hash(password, 10);

                const newUser =
                    await pool.query<User>(`
                        INSERT INTO users (
                            email,
                            password_hash
                        )
                        VALUES ($1, $2)
                        RETURNING
                            id,
                            email,
                            password_hash AS "passwordHash",
                            created_at AS "createdAt"
                    `, [
                        email,
                        passwordHash,
                    ]);

                return res.status(201).json(
                    sanitizeUser(newUser.rows[0]!)
                );

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );


    // =====================================================
    // LOGIN
    // =====================================================

    app.post(
        "/login",
        loginLimiter,
        validateBody(inputSchema),
        async (
            req: Request<{}, {}, Input>,
            res: Response
        ) => {
            try {
                const {
                    email,
                    password,
                } = req.body;

                const result = await pool.query<User>(`
                    SELECT
                        id,
                        email,
                        password_hash AS "passwordHash",
                        created_at AS "createdAt"
                    FROM users
                    WHERE email = $1
                `, [email]);

                const userData = result.rows[0];

                if (!userData) {
                    return res.status(401).json({
                        error: "Invalid email or password",
                        code: "INVALID_CREDENTIALS",
                    });
                }

                const isMatch =
                    await bcrypt.compare(
                        password,
                        userData.passwordHash
                    );

                if (!isMatch) {
                    return res.status(401).json({
                        error: "Invalid email or password",
                        code: "INVALID_CREDENTIALS",
                    });
                }

                const payload: AuthPayload = {
                    userId: userData.id,
                    email: userData.email,
                };

                const accessToken = jwt.sign(
                    payload,
                    process.env.ACCESS_TOKEN!,
                    {
                        expiresIn: "15m",
                    }
                );

                const refreshToken = jwt.sign(
                    payload,
                    process.env.REFRESH_TOKEN!,
                    {
                        expiresIn: "7d",
                    }
                );

                refreshTokenSet.add(refreshToken);

                return res.json({
                    accessToken,
                    refreshToken,
                    user: userData.email,
                });

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );


    // =====================================================
    // REFRESH
    // =====================================================

    app.post(
        "/refresh",
        validateBody(refreshTokenSchema),
        (
            req: Request,
            res: Response
        ) => {
            const {
                refreshToken,
            } = req.body;

            if (!refreshTokenSet.has(refreshToken)) {
                return res.status(401).json({
                    error: "Invalid or expired refresh token",
                    code: "INVALID_REFRESH_TOKEN",
                });
            }

            try {
                const decodedData =
                    jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN!
                    ) as AuthPayload;

                // Rotate old refresh token
                refreshTokenSet.delete(refreshToken);

                const newAccessToken =
                    jwt.sign(
                        {
                            userId: decodedData.userId,
                            email: decodedData.email,
                        },
                        process.env.ACCESS_TOKEN!,
                        {
                            expiresIn: "15m",
                        }
                    );

                const newRefreshToken =
                    jwt.sign(
                        {
                            userId: decodedData.userId,
                            email: decodedData.email,
                        },
                        process.env.REFRESH_TOKEN!,
                        {
                            expiresIn: "7d",
                        }
                    );

                refreshTokenSet.add(newRefreshToken);

                return res.json({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                });

            } catch {
                return res.status(401).json({
                    error: "Invalid or expired refresh token",
                    code: "INVALID_REFRESH_TOKEN",
                });
            }
        }
    );


    // =====================================================
    // LOGOUT
    // =====================================================

    app.post(
        "/logout",
        validateBody(refreshTokenSchema),
        (
            req: Request,
            res: Response
        ) => {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    error: "Refresh token is required",
                });
            }

            refreshTokenSet.delete(refreshToken);

            return res.json({
                message: "Logged out successfully",
            });
        }
    );


    // =====================================================
    // GET TASKS
    // =====================================================

    app.get(
        "/tasks",
        requireAuth,
        async (
            req: Request,
            res: Response
        ) => {
            try {
                const result = await pool.query<Task>(`
                    SELECT *
                    FROM tasks
                    WHERE user_id = $1
                    ORDER BY id
                `, [
                    req.user!.userId,
                ]);

                const tasks = result.rows;

                const page =
                    Math.max(
                        1,
                        parseInt(
                            req.query.page as string
                        ) || 1
                    );

                const limit =
                    Math.min(
                        100,
                        parseInt(
                            req.query.limit as string
                        ) || 10
                    );

                const offset =
                    (page - 1) * limit;

                const pageTasks =
                    tasks.slice(
                        offset,
                        offset + limit
                    );

                const response:
                    PaginatedResponse<Task> = {
                    data: pageTasks,
                    page,
                    limit,
                    total: tasks.length,
                    totalPages:
                        Math.ceil(
                            tasks.length / limit
                        ),
                };

                return res.status(200).json(response);

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );


    // =====================================================
    // POST TASK
    // =====================================================

    app.post(
        "/tasks",
        requireAuth,
        validateBody(dataSchema),
        async (
            req: Request<{}, {}, TaskInput>,
            res: Response
        ) => {
            try {
                const {
                    title,
                    description,
                    status,
                } = req.body;

                const result =
                    await pool.query<Task>(`
                        INSERT INTO tasks (
                            title,
                            description,
                            status,
                            user_id
                        )
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                    `, [
                        title,
                        description,
                        status,
                        req.user!.userId,
                    ]);

                return res.status(201).json(
                    result.rows[0]
                );

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );


    // =====================================================
    // PUT TASK
    // =====================================================

    app.put(
        "/tasks/:id",
        requireAuth,
        validateBody(dataSchema),
        async (
            req: Request<
                { id: string },
                {},
                TaskInput
            >,
            res: Response
        ) => {
            try {
                const id =
                    Number(req.params.id);

                if (Number.isNaN(id)) {
                    return res.status(400).json({
                        error: "Invalid task ID",
                        code: "INVALID_TASK_ID",
                    });
                }

                const {
                    title,
                    description,
                    status,
                } = req.body;

                const result =
                    await pool.query<Task>(`
                        SELECT *
                        FROM tasks
                        WHERE id = $1
                    `, [id]);

                const task =
                    result.rows[0];

                if (!task) {
                    return res.status(404).json({
                        error: "Task not found",
                        code: "TASK_NOT_FOUND",
                    });
                }

                if (
                    task.user_id !==
                    req.user!.userId
                ) {
                    return res.status(403).json({
                        error: "You do not own this task",
                        code: "TASK_FORBIDDEN",
                    });
                }

                const updatedTask =
                    await pool.query<Task>(`
                        UPDATE tasks
                        SET
                            title = $1,
                            description = $2,
                            status = $3,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $4
                        AND user_id = $5
                        RETURNING *
                    `, [
                        title,
                        description,
                        status,
                        id,
                        req.user!.userId,
                    ]);

                return res.status(200).json(
                    updatedTask.rows[0]
                );

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );


    // =====================================================
    // DELETE TASK
    // =====================================================

    app.delete(
        "/tasks/:id",
        requireAuth,
        async (
            req: Request<{ id: string }>,
            res: Response
        ) => {
            try {
                const id =
                    Number(req.params.id);

                if (Number.isNaN(id)) {
                    return res.status(400).json({
                        error: "Invalid task ID",
                        code: "INVALID_TASK_ID",
                    });
                }

                const result =
                    await pool.query<Task>(`
                        SELECT *
                        FROM tasks
                        WHERE id = $1
                    `, [id]);

                const task =
                    result.rows[0];

                if (!task) {
                    return res.status(404).json({
                        error: "Task not found",
                        code: "TASK_NOT_FOUND",
                    });
                }

                if (
                    task.user_id !==
                    req.user!.userId
                ) {
                    return res.status(403).json({
                        error: "You do not own this task",
                        code: "TASK_FORBIDDEN",
                    });
                }

                await pool.query(`
                    DELETE FROM tasks
                    WHERE id = $1
                    AND user_id = $2
                `, [
                    id,
                    req.user!.userId,
                ]);

                return res.status(200).json({
                    message: "Task deleted successfully",
                });

            } catch (error) {
                console.error(error);

                return res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        }
    );

    app.get('/api/version', (req, res) => {
    res.json({ version: 'v1.0.1-ci-test', timestamp: new Date().toISOString() });
    });

    // =====================================================
    // 404
    // =====================================================

    app.use(
        (req: Request, res: Response) => {
            return res.status(404).json({
                error: `Route ${req.method} ${req.path} not found`,
                code: "ROUTE_NOT_FOUND",
            });
        }
    );


    // =====================================================
    // GLOBAL ERROR HANDLER
    // =====================================================

    app.use(
        (
            err: unknown,
            req: Request,
            res: Response,
            next: NextFunction
        ) => {
            console.error(err);

            return res.status(500).json({
                error: "Internal server error",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
    );


    // =====================================================
    // SERVER
    // =====================================================

    // app.listen(PORT, () => {
    //     console.log(
    //         `API running on http://localhost:${PORT}`
    //     );
    // });

    export default app;