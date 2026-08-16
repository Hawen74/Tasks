import { deleteTask } from '../api/tasks';
import type { Task, TaskInput } from '../types/types'
import textIcon from "./text.png";
import binIcon from "./bin.png"

interface TaskCardProps {
    reload: () => void;
    task: Task;
    setInput: (value: TaskInput) => void;
    setOpenForm: (value: boolean) => void,
    setMode: (value: "create" | "edit") => void
}

const styles = {
    actionGroup: "absolute right-0 top-0 flex items-center gap-2",

    editButton:
        "flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow transition hover:bg-blue-600 active:scale-95",

    Icon: "h-4 w-4",

    deleteButton:
        "flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow transition hover:bg-red-600 active:scale-95",
};

const TaskCard = ({
        reload,
        task,
        setInput,
        setOpenForm,
        setMode,
    }: TaskCardProps) => { // get object task itself

    const handleDelete = async () => {
        const confirm = window.confirm(`
                Delete ${task.title}?
            `);

        if (!confirm) return;

        try {
            await deleteTask(task.id);
            reload();
        } catch (err) {
            console.error(err);
        }
    }

    const handleEdit = async () => {    
        setInput({
            title: task.title,
            description: task.description,
            status: task.status,
        })

        setMode('edit');
        setOpenForm(true);
    }

    return (
        <div className="relative">
            <div className={styles.actionGroup}>
                <button
                    className={styles.editButton}
                    aria-label={`Edit ${task.title}`}
                    onClick={handleEdit}
                >
                    <img
                        src={textIcon}
                        alt="Edit"
                        className={styles.Icon}
                    />
                </button>

                <button
                    className={styles.deleteButton}
                    aria-label={`Delete ${task.title}`}
                    onClick={handleDelete}
                >
                    <img
                        src={binIcon}
                        alt="Delete"
                        className={styles.Icon}
                    />
                </button>
            </div>

            <h3 className="font-semibold text-lg">
                {task.title}
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                {task.description}
            </p>

            <p className="mt-3 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                {task.status}
            </p>
        </div>
    )
}

export default TaskCard