// ============ ГЛОБАЛЬНЫЕ ДАННЫЕ (массивы и объекты) ============
const STORAGE_KEY = 'registered_users';
let users = []; // массив объектов пользователей
let clockIntervalId = null;

// ============ РЕГУЛЯРНЫЕ ВЫРАЖЕНИЯ ============
const regex = {
    name: /^[a-zA-Zа-яА-ЯёЁ\s-]{2,30}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
    // Для генератора пароля
    upper: /[A-Z]/g,
    lower: /[a-z]/g,
    digit: /[0-9]/g,
    special: /[!@#$%^&*]/g
};

// ============ УТИЛИТЫ ============
function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

// Класс "элемент + класс" через classList
function setState(input, errorEl, message) {
    input.classList.remove('error', 'valid');
    if (message) {
        input.classList.add('error');
        errorEl.textContent = message;
        return false;
    }
    input.classList.add('valid');
    errorEl.textContent = '';
    return true;
}

// ============ LOCALSTORAGE ============
function loadUsers() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        users = raw ? JSON.parse(raw) : [];
    } catch (e) {
        users = [];
    }
}

function saveUsers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ============ ЧАСЫ (setInterval) ============
function startClock(clockEl) {
    const tick = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleString('ru-RU');
    };
    tick();
    if (clockIntervalId) clearInterval(clockIntervalId);
    clockIntervalId = setInterval(tick, 1000);
}

// ============ ДИНАМИЧЕСКОЕ СОЗДАНИЕ ЭЛЕМЕНТОВ ============
function buildForm() {
    const form = createEl('form', 'registration-form');
    form.id = 'registrationForm';
    form.noValidate = true;

    form.appendChild(createEl('h2', null, 'Регистрация'));

    const clockEl = createEl('div', 'clock');
    clockEl.id = 'clock';
    form.appendChild(clockEl);
    startClock(clockEl);

    // Поля
    const fields = [
        { id: 'name', label: 'Имя', type: 'text', placeholder: 'Введите имя' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'example@mail.com' },
        { id: 'password', label: 'Пароль', type: 'password', placeholder: 'Минимум 8 символов' },
        { id: 'confirmPassword', label: 'Подтверждение пароля', type: 'password', placeholder: 'Повторите пароль' }
    ];

    fields.forEach(field => {
        const group = createEl('div', 'form-group');

        const label = createEl('label', null, field.label);
        label.setAttribute('for', field.id);

        let input;
        if (field.id === 'password') {
            // Обертка с кнопкой генерации пароля
            const wrapper = createEl('div', 'password-wrapper');

            input = createEl('input');
            input.type = field.type;
            input.id = field.id;
            input.placeholder = field.placeholder;

            const genBtn = createEl('button', 'btn btn-secondary', '🎲');
            genBtn.type = 'button';
            genBtn.title = 'Сгенерировать пароль';

            wrapper.appendChild(input);
            wrapper.appendChild(genBtn);
            group.appendChild(label);
            group.appendChild(wrapper);

            // Обработчик click на генератор
            genBtn.addEventListener('click', () => {
                const pwd = generatePassword(12);
                document.getElementById('password').value = pwd;
                document.getElementById('confirmPassword').value = pwd;
                validatePassword();
                validateConfirmPassword();
            });
        } else {
            input = createEl('input');
            input.type = field.type;
            input.id = field.id;
            input.placeholder = field.placeholder;
            group.appendChild(label);
            group.appendChild(input);
        }const error = createEl('span', 'error-message');
        error.id = field.id + 'Error';
        group.appendChild(error);

        form.appendChild(group);
    });

    const submitBtn = createEl('button', 'btn btn-primary', 'Зарегистрироваться');
    submitBtn.type = 'submit';
    form.appendChild(submitBtn);

    const success = createEl('div', 'success-message');
    success.id = 'successMessage';
    form.appendChild(success);

    return form;
}

// ============ ГЕНЕРАТОР ПАРОЛЯ (регулярки + циклы + массивы) ============
function generatePassword(length) {
    const chars = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        digit: '0123456789',
        special: '!@#$%^&*'
    };
    const allChars = Object.values(chars).join('');
    let password = '';

    // Гарантируем наличие всех типов символов (проходим по ключам объекта)
    for (const key in chars) {
        const arr = chars[key].split('');
        password += arr[Math.floor(Math.random() * arr.length)];
    }

    // Добиваем до нужной длины
    while (password.length < length) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Перемешивание
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    // Проверка через регулярки, что все типы присутствуют (если вдруг что-то потерялось при перемешивании)
    if (!regex.upper.test(password) || !regex.lower.test(password) ||
        !regex.digit.test(password) || !regex.special.test(password)) {
        return generatePassword(length);
    }
    return password;
}

