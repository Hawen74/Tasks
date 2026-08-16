import { useState } from "react";
import { login } from "../api/tasks";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const navigate = useNavigate();

    const styles = {
        page: "flex min-h-screen items-center justify-center bg-gray-100 px-4",

        card: "w-full max-w-md rounded-2xl bg-white p-8 shadow-xl",

        header: "mb-8 text-center",

        title: "text-3xl font-bold text-gray-800",

        subtitle: "mt-2 text-sm text-gray-500",

        form: "space-y-5",

        field: "",

        label: "mb-2 block text-sm font-medium text-gray-700",

        input:
            "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200",

        error:
            "mt-2 text-sm font-medium text-red-500",

        buttons: "mt-8 space-y-3",

        confirmButton:
            "w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]",

        signupButton:
            "w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]",
        backButton:
            "absolute left-6 top-6 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md active:scale-95",
    };

    const handleSubmit = async () => {
        setError("");

        try {
            const data = await login(email, password);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setEmail("");
            setPassword("");
            navigate("/tasks")

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Something went wrong."
                );
            } else {
                setError("Something went wrong.");
            }
        }
    };

    return (
        <div className={styles.page}>
            <button
                onClick={() => navigate("/")}
                className={styles.backButton}
            >
                ← Back
            </button>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>   
                        Welcome Back
                    </h1>

                    <p className={styles.subtitle}>
                        Login to continue to your account
                    </p>
                </div>

                {/* Form */}
                <div className={styles.form}>

                    {/* Email */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Enter your email..."
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter your password..."
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && (
                            <p className={styles.error}>
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className={styles.buttons}>

                    <button
                        className={styles.confirmButton}
                        onClick={handleSubmit}
                    >
                        Login
                    </button>

                    <button
                        className={styles.signupButton}
                        onClick={() => {
                            navigate("/signup")
                        }}
                    >
                        Don't have an account? Sign up
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Login;