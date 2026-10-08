# Add the chat widget to your website

Add this script tag to
the website page, just before `</body>`:

```html
<script
  src="https://chatwidget.lookm.org/lam-chat-widget.js"
  data-title="Eponymos Assistant"
  data-greeting="Hello! How can I help you?"
  data-placeholder="Type your question..."
  data-client-id="eponymos"
  data-environment="eponymos"
></script>
```

The `src` is the deployed widget
script and should not be changed by the site integrator.

## Supported data attributes

| Attribute | What it does | Example |
| --- | --- | --- |
| `data-title` | Title shown in the chat panel. | `data-title="Eponymos Assistant"` |
| `data-greeting` | Initial assistant message when there is no saved history. | `data-greeting="Hello! How can I help you?"` |
| `data-placeholder` | Placeholder in the message input. | `data-placeholder="Type your question..."` |
| `data-client-id` | Stable site/widget identifier. Different values keep site conversations separate. | `data-client-id="eponymos"` |
| `data-user-id` | Stable ID of the logged-in person. The widget prefixes it with the client ID. | `data-user-id="user-123"` |
| `data-environment` | Product environment sent with chat requests: `dam`, `eponymos`, or `media_center`. | `data-environment="eponymos"` |

If `data-title`, `data-greeting`, or `data-placeholder` are omitted, the
widget uses its built-in display defaults.

The widget stores each Agent Engine `session_id` in browser `localStorage`, keyed
by user and environment. A new conversation clears that local ID; Agent Engine
remains the source of truth for the previous session and its history.
