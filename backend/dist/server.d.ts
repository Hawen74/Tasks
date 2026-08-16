interface AuthPayload {
    userId: number;
    email: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export {};
//# sourceMappingURL=server.d.ts.map