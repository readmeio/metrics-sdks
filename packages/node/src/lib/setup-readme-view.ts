export function buildSetupView({ baseUrl }) {
  const webhookVerifiedHtml = `
      <div id='webhook-fail' class='hidden'>
        <h2>❌ Webhook Not Verified</h2>
        <p>Uh oh! We couldn't verify your webhook. Make sure you've set up your webhook correctly.</p>
      </div>
      <div id='webhook-success' class='hidden'>
        <h2>✅ Webhook Setup and Verified</h2>
        <p id='userObject'></p>
        <p>
          Webhook running at:
          <a href="${baseUrl}/readme-webhook">${baseUrl}/readme-webhook</a>
        </p>
      </div>
      <div id='webhook-test'>
        <h2>🤔 Verify Webhook Configuration</h2>
        <p>What is a webhook? We should probably explain here.</p>
        <form id='testWebhookForm'>
          <input type="text"  id="email" name="email" value=""/>
          <input type="submit" value="Submit">
        </form>
      </div>
    `;

  const metricsVerifiedHtml = `
      <div id='metrics-fail' class='hidden'>
        <h2>❌ Developer Metrics Setup and Verified</h2>
        <p>Uh oh! We couldn't verify your developer metrics. Make sure you've set up your developer metrics correctly.</p>
      </div>
      <div id='metrics-success' class='hidden'>
        <h2>✅ Developer Metrics Setup and Verified</h2>
        <p> Everything is set up correctly! </p>
      </div>
      <div id='metrics-test'>
        <h2>🤔 Verify Developer Metrics Configuration</h2>
        <p>What are developer metrics? We should probably explain here.</p>
        <p>Listening for API calls.... Make a call to your API locally to test.</p>
      </div>
    `;

  const webhookScriptHtml = `
    var form = document.getElementById("testWebhookForm");
    form.addEventListener('submit', testWebhook);

    function testWebhook(e) {
      e.preventDefault();
      // make request to /webhook-test with email in input
      const email = document.querySelector('#email').value;
      fetch('${baseUrl}/webhook-test?email=' + email)
        .then(response => response.json())
        .then(data => {
          const { webhookVerified, user } = data;
          document.getElementById('webhook-test').classList.add('hidden');
          if (!webhookVerified) {
            document.getElementById('webhook-fail').classList.remove('hidden');
          } else if (JSON.stringify(user) === '{}') {
            document.getElementById('webhook-success').classList.remove('hidden');
            document.getElementById('userObject').innerHTML = 'Recieved empty object, does that user exist?';
            window.webhooksSuccess = true;
          } else {
            document.getElementById('webhook-success').classList.remove('hidden');
            document.getElementById('userObject').innerHTML = JSON.stringify(user, null, 2);
            window.webhooksSuccess = true;
          }
        })
        .catch(error => {
          // Handle errors while making the request
          console.error('Error:', error);
        });
    }
  `;

  const metricsScriptHtml = `
    fetch('${baseUrl}/metrics-test')
      .then(response => response.json())
      .then(data => {
        const { metricsVerified } = data;
        document.getElementById('metrics-test').classList.add('hidden');
        if (!metricsVerified) {
          document.getElementById('metrics-fail').classList.remove('hidden');
        } else {
          document.getElementById('metrics-success').classList.remove('hidden');
          window.metricsSuccess = true;
        }
      });
  `;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>ReadMe Setup</title>
    <style>
      .hidden {
        display: none;
      }
    </style>
  </head>
  <body>
    <h1>ReadMe Setup</h1>

    ${webhookVerifiedHtml}

    ${metricsVerifiedHtml}

    <div id='success' class='hidden'>
      <h2>Great! Everything seems to be working</h2>
      <p>Visit your Developer Dashboard in ReadMe here: <a href='/'>https://dash.readme.com/sfjldjfs</a></p>
    </div>
  </body>
  <script>
    ${webhookScriptHtml}
    ${metricsScriptHtml}

    setInterval(() => {
      if (window.webhooksSuccess && window.metricsSuccess) {
        document.getElementById('success').classList.remove('hidden');
      }
    }, 1000);
  </script>
</html>
  `;
}
