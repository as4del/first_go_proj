'use strict';

// Relative URLs keep the page and API on the same origin, including cookies.
const $ = (id) => document.getElementById(id);
const state = { user: null, links: [], linksLoaded: false, createdURL: '', version: 0 };
let toastTimer;

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const options = { method, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте, что Go backend запущен и страница открыта с того же адреса.');
  }
  const text = await response.text();
  let data = null;
  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new APIError(`Сервер вернул неожиданный ответ (HTTP ${response.status}). Проверьте адрес страницы и логи backend.`, response.status);
    }
  }
  if (!response.ok) {
    const detail = typeof data?.error === 'string' ? data.error : null;
    throw new APIError(detail || `Ошибка сервера: HTTP ${response.status}`, response.status);
  }
  return data;
}

function notice(message, success = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('success', success);
  $('notice').hidden = !message;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}

function shortURL(code) {
  return new URL(`/get/${encodeURIComponent(code)}`, window.location.origin).href;
}

function httpURL(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

async function copyURL(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast('Ссылка скопирована');
  } catch {
    // Clipboard access can be disabled by the browser; leave a selectable link.
    notice(`Браузер не разрешил копирование. Скопируйте адрес вручную: ${value}`);
  }
}

function setUser(username) {
  state.version += 1;
  state.user = username || null;
  state.links = [];
  state.linksLoaded = false;
  const authenticated = Boolean(state.user);
  $('header-user').textContent = state.user || 'Гость';
  $('avatar').textContent = state.user ? state.user.slice(0, 1).toUpperCase() : '?';
  $('profile-avatar').textContent = $('avatar').textContent;
  $('profile-name').textContent = state.user || '';
  $('signed-in').hidden = !authenticated;
  $('signed-out').hidden = authenticated;
  $('account-badge').textContent = authenticated ? 'АКТИВЕН' : 'COOKIE';
  $('session-label').textContent = authenticated ? 'Авторизован' : 'Гостевой режим';
  $('session-note').textContent = authenticated ? `Пользователь: ${state.user}` : 'Сессия не найдена';
  $('create-button').disabled = !authenticated;
  $('refresh-links').disabled = !authenticated;
  $('create-hint').textContent = authenticated ? `Ссылка будет сохранена для ${state.user}.` : 'Войдите в аккаунт или зарегистрируйтесь.';
  $('created-result').hidden = true;
  state.createdURL = '';
  $('search').value = '';
  renderLinks();
}

function emptyList(title, description) {
  $('links-table').hidden = true;
  $('list-state').hidden = false;
  $('list-state').querySelector('h3').textContent = title;
  $('list-state').querySelector('p').textContent = description;
}

function renderLinks() {
  const total = state.linksLoaded ? String(state.links.length) : '—';
  $('total').textContent = total;
  $('nav-count').textContent = total;
  $('list-count').textContent = total;
  $('links-body').replaceChildren();
  if (!state.user) {
    emptyList('У каждой ссылки есть начало', 'Авторизуйтесь, чтобы увидеть свои ссылки.');
    return;
  }
  if (!state.linksLoaded) {
    emptyList('Список пока не загружен', 'Нажмите «Обновить», чтобы получить ссылки с сервера.');
    return;
  }
  const query = $('search').value.trim().toLocaleLowerCase();
  const links = state.links.filter((link) => `${link.short} ${link.original}`.toLocaleLowerCase().includes(query));
  if (!links.length) {
    emptyList(query ? 'Ничего не найдено' : 'Ваша первая ссылка — впереди', query ? 'Попробуйте другой код или адрес.' : 'Добавьте адрес в форме выше — он появится здесь.');
    return;
  }
  $('list-state').hidden = true;
  $('links-table').hidden = false;
  for (const link of links) {
    const row = document.createElement('tr');
    const shortCell = document.createElement('td');
    const shortLink = document.createElement('a');
    const url = shortURL(link.short);
    shortLink.textContent = `/get/${link.short}`;
    shortLink.href = url;
    shortLink.target = '_blank';
    shortLink.rel = 'noopener noreferrer';
    shortCell.append(shortLink);

    const originalCell = document.createElement('td');
    const safeURL = httpURL(link.original);
    const original = document.createElement(safeURL ? 'a' : 'span');
    original.textContent = link.original;
    original.title = link.original;
    if (safeURL) {
      original.href = safeURL;
      original.target = '_blank';
      original.rel = 'noopener noreferrer';
    }
    originalCell.append(original);

    const actions = document.createElement('td');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'row-action';
    copy.textContent = 'Копировать';
    copy.setAttribute('aria-label', `Скопировать ссылку ${link.short}`);
    copy.addEventListener('click', () => copyURL(url));
    const open = document.createElement('a');
    open.className = 'row-action';
    open.textContent = '↗';
    open.href = url;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.setAttribute('aria-label', `Открыть ссылку ${link.short}`);
    actions.append(copy, open);
    row.append(shortCell, originalCell, actions);
    $('links-body').append(row);
  }
}

