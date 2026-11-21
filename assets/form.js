// Lead form: fills record-keeping fields, posts via fetch (falls back to plain POST without JS).
(function () {
  document.querySelectorAll('form.lead').forEach(function (f) {
    var status = f.querySelector('.form-status');
    function stamp() {
      f.page_url.value = location.href;
      f.submitted_at.value = new Date().toISOString();
      f.user_agent.value = navigator.userAgent.slice(0, 250);
    }
    f.addEventListener('submit', function (e) {
      stamp();
      if (!f.checkValidity()) {
        e.preventDefault();
        status.className = 'form-status err';
        status.textContent = 'Please fill in name, phone, email, a 5-digit ZIP, your area and what happened.';
        f.reportValidity && f.reportValidity();
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
          btn.disabled = false; status.className = 'form-status err';
          status.textContent = 'Sorry, that did not go through. Please try again or use the email link below.';
        });
    });
  });
})();
