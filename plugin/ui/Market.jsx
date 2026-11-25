/* AD/LDAP Domain Manager - plugin market page (admin only). */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  function Market(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;

    var versionState = useState(null);
    var version = versionState[0];
    var setVersion = versionState[1];
    var updateState = useState(null);
    var updateInfo = updateState[0];
    var setUpdateInfo = updateState[1];
    var licenseState = useState(null);
    var license = licenseState[0];
    var setLicense = licenseState[1];
    var opsState = useState([]);
    var ops = opsState[0];
    var setOps = opsState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var checkingState = useState(false);
    var checking = checkingState[0];
    var setChecking = checkingState[1];
    var errorState = useState('');
    var error = errorState[0];
    var setError = errorState[1];
    var dialogState = useState(null);
    var dialog = dialogState[0];
    var setDialog = dialogState[1];
    var tokenState = useState('');
    var token = tokenState[0];
    var setToken = tokenState[1];
    var busyState = useState(false);
    var busy = busyState[0];
    var setBusy = busyState[1];
    var skillsState = useState([]);
    var skills = skillsState[0];
    var setSkills = skillsState[1];

    function loadAll() {
      setLoading(true);
      setError('');
      Promise.all([
        call('domain-manager.market.detail', {}),
        call('domain-manager.market.getLicense', {}).catch(function () { return null; }),
        call('domain-manager.market.operations', {}).catch(function () { return null; }),
        call('domain-manager.skills.list', {}).catch(function () { return null; })
      ]).then(function (results) {
        setLoading(false);
        var d = results[0] && results[0].ok ? results[0].data : null;
        setVersion(d || (results[0] && results[0].error ? null : {}));
        var lic = results[1];
        setLicense(lic && lic.ok ? lic.data : null);
        var op = results[2];
        var items = op && op.data && Array.isArray(op.data.items) ? op.data.items : (op && Array.isArray(op.data) ? op.data : []);
        setOps(items);
        var sk = results[3];
        setSkills(sk && sk.ok && Array.isArray(sk.data) ? sk.data : []);
        if (results[0] && !results[0].ok) {
          var msg = results[0].error && results[0].error.message ? results[0].error.message : '';
          setError(C.fmt(t('market.loadError'), { message: msg }));
        }
      }).catch(function (err) {
        setLoading(false);
        setError(C.fmt(t('market.loadError'), { message: err && err.message ? err.message : '' }));
      });
    }

    useEffect(function () { loadAll(); }, []);

    function checkUpdate() {
      setChecking(true);
      setError('');
      call('domain-manager.market.checkUpdate', {}).then(function (res) {
        setChecking(false);
        if (res && res.ok) {
          setUpdateInfo(res.data);
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          toast(C.fmt(t('market.operationFail'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setChecking(false);
        toast(C.fmt(t('market.operationFail'), { message: err && err.message ? err.message : '' }), 'error');
      });
    }

    function openDialog(kind, payload) {
      setDialog({ kind: kind, payload: payload || {} });
      setToken('');
    }

    function runDangerous(method, params, successKey) {
      setBusy(true);
      setDialog(null);
      var payload = Object.assign({}, params, { actor: props.actor, confirmToken: 'CONFIRMED' });
      call(method, payload).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          toast(t(successKey || 'market.operationOk'), 'success');
          loadAll();
          setUpdateInfo(null);
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          toast(C.fmt(t('market.operationFail'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setBusy(false);
        toast(C.fmt(t('market.operationFail'), { message: err && err.message ? err.message : '' }), 'error');
      });
    }

    var version = versionState[0] || {};
    var current = version.current || version.version || version.currentVersion || '';
    var latest = updateInfo && (updateInfo.version || updateInfo.latest) || version.latest || '';
    var hasUpdate = !!(updateInfo && (updateInfo.updateAvailable || updateInfo.hasUpdate || (latest && latest !== current)));
    var force = !!(updateInfo && (updateInfo.force || updateInfo.mandatory));
    var major = !!(updateInfo && (updateInfo.major || updateInfo.majorUpgrade));
    var channel = version.channel || 'stable';
    var licenseMode = (license && license.mode) || '';
    var licenseLabel = licenseMode === 'paid' ? t('market.license.paid') :
      licenseMode === 'trial' ? t('market.license.trial') :
        licenseMode === 'free' ? t('market.license.free') : (licenseMode || t('common.unknown'));
    var licenseValid = license ? !!license.valid : false;

    var opColumns = [
      { key: 'time', title: t('market.operation.time'), render: function (r) { return r.time || r.timestamp || ''; } },
      { key: 'type', title: t('market.operation.type'), render: function (r) { return r.type || r.action || ''; } },
      { key: 'actor', title: t('market.operation.actor'), render: function (r) { return r.actor || ''; } },
      { key: 'detail', title: t('market.operation.detail'), render: function (r) { return r.detail || ''; } }
    ];

    function dialogTitle() {
      if (!dialog) return '';
      if (dialog.kind === 'update') return t('market.update');
      if (dialog.kind === 'rollback') return t('market.rollback');
      if (dialog.kind === 'channel') return t('market.setChannel');
      return t('common.confirm');
    }

    function dialogMessage() {
      if (!dialog) return '';
      if (dialog.kind === 'update') return C.fmt(t('market.confirm.update'), { version: dialog.payload.version || latest });
      if (dialog.kind === 'rollback') return t('market.confirm.rollback');
      if (dialog.kind === 'channel') return C.fmt(t('market.confirm.channel'), { channel: dialog.payload.channel === 'gray' ? t('market.channel.gray') : t('market.channel.stable') });
      return t('common.confirmDangerText');
    }

    function confirmDialog() {
      if (token !== 'CONFIRMED') {
        toast(t('common.confirmTokenInvalid'), 'error');
        return;
      }
      if (dialog.kind === 'update') {
        runDangerous('domain-manager.market.update', { version: dialog.payload.version || latest }, 'market.operationOk');
      } else if (dialog.kind === 'rollback') {
        runDangerous('domain-manager.market.rollback', {}, 'market.operationOk');
      } else if (dialog.kind === 'channel') {
        runDangerous('domain-manager.market.setChannel', { channel: dialog.payload.channel }, 'market.operationOk');
      }
    }

    return h('div', { className: 'dm-page dm-market' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t('market.title')),
        h('p', { className: 'dm-page__desc' }, t('market.description'))
      ),
      error ? h(C.Notice, { tone: 'error' }, error,
        h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadAll }, t('common.retry'))
      ) : null,

      h(C.Section, { title: t('market.section.version') },
        h('div', { className: 'dm-kv' },
          h('div', null, h('span', null, t('market.currentVersion')), h('strong', null, current || t('common.unknown'))),
          h('div', null, h('span', null, t('market.latestVersion')), h('strong', null, latest || t('common.unknown'))),
          h('div', null, h('span', null, t('market.section.channel')),
            h('strong', null, channel === 'gray' ? t('market.channel.gray') : t('market.channel.stable')))
        )
      ),

      h(C.Section, { title: t('market.section.update') },
        h('div', { className: 'dm-toolbar' },
          h(C.Button, { variant: 'primary', onClick: checkUpdate, loading: checking }, t('market.checkUpdate')),
          hasUpdate ? h(C.Button, {
            variant: 'danger', loading: busy,
            onClick: function () { openDialog('update', { version: latest }); }
          }, t('market.update')) : h(C.Badge, { tone: 'success' }, t('market.upToDate')),
          h(C.Button, {
            variant: 'ghost', loading: busy,
            onClick: function () { openDialog('rollback', {}); }
          }, t('market.rollback'))
        ),
        hasUpdate ? h(C.Notice, { tone: force ? 'warning' : 'info' },
          C.fmt(t(force ? 'market.forceUpdate' : 'market.updateAvailable'), { version: latest }),
          major ? h('div', null, t('market.majorRisk')) : null
        ) : null
      ),

      h(C.Section, { title: t('market.section.channel') },
        h('div', { className: 'dm-toolbar' },
          h(C.Select, {
            value: channel,
            options: [
              { value: 'stable', label: t('market.channel.stable') },
              { value: 'gray', label: t('market.channel.gray') }
            ],
            onChange: function (v) {
              if (v !== channel) openDialog('channel', { channel: v });
            },
            'aria-label': t('market.section.channel')
          })
        )
      ),

      h(C.Section, { title: t('market.section.license') },
        h('div', { className: 'dm-kv' },
          h('div', null, h('span', null, t('market.license.mode')), h('strong', null, licenseLabel)),
          h('div', null, h('span', null, t('market.license.status')),
            h(C.Badge, { tone: licenseValid ? 'success' : 'error' },
              licenseValid ? t('market.license.valid') : t('market.license.invalid'))),
          license && license.expiry ? h('div', null, h('span', null, t('market.license.expiry')), h('strong', null, license.expiry)) : null
        ),
        h(C.Button, { variant: 'ghost', onClick: loadAll }, t('market.refreshLicense'))
      ),

      h(C.Section, { title: t('market.section.skills') },
        h('p', { className: 'dm-page__desc' }, t('market.skillsHint')),
        h(C.Table, {
          columns: [
            { key: 'name', title: t('market.skill.name'), render: function (s) { return s.name || ''; } },
            { key: 'version', title: t('market.skill.version'), render: function (s) { return s.version || ''; } },
            { key: 'description', title: t('market.skill.desc'), render: function (s) { return s.description || ''; } },
            { key: 'action', title: t('market.skill.action'), render: function (s) {
              return h(C.Button, {
                size: 'sm', variant: 'primary',
                onClick: function () {
                  call('domain-manager.skills.get', { path: s.path }).then(function (res) {
                    if (res && res.ok && res.data && res.data.content) {
                      var blob = new Blob([res.data.content], { type: 'text/markdown;charset=utf-8' });
                      var url = URL.createObjectURL(blob);
                      var a = document.createElement('a');
                      a.href = url;
                      a.download = (s.id || 'skill') + '-SKILL.md';
                      document.body.appendChild(a); a.click();
                      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
                      toast(t('market.skill.downloaded'), 'success');
                    } else {
                      toast(t('common.error'), 'error');
                    }
                  }).catch(function () { toast(t('common.error'), 'error'); });
                }
              }, t('market.skill.download'));
            } }
          ],
          rows: skills, loading: false, emptyText: t('market.skill.empty')
        })
      ),

      h(C.Section, { title: t('market.section.operations') },
        h(C.Table, {
          columns: opColumns, rows: ops, loading: loading,
          emptyText: t('market.noOperations'), loadingLabel: t('common.loading')
        })
      ),

      dialog ? h(C.Modal, {
        title: dialogTitle(),
        size: 'sm',
        onClose: function () { setDialog(null); },
        closeLabel: t('common.close'),
        footer: h('div', { className: 'dm-dialog-actions' },
          h(C.Button, { variant: 'ghost', onClick: function () { setDialog(null); } }, t('danger.cancel')),
          h(C.Button, { variant: 'danger', disabled: token !== 'CONFIRMED', onClick: confirmDialog }, t('danger.confirm'))
        )
      },
        h('p', { className: 'dm-dialog-message' }, dialogMessage()),
        major && dialog.kind === 'update' ? h(C.Notice, { tone: 'warning' }, t('market.majorRisk')) : null,
        h(C.Field, { id: 'dm-market-token', label: t('danger.tip') },
          h(C.Input, { id: 'dm-market-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })
        )
      ) : null
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.Market = Market;
})(typeof window !== 'undefined' ? window : this);
