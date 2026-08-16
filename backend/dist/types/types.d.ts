export interface Task {
    id: number;
    title: string;
    description: string;
    status: "Created" | "Doing" | "Completed";
    created_at: string;
    updated_at: string;
    user_id: number;
}
export interface TaskInput {
    title: string;
    description: string;
    status: "Created" | "Doing" | "Completed";
}
//# sourceMappingURL=types.d.ts.map