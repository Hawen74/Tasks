import { describe, it, expect, vi, beforeEach } from "vitest"
import request from "supertest"
import jwt from "jsonwebtoken"
import app from "./app.js"
import pool from "./db/database.js"

vi.mock("./db/database.js", () => ({
    default: {
        query: vi.fn(),
    },
}))

describe("Tasks API Endpoints", () => {
    const secret = "test-access-token-secrets";
    let mockToken: string;

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.ACCESS_TOKEN = secret

        mockToken = jwt.sign(
            { userId: 1, email: 'testuser@gmail.com' },
            secret
        )
    })

    // Test 1: Success case for GET /tasks
    it("GET /tasks - returns 200 and paginated tasks list when authenticated", async () => {
        const mockTasks = [
            { id: 1, title: "Task 1", description: "Desc 1", status: "Doing", user_id: 1 },
            { id: 2, title: "Task 2", description: "Desc 2", status: "Completed", user_id: 1 },
        ];

        (pool.query as any).mockResolvedValueOnce({ rows: mockTasks });

        const res = await request(app)
            .get("/tasks")
            .set("Authorization", `Bearer ${mockToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.total).toBe(2);
    });

    // Test 2: Error case (401 Unauthorized) for missing token
    it("GET /tasks - returns 401 when authorization token is missing", async () => {
        const res = await request(app).get("/tasks");

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("AUTH_TOKEN_MISSING");
    });

    // Test 3: Success case for POST /tasks
    it("POST /tasks - returns 201 and creates task when input is valid", async () => {
        const newTask = {
            id: 1,
            title: "New Task",
            description: "Task description",
            status: "Created",
            user_id: 1,
        };

        (pool.query as any).mockResolvedValueOnce({ rows: [newTask] });

        const res = await request(app)
            .post("/tasks")
            .set("Authorization", `Bearer ${mockToken}`)
            .send({
                title: "New Task",
                description: "Task description",
                status: "Created",
            });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("New Task");
    });

    // Test 4: Error case (400 Bad Request) for Zod validation failure
    it("POST /tasks - returns 400 when body fails Zod validation", async () => {
        const res = await request(app)
            .post("/tasks")
            .set("Authorization", `Bearer ${mockToken}`)
            .send({
                title: "Incomplete Task",
                // missing description and invalid status
                status: "INVALID_STATUS",
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    // Test 5: Error case (404 Not Found) for unknown route
    it("GET /unknown-route - returns 404 for undefined routes", async () => {
        const res = await request(app).get("/nonexistent-endpoint");

        expect(res.status).toBe(404);
        expect(res.body.code).toBe("ROUTE_NOT_FOUND");
    });
})