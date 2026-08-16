import type { Task, TaskInput } from "../types/types";
import { createTask, updateTask } from "../api/tasks";

interface TasksProps {
    task?: Task
    setInput: (value: TaskInput) => void;
    input: TaskInput;
    setOpenForm: (value: boolean) => void;
    mode: 'create' | 'edit';
    reload: () => void;
}

const TaskForm = ({
    task,
    setInput,
    input,
    setOpenForm,
    mode,
    reload
}: TasksProps) => {

    const handleSubmit = async () => {
        try {
            if (mode === "create") {
                await createTask(input)
            } else {
            await updateTask(task!.id, input)
            }

            reload();
            setOpenForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {mode === "create" ? "Create Task" : "Edit Task"}
                    </h1>

                    <button
                        className={styles.cancel}
                        onClick={() => setOpenForm(false)}
                    >
                        Cancel
                    </button>
                </div>

                <label className={styles.label}>
                    Title
                </label>

                <input
                    className={styles.input}
                    value={input.title}
                    onChange={(e) =>
                        setInput({
                            ...input,
                            title: e.target.value,
                        })
                    }
                    placeholder="Type here..."
                />

                <label className={styles.label}>
                    Description
                </label>

                <textarea
                    className={styles.input}
                    value={input.description}
                    onChange={(e) =>
                        setInput({
                            ...input,
                            description: e.target.value,
                        })
                    }
                    placeholder="Type here..."
                />

                <label className={styles.label}>
                    Status
                </label>

                <select
                    className={styles.select}
                    value={input.status}
                    onChange={(e) =>
                        setInput({
                            ...input,
                            status: e.target.value as TaskInput["status"],
                        })
                    }
                >
                    <option value="Created">
                        Created
                    </option>
                    <option value="Doing">
                        Doing
                    </option>
                    <option value="Completed">
                        Completed
                    </option>
                </select>

                <button
                    className={styles.button}
                    onClick={handleSubmit}
                >
                    {mode === "create" ? "Create Task" : "Edit Task"}
                </button>
            </div>
        </div>
    );
};

const styles = {
    page:
        "min-h-screen bg-gray-100 p-6",

    container:
        "mx-auto mt-10 max-w-lg rounded-2xl bg-white p-8 shadow-xl",

    header:
        "mb-6 flex items-center justify-between",

    title:
        "text-2xl font-bold text-gray-800",

    label:
        "mb-2 block font-semibold text-gray-700",

    input:
        "mb-5 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200",

    select:
        "mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200",

    button:
        "w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700 active:scale-95",

    cancel:
        "rounded-lg bg-red-500 px-5 py-2 font-semibold text-white transition hover:bg-red-600",

};

export default TaskForm;