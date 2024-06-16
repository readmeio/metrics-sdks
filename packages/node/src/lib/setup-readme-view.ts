import { createHash } from 'crypto';

const hashToken = (token: string): string => createHash('sha512').update(token).digest('hex');

export function buildSetupView({
  baseUrl,
  readmeAPIKey,
  subdomain,
  stableVersion,
  disableWebhook,
  disableMetrics,
}: {
  baseUrl: string;
  disableMetrics?: boolean;
  disableWebhook?: boolean;
  readmeAPIKey: string;
  stableVersion: string;
  subdomain: string;
}) {
  const dashUrl = `https://dash.readme.com/project/${subdomain}/v${stableVersion}/metrics/developers`;
  let webhookScriptHtml = `
    var form = document.getElementById("testWebhookForm");
    form.addEventListener('submit', testWebhook);

    function updateElement(className, user) {
      let elements = document.getElementsByClassName(className);

      for(let i=0; i<elements.length; i++) {
          elements[i].innerHTML = user;
      }
    }

    function updateUser(user) {
        updateElement('userObject', JSON.stringify(user, undefined, 2));
    }

    function updateWarning(warning) {
        updateElement('warningText', warning);
    }


    function testWebhook(e) {
      e.preventDefault();
      // make request to /webhook-test with email in input
      const email = document.querySelector('#email').value;
      fetch('${baseUrl}/webhook-test?email=' + email)
        .then(response => response.json())
        .then(data => {
          const { webhookError, user } = data;
          document.getElementById('webhook-test').classList.add('hidden');
          if (webhookError === 'FAILED_VERIFY' || webhookError === 'UNVERIFIED') {
            document.getElementById('webhook-fail').classList.remove('hidden');
            updateUser(data.error);
          } else if (webhookError === 'EMPTY_USER') {
            const webhookSuccess = document.getElementById('webhook-warning').classList.remove('hidden');

            updateWarning('Recieved empty object, does that user exist?');
            updateUser(user);
            window.webhookSuccess = true;
          } else if (webhookError === 'MISSING_KEYS') {
            const webhookSuccess = document.getElementById('webhook-warning').classList.remove('hidden');

            updateWarning('Missing required array \`keys\` from the user data we received.')
            updateUser(user);
            window.webhookSuccess = false;
          } else if (!webhookError) {
            document.getElementById('webhook-success').classList.remove('hidden');
            updateUser(user);
            window.webhookSuccess = true;
          }
        })
        .catch(error => {
          // Handle errors while making the request
          console.error('Error:', error);
        });
    }
  `;

  let metricsScriptHtml = `
    const token = '${hashToken(readmeAPIKey)}';
    const query = new URLSearchParams(\`token=\${token}&subdomain=${subdomain}\`);
    const socket = new WebSocket(new URL(\`?\${query}\`, 'wss://m.readme.io'));
    socket.addEventListener('message', async ({ data }) => {
      document.getElementById('metrics-test').classList.add('hidden');
      document.getElementById('metrics-success').classList.remove('hidden');
      window.metricsSuccess = true;
    });

    // TODO: should we do something here if it takes too long?
    // Maybe show some trouble shooting steps?
  `;

  let webhookVerifiedHtml = `
    <section class="card">
      <div id="webhook-test">
        <h2 class="card-heading">
          <span>
            <span class="card-status"></span>
            Test Your Data
          </span>
          <span class="card-badge">Webhook</span>
        </h2>
        <p>Test this configuration by entering an email in your database.
        <form id="testWebhookForm">
        <input id="email" name="email" placeholder="owlbert@readme.io" required type="email" />
        <button>Submit</button>
        </form>
        <p class="info">
          <span class="info-header">WHAT IS THIS?</span>
          When a user logs into your docs, we make a request to this API to retrieve data about that user to fill in their API keys in your docs and display their logs.</p>
      </div>
      <div class="hidden" id="webhook-fail">
        <h2 class="card-heading">
            <span>
              <span class="card-status"></span>
              Not Verified
            </span>
            <span class="card-badge">Webhook</span>
          </h2>
          <p>We couldn’t verify your webhook. Send us an email at <a href="mailto:devdash@readme.io">devdash@readme.io</a> and we'll help you out!
          <p>Error we recieved:</p>
          <pre class="userObject"></pre>
        </div>
      </div>
      <div class="hidden" id="webhook-success">
        <h2 class="card-heading">
          <span>
            <span class="card-status card-status_done"></span>
            Verified
          </span>
          <span class="card-badge">Webhook</span>
        </h2>
        <p className='success'></p>
        <p>
          We recieved a user that appears valid!<br>
          Webhook running locally at:
          <a href="${baseUrl}/readme-webhook">${baseUrl}/readme-webhook</a><br>
          Enter the production version of that URL in your ReadMe dashboard.
        </p>
        <p>User we recieved:</p>
        <pre class="userObject"></p>
      </div>
      <div class="hidden" id="webhook-warning">
        <h2 class="card-heading">
          <span>
            <span class="card-status card-status_warning"></span>
            Verified, but invalid data
          </span>
          <span class="card-badge">Webhook</span>
        </h2>
        <p class="warningText"></p>
        <pre class="userObject"></pre>
        <p>
          Webhook running at:
          <a href="${baseUrl}/readme-webhook">${baseUrl}/readme-webhook</a>
      </div>
    </section>
  `;

  if (disableWebhook) {
    webhookVerifiedHtml = `
      <section class="card">
        <div id="webhook-success">
          <h2 class="card-heading">
            <span>
              <span class="card-status"></span>
              Webhook Disabled
            </span>
            <span class="card-badge">Webhook</span>
          </h2>
          <p>
            The webhook has been disabled. You can re-enable it by removing "webhookDisabled: true" from your configuration.
        </div>
        <script>window.webhookSuccess = true;</script>
      </section>`;

    webhookScriptHtml = '';
  }

  let metricsVerifiedHtml = `
    <section class="card">
      <div id="metrics-test">
        <h2 class="card-heading">
          <span>
            <span class="card-status card-status_pending"></span>
            Listening for API Calls
          </span>
          <span class="card-badge">API Calls</span>
        </h2>
        <p>Make a call to your API locally to verify everything is set up properly.
        <p class="info">
          <span class="info-header">WHAT IS THIS?</span>
          Sending API logs to ReadMe lets you know who’s using your API, the errors they’re receiving, and allow them to view their own logs directly in your docs when logged in.</p>
      </div>
      <div id="metrics-fail" class="hidden">
        <h2 class="card-heading">
          <span>
            <span class="card-status"></span>
            Not Verified
          </span>
          <span class="card-badge">API Calls</span>
        </h2>
        <p>Uh oh! We couldn't verify your API calls. Don’t be afraid to ask for help: <a href="mailto:devdash@readme.io">devdash@readme.io</a>
      </div>
      <div id="metrics-success" class="hidden">
        <h2 class="card-heading">
          <span>
            <span class="card-status card-status_done"></span>
            Verified
          </span>
          <span class="card-badge">API Calls</span>
        </h2>
        <p>API calls are being recieved by ReadMe! 👌
      </div>
    </section>
    `;

  if (disableMetrics) {
    metricsVerifiedHtml = `
      <section class="card">
        <div id="metrics-test">
          <h2 class="card-heading">
            <span>
              <span class="card-status"></span>
              Metrics Disabled
            </span>
            <span class="card-badge">Metrics</span>
          </h2>
          <p class="userObject"></p>
          <p>
            Developer Metrics has been disabled. You can re-enable it by removing "disableMetrics: true" from your configuration.
        </div>
        <script>window.metricsSuccess = true;</script>
      </section>`;

    metricsScriptHtml = '';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<meta charset="UTF-8" />
<meta content="width=device-width, initial-scale=1" name="viewport">
<title>ReadMe Setup</title>
<style>
  :root {
    --blue: hsl(205, 99%, 48%);
    --blue-hsl: 205, 99%, 48%;
    --green: #12ca93;
    --yellow: #f5a623;
    --red: #e95f6a;
    --font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    --font-family-mono: "SF Mono", SFMono-Regular, ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace;
    --color-bg-page: #fff;
    --color-text-default: #242e34;
    --color-text-minimum: #637288;
    --color-decor: rgba(0,0,0,0.1);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg-page: #242e34;
      --color-text-default: #fff;
      --color-text-minimum: #adb4c1;
      --color-decor: rgba(255,255,255,0.1);
    }
  }
  .hidden {
    display: none;
  }
  body {
    background: var(--color-bg-page);
    color: var(--color-text-default);
    font-family: var(--font-family);
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    line-height: 1.4;
    margin: 0;
    padding: 0;
  }
  main {
    margin: 0 auto;
    max-width: 60ch;
    padding: 2em;

    > * {
      margin: 1em 0;
    }
  }
  h1,
  h2,
  h3 {
    margin: 0;
  }
  hr {
    background: var(--color-decor);
    border: 0;
    height: 1px;
    margin: 2em 0;
  }
  input,
  button {
    border-radius: 0.5em;
    color: var(--color-text-default);
    padding: 0.5em 1em;
  }
  input {
    background: var(--color-bg-page);
    border: 1px solid var(--color-decor);
  }
  button {
    background: var(--color-text-default);
    border: 0;
    color: var(--color-bg-page);
    font-weight: 600;
    text-transform: uppercase;
  }

  a {
    color: currentcolor;
  }

  ol {
    padding: 0;

    .card-badge {
      margin-left: 5px;
    }
  }

  pre {
    background: var(--color-text-default);
    border-radius: 5px;
    color: var(--color-bg-page);
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
    font-size: 12px;
    overflow: auto;
    padding: 10px;
  }

  .card,
  .content {
    padding: 1.5em;

    .card-badge {
      border: 1px solid var(--color-decor);
      border-radius: 0.5em;
      color: var(--color-text-minimum);
      display: inline-flex;
      font-size: 11px;
      font-weight: 400;
      padding: 0.2em 0.5em;
    }
  }

  .card {
    border: 1px solid var(--color-decor);
    border-radius: 0.5em;

    .card-heading {
      align-items: center;
      display: flex;
      font-size: 1em;
      justify-content: space-between;
      gap: 0.5em;

    }

    .card-status {
      --status-color: var(--color-decor);
      background: var(--status-color);
      border: 1px solid var(--color-decor);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 2px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.1);
      border-radius: 0.5em;
      display: inline-flex;
      height: 0.5em;
      position: relative;
      width: 0.5em;

      &::after {
        animation: status 2s -1s infinite linear;
        border: 7.5px solid var(--status-color);
        border-radius: 1em;
        content: '';
        display: block;
        height: 100%;
        inset: -7.5px;
        opacity: .25;
        position: absolute;
        width: 100%;
      }

      &.card-status_pending {
        --status-color: var(--red);
        animation: blink 2s steps(1) infinite;
      }

      &.card-status_done {
        --status-color: var(--green);

        &::after {
          display: none;
        }
      }

      &.card-status_warning {
        --status-color: var(--yellow);

        &::after {
          display: none;
        }
      }
    }
  }
  .tooltip {
    border-bottom: 1px dotted;
    display: inline-block;
    position: relative;

    &:hover,
    &:active,
    &:focus {
      .tooltip-img {
        display: block;
      }
    }

    .tooltip-img {
      bottom: 20px;
      display: none;
      position: absolute;
      right: 0;
    }
  }
  .footer {
    display: flex;
    justify-content: center;
    opacity: 0.5;
  }
  @keyframes blink {
    0% {
      background-color: var(--color-decor);
    }
    50% {
      background-color: var(--red);
    }
  }
  @keyframes status {
    0% {
      opacity: .25;
      transform: scale(0);
    }
    12.5% {
      opacity: .25;
    }
    33%,
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }

  .info {
    background: rgba(0,0,0,0.05);
    border-radius: 5px;
    font-size: 14px;
    margin: 20px 0 0;
    padding: 10px;

    .info-header {
      color: var(--color-text-minimum);
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    @media (prefers-color-scheme: dark) {
      background: rgba(255,255,255,0.05);
    }
  }

  .warning {
    background: #fcf8e3;
    border-left: 5px solid #f0ad4e;
    border-radius: 3px;
    padding: 10px;
  }

  /* Syntax Highlighting */
  .cm-variable {
    color: #f07178;
  }

  .cm-keyword {
    color: #c792ea;
  }

  .cm-def {
    color: #82aaff;
  }

  .cm-operator {
    color: #89ddff;
  }

  .cm-variable-2 {
    color: #eff;
  }

  .cm-property {
    color: #c792ea;
  }

  .cm-atom {
    color: #f78c6c;
  }

  .cm-comment {
    color: #676e95;
  }
</style>
<main>

<div id="success" class="hidden">
  <section class="content">
    <h1>Everything seems to be working! 🙂</h1>
    <p>Visit your Developer Dashboard at <a href="${dashUrl}">${dashUrl}</a>
  </section>
</div>

${webhookVerifiedHtml}

${metricsVerifiedHtml}

<hr>

<section class="content">
  <h1>I need help getting setup!</h1>
  <p>If you’ve made it this far and still need help, feel free to email us at <a href="mailto:devdash@readme.io">devdash@readme.io</a>. That email goes directly to
    <a class="tooltip" role="button" tabindex="0">
      <span>the engineers who built this</span>
      <img alt="Bill Gates on a desk with a computer" class="tooltip-img" src="//readmeio.github.io/pix/bill.jpg">
    </a>. Also, check out <a target="blank" href="//docs.readme.com/main/docs/sending-api-logs">the docs</a>!
  <hr>
  <h2>Do I need to setup both, webhooks and API calls?</h2>
  <p>No, you can have partial functionality:
  <ol>
    <li>Get API keys and logs in your docs<div class="card-badge">Webhooks</div>
    <li>Admin UI for your API<div class="card-badge">API Calls</div>
  </ol>
  <pre>
<div class="cm-s-neo"><span class="cm-variable">readme</span>(<span class="cm-keyword">async</span> (<span class="cm-def">req</span>) <span class="cm-operator">=&gt;</span> {
  <span class="cm-keyword">const</span> <span class="cm-def">user</span> <span class="cm-operator">=</span> <span class="cm-variable">getUser</span>({ <span class="cm-property">byEmail</span>: <span class="cm-variable">getUserByEmail</span>, <span class="cm-property">apiKey</span>: <span class="cm-variable">getUserByAPIKey</span> });

  <span class="cm-keyword">return</span> {
    <span class="cm-property">email</span>: <span class="cm-variable-2">user</span>.<span class="cm-property">email</span>,
    <span class="cm-property">keys</span>: <span class="cm-variable-2">user</span>.<span class="cm-property">apiKeys</span>,
    <span class="cm-property">name</span>: <span class="cm-variable-2">user</span>.<span class="cm-property">name</span>,
  };
}, {
    <span class="cm-property">disableMetrics</span>: <span class="cm-atom">false</span>, <span class="cm-comment">// disable sending api logs to ReadMe</span>
    <span class="cm-property">disableWebhook</span>: <span class="cm-atom">false</span> <span class="cm-comment">// disable webhooks functionality to get keys and logs in the docs</span>
});
</div></pre>
</section>

<footer class="footer">
  <svg width="28" height="21" viewBox="0 0 28 21" fill="none">
    <title>ReadMe Logo</title>
    <path
      d="M25.5003 0.839819H18.7622C16.3949 0.839819 14.4179 2.49731 13.9194 4.71407C13.4209 2.49731 11.4441 0.839819 9.07665 0.839819H2.33858C1.04697 0.839819 0 1.88679 0 3.17828V15.0345C0 16.3261 1.04697 17.3731 2.33858 17.3731H6.80966C6.80966 17.3731 6.80978 17.3732 6.80989 17.3732C11.4729 17.3874 13.0018 18.4825 13.7386 20.7204C13.769 20.7895 13.8392 20.8397 13.9195 20.8397C14.0001 20.8397 14.07 20.7901 14.1001 20.7204C14.8367 18.4825 16.366 17.3874 21.0289 17.3732C21.029 17.3732 21.029 17.3731 21.0291 17.3731H25.5004C26.792 17.3731 27.839 16.3261 27.839 15.0345V3.17828C27.839 1.88679 26.792 0.839706 25.5004 0.839706L25.5003 0.839819ZM11.6811 13.5402C11.6811 13.6781 11.5694 13.7898 11.4315 13.7898H3.81578C3.67791 13.7898 3.56617 13.6781 3.56617 13.5402V12.5924C3.56617 12.4546 3.67791 12.3428 3.81578 12.3428H11.4315C11.5694 12.3428 11.6811 12.4546 11.6811 12.5924V13.5402ZM11.6811 10.5902C11.6811 10.7281 11.5694 10.8398 11.4315 10.8398H3.81578C3.67791 10.8398 3.56617 10.7281 3.56617 10.5902V9.64242C3.56617 9.50456 3.67791 9.39281 3.81578 9.39281H11.4315C11.5694 9.39281 11.6811 9.50456 11.6811 9.64242V10.5902ZM11.6811 7.64021C11.6811 7.77808 11.5694 7.88982 11.4315 7.88982H3.81578C3.67791 7.88982 3.56617 7.77808 3.56617 7.64021V6.69243C3.56617 6.55456 3.67791 6.44281 3.81578 6.44281H11.4315C11.5694 6.44281 11.6811 6.55456 11.6811 6.69243V7.64021ZM24.2726 13.5402C24.2726 13.6781 24.1608 13.7898 24.023 13.7898H16.4075C16.2696 13.7898 16.1579 13.6781 16.1579 13.5402V12.5924C16.1579 12.4546 16.2696 12.3428 16.4075 12.3428H24.023C24.1608 12.3428 24.2726 12.4546 24.2726 12.5924V13.5402ZM24.2726 10.5902C24.2726 10.7281 24.1608 10.8398 24.023 10.8398H16.4075C16.2696 10.8398 16.1579 10.7281 16.1579 10.5902V9.64242C16.1579 9.50456 16.2696 9.39281 16.4075 9.39281H24.023C24.1608 9.39281 24.2726 9.50456 24.2726 9.64242V10.5902ZM24.2726 7.64021C24.2726 7.77808 24.1608 7.88982 24.023 7.88982H16.4075C16.2696 7.88982 16.1579 7.77808 16.1579 7.64021V6.69243C16.1579 6.55456 16.2696 6.44281 16.4075 6.44281H24.023C24.1608 6.44281 24.2726 6.55456 24.2726 6.69243V7.64021Z"
      fill="var(--color-text-minimum)" />
  </svg>
</footer>

<script>
  ${webhookScriptHtml}
  ${metricsScriptHtml}

  setInterval(() => {
    if (window.webhookSuccess && window.metricsSuccess) {
      document.getElementById('success').classList.remove('hidden');
    }
  }, 1000);
</script>
  `;
}
