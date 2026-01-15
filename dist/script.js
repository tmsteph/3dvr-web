const helpButton = document.querySelector('[data-help-button]');
const helpModal = document.querySelector('[data-help-modal]');
const helpClose = document.querySelector('[data-help-close]');
const motionToggle = document.querySelector('[data-motion-toggle]');

if (helpButton && helpModal) {
  const openModal = () => {
    helpModal.classList.add('active');
    helpModal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    helpModal.classList.remove('active');
    helpModal.setAttribute('aria-hidden', 'true');
  };

  helpButton.addEventListener('click', openModal);
  helpClose?.addEventListener('click', closeModal);
  helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
      closeModal();
    }
  });
}

if (motionToggle) {
  const setMotion = (reduced) => {
    document.body.classList.toggle('reduced-motion', reduced);
    motionToggle.setAttribute('aria-pressed', String(reduced));
    motionToggle.textContent = reduced ? 'Motion: Reduced' : 'Motion: On';
    localStorage.setItem('reducedMotion', String(reduced));
  };

  const saved = localStorage.getItem('reducedMotion') === 'true';
  setMotion(saved);

  motionToggle.addEventListener('click', () => {
    setMotion(!document.body.classList.contains('reduced-motion'));
  });
}

const wizardForm = document.querySelector('[data-wizard-form]');
const output = document.querySelector('[data-plan-output]');
const copyButton = document.querySelector('[data-copy-plan]');
const downloadButton = document.querySelector('[data-download-plan]');

const vibeDescriptions = {
  "minimal-luxe": "Minimal luxe with calm gradients and clean typography.",
  "playful-maker": "Playful maker energy with bright accents and micro-illustrations.",
  "bold-tech": "Bold tech vibe with strong contrast and geometric layout.",
  "warm-community": "Warm community feel with soft shapes and inclusive copy.",
  "nature-digital": "Nature + digital blend with organic tones and modular sections.",
  "retro-future": "Retro-future with glowing highlights and crisp UI panels."
};

const createPlan = (data) => {
  const needs = data.needs.length ? data.needs.join(', ') : 'a focused website and support plan';
  return `Project kickoff for ${data.project || 'your business'}\n\n1. Snapshot\n- Lead: ${data.name || 'Creator'}\n- Contact: ${data.email || 'email@example.com'}\n- Primary needs: ${needs}\n- Style vibe: ${vibeDescriptions[data.vibe] || 'modern and open-source friendly'}\n\n2. Website outline\n- Hero: What you do + primary CTA (${data.project || 'Project'} launch)\n- Social proof: community stories + trust signals\n- Offer: clear plan breakdown + pricing\n- FAQ + Contact\n\n3. Automation ideas\n- Intake form for new leads\n- Follow-up email + reminder workflow\n- Portal onboarding checklist\n\nNext steps\n- We review your intake within 24 hours\n- First draft site delivered in 3-5 days\n- Ongoing support via portal and weekly consults\n\nNotes\n${data.notes || 'No additional notes yet.'}`;
};

const updatePlan = () => {
  if (!wizardForm || !output) return;
  const formData = new FormData(wizardForm);
  const data = {
    name: formData.get('name')?.toString().trim(),
    project: formData.get('project')?.toString().trim(),
    email: formData.get('email')?.toString().trim(),
    notes: formData.get('notes')?.toString().trim(),
    vibe: formData.get('vibe')?.toString(),
    needs: formData.getAll('needs')
  };

  output.textContent = createPlan(data);
};

if (wizardForm && output) {
  wizardForm.addEventListener('input', updatePlan);
  wizardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updatePlan();
  });
  updatePlan();
}

if (copyButton && output) {
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy this plan';
      }, 2000);
    } catch (error) {
      copyButton.textContent = 'Copy failed';
    }
  });
}

if (downloadButton && output) {
  downloadButton.addEventListener('click', () => {
    const blob = new Blob([output.textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '3dvr-plan.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}
