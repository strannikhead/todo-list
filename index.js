function createElement(tag, attributes = {}, children = [], callbacks = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (value == null) return;
        if (key === 'value') {
            element.value = value;
        } else if (key === 'checked') {
            element.checked = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    const appendChild = child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        }
    };
    Array.isArray(children) ? children.forEach(appendChild) : appendChild(children);

    callbacks.forEach(({event, handler}) => {
        element.addEventListener(event, handler);
    });

    return element;
}

class Component {
    constructor() {
        this._domNode = null;
    }

    getDomNode() {
        if (!this._domNode) {
            this._domNode = this.render();
        }
        return this._domNode;
    }
}

class AddTask extends Component {
    constructor({onAddTask, onInputChange, getInputValue}) {
        super();
        this.onAddTask = onAddTask;
        this.onInputChange = onInputChange;
        this.getInputValue = getInputValue;
    }

    render() {
        const input = createElement(
            'input',
            {type: 'text', placeholder: 'Задание', value: this.getInputValue()},
            [],
            [{event: 'input', handler: this.onInputChange}]
        );
        const button = createElement(
            'button',
            {},
            '+',
            [{event: 'click', handler: this.onAddTask}]
        );
        return createElement('div', {class: 'add-todo'}, [input, button]);
    }
}

class Task extends Component {
    constructor(task, onToggle, onDelete) {
        super();
        this.task = task;
        this.onToggle = onToggle;
        this.onDelete = onDelete;
        this.state = {confirm: false};
    }

    toggle = e => this.onToggle(this.task.id, e.target.checked);

    deleteClick = () => {
        if (!this.state.confirm) {
            this.state.confirm = true;
            this.update();
        } else {
            this.onDelete(this.task.id);
        }
    };

    update() {
        const newNode = this.render();
        this._domNode.replaceWith(newNode);
        this._domNode = newNode;
    }

    render() {
        const checkbox = createElement(
            'input',
            {type: 'checkbox', checked: this.task.completed},
            [],
            [{event: 'change', handler: this.toggle}]
        );
        const label = createElement('label', {}, this.task.text);
        if (this.task.completed) label.style.color = 'grey';

        const deleteBtn = createElement(
            'button',
            {},
            this.state.confirm ? '🗑️ Уверен?' : '🗑️',
            [{event: 'click', handler: this.deleteClick}]
        );
        if (this.state.confirm) {
            deleteBtn.style.backgroundColor = 'red';
            deleteBtn.style.color = 'white';
        }

        return createElement('li', {}, [checkbox, label, deleteBtn]);
    }
}

class TodoList extends Component {
    constructor() {
        super();
        this.state = {tasks: [], nextId: 1, newTaskText: ''};
        this.taskComponents = {};
        this.addTaskComp = new AddTask({
            onAddTask: this.onAddTask,
            onInputChange: this.onAddInputChange,
            getInputValue: () => this.state.newTaskText
        });
    }

    getDomNode() {
        if (!this._domNode) {
            this._domNode = this.render();
            this.listNode = this._domNode.querySelector('ul');
        }
        return this._domNode;
    }

    updateTasks() {
        const newList = createElement('ul', {},
            this.state.tasks.map(task => {
                let comp = this.taskComponents[task.id];
                if (!comp) comp = new Task(task, this.toggleTask, this.deleteTask);
                return comp.getDomNode();
            })
        );
        this.listNode.replaceWith(newList);
        this.listNode = newList;
    }

    onAddInputChange = e => {
        this.state.newTaskText = e.target.value;
        const inputEl = this.addTaskComp._domNode.querySelector('input');
        inputEl.value = this.state.newTaskText;
    };

    onAddTask = () => {
        const text = this.state.newTaskText.trim();
        if (!text) return;
        const id = this.state.nextId++;
        const task = {id, text, completed: false};
        this.state.tasks.push(task);
        this.taskComponents[id] = new Task(task, this.toggleTask, this.deleteTask);
        this.state.newTaskText = '';
        const inputEl = this.addTaskComp._domNode.querySelector('input');
        inputEl.value = '';
        this.updateTasks();
    };

    toggleTask = (id, completed) => {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) task.completed = completed;
        this.taskComponents[id].update();
    };

    deleteTask = id => {
        delete this.taskComponents[id];
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.updateTasks();
    };

    render() {
        const tasksNodes = this.state.tasks.map(task => {
            let comp = this.taskComponents[task.id];
            if (!comp) comp = new Task(task, this.toggleTask, this.deleteTask);
            return comp.getDomNode();
        });

        return createElement('div', {class: 'todo-list'}, [
            createElement('h1', {}, 'TODO List'),
            this.addTaskComp.getDomNode(),
            createElement('ul', {}, tasksNodes)
        ]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(new TodoList().getDomNode());
});