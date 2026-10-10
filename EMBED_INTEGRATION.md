# Add the chat widget to your website

Add this script tag to the website page, just before `</body>`:

```html
<script
  src="https://chatwidget.lookm.org/lam-chat-widget.js"
  data-title="Ask Eponymos™"
  data-greeting="Hello! How can I help you?"
  data-placeholder="Type your question..."
  data-user-id="GLOBAL_STABLE_USER_ID"
  data-environment="eponymos"
></script>
```

Replace `GLOBAL_STABLE_USER_ID` with the signed-in person's stable ID. Pass the
same ID for that person on every platform and page load; the widget sends it
unchanged as `user_id` to Agent Engine. Do not include an email address or an ID
that changes between sessions. If the visitor is signed out, do not render the
widget script.
## Supported data attributes

| Attribute | What it does | Example |
| --- | --- | --- |
| `data-title` | Optional title override. Defaults to `Ask Eponymos™`. | `data-title="Eponymos Support"` |
| `data-greeting` | Initial assistant message when there is no saved history. Defaults to `How may I help you?`. | `data-greeting="Hello! How can I help you?"` |
| `data-placeholder` | Message input placeholder. Defaults to `Ask a question...`. | `data-placeholder="Type your question..."` |
| `data-user-id` | Stable global ID of the signed-in person. The widget sends it unchanged as Agent Engine's `user_id`. | `data-user-id="GLOBAL_STABLE_USER_ID"` |
| `data-environment` | Product context sent as `environment_id` and stored as session `product_id`. Supported values: `dam`, `eponymos`, `media_center`. Defaults to `dam`. | `data-environment="eponymos"` |
| `data-api-url` | Optional chat API endpoint override. Normally omitted; the deployed widget bundle has its API URL configured. | `data-api-url="https://api.example.com/api/chat"` |
