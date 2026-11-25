/* AD/LDAP Domain Manager - audit log page. */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  // 防御式把任何值转成可安全渲染的字符串：审计记录的 detail/actor 可能是
  // 嵌套对象、数组或特殊值，直接作为 React children 会让整页变空白。
  function safeText(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }

  function AuditLog(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;

    var actorState = useState('');
    var actor = actorState[0];
    var setActor = actorState[1];
    var actionState = useState('');
    var action = actionState[0];
    var setAction = actionState[1];
    var resultState = useState('');
    var result = resultState[0];
    var setResult = resultState[1];
    var fromState = useState('');
    var from = fromState[0];
    var setFrom = fromState[1];
    var toState = useState('');
    var to = toState[0];
    var setTo = toState[1];
    var pageState = useState(1);
    var page = pageState[0];
    var setPage = pageState[1];
    var rowsState = useState([]);
    var rows = rowsState[0];
    var setRows = rowsState[1];
    var totalState = useState(0);
    var total = totalState[0];
    var setTotal = totalState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var errorState = useState('');
    var error = errorState[0];
    var setError = errorState[1];

    function load() {
      setLoading(true);
      setError('');
      var filters = {};
      if (actor) filters.actor = actor;
      if (action) filters.action = action;
      if (result) filters.result = result;
      if (from) filters.from = from;
      if (to) filters.to = to;
      call('domain-manager.audit.list', {
        domainId: props.domainId,
        filters: filters,
        page: page,
        pageSize: 20
      }).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          var data = res.data || {};
          setRows(normalizeRows(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : [])));
          setTotal(data.total != null ? data.total : 0);
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          setError(C.fmt(t('audit.loadError'), { message: msg }));
        }
      }).catch(function (err) {
        setLoading(false);
        setError(C.fmt(t('audit.loadError'), { message: err && err.message ? err.message : '' }));
      });
    }

    useEffect(function () { load(); }, [page, props.domainId]);

    function apply() { setPage(1); load(); }
    function clear() {
      setActor(''); setAction(''); setResult(''); setFrom(''); setTo('');
      setPage(1);
      // load with cleared state on next tick via explicit call
      call('domain-manager.audit.list', { domainId: props.domainId, filters: {}, page: 1, pageSize: 20 }).then(function (res) {
        var data = res && res.data || {};
        setRows(normalizeRows(Array.isArray(data.items) ? data.items : []));
        setTotal(data.total || 0);
      }).catch(function () {});
    }

    function renderResult(r) {
      var ok = r.result === 'ok' || r.result === true || r.result === 'success' || r.ok === true;
      return h(C.Badge, { tone: ok ? 'success' : 'error' }, ok ? t('audit.result.ok') : t('audit.result.fail'));
    }

    // detail/actor 可能是对象或数组，React 不能直接渲染对象，
    // 必须序列化为字符串，否则整页抛 "Objects are not valid as a React child" 变空白。
    function renderDetail(v) { return safeText(v); }
    function text(v) { return safeText(v); }

    // 渲染每一行前做一次规范化：把非对象条目、嵌套对象字段全部安全字符串化，
    // 确保 Table 的任何列单元格都不会拿到对象作为 children。
    function normalizeRows(list) {
      return (Array.isArray(list) ? list : []).map(function (r) {
        if (!r || typeof r !== 'object') return { time: '', actor: safeText(r), action: '', target: '', result: '', detail: '' };
        return {
          time: safeText(r.time || r.timestamp),
          actor: r.actor && typeof r.actor === 'object' ? safeText(r.actor.name || r.actor.role || r.actor) : safeText(r.actor),
          action: safeText(r.action),
          target: safeText(r.target || r.targetDn),
          result: r.result,
          detail: safeText(r.detail)
        };
      });
    }

    var columns = [
      { key: 'time', title: t('audit.col.time'), render: function (r) { return text(r.time); } },
      { key: 'actor', title: t('audit.col.actor'), render: function (r) { return text(r.actor); } },
      { key: 'action', title: t('audit.col.action'), render: function (r) { return text(r.action); } },
      { key: 'target', title: t('audit.col.target'), render: function (r) { return text(r.target); } },
      { key: 'result', title: t('audit.col.result'), render: renderResult },
      { key: 'detail', title: t('audit.col.detail'), render: function (r) { return text(r.detail); } }
    ];

    return h('div', { className: 'dm-page dm-audit' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t('audit.title')),
        h('p', { className: 'dm-page__desc' }, t('audit.description'))
      ),
      h('div', { className: 'dm-toolbar' },
        h(C.Input, { value: actor, placeholder: t('audit.filter.actor'), onChange: setActor }),
        h(C.Input, { value: action, placeholder: t('audit.filter.action'), onChange: setAction }),
        h(C.Select, {
          value: result,
          options: [
            { value: '', label: t('common.all') },
            { value: 'ok', label: t('audit.result.ok') },
            { value: 'fail', label: t('audit.result.fail') }
          ],
          onChange: setResult,
          'aria-label': t('audit.filter.result')
        }),
        h(C.Input, { type: 'date', value: from, onChange: setFrom, 'aria-label': t('audit.filter.from') }),
        h(C.Input, { type: 'date', value: to, onChange: setTo, 'aria-label': t('audit.filter.to') }),
        h(C.Button, { variant: 'primary', onClick: apply }, t('common.search')),
        h(C.Button, { variant: 'ghost', onClick: clear }, t('common.clearFilter')),
        h(C.Button, { variant: 'ghost', onClick: load, loading: loading }, t('common.refresh'))
      ),
      error ? h(C.Notice, { tone: 'error' }, error,
        h(C.Button, { size: 'sm', variant: 'ghost', onClick: load }, t('common.retry'))
      ) : null,
      h(C.Table, {
        columns: columns, rows: rows, loading: loading,
        emptyText: t('audit.noLog'), loadingLabel: t('common.loading')
      }),
      h(C.Pagination, {
        page: page, pageSize: 20, total: total,
        totalText: C.fmt(t('common.total'), { total: total }),
        pageText: C.fmt(t('common.page'), { page: page, pages: Math.max(1, Math.ceil(total / 20)) }),
        prevText: t('common.prev'), nextText: t('common.next'),
        onChange: setPage
      })
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.AuditLog = AuditLog;
})(typeof window !== 'undefined' ? window : this);
