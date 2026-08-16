import axios from "axios";
import type { Task, TaskInput } from "../types/types";
    
interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const api = axios.create({
    baseURL: "http://localhost:3000",
});

// Automatically attach access token to protected requests
api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

// ====================
// TASK API
// ====================

export async function getAllTasks(): Promise<Task[]> {
    const res = await api.get<PaginatedResponse<Task>>("/tasks");
    return res.data.data;
}

export async function createTask(task: TaskInput): Promise<Task> {
    const res = await api.post<Task>("/tasks", task);
    return res.data;
}

export async function updateTask(
    id: number,
    task: TaskInput
): Promise<Task> {
    const res = await api.put<Task>(`/tasks/${id}`, task);
    return res.data;
}

export async function deleteTask(id: number): Promise<Task> {
    const res = await api.delete<Task>(`/tasks/${id}`);
    return res.data;
}

// ====================
// AUTH API
// ====================

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user?: string;
}

export async function signup(
    email: string,
    password: string
) {
    const res = await api.post("/signup", {
        email,
        password,
    });

    return res.data;
}

export async function login(
    email: string,
    password: string
): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/login", {
        email,
        password,
    });

    // Save tokens after successful login
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    localStorage.setItem("user", res.data.user!)

    return res.data;
}

export async function refresh(
    refreshToken: string
): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/refresh", {
        refreshToken,
    });

    // Replace old tokens with rotated tokens
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);

    return res.data;
}

export async function logout(refreshToken: string) {
    const res = await api.post("/logout", {
        refreshToken,
    });

    // Remove tokens from browser
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    return res.data;
}

export async function guest() {
    const res = await api.post("/guest");

    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    localStorage.setItem("user", res.data.user)
    
    return res.data;
}