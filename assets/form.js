// Lead form: multi-step quiz (progressive enhancement), fills record-keeping fields,
// posts via fetch to the form provider (falls back to a plain POST without JS).
(function () {
  document.querySelectorAll('form.lead').forEach(function (f) {
    var status = f.querySelector('.form-status');
    var steps = [].slice.call(f.querySelectorAll('.step'));
    var bar = f.querySelector('.progress span');
    var count = f.querySelector('.stepcount');
    var back = f.querySelector('[data-back]');
    var next = f.querySelector('[data-next]');
    var cur = 0;
    function stamp() {
      f.page_url.value = location.href;
      f.submitted_at.value = new Date().toISOString();
      f.user_agent.value = navigator.userAgent.slice(0, 250);
    }
    function fields(i) { return [].slice.call(steps[i].querySelectorAll('input:not([type=hidden]):not(.hp),select,textarea')); }
    function stepValid(i) {
      var ok = true;
      fields(i).forEach(function (el) {
        if (ok && !el.checkValidity()) { ok = false; el.reportValidity && el.reportValidity(); }
      });
      return ok;
    }
    function show(i, focus) {
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
      if (count) count.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      back.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      status.textContent = ''; status.className = 'form-status';
      if (focus) { var l = steps[i].querySelector('legend'); if (l) { l.setAttribute('tabindex', '-1'); l.focus({ preventScroll: true }); } }
    }
    if (steps.length > 1) {
      f.classList.add('js');
      // start at the first step that is not already answered (e.g. a service page preselects the project type)
      var start = 0;
      while (start < steps.length - 1 && fields(start).every(function (el) { return el.type === 'radio' ? !!f.querySelector('input[name="' + el.name + '"]:checked') : !!el.value; })) start++;
      show(start, false);
      next.addEventListener('click', function () { if (stepValid(cur)) show(cur + 1, true); });
      back.addEventListener('click', function () { if (cur > 0) show(cur - 1, true); });
      steps.forEach(function (s, k) {
        s.querySelectorAll('input[type=radio]').forEach(function (r) {
          r.addEventListener('change', function () { if (k === cur && k < steps.length - 1) setTimeout(function () { show(k + 1, true); }, 180); });
        });
      });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && cur < steps.length - 1 && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); }
      });
    }
    f.addEventListener('submit', function (e) {
      stamp();
      if (!f.checkValidity()) {
        e.preventDefault();
        // jump to the first step with a problem
        for (var i = 0; i < steps.length; i++) { if (fields(i).some(function (el) { return !el.checkValidity(); })) { if (steps.length > 1) show(i, true); stepValid(i); break; } }
        status.className = 'form-status err';
        status.textContent = 'Please answer each step: project type, your area and a 5-digit ZIP, timing, then name, phone and email.';
        return;
      }
      if (f.dataset.configured !== '1') {
        e.preventDefault();
        status.className = 'form-status err';
        status.textContent = 'Online requests are being switched on. Please try again shortly.';
        return;
      }
      e.preventDefault();
      var btn = f.querySelector('button[type=submit]');
      btn.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
      var data = new FormData(f);
      if (!data.get('tcpa_consent')) data.set('tcpa_consent', 'no');
      fetch(f.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.success !== false) { location.href = f.dataset.thanks; }
          else { throw new Error((res.j && res.j.message) || 'Send failed'); }
        })
        .catch(function () {
          btn.disabled = false; f.classList.add('failed'); status.className = 'form-status err';
          status.textContent = 'Sorry, that did not go through. Please try again in a few minutes.';
        });
    });
  });
  // Scroll reveal (progressive; elements are visible without JS)
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = document.querySelectorAll('.reveal');
    document.documentElement.classList.add('rv');
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); io.observe(el); });
  }
  // Mobile sticky CTA: hide while a lead form is on screen.
  var cta = document.querySelector('.sticky-cta'), form = document.querySelector('form.lead');
  if (cta && form && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { cta.classList.toggle('hide', en[0].isIntersecting); }).observe(form);
  }
})();
