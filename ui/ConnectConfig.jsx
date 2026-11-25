/* AD/LDAP Domain Manager - connection configuration page. */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  var DEFAULTS = {
    id: '',
    label: '',
    host: '',
    failoverHosts: '',
    port: 389,
    ssl: false,
    tls: false,
    bindDN: '',
    bindPassword: '',
    baseDN: '',
    timeout: 10,
    pageSize: 100,
    vendor: 'ad'
  };

  function blank() {
    return Object.assign({}, DEFAULTS);
  }

  function normalize(cfg) {
    var out = blank();
    if (!cfg || typeof cfg !== 'object') return out;
    Object.keys(out).forEach(function (k) {
      if (cfg[k] !== undefined && cfg[k] !== null && cfg[k] !== '') out[k] = cfg[k];
    });
    // 兼容存储层字段：配置名在 store 中存为 name/label，而表单用 label。
    // 优先 label，其次 name；只有两者都缺失才回退到 id。
    if (cfg.label) out.label = cfg.label;
    else if (cfg.name) out.label = cfg.name;
    else if (cfg.id) out.label = cfg.id;
    // 备用域控：store 存数组，表单用逗号分隔字符串
    if (Array.isArray(cfg.failoverHosts)) out.failoverHosts = cfg.failoverHosts.join(', ');
    return out;
  }

  function ConnectionConfig(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;
    var refreshKey = props.refreshKey || 0;

    var listState = useState([]);
    var domains = listState[0];
    var setDomains = listState[1];
    var activeState = useState(null);
    var activeId = activeState[0];
    var setActiveId = activeState[1];
    var formState = useState(blank());
    var form = formState[0];
    var setForm = formState[1];
    var errorsState = useState({});
    var errors = errorsState[0];
    var setErrors = errorsState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var testingState = useState(false);
    var testing = testingState[0];
    var setTesting = testingState[1];
    var testResultState = useState(null);
    var testResult = testResultState[0];
    var setTestResult = testResultState[1];
    var inlineErrorState = useState('');
    var inlineError = inlineErrorState[0];
    var setInlineError = inlineErrorState[1];

    function loadDomains(cb) {
      setLoading(true);
      setInlineError('');
      call('domain-manager.domainConfig.list', {}).then(function (res) {
        var data = res && res.data;
        var items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        setDomains(items);
        var active = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].active || items[i].isActive) { active = items[i].id; break; }
        }
        if (active == null && items.length) active = items[0].id;
        // 回填当前激活（已选中）域的配置——包含配置名称、主/备域控等全部字段。
        // 只要当前表单没有未保存的编辑（id 为空或等于激活域）就回填，
        // 确保进入/刷新本页时"配置名称"始终显示已存储且当前选中的名称。
        if (active != null && (!form.id || form.id === active)) {
          var found = null;
          for (var j = 0; j < items.length; j++) if (items[j].id === active) found = items[j];
          if (found) setForm(normalize(found));
        }
        setActiveId(active);
        setLoading(false);
        if (cb) cb(items);
      }).catch(function (err) {
        setLoading(false);
        var msg = err && err.message ? err.message : String(err || '');
        setInlineError(C.fmt(t('common.inlineError'), { message: msg }));
      });
    }

    useEffect(function () { loadDomains(); }, [refreshKey]);

    function onField(key, value) {
      setForm(function (prev) {
        var next = Object.assign({}, prev);
        next[key] = value;
        return next;
      });
      setErrors(function (prev) {
        if (!prev[key]) return prev;
        var next = Object.assign({}, prev);
        delete next[key];
        return next;
      });
      setTestResult(null);
    }

    function validate() {
      var next = {};
      if (!String(form.label || '').trim()) next.label = t('common.required', { fields: t('connect.label') });
      if (!String(form.host || '').trim()) next.host = t('common.required', { fields: t('connect.host') });
      if (!String(form.bindDN || '').trim()) next.bindDN = t('common.required', { fields: t('connect.bindDN') });
      if (!String(form.baseDN || '').trim()) next.baseDN = t('common.required', { fields: t('connect.baseDN') });
      var port = Number(form.port);
      if (!port || port < 1 || port > 65535) next.port = t('common.required', { fields: t('connect.port') });
      var timeout = Number(form.timeout);
      if (!timeout || timeout < 1) next.timeout = t('common.required', { fields: t('connect.timeout') });
      var size = Number(form.pageSize);
      if (!size || size < 1 || size > 1000) next.pageSize = t('common.required', { fields: t('connect.pageSize') });
      if (form.ssl && form.tls) next.tls = t('connect.testFail', { message: 'SSL and StartTLS cannot both be enabled' });
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleTest() {
      setTestResult(null);
      setInlineError('');
      var payload = Object.assign({}, form, {
        port: Number(form.port), timeout: Number(form.timeout), pageSize: Number(form.pageSize)
      });
      setTesting(true);
      call('domain-manager.domainConfig.test', payload).then(function (res) {
        setTesting(false);
        if (res && res.ok) {
          setTestResult({ ok: true, text: t('connect.testOk') });
          toast(t('connect.testOk'), 'success');
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          setTestResult({ ok: false, text: C.fmt(t('connect.testFail'), { message: msg }) });
          toast(C.fmt(t('connect.testFail'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setTesting(false);
        var msg = err && err.message ? err.message : String(err || '');
        setTestResult({ ok: false, text: C.fmt(t('connect.testFail'), { message: msg }) });
        toast(C.fmt(t('connect.testFail'), { message: msg }), 'error');
      });
    }

    function handleSave() {
      if (!validate()) return;
      setInlineError('');
      var payload = Object.assign({}, form, {
        port: Number(form.port), timeout: Number(form.timeout), pageSize: Number(form.pageSize)
      });
      setLoading(true);
      call('domain-manager.domainConfig.save', payload).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          toast(t('connect.saved'), 'success');
          loadDomains(function (items) {
            var saved = res.data && res.data.id ? res.data.id : payload.id;
            var found = null;
            for (var i = 0; i < items.length; i++) if (items[i].id === saved) found = items[i];
            setForm(normalize(found || payload));
          });
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          setInlineError(C.fmt(t('common.inlineError'), { message: msg }));
          toast(C.fmt(t('common.error'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setLoading(false);
        var msg = err && err.message ? err.message : String(err || '');
        setInlineError(C.fmt(t('common.inlineError'), { message: msg }));
      });
    }

    function handleReset() {
      setForm(blank());
      setErrors({});
      setTestResult(null);
      setInlineError('');
      toast(t('connect.resetDone'), 'info');
    }

    function handleNew() {
      setForm(blank());
      setErrors({});
      setTestResult(null);
      setInlineError('');
    }

    function handleSelectDomain(id) {
      var found = null;
      for (var i = 0; i < domains.length; i++) if (domains[i].id === id) found = domains[i];
      setForm(normalize(found));
      setErrors({});
      setTestResult(null);
      setInlineError('');
    }

    function handleSetActive() {
      if (!form.id) return;
      setLoading(true);
      call('domain-manager.domainConfig.setActive', { id: form.id }).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          toast(t('connect.activeSet'), 'success');
          loadDomains();
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          toast(C.fmt(t('common.error'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setLoading(false);
        toast(C.fmt(t('common.error'), { message: err && err.message ? err.message : '' }), 'error');
      });
    }

    var deleteConfirm = useState(null);
    var pendingDelete = deleteConfirm[0];
    var setPendingDelete = deleteConfirm[1];

    function handleDelete() {
      if (!form.id) return;
      setPendingDelete({ id: form.id, name: form.label });
    }

    function doDelete() {
      var id = pendingDelete.id;
      setPendingDelete(null);
      setLoading(true);
      call('domain-manager.domainConfig.delete', { id: id, confirmToken: 'CONFIRMED' }).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          toast(t('connect.deleted'), 'success');
          setForm(blank());
          loadDomains();
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          toast(C.fmt(t('common.error'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setLoading(false);
        toast(C.fmt(t('common.error'), { message: err && err.message ? err.message : '' }), 'error');
      });
    }

    function field(key, labelKey, opts) {
      opts = opts || {};
      return h(C.Field, {
        key: key,
        id: 'dm-cfg-' + key,
        label: t(labelKey),
        required: opts.required,
        hint: opts.hint,
        error: errors[key]
      }, h(C.Input, {
        id: 'dm-cfg-' + key,
        type: opts.type || 'text',
        value: form[key],
        placeholder: opts.placeholder,
        min: opts.min,
        max: opts.max,
        disabled: loading,
        onChange: function (v) { onField(key, v); }
      }));
    }

    var domainOptions = domains.map(function (d) {
      return { value: d.id, label: (d.label || d.host || d.id) + (d.id === activeId ? ' (' + t('connect.active') + ')' : '') };
    });

    return h('div', { className: 'dm-page dm-connect' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t('connect.title')),
        h('p', { className: 'dm-page__desc' }, t('connect.description'))
      ),
      inlineError ? h(C.Notice, { tone: 'error' }, inlineError,
        h(C.Button, { size: 'sm', variant: 'ghost', onClick: function () { loadDomains(); } }, t('common.retry'))
      ) : null,

      h(C.Section, { title: t('common.selectDomain') },
        h('div', { className: 'dm-toolbar' },
          h(C.Select, {
            value: form.id || '',
            options: [{ value: '', label: t('common.selectDomain') }].concat(domainOptions),
            onChange: handleSelectDomain,
            disabled: loading
          }),
          h(C.Button, { variant: 'ghost', onClick: handleNew }, t('connect.addDomain')),
          form.id && form.id !== activeId
            ? h(C.Button, { variant: 'ghost', onClick: handleSetActive, disabled: loading }, t('connect.setActive'))
            : null,
          h(C.Button, {
            variant: 'ghost', onClick: function () { loadDomains(); }, disabled: loading, title: t('common.refresh')
          }, t('common.refresh'))
        ),
        !domains.length && !loading ? h(C.Empty, null, t('connect.noDomains')) : null
      ),

      h(C.Section, null,
        h('div', { className: 'dm-form-grid' },
          field('label', 'connect.label', { required: true }),
          field('host', 'connect.host', { required: true, placeholder: t('connect.hostPlaceholder') }),
          field('failoverHosts', 'connect.failoverHosts', { placeholder: t('connect.failoverHostsPlaceholder') }),
          field('port', 'connect.port', { required: true, type: 'number', min: 1, max: 65535 }),
          h(C.Field, { id: 'dm-cfg-vendor', label: t('connect.vendor') },
            h(C.Select, {
              id: 'dm-cfg-vendor',
              value: form.vendor,
              options: [
                { value: 'ad', label: t('connect.vendor.ad') },
                { value: 'openldap', label: t('connect.vendor.openldap') }
              ],
              onChange: function (v) { onField('vendor', v); },
              disabled: loading
            })
          ),
          field('bindDN', 'connect.bindDN', { required: true, placeholder: t('connect.bindDNPlaceholder') }),
          field('bindPassword', 'connect.bindPassword', {
            type: 'password', hint: t('connect.passwordHint')
          }),
          field('baseDN', 'connect.baseDN', { required: true, placeholder: t('connect.baseDNPlaceholder') }),
          field('timeout', 'connect.timeout', { required: true, type: 'number', min: 1 }),
          field('pageSize', 'connect.pageSize', { required: true, type: 'number', min: 1, max: 1000 })
        ),
        h('div', { className: 'dm-form-checks' },
          h(C.Checkbox, {
            label: t('connect.ssl'), checked: !!form.ssl, disabled: loading,
            onChange: function (v) { onField('ssl', v); }
          }),
          h(C.Checkbox, {
            label: t('connect.tls'), checked: !!form.tls, disabled: loading,
            onChange: function (v) { onField('tls', v); }
          })
        ),
        errors.tls ? h(C.Notice, { tone: 'error' }, errors.tls) : null,
        testResult
          ? h(C.Notice, { tone: testResult.ok ? 'success' : 'error' }, testResult.text)
          : null,
        h('div', { className: 'dm-form-actions' },
          h(C.Button, { variant: 'primary', onClick: handleSave, loading: loading }, t('connect.save')),
          h(C.Button, { variant: 'ghost', onClick: handleTest, loading: testing }, t('connect.test')),
          h(C.Button, { variant: 'ghost', onClick: handleReset, disabled: loading }, t('connect.reset')),
          form.id
            ? h(C.Button, { variant: 'danger', onClick: handleDelete, disabled: loading }, t('connect.delete'))
            : null
        )
      ),

      pendingDelete
        ? h(C.ConfirmDialog, {
          t: t,
          danger: true,
          title: t('connect.delete'),
          action: pendingDelete.name || pendingDelete.id,
          message: C.fmt(t('objects.confirm.delete'), { name: pendingDelete.name || pendingDelete.id }),
          onClose: function () { setPendingDelete(null); },
          onConfirm: doDelete
        })
        : null
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.ConnectConfig = ConnectionConfig;
})(typeof window !== 'undefined' ? window : this);
