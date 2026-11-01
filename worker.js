// Chatly - a tiny WhatsApp-style chat app for Cloudflare Workers + D1.
//
// This ONE file contains everything:
//   1. PAGE        -> the HTML + CSS + JavaScript users see in their browser
//   2. handleApi   -> the server code that reads/writes your D1 database
//
// Setup: the Worker needs a D1 binding named DB that points to your "app-db" database.

// ---------------------------------------------------------------------------
// 1. THE PAGE (HTML + CSS + browser JavaScript)
//    Note: this is a JS template string, so the page code must not contain
//    backticks, dollar-brace sequences, or backslashes.
// ---------------------------------------------------------------------------
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#075e54">
<title>Chatly</title>
<style>
:root {
  --bg: #f0f2f5; --panel: #ffffff; --text: #111b21; --muted: #667781;
  --head: #075e54; --head-text: #ffffff; --accent: #128c7e;
  --bubble-me: #d9fdd3; --bubble-them: #ffffff; --chat-bg: #efeae2;
  --line: #e9edef; --err: #c62828;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b141a; --panel: #111b21; --text: #e9edef; --muted: #8696a0;
    --head: #202c33; --head-text: #e9edef; --accent: #00a884;
    --bubble-me: #005c4b; --bubble-them: #202c33; --chat-bg: #0b141a;
    --line: #222d34; --err: #ef9a9a;
  }
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; margin: 0; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: var(--bg); color: var(--text); font-size: 16px;
}
#app {
  height: 100vh; height: 100dvh; max-width: 560px; margin: 0 auto;
  background: var(--panel); position: relative; overflow: hidden;
}
.screen { display: flex; flex-direction: column; height: 100%; }
.hidden { display: none !important; }
button { font: inherit; cursor: pointer; }
input { font: inherit; color: var(--text); }

/* Sign-up screen */
.join { align-items: center; justify-content: center; padding: 24px; text-align: center; }
.logo {
  width: 84px; height: 84px; border-radius: 50%; background: var(--accent);
  display: flex; align-items: center; justify-content: center; font-size: 42px; margin-bottom: 12px;
}
.join h1 { margin: 0 0 6px; font-size: 28px; }
.lead { margin: 0 0 22px; color: var(--muted); max-width: 300px; }
#join-form { width: 100%; max-width: 320px; }
#join-form input {
  width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--line);
  background: var(--bg); outline: none;
}
#join-form input:focus { border-color: var(--accent); }
#join-btn {
  width: 100%; margin-top: 12px; padding: 14px; border: 0; border-radius: 12px;
  background: var(--accent); color: #fff; font-weight: 600;
}
#join-btn:disabled { opacity: 0.6; }
.error { color: var(--err); min-height: 1.3em; margin: 10px 0 0; font-size: 14px; }
.hint { color: var(--muted); font-size: 13px; margin: 6px 0 0; }
.server { width: 100%; max-width: 320px; margin-top: 22px; text-align: left; }
.server summary { color: var(--muted); font-size: 13px; cursor: pointer; text-align: center; }
.server input {
  width: 100%; margin-top: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line);
  background: var(--bg); outline: none;
}
.server p { color: var(--muted); font-size: 12px; margin: 6px 2px 0; }

/* Header bar */
header.bar {
  background: var(--head); color: var(--head-text); display: flex; align-items: center; gap: 10px;
  padding: calc(10px + env(safe-area-inset-top)) 12px 10px; min-height: 58px;
}
.title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
.title span { font-size: 13px; opacity: 0.8; }
.ghost { background: transparent; border: 0; color: inherit; padding: 8px; border-radius: 8px; }
.icon { font-size: 22px; line-height: 1; padding: 6px 10px 6px 4px; }