// ============ ВАЛИДАЦИЯ ============
function validateName() {
    const input = document.getElementById('name');
    const err = document.getElementById('nameError');
    const v = input.value.trim();
    let msg = '';
    if (!v) msg = 'Поле не может быть пустым';
    else if (v.length < 2) msg = 'Имя должно содержать минимум 2 символа';
    else if (!regex.name.test(v)) msg = 'Только буквы, пробел и дефис (2–30)';
    return setState(input, err, msg);
}

function validateEmail() {
    const input = document.getElementById('email');
    const err = document.getElementById('emailError');
    const v = input.value.trim();
    let msg = '';
    if (!v) msg = 'Поле не может быть пустым';
    else if (!regex.email.test(v)) msg = 'Введите корректный email';
    else if (users.some(u => u.email === v)) msg = 'Этот email уже зарегистрирован';
    return setState(input, err, msg);
}

function validatePassword() {
    const input = document.getElementById('password');
    const err = document.getElementById('passwordError');
    const v = input.value;
    let msg = '';
    if (!v) msg = 'Поле не может быть пустым';
    else if (v.length < 8) msg = 'Минимум 8 символов';
    else if (!regex.password.test(v)) msg = 'Нужны минимум 1 буква и 1 цифра';
    return setState(input, err, msg);
}

function validateConfirmPassword() {
    const input = document.getElementById('confirmPassword');
    const err = document.getElementById('confirmPasswordError');
    const pwd = document.getElementById('password').value;
    const v = input.value;
    let msg = '';
    if (!v) msg = 'Поле не может быть пустым';
    else if (v !== pwd) msg = 'Пароли не совпадают';
    return setState(input, err, msg);
}

// ============ СПИСОК ПОЛЬЗОВАТЕЛЕЙ ============
function renderUsers(listContainer) {
    listContainer.innerHTML = '';
    if (users.length === 0) {
        const empty = createEl('li', 'empty-list', 'Пока нет зарегистрированных пользователей');
        listContainer.appendChild(empty);
        return;
    }

    // Перебираем массив users через forEach
    users.forEach(user => {
        const li = createEl('li', 'user-item');

        const info = createEl('div', 'user-info');
        const nameEl = createEl('div', 'user-name', user.name);
        const dateBadge = createEl('span', 'badge', user.date);
        nameEl.appendChild(dateBadge);
        const emailEl = createEl('div', 'user-email', user.email);info.appendChild(nameEl);
        info.appendChild(emailEl);

        const deleteBtn = createEl('button', 'btn btn-danger', 'Удалить');
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
            // Удаление через filter (работа с массивами)
            users = users.filter(u => u.email !== user.email);
            saveUsers();
            renderUsers(listContainer);
        });

        li.appendChild(info);
        li.appendChild(deleteBtn);
        listContainer.appendChild(li);
    });
}

// ============ СБОРКА ПРИЛОЖЕНИЯ ============
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    const app = document.getElementById('app');
    const container = createEl('div', 'container');

    // Левая карточка — форма
    const formCard = createEl('div', 'card');
    const form = buildForm();
    formCard.appendChild(form);

    // Правая карточка — список
    const listCard = createEl('div', 'card');
    listCard.appendChild(createEl('h2', null, 'Зарегистрированные пользователи'));
    const usersList = createEl('ul', 'users-list');
    usersList.id = 'usersList';
    listCard.appendChild(usersList);

    container.appendChild(formCard);
    container.appendChild(listCard);
    app.appendChild(container);

    renderUsers(usersList);

    // ---- Обработчики ввода (input и blur) ----
    ['name', 'email', 'password', 'confirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('blur', () => {
            if (id === 'name') validateName();
            if (id === 'email') validateEmail();
            if (id === 'password') validatePassword();
            if (id === 'confirmPassword') validateConfirmPassword();
        });
        el.addEventListener('input', () => {
            if (el.classList.contains('error')) {
                if (id === 'name') validateName();
                if (id === 'email') validateEmail();
                if (id === 'password') validatePassword();
                if (id === 'confirmPassword') validateConfirmPassword();
            }
        });
    });

    // При изменении пароля перепроверяем подтверждение
    document.getElementById('password').addEventListener('input', () => {
        if (document.getElementById('confirmPassword').value) {
            validateConfirmPassword();
        }
    });

    // ---- Отправка формы ----
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const success = document.getElementById('successMessage');
        success.textContent = '';

        const ok = [
            validateName(),
            validateEmail(),
            validatePassword(),
            validateConfirmPassword()
        ].every(Boolean);

        if (!ok) return;

        const newUser = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            date: new Date().toLocaleDateString('ru-RU')
        };

        // Работа с массивом объектов
        users.push(newUser);
        saveUsers();
        renderUsers(usersList);

        success.textContent = '✓ Регистрация прошла успешно!';
        form.reset();

        // Сброс классов через classList
        ['name', 'email', 'password', 'confirmPassword'].forEach(id => {
            const el = document.getElementById(id);
            el.classList.remove('valid', 'error');
            document.getElementById(id + 'Error').textContent = '';
        });
    });
});