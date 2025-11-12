// JavaScript para funcionalidade da lista de tarefas (modo escuro, navegação, armazenamento, etc.)

const themeToggle = document.getElementById('themeToggle');
const syncStatus = document.getElementById('syncStatus');
const body = document.body;
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const closeModalBtn = document.getElementById('closeModal');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskCategorySelect = document.getElementById('taskCategory');
const taskDueDateInput = document.getElementById('taskDueDate');
const modalTitle = document.getElementById('modalTitle');
const tasksContainer = document.getElementById('tasksContainer');
const completedContainer = document.getElementById('completedContainer');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const priorityFilter = document.getElementById('priorityFilter');
const categoryFilter = document.getElementById('categoryFilter');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const quickTaskInput = document.getElementById('quickTaskInput');
const quickAddBtn = document.getElementById('quickAddBtn');

let currentView = 'home';
let currentTaskId = null;

// Load theme preference and initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize sync status
    syncStatus.className = 'sync-status offline';
    syncStatus.title = 'Iniciando...';
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        updateFavicon(savedTheme);
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.textContent = 'Modo Escuro';
        updateFavicon('light');
    }
    
    // Load tasks from server
    await loadTasksFromServer();
    updateStats();
    renderTasks();
    showView('home');
});

// Toggle theme
themeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = 'Modo Escuro';
        updateFavicon('light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = 'Modo Claro';
        updateFavicon('dark');
    }
});

// Navigation
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const viewId = button.dataset.view;
        showView(viewId);
    });
});

function showView(viewId) {
    views.forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.view === viewId) {
            button.classList.add('active');
        }
    });

    currentView = viewId;
    if (viewId === 'home') {
        updateStats();
    } else if (viewId === 'tasks') {
        renderTasks();
    } else if (viewId === 'completed') {
        renderCompletedTasks();
    }
}

// --- Task Management ---


// Detect environment and set API base URL
const API_BASE = '/api'; // Sempre usar o backend Flask local


async function loadTasksFromServer() {
    try {
        syncStatus.className = 'sync-status saving';
        syncStatus.title = 'Carregando dados do servidor...';
        const response = await fetch(`${API_BASE}/entries`);
        if (!response.ok) throw new Error('Falha ao carregar tarefas');
        const entries = await response.json();
        // Converter entradas do backend para tarefas do frontend
        const tasks = entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            description: entry.content,
            date: entry.date,
            completed: entry.completed || false,
            priority: entry.priority || 'medium',
            category: entry.category || 'personal',
            dueDate: entry.dueDate || '',
            createdAt: entry.createdAt || entry.date,
            updatedAt: entry.updatedAt || entry.date
        }));
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        syncStatus.className = 'sync-status connected';
        syncStatus.title = 'Conectado ao servidor - dados sincronizados';
        return tasks;
    } catch (error) {
        console.error('Erro ao carregar do servidor, usando localStorage:', error);
        syncStatus.className = 'sync-status offline';
        syncStatus.title = 'Offline - usando dados locais';
        return JSON.parse(localStorage.getItem('todoTasks')) || [];
    }
}


async function saveTasksToServer(tasks) {
    try {
        syncStatus.className = 'sync-status saving';
        syncStatus.title = 'Salvando no servidor...';
        // Converter tarefas do frontend para formato de entradas do backend
        const entries = tasks.map(task => ({
            id: task.id,
            date: task.date || new Date().toISOString().slice(0, 10),
            title: task.title,
            content: task.description || '',
            completed: task.completed || false,
            priority: task.priority || 'medium',
            category: task.category || 'personal',
            dueDate: task.dueDate || '',
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || new Date().toISOString()
        }));
        const response = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entries)
        });
        if (!response.ok) throw new Error('Falha ao salvar tarefas');
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        updateStats();
        syncStatus.className = 'sync-status connected';
        syncStatus.title = 'Salvo no servidor com sucesso';
        return true;
    } catch (error) {
        console.error('Erro ao salvar no servidor, usando localStorage:', error);
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        updateStats();
        syncStatus.className = 'sync-status error';
        syncStatus.title = 'Erro ao salvar no servidor - dados salvos localmente';
        return false;
    }
}

