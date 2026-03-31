import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage ships Gun-backed experiment and feedback plumbing', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../growth/homepage-experiment.js', import.meta.url), 'utf8');

  assert.match(html, /id="heroEyebrow"/);
  assert.match(html, /id="heroHeadlinePrimary"/);
  assert.match(html, /id="heroHeadlineSecondary"/);
  assert.match(html, /id="heroBody"/);
  assert.match(html, /id="heroFeedbackPrompt"/);
  assert.match(html, /id="heroFeedbackStatus"/);
  assert.match(html, /data-growth-feedback="clear"/);
  assert.match(html, /data-growth-feedback="unclear"/);
  assert.match(html, /data-growth-cta="start-here"/);
  assert.match(html, /data-growth-cta="plan-free"/);
  assert.match(html, /data-growth-cta="segment-professional-services"/);
  assert.match(html, /src="https:\/\/cdn\.jsdelivr\.net\/npm\/gun\/gun\.js"/);
  assert.match(html, /src="growth\/homepage-experiment\.js"/);

  assert.match(js, /EXPERIMENT_CONFIG_PATH = \['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'config'\]/);
  assert.match(js, /EXPERIMENT_EVENT_PATH = \['3dvr-portal', 'growth', 'experiments', 'homepage-hero', 'events'\]/);
  assert.match(js, /FEEDBACK_EVENT_PATH = \['3dvr-portal', 'growth', 'feedback', 'homepage-hero'\]/);
  assert.match(js, /function chooseVariant/);
  assert.match(js, /function applyVariant/);
  assert.match(js, /function logView/);
  assert.match(js, /function logCtaClick/);
  assert.match(js, /function submitFeedback/);
});
