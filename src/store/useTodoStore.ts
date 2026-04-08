import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    created_at: string;
}

interface TodoState {
    todos: TodoItem[];
    addTodo: (todo: TodoItem) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    editTodo: (id: string, text: string) => void;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set) => ({
            todos: [],
            addTodo: (todo) =>
                set((state) => ({ todos: [todo, ...state.todos] })),
            toggleTodo: (id) =>
                set((state) => ({
                    todos: state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
                })),
            deleteTodo: (id) =>
                set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
            editTodo: (id, text) =>
                set((state) => ({
                    todos: state.todos.map((t) => (t.id === id ? { ...t, text } : t)),
                })),
        }),
        {
            name: 'noma-todo-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
