import { useNavigate } from 'react-router-dom';
import { guest } from "../api/tasks";

const Home = () => {
    const navigate = useNavigate();

    const handleGuest = async () => {
    try {
        await guest();

        navigate("/tasks");

    } catch (error) {
        console.error(error);
    }
};

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tracking Your Life</h1>

            <h3 className={styles.subtitle}>
                Provide many tools that help you improve your life.
            </h3>

            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Options</h2>

                <ul className={styles.list}>
                    <li className={styles.item}>
                        <span className={styles.icon}>📝</span>
                        <span className={styles.text}>Tasks</span>
                    </li>

                    <li className={styles.item}>
                        <span className={styles.icon}>🎯</span>
                        <span className={styles.text}>Habits</span>
                    </li>

                    <li className={styles.item}>
                        <span className={styles.icon}>💰</span>
                        <span className={styles.text}>Finance</span>
                    </li>
                </ul>
            </div>

            <button onClick={handleGuest} className={styles.button}>
                Start
            </button>

            <button
                onClick={() => navigate("/login")}
                className={styles.loginButton}
            >
                Login
            </button>
        </div>
    )
}

const styles = {
    container: "mx-auto mt-12 max-w-4xl px-6 text-center",
    title: "mb-4 text-5xl font-extrabold text-gray-900",
    subtitle: "mx-auto mb-10 max-w-2xl text-lg text-gray-600",
    card: "rounded-xl border border-gray-200 bg-white p-8 shadow-lg",
    sectionTitle: "mb-6 text-2xl font-semibold text-gray-800",
    list: "space-y-4 text-left",
    item: "flex items-center gap-3 rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100",
    icon: "text-2xl",
    text: "font-medium",
    button: "mt-8 rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95",
    loginButton:
        "ml-10 mt-4 rounded-lg border border-blue-600 px-8 py-3 text-lg font-semibold text-blue-600 transition duration-200 hover:bg-blue-50 active:scale-95",
};

export default Home