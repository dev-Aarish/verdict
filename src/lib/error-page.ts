export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Projection fault · Verdict</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @font-face {
        font-family: "Playfair Display";
        font-style: normal;
        font-weight: 400 900;
        font-display: swap;
        src: url("/fonts/playfair-display-latin.woff2") format("woff2");
      }
      @font-face {
        font-family: "JetBrains Mono";
        font-style: normal;
        font-weight: 100 800;
        font-display: swap;
        src: url("/fonts/jetbrains-mono-latin.woff2") format("woff2");
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #151411;
        color: #eee7d9;
        font: 15px/1.5 system-ui, -apple-system, sans-serif;
        padding: 1.5rem;
      }
      .stage {
        max-width: 30rem;
        width: 100%;
        text-align: center;
      }
      .eyebrow {
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #9d352f;
        margin: 0 0 1.75rem;
      }
      .stamp {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 8.5rem;
        height: 8.5rem;
        border: 3px solid #9d352f;
        box-shadow: inset 0 0 0 2px #151411, inset 0 0 0 3px #9d352f;
        font-family: "Playfair Display", Georgia, serif;
        font-weight: 900;
        font-size: 4.5rem;
        line-height: 1;
        color: #9d352f;
        transform: rotate(-4deg);
      }
      h1 {
        font-family: "Playfair Display", Georgia, serif;
        font-size: 1.75rem;
        font-weight: 600;
        line-height: 1.1;
        margin: 2.5rem 0 0.75rem;
      }
      p {
        color: #74716c;
        margin: 0 0 2.25rem;
      }
      .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      a, button {
        padding: 0.75rem 1.5rem;
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        text-decoration: none;
        border: 2px solid transparent;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .primary {
        background: #d1a757;
        border-color: #d1a757;
        color: #151411;
      }
      .primary:hover { background: transparent; color: #d1a757; }
      .secondary {
        background: transparent;
        border-color: rgba(116, 113, 108, 0.4);
        color: #eee7d9;
      }
      .secondary:hover { border-color: #d1a757; color: #d1a757; }
    </style>
  </head>
  <body>
    <div class="stage">
      <p class="eyebrow">Projection fault</p>
      <div class="stamp" aria-hidden="true">500</div>
      <h1>The projector jammed mid-show.</h1>
      <p>Something went wrong on our end. Give it another try — if it keeps jamming, come back in a minute.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
