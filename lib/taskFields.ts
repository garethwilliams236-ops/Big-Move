import { opts, type Field } from "@/components/EditDialog";

export const TASK_CATEGORIES = ["General", "Finance", "Selling", "Buying", "Legal", "Possessions", "Removals", "Storage", "Admin"];
export const OWNERS = ["Both", "Gareth", "Kristin"];

export const taskFields: Field[] = [
  { key: "title", label: "What", required: true },
  { key: "kind", label: "Type", type: "select", required: true, options: opts({ task: "Task", appointment: "Appointment" }), half: true },
  { key: "category", label: "Category", type: "select", required: true, options: opts(TASK_CATEGORIES), half: true },
  { key: "due_date", label: "Date", type: "date", half: true },
  { key: "due_time", label: "Time", type: "time", half: true },
  { key: "owner", label: "Who", type: "select", required: true, options: opts(OWNERS), half: true },
  { key: "priority", label: "Priority", type: "select", required: true, options: opts({ low: "Low", normal: "Normal", high: "High" }), half: true },
  { key: "status", label: "Status", type: "select", required: true, options: opts({ todo: "To do", doing: "In progress", done: "Done" }), half: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export const newTask = (date?: string) => ({
  title: "",
  kind: "task",
  category: "General",
  owner: "Both",
  priority: "normal",
  status: "todo",
  due_date: date ?? "",
});
