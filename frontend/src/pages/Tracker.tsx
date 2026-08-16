import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTasks, guest, logout } from "../api/tasks";
import type { Task, TaskInput } from "../types/types";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";

const styles = {
  page: "min-h-screen bg-gray-100 p-6",

  header:
    "mb-6 flex items-center justify-between",

  button:
    "rounded-lg bg-gray-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-gray-700 active:scale-95",

  createButton:
    "rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-green-700 active:scale-95",

  board:
    "grid grid-cols-1 gap-6 md:grid-cols-3",

  column:
    "min-h-[300px] rounded-xl border p-5 shadow-md",

  title:
    "mb-4 border-b pb-3 text-xl font-bold text-gray-800",

  list:
    "space-y-3",

  item:
    "rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md",

  taskColumn:
    "bg-gray-200",

  doingColumn:
    "bg-yellow-100",

  completedColumn:
    "bg-green-100",
  userContainer:
    "flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm",

  userText:
    "text-sm font-medium text-gray-700",

  logoutButton:
    "rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95",
};

const Tracker = () => {
  const navigate = useNavigate();
  const initialInput: TaskInput = {
    title: "",
    description: "",
    status: "Created",
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [input, setInput] = useState<TaskInput>(initialInput);
  const storedUser = localStorage.getItem("user");
  const user = storedUser
    ? (() => {
      try {
        return JSON.parse(storedUser) as string;
      } catch {
        return storedUser;
      }
    })()
    : "Guest@gmail.com";
  const userName = user.split("@")[0];

  const fetchAllTasks = async () => {
    try {
      const data = await getAllTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const bootstrapTasks = async () => {
      if (!localStorage.getItem("accessToken")) {
        await guest();
      }

      await fetchAllTasks();
    };

    bootstrapTasks();
  }, []);

  const columns = [
    {
      title: "Task",
      className: styles.taskColumn,
      items: tasks.filter(
        (task) => task.status === "Created"
      ),
    },
    {
      title: "Doing",
      className: styles.doingColumn,
      items: tasks.filter(
        (task) => task.status === "Doing"
      ),
    },
    {
      title: "Completed",
      className: styles.completedColumn,
      items: tasks.filter(
        (task) => task.status === "Completed"
      ),
    },
  ];

  if (openForm) {
    return (
      <TaskForm
        setInput={setInput}
        input={input}
        setOpenForm={setOpenForm}
        mode={mode}
        reload={fetchAllTasks}
      />
    );
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
        navigate("/");
        return;
    }

    try {
        await logout(refreshToken);

        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        navigate("/");
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          onClick={() => navigate("/")}
          className={styles.button}
        >
          Home
        </button>

        <div className={styles.userContainer}>
          <p className={styles.userText}>
            User: {userName}
          </p>

          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <button
          onClick={() => {
            setMode("create");

            setInput({
              title: "",
              description: "",
              status: "Created",
            });

            setOpenForm(true);
          }}
          className={styles.createButton}
        >
          + Create Task
        </button>
      </div>

      <div className={styles.board}>
        {columns.map((column) => (
          <div
            key={column.title}
            className={`${styles.column} ${column.className}`}
          >
            <h2 className={styles.title}>
              {column.title}
            </h2>

            <ul className={styles.list}>
              {column.items.map((task) => (
                <li
                  key={task.id}
                  className={styles.item}
                >
                  <TaskCard
                    reload={fetchAllTasks}
                    task={task}
                    setInput={setInput}
                    setOpenForm={setOpenForm}
                    setMode={setMode}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};


export default Tracker;