async function loadLinks() {
  if (!state.user) return;
  const version = state.version;
  $('refresh-links').disabled = true;
  emptyList('Загружаем ссылки…', 'Получаем список из вашего аккаунта.');
  try {
    const links = await request('/url_for_user');
    if (version !== state.version) return;
    if (!Array.isArray(links) || links.some((link) => !link || typeof link.short !== 'string' || typeof link.original !== 'string')) {
      throw new Error('Сервер вернул список ссылок в неожиданном формате.');
    }
    state.links = links;
    state.linksLoaded = true;
    renderLinks();
  } catch (error) {
    if (version !== state.version) return;
    if (error.status === 401) {
      setUser(null);
      notice('Сессия завершилась. Сервер больше не подтверждает авторизацию.');
    } else {
      emptyList('Не удалось загрузить ссылки', 'Попробуйте нажать «Обновить» ещё раз.');
      notice(error.message);
    }
  } finally {
    if (version === state.version) $('refresh-links').disabled = !state.user;
  }
}

async function checkSession() {
  $('check-session').disabled = true;
  try {
    const me = await request('/api/me');
    if (!me || typeof me.username !== 'string' || !me.username) throw new Error('В ответе /api/me нет имени пользователя.');
    setUser(me.username);
    await loadLinks();
    return Boolean(state.user);
  } catch (error) {
    setUser(null);
    if (error.status !== 401) {
      $('session-label').textContent = 'Нет соединения';
      $('session-note').textContent = 'Не удалось проверить /api/me';
      notice(error.message);
    }
    return false;
  } finally {
    $('check-session').disabled = false;
  }
}

function pending(form, busy) {
  for (const element of form.elements) element.disabled = busy;
  form.setAttribute('aria-busy', String(busy));
}

let authBusy = false;

function authMode(mode) {
  const login = mode === 'login';
  $('login-form').hidden = !login;
  $('user-form').hidden = login;
  $('login-tab').classList.toggle('selected', login);
  $('register-tab').classList.toggle('selected', !login);
  $('login-tab').setAttribute('aria-pressed', String(login));
  $('register-tab').setAttribute('aria-pressed', String(!login));
  $('auth-description').textContent = login
    ? 'Войдите в свой аккаунт. Если кука уже есть, сессия восстановится автоматически.'
    : 'Создайте аккаунт, чтобы сохранять ссылки. После регистрации войдём автоматически.';
  $('login-password').value = '';
  $('password').value = '';
}

function authPending(busy) {
  authBusy = busy;
  pending($('login-form'), busy);
  pending($('user-form'), busy);
  $('login-tab').disabled = busy;
  $('register-tab').disabled = busy;
  $('check-session').disabled = busy;
}

