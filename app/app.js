const STORAGE_KEY = "bmad-symphony-todos";

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const todoTemplate = document.querySelector("#todo-item-template");
const clearCompletedButton = document.querySelector("#clear-completed");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const openCount = document.querySelector("#open-count");
const completedCount = document.querySelector("#completed-count");

/** @type {{ id: string, text: string, completed: boolean }[]} */
let todos = loadTodos();

render();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) {
    return;
  }

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });

  todoInput.value = "";
  persistAndRender();
});

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  persistAndRender();
});

todoList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".todo-checkbox");
  if (!checkbox) {
    return;
  }

  const item = checkbox.closest(".todo-item");
  const todoId = item?.dataset.todoId;
  if (!todoId) {
    return;
  }

  todos = todos.map((todo) =>
    todo.id === todoId ? { ...todo, completed: checkbox.checked } : todo
  );

  persistAndRender();
});

todoList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) {
    return;
  }

  const item = button.closest(".todo-item");
  const todoId = item?.dataset.todoId;
  if (!todoId) {
    return;
  }

  todos = todos.filter((todo) => todo.id !== todoId);
  persistAndRender();
});

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function render() {
  todoList.innerHTML = "";

  for (const todo of todos) {
    const fragment = todoTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const checkbox = fragment.querySelector(".todo-checkbox");
    const text = fragment.querySelector(".todo-text");

    item.dataset.todoId = todo.id;
    item.classList.toggle("is-complete", todo.completed);
    checkbox.checked = todo.completed;
    text.textContent = todo.text;

    todoList.append(fragment);
  }

  const completed = todos.filter((todo) => todo.completed).length;
  totalCount.textContent = String(todos.length);
  openCount.textContent = String(todos.length - completed);
  completedCount.textContent = String(completed);
  emptyState.hidden = todos.length > 0;
  clearCompletedButton.disabled = completed === 0;
}