/* Tabs */
.tabs { display: flex; background: var(--head); }
.tabs button {
  flex: 1; padding: 12px; background: transparent; border: 0; color: var(--head-text);
  opacity: 0.7; border-bottom: 3px solid transparent; font-weight: 600;
}
.tabs button.active { opacity: 1; border-bottom-color: #25d366; }
.panel { flex: 1; overflow-y: auto; }
.searchbox { padding: 10px 12px; position: sticky; top: 0; background: var(--panel); z-index: 1; }
.searchbox input {
  width: 100%; padding: 10px 14px; border-radius: 10px; border: 0; background: var(--bg); outline: none;
}

/* List rows */
.row {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px;
  background: transparent; border: 0; border-bottom: 1px solid var(--line); text-align: left; color: var(--text);
}
.row:active { background: var(--bg); }
.avatar {
  flex: none; width: 46px; height: 46px; border-radius: 50%; color: #fff; font-weight: 600;
  display: flex; align-items: center; justify-content: center; font-size: 19px;
}
.avatar.small { width: 38px; height: 38px; font-size: 16px; }
.mid { flex: 1; min-width: 0; }
.name { font-weight: 600; }
.sub { color: var(--muted); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.when { color: var(--muted); font-size: 12px; align-self: flex-start; margin-top: 4px; }
.row.unread .sub { color: var(--text); font-weight: 600; }
.row.unread .when { color: var(--accent); }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #25d366; flex: none; }
.note { padding: 28px 24px; text-align: center; color: var(--muted); }

/* Conversation */
#messages {
  flex: 1; overflow-y: auto; padding: 12px 10px; background: var(--chat-bg);
  display: flex; flex-direction: column; gap: 4px;
}
.msg {
  max-width: 80%; padding: 6px 9px 4px; border-radius: 9px; overflow-wrap: anywhere;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.12);
}
.msg.me { align-self: flex-end; background: var(--bubble-me); border-top-right-radius: 2px; }
.msg.them { align-self: flex-start; background: var(--bubble-them); border-top-left-radius: 2px; }
.msg .txt { white-space: pre-wrap; }
.msg time { display: block; text-align: right; font-size: 11px; color: var(--muted); margin-top: 2px; }
#composer {
  display: flex; gap: 8px; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); background: var(--bg);
}
#msg-input {
  flex: 1; min-width: 0; padding: 12px 16px; border-radius: 24px; border: 0; background: var(--panel); outline: none;
}
#composer button {
  flex: none; width: 46px; height: 46px; border-radius: 50%; border: 0; background: var(--accent); color: #fff; font-size: 18px;
}
.toast {
  position: absolute; left: 50%; top: 70px; transform: translateX(-50%); background: #323232; color: #fff;
  padding: 10px 16px; border-radius: 10px; font-size: 14px; max-width: 90%; z-index: 5;
}
</style>
</head>
<body>
<div id="app">

  <section id="join" class="screen join">
    <div class="logo">&#128172;</div>
    <h1>Chatly</h1>
    <p class="lead">Pick a username and start chatting. No password, no phone number.</p>
    <form id="join-form" autocomplete="off">
      <input id="username" type="text" placeholder="Choose a username" maxlength="20"
             autocapitalize="none" autocorrect="off" spellcheck="false" required>
      <button id="join-btn" type="submit">Start chatting</button>
      <p id="join-error" class="error" role="alert"></p>
    </form>
    <p class="hint">3 to 20 letters, numbers or underscores.</p>
    <details id="server-box" class="server">
      <summary>Server address</summary>
      <input id="server" type="url" placeholder="https://your-worker.workers.dev"
             autocapitalize="none" autocorrect="off" spellcheck="false">
      <p>Only needed when you open this page as a file. Paste your Worker link here.</p>
    </details>
  </section>

  <section id="home" class="screen hidden">
    <header class="bar">
      <div class="title"><strong>Chatly</strong><span id="me-name"></span></div>
      <button id="logout" class="ghost" type="button">Log out</button>
    </header>
    <nav class="tabs">
      <button id="tab-chats" class="active" type="button">Chats</button>
      <button id="tab-people" type="button">People</button>
    </nav>
    <div id="chats-panel" class="panel"><div id="chat-list"></div></div>
    <div id="people-panel" class="panel hidden">
      <div class="searchbox">
        <input id="search" type="search" placeholder="Search by username" autocapitalize="none" autocorrect="off" spellcheck="false">
      </div>
      <div id="people-list"></div>
    </div>
  </section>

  <section id="chat" class="screen hidden">
    <header class="bar">
      <button id="back" class="ghost icon" type="button" aria-label="Back">&#8592;</button>
      <div id="peer-avatar" class="avatar small"></div>
      <strong id="peer"></strong>
    </header>
    <div id="messages"></div>
    <form id="composer" autocomplete="off">
      <input id="msg-input" type="text" placeholder="Type a message" maxlength="1000" enterkeyhint="send">
      <button type="submit" aria-label="Send">&#10148;</button>
    </form>
  </section>

  <div id="toast" class="toast hidden"></div>
</div>

