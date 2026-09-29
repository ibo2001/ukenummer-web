// Ukenummer site — nav toggle, smooth scroll, scroll reveal, and the live week number +
// holiday table. No dependencies. Week math is ISO 8601, the same as the app.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.hasAttribute('data-open');
      if (open) { nav.removeAttribute('data-open'); } else { nav.setAttribute('data-open', ''); }
      toggle.setAttribute('aria-expanded', String(!open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.removeAttribute('data-open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();

// Scroll reveal — progressive enhancement. The hidden start state is gated behind the `js`
// class (added in the page head), so with JS disabled all content renders visibly.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  var i;
  if (reduce || !('IntersectionObserver' in window) || !els.length) {
    for (i = 0; i < els.length; i++) { els[i].classList.add('in'); }
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  for (i = 0; i < els.length; i++) { io.observe(els[i]); }
})();

// Live week number and Norwegian public holidays.
(function () {
  var nb = document.documentElement.lang !== 'en';
  var locale = nb ? 'nb-NO' : 'en-GB';
  var DAY = 86400000;

  var T = nb ? {
    week: 'Uke', title: 'Uke {n} – hvilken uke er det? | Ukenummer',
    progress: 'Dag {d} av 7', today: 'i dag', tomorrow: 'i morgen', inDays: 'om {n} dager', passed: 'passert',
    names: ['1. nyttårsdag', 'Skjærtorsdag', 'Langfredag', '1. påskedag', '2. påskedag', 'Arbeidernes dag',
      'Kristi himmelfartsdag', 'Grunnlovsdag', '1. pinsedag', '2. pinsedag', '1. juledag', '2. juledag']
  } : {
    week: 'Week', title: 'Week {n} – what week is it? | Ukenummer',
    progress: 'Day {d} of 7', today: 'today', tomorrow: 'tomorrow', inDays: 'in {n} days', passed: 'passed',
    names: ["New Year's Day", 'Maundy Thursday', 'Good Friday', 'Easter Sunday', 'Easter Monday', 'Labour Day',
      'Ascension Day', 'Constitution Day', 'Whit Sunday', 'Whit Monday', 'Christmas Day', 'Boxing Day']
  };

  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function daysBetween(a, b) { return Math.round((midnight(b) - midnight(a)) / DAY); }

  // ISO 8601: weeks start on Monday; week 1 contains the year's first Thursday.
  function isoWeek(date) {
    var d = midnight(date);
    var thursday = addDays(d, 3 - ((d.getDay() + 6) % 7));
    var jan1 = new Date(thursday.getFullYear(), 0, 1);
    return { number: 1 + Math.floor(daysBetween(jan1, thursday) / 7), year: thursday.getFullYear() };
  }
  function weekStart(date) { var d = midnight(date); return addDays(d, -((d.getDay() + 6) % 7)); }

  // Anonymous Gregorian Easter algorithm (Meeus/Jones/Butcher), as in the app.
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var n = h + l - 7 * m + 114;
    return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1);
  }
  function holidays(y) {
    var e = easter(y);
    var dates = [new Date(y, 0, 1), addDays(e, -3), addDays(e, -2), e, addDays(e, 1), new Date(y, 4, 1),
      addDays(e, 39), new Date(y, 4, 17), addDays(e, 49), addDays(e, 50), new Date(y, 11, 25), new Date(y, 11, 26)];
    return dates.map(function (date, idx) { return { name: T.names[idx], date: date }; })
      .sort(function (a, b) { return a.date - b.date; });
  }
  function isHoliday(date) {
    return holidays(date.getFullYear()).some(function (h) { return daysBetween(h.date, date) === 0; });
  }
  function relative(days) {
    if (days < 0) return T.passed;
    if (days === 0) return T.today;
    if (days === 1) return T.tomorrow;
    return T.inDays.replace('{n}', days);
  }

  var now = new Date();
  var week = isoWeek(now);
  var start = weekStart(now);
  var end = addDays(start, 6);

  // Hero card
  var num = document.querySelector('[data-week-number]');
  if (num) {
    num.textContent = week.number;
    document.title = T.title.replace('{n}', week.number);
    var range = document.querySelector('[data-week-range]');
    var fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
    if (range) range.textContent = fmt.formatRange ? fmt.formatRange(start, end) : fmt.format(start) + ' – ' + fmt.format(end);
    var label = document.querySelector('[data-week-label]');
    if (label) label.setAttribute('aria-label', T.week + ' ' + week.number);
    var days = document.querySelector('[data-week-days]');
    if (days) {
      var short = new Intl.DateTimeFormat(locale, { weekday: 'short' });
      days.innerHTML = '';
      for (var i = 0; i < 7; i++) {
        var d = addDays(start, i);
        var cell = document.createElement('span');
        if (daysBetween(d, now) === 0) cell.className = 'today';
        if (isHoliday(d)) cell.className += ' holiday';
        cell.appendChild(document.createTextNode(short.format(d).replace('.', '')));
        var b = document.createElement('b');
        b.textContent = d.getDate();
        cell.appendChild(b);
        days.appendChild(cell);
      }
    }
    var progress = document.querySelector('[data-week-progress]');
    if (progress) progress.textContent = T.progress.replace('{d}', ((now.getDay() + 6) % 7) + 1);
    document.querySelectorAll('[data-live]').forEach(function (el) { el.hidden = false; });
  }

  // Holiday table
  var table = document.querySelector('[data-holidays]');
  if (table) {
    var year = now.getFullYear();
    var yearLabel = document.querySelector('[data-holiday-year]');
    var dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    var render = function () {
      var list = holidays(year);
      var nextIdx = -1;
      list.forEach(function (h, idx) { if (nextIdx < 0 && daysBetween(now, h.date) >= 0) nextIdx = idx; });
      table.innerHTML = '';
      list.forEach(function (h, idx) {
        var until = daysBetween(now, h.date);
        var tr = document.createElement('tr');
        if (until < 0) tr.className = 'past';
        if (idx === nextIdx) tr.className = 'next';
        var cells = [h.name, dateFmt.format(h.date), T.week.toLowerCase() + ' ' + isoWeek(h.date).number, relative(until)];
        cells.forEach(function (text, c) {
          var td = document.createElement(c === 0 ? 'th' : 'td');
          if (c === 0) td.setAttribute('scope', 'row');
          if (c === 2) td.className = 'week';
          if (c === 3) td.className = 'when';
          td.textContent = text;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      if (yearLabel) yearLabel.textContent = year;
    };
    var prev = document.querySelector('[data-year-prev]');
    var next = document.querySelector('[data-year-next]');
    if (prev) prev.addEventListener('click', function () { year--; render(); });
    if (next) next.addEventListener('click', function () { year++; render(); });
    render();
  }
})();
