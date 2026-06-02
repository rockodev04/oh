// src/core/registry.ts
var magicRegistry = {
  "only-admin": [],
  "only-article": [
    "article-id"
  ],
  "only-chat": [],
  "only-feed": [],
  "only-home": [],
  "only-login": [],
  "only-navbar": [],
  "only-profile": [],
  "only-register": [],
  "only-store": [],
  "only-stream": []
};

// src/core/libris.core.ts
var errorMessages = {
  "article-id": 'This component needs to know which article to display. Add the attribute article-id="123".',
  image: 'The card needs an image. Add the attribute image="your-image-url".',
  title: 'The card needs a title. Add the attribute title="My Title".'
};
var getHumanError = (attr, tagName) => {
  return {
    message: `Component <${tagName}> cannot work without the "${attr}" attribute`,
    hint: errorMessages[attr] ?? `Add the attribute ${attr}="..." to your <${tagName}> component.`
  };
};
var sanitizeText = (text) => {
  const risky = /<(script|img|iframe|object|embed|svg|on\w+)[^>]*?>/gi;
  if (risky.test(text)) {
    console.warn("[LIBRIS] ⚠️ Dangerous content detected and sanitized");
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return text;
};
var hashData = async (data) => {
  const encoder = new TextEncoder;
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
var renderMagicError = (el, attr, tagName) => {
  if (el.previousElementSibling?.tagName.toLowerCase() === "magic-error")
    return;
  const { message, hint } = getHumanError(attr, tagName);
  const descriptor = Array.from(el.attributes).map((a) => `${a.name}="${a.value}"`).join(" ");
  const error = document.createElement("magic-error");
  error._message = message;
  error._hint = hint;
  error._descriptor = descriptor;
  el.classList.add("magic-error-target");
  el.insertAdjacentElement("beforebegin", error);
};
var clearMagicError = (el) => {
  if (el.previousElementSibling?.tagName.toLowerCase() === "magic-error") {
    el.previousElementSibling.remove();
  }
  el.classList.remove("magic-error-target");
};
var validateMagicComponent = (el, requiredAttrs, tagName) => {
  const missing = requiredAttrs.find((attr) => !el.getAttribute(attr));
  if (missing) {
    renderMagicError(el, missing, tagName);
  } else {
    clearMagicError(el);
  }
};
var observeMagicComponents = (tagName, requiredAttrs) => {
  if (requiredAttrs.length === 0)
    return;
  customElements.whenDefined(tagName).then(() => {
    const elements = document.querySelectorAll(tagName);
    elements.forEach((el) => {
      const validate = () => validateMagicComponent(el, requiredAttrs, tagName);
      const observer = new MutationObserver(() => setTimeout(validate, 0));
      observer.observe(el, { attributes: true });
      setTimeout(validate, 0);
    });
  });
};
Object.entries(magicRegistry).forEach(([tag, attrs]) => {
  observeMagicComponents(tag, attrs);
});
customElements.define("magic-error", class extends HTMLElement {
  _message = "";
  _hint = "";
  _descriptor = "";
  connectedCallback() {
    this.setAttribute("role", "alert");
    this.setAttribute("aria-live", "assertive");
    this.style.cssText = `
      display: block;
      background: rgba(167, 139, 250, 0.08);
      color: #E6E6FA;
      border: 1px solid rgba(167, 139, 250, 0.3);
      border-left: 4px solid #a78bfa;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    `;
    this.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <span style="font-size:1.2rem; flex-shrink:0;">\uD83E\uDDD9</span>
        <div>
          <strong style="color:#a78bfa; display:block; margin-bottom:4px;">
            Magic detected a problem
          </strong>
          <span style="color:#E6E6FA;">${this._message}</span>
          <br/>
          <small style="color:#9ca3af; margin-top:4px; display:block;">
            \uD83D\uDCA1 ${this._hint}
          </small>
          ${this._descriptor ? `
            <code style="display:block; margin-top:8px; padding:6px 10px; background:rgba(0,0,0,0.3); border-radius:4px; font-size:0.8rem; color:#34d399;">
              ${this._descriptor}
            </code>
          ` : ""}
        </div>
      </div>
    `;
  }
});
console.log(`\uD83E\uDDD9 LIBRIS initialized — ${Object.keys(magicRegistry).length} components registred`);
export {
  sanitizeText,
  hashData
};