$('login-tab').addEventListener('click', () => authMode('login'));
$('register-tab').addEventListener('click', () => authMode('register'));

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (authBusy) return;
  const form = event.currentTarget;
  const fields = new FormData(form);
  authPending(true);
  notice('');
  try {
    // The backend must register POST /login: browser fetch forbids a GET body.
    await request('/login', {
      method: 'POST',
      body: { username: fields.get('username'), password: fields.get('password') },
    });
    form.reset();
    const authenticated = await checkSession();
    if (authenticated) {
      toast('Вы вошли в аккаунт');
    } else {
      notice('Сервер принял вход, но /api/me не подтвердил сессию. Проверьте сохранение cookie и логи сервера.');
    }
  } catch (error) {
    if (error.status === 404 || error.status === 405) {
      notice('Вход недоступен: сервер должен принимать POST /login с JSON. В main.go замените server.GET("/login", handler.Login) на server.POST("/login", handler.Login).');
    } else {
      notice(error.status === 401 ? 'Неверное имя пользователя или пароль.' : error.message);
    }
  } finally {
    $('login-password').value = '';
    authPending(false);
  }
});

$('logout-button').addEventListener('click', async () => {
  if (authBusy) return;
  authPending(true);
  $('logout-button').disabled = true;
  notice('');
  try {
    await request('/logout');
    // Confirm that the browser cookie no longer authenticates the user.
    try {
      await request('/api/me');
      notice('Сервер ответил на выход, но сессия ещё активна. Попробуйте выйти ещё раз.');
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        authMode('login');
        toast('Вы вышли из аккаунта');
      } else {
        setUser(null);
        notice('Запрос выхода выполнен, но проверить сессию не удалось. Нажмите «Проверить сессию».');
      }
    }
  } catch (error) {
    notice(error.message);
  } finally {
    $('logout-button').disabled = false;
    authPending(false);
  }
});

$('user-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (authBusy) return;
  const form = event.currentTarget;
  const fields = new FormData(form);
  authPending(true);
  notice('');
  try {
    await request('/new_user', {
      method: 'POST',
      body: { username: fields.get('username'), email: fields.get('email'), password: fields.get('password') },
    });
    form.reset();
    const authenticated = await checkSession();
    if (authenticated) {
      notice('Аккаунт создан. Сессия подтверждена — теперь можно добавлять ссылки.', true);
    } else {
      notice('Пользователь создан, но /api/me не подтвердил сессию. Проверьте сохранение cookie и логи сервера. Повторная регистрация с теми же данными не требуется.');
    }
  } catch (error) {
    notice(error.message);
  } finally {
    // Never retain the password after sending the request.
    $('password').value = '';
    authPending(false);
  }
});

$('link-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.user) { notice('Для создания ссылки нужна активная сессия.'); return; }
  const form = event.currentTarget;
  const fields = new FormData(form);
  const original = String(fields.get('original')).trim();
  const short = String(fields.get('short')).trim();
  if (!httpURL(original)) { notice('Укажите полный адрес с http:// или https://.'); return; }
  pending(form, true);
  notice('');
  try {
    await request('/new_url', { method: 'POST', body: { short, original } });
    form.reset();
    await loadLinks();
    if (state.user) {
      state.createdURL = shortURL(short);
      $('created-link').href = state.createdURL;
      $('created-link').textContent = state.createdURL;
      $('created-result').hidden = false;
      toast('Короткая ссылка создана');
    }
  } catch (error) {
    if (error.status === 401) setUser(null);
    notice(error.status === 401 ? 'Сессия завершилась. Проверьте авторизацию.' : error.message);
  } finally {
    pending(form, false);
    $('create-button').disabled = !state.user;
  }
});

$('check-session').addEventListener('click', () => { notice(''); checkSession(); });
$('refresh-links').addEventListener('click', () => { notice(''); loadLinks(); });
$('search').addEventListener('input', renderLinks);
$('copy-created').addEventListener('click', () => { if (state.createdURL) copyURL(state.createdURL); });
$('resolve-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = $('resolve-code').value.trim();
  if (code) window.open(shortURL(code), '_blank', 'noopener,noreferrer');
});

if (window.location.protocol === 'file:') {
  setUser(null);
  $('session-label').textContent = 'Откройте через Gin';
  $('session-note').textContent = 'Нужен http://localhost:8080';
  notice('Эту страницу нужно открыть через тот же Gin-сервер, что и API. При открытии HTML как файла запросы с cookie не работают. Инструкция подключения — в frontend/README.md.');
} else {
  checkSession();
}