<script>
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var token = null, me = null, seen = {};
  var current = null;   // username of the open conversation (null = on the home screen)
  var lastId = 0;       // newest message id shown in the open conversation
  var shown = {};       // message ids already on screen (prevents duplicates)
  var tab = 'chats';
  var base = '';        // server address; empty = same site this page was loaded from
  var isWeb = location.protocol === 'http:' || location.protocol === 'https:';

  try {
    token = localStorage.getItem('chat_token');
    me = localStorage.getItem('chat_user');
    seen = JSON.parse(localStorage.getItem('chat_seen') || '{}') || {};
    base = localStorage.getItem('chat_server') || '';
  } catch (e) {}

  // Turns "my-worker.workers.dev/" into "https://my-worker.workers.dev"
  function normalizeServer(value) {
    var v = (value || '').trim();
    if (!v) return '';
    if (!/^https?:[/][/]/i.test(v)) v = 'https://' + v;
    return v.replace(/[/]+$/, '');
  }

  function store(key, val) {
    try {
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) {}
  }

  function show(name) {
    ['join', 'home', 'chat'].forEach(function (s) { $(s).classList.toggle('hidden', s !== name); });
  }

  var toastTimer = null;
  function toast(text) {
    var el = $('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 2800);
  }

  // Talk to the server API
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(base + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).catch(function () {
      throw new Error('Can not reach the server. Check the server address and your internet connection.');
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || 'Something went wrong.');
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function resetSession() {
    token = null; me = null; current = null;
    store('chat_token', null);
    store('chat_user', null);
    show('join');
  }

  function onAuthError(err) {
    if (err && err.status === 401) { resetSession(); return true; }
    return false;
  }

  function fmtTime(ms) {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtListTime(ms) {
    var d = new Date(ms);
    if (d.toDateString() === new Date().toDateString()) return fmtTime(ms);
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  function colorFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return 'hsl(' + h + ', 45%, 42%)';
  }

  function note(text) {
    var el = document.createElement('div');
    el.className = 'note';
    el.textContent = text;
    return el;
  }

  function row(name, sub, time, unread, onClick) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'row' + (unread ? ' unread' : '');

    var av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = name.charAt(0).toUpperCase();
    av.style.background = colorFor(name);

    var mid = document.createElement('div');
    mid.className = 'mid';
    var n = document.createElement('div');
    n.className = 'name';
    n.textContent = name;
    var s = document.createElement('div');
    s.className = 'sub';
    s.textContent = sub;
    mid.appendChild(n);
    mid.appendChild(s);

    el.appendChild(av);
    el.appendChild(mid);
    if (time) {
      var w = document.createElement('div');
      w.className = 'when';
      w.textContent = time;
      el.appendChild(w);
    }
    if (unread) {
      var dot = document.createElement('span');
      dot.className = 'dot';
      el.appendChild(dot);
    }
    el.addEventListener('click', onClick);
    return el;
  }

  // ----- Home screen: chats + people -----
  function loadChats() {
    return api('/api/chats').then(function (d) {
      if (current) return;
      var list = $('chat-list');
      list.textContent = '';
      if (!d.chats.length) {
        list.appendChild(note('No chats yet. Open the People tab and pick someone to message.'));
        return;
      }
      d.chats.forEach(function (c) {
        var unread = !c.mine && c.id > (seen[c.username] || 0);
        var sub = (c.mine ? 'You: ' : '') + c.body;
        list.appendChild(row(c.username, sub, fmtListTime(c.at), unread, function () { openChat(c.username); }));
      });
    }).catch(onAuthError);
  }

  function loadPeople() {
    var q = $('search').value.trim();
    return api('/api/users?q=' + encodeURIComponent(q)).then(function (d) {
      if (q !== $('search').value.trim()) return;
      var list = $('people-list');
      list.textContent = '';
      if (!d.users.length) {
        list.appendChild(note(q ? 'Nobody found with that name.'
          : 'No one else has joined yet. Open this link on another phone and sign up with a different username.'));
        return;
      }
      d.users.forEach(function (u) {
        list.appendChild(row(u, 'Tap to chat', '', false, function () { openChat(u); }));
      });
    }).catch(onAuthError);
  }

  function setTab(name) {
    tab = name;
    $('tab-chats').classList.toggle('active', name === 'chats');
    $('tab-people').classList.toggle('active', name === 'people');
    $('chats-panel').classList.toggle('hidden', name !== 'chats');
    $('people-panel').classList.toggle('hidden', name !== 'people');
    if (name === 'chats') loadChats(); else loadPeople();
  }

  function enterHome() {
    $('me-name').textContent = '@' + me;
    show('home');
    setTab('chats');
  }

  // ----- Conversation screen -----
  function bubble(m) {
    var el = document.createElement('div');
    el.className = 'msg ' + (m.mine ? 'me' : 'them');
    var txt = document.createElement('div');
    txt.className = 'txt';
    txt.textContent = m.body;
    var t = document.createElement('time');
    t.textContent = fmtTime(m.at);
    el.appendChild(txt);
    el.appendChild(t);
    return el;
  }

  function addMessages(list) {
    if (!list.length) return;
    var box = $('messages');
    var wasEmpty = box.children.length === 0;
    var nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    var mineNew = false;
    list.forEach(function (m) {
      if (shown[m.id]) return;
      shown[m.id] = true;
      if (m.id > lastId) lastId = m.id;
      if (m.mine) mineNew = true;
      box.appendChild(bubble(m));
    });
    seen[current] = Math.max(seen[current] || 0, lastId);
    store('chat_seen', JSON.stringify(seen));
    if (wasEmpty || nearBottom || mineNew) box.scrollTop = box.scrollHeight;
  }

  function loadMessages() {
    var who = current;
    if (!who) return Promise.resolve();
    return api('/api/messages?with=' + encodeURIComponent(who) + '&after=' + lastId).then(function (d) {
      if (who === current) addMessages(d.messages);
    }).catch(onAuthError);
  }

  function openChat(name) {
    current = name;
    lastId = 0;
    shown = {};
    $('peer').textContent = name;
    var av = $('peer-avatar');
    av.textContent = name.charAt(0).toUpperCase();
    av.style.background = colorFor(name);
    $('messages').textContent = '';
    $('msg-input').value = '';
    show('chat');
    loadMessages();
  }

  // ----- Events -----
  $('username').addEventListener('input', function () {
    this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
  });

  $('join-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('username').value.trim();
    var errBox = $('join-error');
    var btn = $('join-btn');
    errBox.textContent = '';
    if (name.length < 3) {
      errBox.textContent = 'Username must be 3 to 20 letters, numbers or underscores.';
      return;
    }
    var server = normalizeServer($('server').value);
    if (!isWeb && !server) {
      $('server-box').open = true;
      errBox.textContent = 'Enter your server address first (open "Server address" below).';
      return;
    }
    if (server) base = server;
    btn.disabled = true;
    api('/api/register', { method: 'POST', body: { username: name } }).then(function (d) {
      token = d.token;
      me = d.username;
      store('chat_token', token);
      store('chat_user', me);
      store('chat_server', base || null);
      enterHome();
    }).catch(function (err) {
      errBox.textContent = err.message;
    }).then(function () {
      btn.disabled = false;
    });
  });

  $('tab-chats').addEventListener('click', function () { setTab('chats'); });
  $('tab-people').addEventListener('click', function () { setTab('people'); });

  var searchTimer = null;
  $('search').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadPeople, 250);
  });

  $('logout').addEventListener('click', function () {
    var ok = confirm('Log out? There is no password, so you will not be able to sign back in as "' + me + '".');
    if (ok) resetSession();
  });

  $('back').addEventListener('click', function () {
    current = null;
    show('home');
    setTab(tab);
  });

  $('composer').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('msg-input');
    var text = input.value.trim();
    if (!text || !current) return;
    var who = current;
    input.value = '';
    api('/api/messages', { method: 'POST', body: { to: who, body: text } }).then(function (d) {
      if (who === current) addMessages([d.message]);
    }).catch(function (err) {
      if (onAuthError(err)) return;
      if (who === current) input.value = text;
      toast(err.message);
    });
    input.focus();
  });

  // Check for new messages every 3 seconds
  function tick() {
    if (!token || document.hidden) return;
    if (current) loadMessages();
    else if (tab === 'chats' && !$('home').classList.contains('hidden')) loadChats();
  }
  setInterval(tick, 3000);
  document.addEventListener('visibilitychange', tick);

  // Start
  $('server').value = base;
  if (!isWeb) $('server-box').open = true;
  if (token && me) enterHome(); else show('join');
})();
</script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// 2. THE SERVER (API + database)
// ---------------------------------------------------------------------------
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const MAX_MESSAGE_LENGTH = 1000;

