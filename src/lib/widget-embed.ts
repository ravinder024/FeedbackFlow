export function generateWidgetEmbedCode(testGroupId: string, memberToken: string, apiUrl: string): string {
  const scriptUrl = `${apiUrl}/widget/feedback-widget.js`;
  
  return `
<!-- FeedbackFlow Widget -->
<script src="${scriptUrl}"></script>
<script>
  window.FeedbackFlow.init({
    testGroupId: '${testGroupId}',
    memberToken: '${memberToken}',
    apiUrl: '${apiUrl}'
  });
</script>
`.trim();
}

export function generateWidgetSnippet(testGroupId: string, memberToken: string, apiUrl: string): string {
  return `
// Add this code to your HTML file, preferably just before the closing </body> tag
${generateWidgetEmbedCode(testGroupId, memberToken, apiUrl)}
`.trim();
}

export function generateWidgetInstructions(domain: string): string {
  return `
To enable feedback collection on ${domain}, follow these steps:

1. Copy the code snippet below
2. Add it to your website's HTML, preferably just before the closing </body> tag
3. The widget will automatically initialize and validate the domain

Note: The widget will only work on ${domain} and its subdomains. If you need to test on a different domain, please update your test group settings.
`.trim();
} 