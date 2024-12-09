import React, {useEffect, useState} from "react";
import Papa from "papaparse";
import "./App.css";

interface CSVData {
    Day: string;

    [key: string]: string;
}

const App: React.FC = () => {
    const [data, setData] = useState<CSVData[]>([]);
    const [currentDate, setCurrentDate] = useState<string>("");
    const [currentTimeSlot, setCurrentTimeSlot] = useState<string>("");
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    const getTimeSlot = (hours: number, minutes: number): string => {
        if (hours >= 8 && hours < 10) return "Morning Session (08:00-10:00)";
        else if (hours >= 10 && hours < 12) return "Late Morning Session (10:00-12:00)";
        else if (hours >= 12 && hours < 14) return "Early Afternoon Session (12:00-14:00)";
        else if (hours >= 14 && hours < 16) return "Late Afternoon Session (14:00-16:00)";
        else if (hours >= 16 && hours < 18) return "Early Evening Session (16:00-18:00)";
        else if (hours >= 18 && hours < 20) return "Late Evening Session (18:00-20:00)";
        else return "";
    };

    useEffect(() => {
        fetch("/assets/csv/Revised_Learning_Timetable.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse<CSVData>(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setData(results.data);
                    },
                });
            });

        const timer = setInterval(() => {
            const now = new Date();
            const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];
            const fullDate = `${monthNames[now.getMonth()]} ${now.getDate()}`;
            setCurrentDate(fullDate);

            const hours = now.getHours();
            const minutes = now.getMinutes();
            const timeSlot = getTimeSlot(hours, minutes);
            setCurrentTimeSlot(timeSlot);
        }, 1000);

        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        return () => clearInterval(timer);
    }, []);

    const getDays = (startDate: Date, numDays: number) => {
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        return Array.from({length: numDays}, (_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            return `${monthNames[date.getMonth()]} ${date.getDate()}`;
        });
    };

    const daysToShow = getDays(new Date(), 3);

    const daysData = daysToShow.map((day) => ({
        day,
        tasks: data.find((task) => task.Day === day),
    }));

    const handleTaskComplete = (task: string) => {
        setCompletedTasks((prev) => (prev.includes(task) ? prev : [...prev, task]));
    };

    const isTaskCompleted = (task: string) => completedTasks.includes(task);

    return (
        <div className="app">
            <h1>Interactive Learning Timetable</h1>
            <div className="table-container">
                {daysData.map(({day, tasks}) => (
                    <div key={day} className="day-section">
                        <h2>{day}</h2>
                        {tasks ? (
                            <table>
                                <thead>
                                <tr>
                                    {Object.keys(tasks)
                                        .filter((key) => key !== "Day")
                                        .map((timeSlot, index) => (
                                            <th key={index} className="time-slot-header">
                                                {timeSlot}
                                            </th>
                                        ))}
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    {Object.entries(tasks)
                                        .filter(([key]) => key !== "Day")
                                        .map(([timeSlot, task], index) => {
                                            const [startTime, endTime] = timeSlot
                                                .split("(")[1]
                                                .replace(")", "")
                                                .split("-");
                                            return (
                                                <td
                                                    key={index}
                                                    className={`task-cell ${
                                                        day === currentDate && timeSlot === currentTimeSlot
                                                            ? "highlight"
                                                            : ""
                                                    }`}
                                                >
                                                    <div>
                                                        <input
                                                            type="checkbox"
                                                            onChange={() => handleTaskComplete(task)}
                                                            checked={isTaskCompleted(task)}
                                                        />
                                                        <br/>
                                                        <span
                                                            style={{
                                                                textDecoration: isTaskCompleted(task)
                                                                    ? "line-through"
                                                                    : "none",
                                                            }}
                                                        >
                                {task}
                              </span>
                                                        {day === currentDate && timeSlot === currentTimeSlot && (
                                                            <>
                                                                <TaskTimer
                                                                    startTime={startTime}
                                                                    endTime={endTime}
                                                                />
                                                                <ProgressBar
                                                                    startTime={startTime}
                                                                    endTime={endTime}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                </tr>
                                </tbody>
                            </table>
                        ) : (
                            <p>No tasks scheduled for {day}.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TaskTimer = ({startTime, endTime}: { startTime: string; endTime: string }) => {
    const [remainingTime, setRemainingTime] = useState("");

    useEffect(() => {
        const calculateRemainingTime = () => {
            const now = new Date();
            const start = new Date();
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            start.setHours(startHour, startMinute, 0, 0);
            const end = new Date(start);
            end.setHours(endHour, endMinute, 0, 0);

            if (now < start) {
                setRemainingTime("Starts soon!");
            } else if (now >= start && now <= end) {
                const diff = end.getTime() - now.getTime();
                const minutes = Math.floor(diff / 1000 / 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setRemainingTime(`${minutes}m ${seconds}s remaining`);
            } else {
                setRemainingTime("Task time is over!");
            }
        };

        const timer = setInterval(() => {
            calculateRemainingTime();
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, endTime]);

    return <p>{remainingTime}</p>;
};

export const ProgressBar = ({startTime, endTime}: { startTime: string; endTime: string }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date();
            const start = new Date();
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            start.setHours(startHour, startMinute, 0, 0);
            const end = new Date(start);
            end.setHours(endHour, endMinute, 0, 0);

            if (now >= start && now <= end) {
                const total = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                setProgress((elapsed / total) * 100);
            } else if (now > end) {
                setProgress(100);
            } else {
                setProgress(0);
            }
        };

        const timer = setInterval(calculateProgress, 1000);
        calculateProgress();

        return () => clearInterval(timer);
    }, [startTime, endTime]);

    return (
        <div className="progress-bar">
            <div style={{width: `${progress}%`}} className="progress"></div>
        </div>
    );
};

export default App;