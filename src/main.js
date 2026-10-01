import widgetStyles from './style.css?inline';
import assistantIcon from './assets/assistant.svg';
import closeIcon from './assets/close.svg';
import launcherIcon from './assets/launcher.svg';
import sendIcon from './assets/send.svg';

const WIDGET_ID = 'lam-chat-widget';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/chat';
const DEFAULTS = {
  title: 'Lookatmedia™AIAssist',
  greeting: 'How may I help you?',
  placeholder: 'Ask a question...',
  userId: 'default',
  environment: 'dam',
  apiUrl: API_URL,
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function renderInlineMarkdown(value) {
  const codeTokens = [];
  const withTokens = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  return withTokens
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/@@CODE(\d+)@@/g, (_, index) => codeTokens[Number(index)]);
}

function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeCode = () => {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    inCode = false;
    codeLanguage = '';
    codeLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (inCode) {
      if (/^\s*```/.test(line)) {
        closeCode();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const codeStart = line.match(/^\s*```\s*([\w-]*)\s*$/);
    if (codeStart) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLanguage = codeStart[1];
      continue;
    }

    const tableSeparator = lines[index + 1] && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[index + 1]);
    if (line.includes('|') && tableSeparator) {
      flushParagraph();
      closeList();
      const parseCells = (tableLine) => tableLine.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
      const headers = parseCells(line);
      html.push('<table><thead><tr>');
      headers.forEach((cell) => html.push(`<th>${renderInlineMarkdown(cell)}</th>`));
      html.push('</tr></thead><tbody>');
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        html.push('<tr>');
        parseCells(lines[index]).forEach((cell) => html.push(`<td>${renderInlineMarkdown(cell)}</td>`));
        html.push('</tr>');
        index += 1;
      }
      html.push('</tbody></table>');
      index -= 1;
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      flushParagraph();
      const nextListType = unorderedItem ? 'ul' : 'ol';
      if (listType && listType !== nextListType) {
        closeList();
      }
      if (!listType) {
        listType = nextListType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${renderInlineMarkdown((unorderedItem || orderedItem)[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  if (inCode) {
    closeCode();
  }
  flushParagraph();
  closeList();
  return html.join('');
}

function getScriptConfig(script) {
  if (!script || !script.dataset) {
    return {};
  }

  return Object.fromEntries(
    Object.entries({
      title: script.dataset.title,
      greeting: script.dataset.greeting,
      placeholder: script.dataset.placeholder,
      apiUrl: script.dataset.apiUrl,
      clientId: script.dataset.clientId,
      userId: script.dataset.userId,
      environment: script.dataset.environment,
    }).filter(([, value]) => value !== undefined && value !== '')
  );
}

function createWidget(config = {}) {
  if (document.getElementById(WIDGET_ID)) {
    return;
  }

  const settings = { ...DEFAULTS, ...config };
  const title = escapeHtml(settings.title);
  const greeting = escapeHtml(settings.greeting);
  const placeholder = escapeHtml(settings.placeholder);
  const host = document.createElement('div');
  host.id = WIDGET_ID;
  host.setAttribute('data-lam-chat-widget', '');
  document.body.append(host);

  const shadowRoot = host.attachShadow({ mode: 'closed' });
  shadowRoot.innerHTML = `
    <style>${widgetStyles}</style>
    <button class="launcher" type="button" aria-label="Open chat" aria-expanded="false">
      <img src="${launcherIcon}" alt="" />
    </button>
    <section class="panel" aria-label="${title}" hidden>
      <header class="header">
        <h1>${title}</h1>
        <button class="close" type="button" aria-label="Close chat">
          <img src="${closeIcon}" alt="" />
        </button>
      </header>
      <div class="chat-shell">
        <div class="conversation" role="log" aria-live="polite" aria-label="Conversation">
        </div>
        <form class="composer">
          <label class="sr-only" for="chat-question">${placeholder}</label>
          <input id="chat-question" name="question" type="text" autocomplete="off" placeholder="${placeholder}" />
          <button class="send" type="submit" aria-label="Send message">
            <img src="${sendIcon}" alt="" />
          </button>
        </form>
      </div>
    </section>
  `;

  const launcher = shadowRoot.querySelector('.launcher');
  const close = shadowRoot.querySelector('.close');
  const panel = shadowRoot.querySelector('.panel');
  const conversation = shadowRoot.querySelector('.conversation');
  const composer = shadowRoot.querySelector('.composer');
  const input = shadowRoot.querySelector('#chat-question');
  const send = shadowRoot.querySelector('.send');

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    launcher.setAttribute('aria-expanded', String(isOpen));
    launcher.setAttribute('aria-label', isOpen ? 'Chat open' : 'Open chat');

    if (isOpen) {
      window.requestAnimationFrame(() => input.focus());
    } else {
      launcher.focus();
    }
  };

  const appendMessage = (text, type) => {
    const message = document.createElement('div');
    message.className = `message ${type}-message`;

    if (type === 'assistant') {
      const icon = document.createElement('img');
      icon.className = 'assistant-icon';
      icon.src = assistantIcon;
      icon.alt = '';
      message.append(icon);
    }

    const content = document.createElement(type === 'assistant' ? 'div' : 'p');
    content.className = 'message-content';
    if (type === 'assistant') {
      content.innerHTML = renderMarkdown(text);
    } else {
      content.textContent = text;
    }
    message.append(content);
    conversation.append(message);
    conversation.scrollTop = conversation.scrollHeight;
  };

  const appendAssistantStream = () => {
    const message = document.createElement('div');
    message.className = 'message assistant-message';

    const icon = document.createElement('img');
    icon.className = 'assistant-icon';
    icon.src = assistantIcon;
    icon.alt = '';
    message.append(icon);

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = renderMarkdown('');
    message.append(content);
    conversation.append(message);
    conversation.scrollTop = conversation.scrollHeight;
    return content;
  };

  appendMessage(settings.greeting, 'assistant');

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  composer.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      return;
    }

    appendMessage(question, 'user');
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    const assistantContent = appendAssistantStream();
    let streamedAnswer = '';
    let finalized = false;

    const finalizeAssistant = (text) => {
      if (finalized) {
        return;
      }
      finalized = true;
      assistantContent.innerHTML = renderMarkdown(text);
      conversation.scrollTop = conversation.scrollHeight;
    };

    try {
      const response = await fetch(settings.apiUrl || API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          user_id: settings.userId || settings.clientId || 'default',
          environment: settings.environment || 'dam',
          message: question,
          profile: {
            name: '',
            role: '',
            organization: '',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('The chat API response stream is not available.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = 'message';
      const dataLines = [];

      const flushSseBlock = () => {
        if (!dataLines.length) {
          return;
        }

        const rawData = dataLines.join('\n').trim();
        if (!rawData) {
          return;
        }

        try {
          const payload = JSON.parse(rawData);
          if (eventName === 'error') {
            throw new Error(payload?.message || 'Chat request failed');
          }
          if (payload && typeof payload.text === 'string' && payload.text.trim()) {
            streamedAnswer += payload.text;
            assistantContent.innerHTML = renderMarkdown(streamedAnswer);
            conversation.scrollTop = conversation.scrollHeight;
          }
        } catch (error) {
          console.error('Chat widget SSE parse error:', error);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line) {
            flushSseBlock();
            eventName = 'message';
            dataLines.length = 0;
            continue;
          }

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }
      }

      const trailingLines = buffer.split(/\r?\n/);
      for (const line of trailingLines) {
        if (!line) {
          flushSseBlock();
          eventName = 'message';
          dataLines.length = 0;
          continue;
        }

        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      flushSseBlock();

      if (!streamedAnswer.trim()) {
        streamedAnswer = 'I could not find a response for that question.';
      }
      finalizeAssistant(streamedAnswer);
    } catch (error) {
      console.error('Chat widget API error:', error);
      finalizeAssistant('Sorry, I could not connect right now. Please try again.');
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  });
}

const embedScript = document.currentScript;

function boot() {
  const previewRoot = document.querySelector('#app');

  if (previewRoot) {
    createWidget();
  } else {
    createWidget(getScriptConfig(embedScript));
  }
}

if (document.body) {
  boot();
} else {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
}