function getTasks() {
    return JSON.parse(localStorage.getItem('todoTasks')) || [];
}

function saveTasks(tasks) {
    // Save to server asynchronously
    saveTasksToServer(tasks);
}

function updateStats() {
    const tasks = getTasks();
    const completedTasks = tasks.filter(task => task.completed);
    const pendingTasks = tasks.filter(task => !task.completed);
    
    totalTasksSpan.textContent = tasks.length;
    completedTasksSpan.textContent = completedTasks.length;
    pendingTasksSpan.textContent = pendingTasks.length;
}

// Generate task card HTML
function createTaskCard(task) {
    // Verificar se a tarefa está atrasada usando comparação correta de datas
    let isOverdue = false;
    if (task.dueDate && !task.completed) {
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        isOverdue = dueDateOnly < todayOnly;
    }
    
    const priorityClass = task.priority || 'medium';
    const categoryClass = task.category || 'personal';
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-priority priority-${priorityClass}"></div>
                    <div class="task-category category-${categoryClass}">${getCategoryLabel(task.category)}</div>
                </div>
                <div class="task-right">
                    ${task.dueDate ? `<div class="task-due-date">${formatDate(task.dueDate)}</div>` : ''}
                </div>
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="task-edit-btn" title="Editar tarefa">✏️</button>
                <button class="task-delete-btn" title="Excluir tarefa">🗑️</button>
            </div>
        </div>
    `;
}

// Render Tasks
function renderTasks() {
    const tasks = getTasks().filter(task => !task.completed);
    const filteredTasks = filterTasks(tasks);
    
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma tarefa pendente. Adicione uma nova tarefa!</p>';
        return;
    }
    
    // Sort tasks by priority and due date
    const sortedTasks = filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
            return bPriority - aPriority;
        }
        
        if (a.dueDate && b.dueDate) {
            // Comparar datas corretamente
            const [yearA, monthA, dayA] = a.dueDate.split('-').map(Number);
            const [yearB, monthB, dayB] = b.dueDate.split('-').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB;
        }
        
        return a.dueDate ? -1 : 1;
    });
    
    sortedTasks.forEach(task => {
        tasksContainer.innerHTML += createTaskCard(task);
    });
    
    attachTaskEventListeners();
}

// Render Completed Tasks
function renderCompletedTasks() {
    const tasks = getTasks().filter(task => task.completed);
    
    completedContainer.innerHTML = '';
    
    if (tasks.length === 0) {
        completedContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma tarefa concluída ainda.</p>';
        return;
    }
    
    // Sort by completion date (newest first)
    const sortedTasks = tasks.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    
    sortedTasks.forEach(task => {
        completedContainer.innerHTML += createTaskCard(task);
    });
    
    attachTaskEventListeners();
}

// Filter tasks based on current filters
function filterTasks(tasks) {
    const priorityFilter = document.getElementById('priorityFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    return tasks.filter(task => {
        const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
        const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
        return priorityMatch && categoryMatch;
    });
}

// Attach event listeners to task cards
function attachTaskEventListeners() {
    // Checkbox listeners
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskCard = e.target.closest('.task-card');
            const taskId = taskCard.dataset.taskId;
            toggleTaskCompletion(taskId);
        });
    });
    
    // Edit button listeners
    document.querySelectorAll('.task-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskCard = e.target.closest('.task-card');
            const taskId = taskCard.dataset.taskId;
            openTaskModal(taskId);
        });
    });
    
    // Delete button listeners
    document.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskCard = e.target.closest('.task-card');
            const taskId = taskCard.dataset.taskId;
            deleteTask(taskId);
        });
    });
}

// Toggle task completion
function toggleTaskCompletion(taskId) {
    let tasks = getTasks();
    let wasCompleted = false;
    
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            wasCompleted = task.completed;
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
        }
        return task;
    });
    
    saveTasks(tasks);
    
    // Show celebration effect if task was just completed
    if (!wasCompleted) {
        showTaskCompletionEffect(taskId);
    }
    
    // Re-render current view
    if (currentView === 'tasks') {
        renderTasks();
    } else if (currentView === 'completed') {
        renderCompletedTasks();
    }
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        let tasks = getTasks();
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);
        
        // Re-render current view
        if (currentView === 'tasks') {
            renderTasks();
        } else if (currentView === 'completed') {
            renderCompletedTasks();
        } else if (currentView === 'search') {
            performSearch();
        }
    }
}

// Search Functionality
searchInput.addEventListener('input', performSearch);

function performSearch() {
    const query = searchInput.value.toLowerCase();
    const tasks = getTasks();
    const filteredResults = tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.category.toLowerCase().includes(query)
    ).sort((a, b) => {
        // Incomplete tasks first, then by priority
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        return bPriority - aPriority;
    });

    searchResults.innerHTML = '';
    if (query === '') {
        searchResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Digite algo para pesquisar suas tarefas.</p>';
        return;
    }
    if (filteredResults.length === 0) {
        searchResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum resultado encontrado.</p>';
        return;
    }

    filteredResults.forEach(task => {
        searchResults.innerHTML += createTaskCard(task);
    });
    
    attachTaskEventListeners();
}

// Open Task Modal
function openTaskModal(taskId = null) {
    currentTaskId = taskId;
    if (taskId) {
        modalTitle.textContent = 'Editar Tarefa';
        deleteTaskBtn.style.display = 'inline-block';
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            taskPrioritySelect.value = task.priority || 'medium';
            taskCategorySelect.value = task.category || 'personal';
            taskDueDateInput.value = task.dueDate || '';
        }
    } else {
        modalTitle.textContent = 'Nova Tarefa';
        deleteTaskBtn.style.display = 'none';
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskPrioritySelect.value = 'medium';
        taskCategorySelect.value = 'personal';
        taskDueDateInput.value = '';
    }
    taskModal.classList.add('active');
    taskTitleInput.focus();
}

// Close Task Modal
closeModalBtn.addEventListener('click', () => {
    taskModal.classList.remove('active');
    currentTaskId = null;
});

// Save Task
saveTaskBtn.addEventListener('click', () => {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPrioritySelect.value;
    const category = taskCategorySelect.value;
    const dueDate = taskDueDateInput.value;

    if (!title) {
        alert('O título da tarefa é obrigatório!');
        taskTitleInput.focus();
        return;
    }

    let tasks = getTasks();

    if (currentTaskId) {
        // Update existing task
        tasks = tasks.map(task =>
            task.id === currentTaskId ? { 
                ...task, 
                title, 
                description, 
                priority, 
                category, 
                dueDate,
                updatedAt: new Date().toISOString()
            } : task
        );
    } else {
        // Add new task
        const newTask = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            title,
            description,
            priority,
            category,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }
    
    saveTasks(tasks);
    taskModal.classList.remove('active');
    currentTaskId = null;

    // Re-render based on current view
    if (currentView === 'tasks') {
        renderTasks();
    } else if (currentView === 'completed') {
        renderCompletedTasks();
    } else if (currentView === 'search') {
        performSearch();
    } else {
        showView('home');
    }
});

// Delete Task from Modal
deleteTaskBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        deleteTask(currentTaskId);
        taskModal.classList.remove('active');
        currentTaskId = null;
    }
});

// Quick Add Task
quickAddBtn.addEventListener('click', addQuickTask);
quickTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addQuickTask();
    }
});

function addQuickTask() {
    const title = quickTaskInput.value.trim();
    if (!title) return;
    
    const newTask = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        title,
        description: '',
        priority: 'medium',
        category: 'personal',
        dueDate: '',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    let tasks = getTasks();
    tasks.push(newTask);
    saveTasks(tasks);
    
    quickTaskInput.value = '';
    
    if (currentView === 'tasks') {
        renderTasks();
    }
}

// Filter event listeners
priorityFilter.addEventListener('change', () => {
    if (currentView === 'tasks') {
        renderTasks();
    }
});

categoryFilter.addEventListener('change', () => {
    if (currentView === 'tasks') {
        renderTasks();
    }
});

// Clear completed tasks
clearCompletedBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir todas as tarefas concluídas?')) {
        let tasks = getTasks();
        tasks = tasks.filter(task => !task.completed);
        saveTasks(tasks);
        renderCompletedTasks();
    }
});

// Add Task button
addTaskBtn.addEventListener('click', () => openTaskModal());

// Utility functions
function getCategoryLabel(category) {
    const labels = {
        work: 'Trabalho',
        personal: 'Pessoal',
        study: 'Estudos',
        health: 'Saúde',
        shopping: 'Compras',
        other: 'Outros'
    };
    return labels[category] || 'Pessoal';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    // Criar a data usando componentes separados para evitar problemas de fuso horário
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month é 0-indexed no JavaScript
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Comparar apenas a data (sem horário) para evitar problemas de fuso horário
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Hoje';
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
        return 'Amanhã';
    } else {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }
}

// Function to update favicon based on theme
function updateFavicon(theme) {
    const favicon = document.querySelector('link[rel="icon"]');
    const alternateFavicon = document.querySelector('link[rel="alternate icon"]');
    const maskIcon = document.querySelector('link[rel="mask-icon"]');
    
    // Adiciona um timestamp para forçar o recarregamento do favicon
    const timestamp = new Date().getTime();
    
    if (theme === 'dark') {
        if (favicon) favicon.href = `black.svg?t=${timestamp}`;
        if (alternateFavicon) alternateFavicon.href = `black.svg?t=${timestamp}`;
        if (maskIcon) maskIcon.href = `black.svg?t=${timestamp}`;
    } else {
        if (favicon) favicon.href = `favicon.svg?t=${timestamp}`;
        if (alternateFavicon) alternateFavicon.href = `favicon.svg?t=${timestamp}`;
        if (maskIcon) maskIcon.href = `favicon.svg?t=${timestamp}`;
    }
}

// Function to show task completion celebration effect
function showTaskCompletionEffect(taskId) {
    // Find the task card
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskCard) return;
    
    // Add ripple effect to the task card
    taskCard.classList.add('task-complete-effect');
    setTimeout(() => {
        taskCard.classList.remove('task-complete-effect');
    }, 600);
    
    // Add bounce effect
    taskCard.classList.add('task-complete-bounce');
    setTimeout(() => {
        taskCard.classList.remove('task-complete-bounce');
    }, 500);
    
    // Play completion sound
    playCompletionSound();
    
    // Create confetti effect
    createConfettiEffect();
    
    // Show completion toast
    showCompletionToast();
}

// Sound effect for task completion
function playCompletionSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
        oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6 note
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silently fail if audio is not supported
    }
}

// Function to create confetti animation
function createConfettiEffect() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create multiple confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti container after animation
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 4000);
}

// Function to show completion toast notification
function showCompletionToast() {
    // Remove any existing toast
    const existingToast = document.querySelector('.completion-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'completion-toast';
    
    const messages = [
        'Tarefa concluída! 🎉',
        'Parabéns! Mais uma conquista! ✨',
        'Excelente trabalho! 🌟',
        'Missão cumprida! 🚀',
        'Você está arrasando! 💪'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    toast.innerHTML = `
        <div class="checkmark-icon">
            <svg viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4"/>
            </svg>
        </div>
        <span class="celebration-message">${randomMessage}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