// CORS lets the standalone index.html (opened from a file on a phone) talk to this API.
// Safe here because the API uses a secret token header, not cookies.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-max-age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS },
  });
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

function newToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}

// Finds the user that owns the "Authorization: Bearer <token>" header.
async function authUser(request, env) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer ([a-f0-9]{64})$/.exec(header);
  if (!match) return null;
  const hash = await sha256(match[1]);
  return await env.DB.prepare('SELECT id, username FROM users WHERE token_hash = ?').bind(hash).first();
}

async function handleApi(request, env, url) {
  if (!env.DB) {
    return json({ error: 'Database not connected. Add a D1 binding named DB to this Worker.' }, 500);
  }
  const path = url.pathname;
  const method = request.method;

  // Create an account (username only)
  if (path === '/api/register' && method === 'POST') {
    const body = await readJson(request);
    const username = String(body.username || '').trim();
    if (!USERNAME_RE.test(username)) {
      return json({ error: 'Username must be 3 to 20 letters, numbers or underscores.' }, 400);
    }
    const token = newToken();
    try {
      await env.DB.prepare('INSERT INTO users (username, token_hash, created_at) VALUES (?, ?, ?)')
        .bind(username, await sha256(token), Date.now())
        .run();
    } catch (e) {
      if (/UNIQUE/i.test(String(e && e.message))) {
        return json({ error: 'That username is taken. Try another one.' }, 409);
      }
      throw e;
    }
    return json({ username, token });
  }

  // Everything below needs a signed-in user
  const user = await authUser(request, env);
  if (!user) return json({ error: 'Please sign up again.' }, 401);

  if (path === '/api/me' && method === 'GET') {
    return json({ username: user.username });
  }

  // Search people (empty search = everyone)
  if (path === '/api/users' && method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 20);
    const like = '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    const { results } = await env.DB
      .prepare("SELECT username FROM users WHERE id != ? AND username LIKE ? ESCAPE '\\' ORDER BY username COLLATE NOCASE LIMIT 30")
      .bind(user.id, like)
      .all();
    return json({ users: results.map((r) => r.username) });
  }

  // Conversation list: the latest message with each person
  if (path === '/api/chats' && method === 'GET') {
    const { results } = await env.DB
      .prepare(
        `SELECT u.username AS username, m.id AS id, m.body AS body, m.created_at AS at, (m.sender_id = ?) AS mine
         FROM messages m
         JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
         WHERE m.id IN (
           SELECT MAX(id) FROM messages WHERE sender_id = ? OR receiver_id = ?
           GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
         )
         ORDER BY m.id DESC LIMIT 50`
      )
      .bind(user.id, user.id, user.id, user.id, user.id)
      .all();
    return json({
      chats: results.map((r) => ({ username: r.username, id: r.id, body: r.body, at: r.at, mine: !!r.mine })),
    });
  }

  // Read messages with one person (after = only messages newer than this id)
  if (path === '/api/messages' && method === 'GET') {
    const other = await env.DB
      .prepare('SELECT id FROM users WHERE username = ?')
      .bind(url.searchParams.get('with') || '')
      .first();
    if (!other) return json({ error: 'User not found.' }, 404);
    const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
    const pair = '((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))';
    let rows;
    if (after > 0) {
      rows = (
        await env.DB
          .prepare('SELECT id, sender_id, body, created_at FROM messages WHERE id > ? AND ' + pair + ' ORDER BY id ASC LIMIT 200')
          .bind(after, user.id, other.id, other.id, user.id)
          .all()
      ).results;
    } else {
      rows = (
        await env.DB
          .prepare('SELECT id, sender_id, body, created_at FROM messages WHERE id > ? AND ' + pair + ' ORDER BY id DESC LIMIT 100')
          .bind(0, user.id, other.id, other.id, user.id)
          .all()
      ).results.reverse();
    }
    return json({
      messages: rows.map((r) => ({ id: r.id, mine: r.sender_id === user.id, body: r.body, at: r.created_at })),
    });
  }

  // Send a message
  if (path === '/api/messages' && method === 'POST') {
    const body = await readJson(request);
    const text = String(body.body || '').trim();
    if (!text) return json({ error: 'Type a message first.' }, 400);
    if (text.length > MAX_MESSAGE_LENGTH) {
      return json({ error: 'Message is too long (max ' + MAX_MESSAGE_LENGTH + ' characters).' }, 400);
    }
    const other = await env.DB
      .prepare('SELECT id FROM users WHERE username = ?')
      .bind(String(body.to || ''))
      .first();
    if (!other) return json({ error: 'That user does not exist.' }, 404);
    if (other.id === user.id) return json({ error: "You can't message yourself." }, 400);
    const now = Date.now();
    const res = await env.DB
      .prepare('INSERT INTO messages (sender_id, receiver_id, body, created_at) VALUES (?, ?, ?, ?)')
      .bind(user.id, other.id, text, now)
      .run();
    return json({ message: { id: res.meta.last_row_id, mine: true, body: text, at: now } });
  }

  return json({ error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      try {
        return await handleApi(request, env, url);
      } catch (e) {
        return json({ error: 'Server error. Please try again.' }, 500);
      }
    }
    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
    return new Response(PAGE, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
    });
  },
};
