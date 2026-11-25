/* AD/LDAP Domain Manager - data sync panel (local cache + schedule). */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  // 0=关闭自动同步；其余为周期分钟，与后端 ALLOWED_INTERVALS 保持一致
  var INTERVALS = [0, 1, 5, 10, 15, 30, 60, 120];

  function fmtTime(v) {
    if (!v) return '—';
    try {
      var d = new Date(v);
      return d.toLocaleString();
    } catch (e) { return String(v); }
  }

  function SyncPanel(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;
    var refreshKey = props.refreshKey || 0;

    var statusState = useState(null);
    var status = statusState[0];
    var setStatus = statusState[1];
    var busyState = useState(false);
    var busy = busyState[0];
    var setBusy = busyState[1];
    var errorState = useState('');
    var error = errorState[0];
    var setError = errorState[1];

    function loadStatus() {
      setError('');
      call('domain-manager.sync.status', {}).then(function (res) {
        if (res && res.ok) setStatus(res.data || {});
        else setError(res && res.error && res.error.message ? res.error.message : '');
      }).catch(function (e) {
        setError(e && e.message ? e.message : String(e));
      });
    }

    useEffect(function () { loadStatus(); }, [refreshKey]);

    function doSync() {
      setBusy(true);
      call('domain-manager.sync.now', {}).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          toast(t('sync.done'), 'success');
          loadStatus();
        } else {
          toast(res && res.error && res.error.message ? res.error.message : t('common.error'), 'error');
        }
      }).catch(function (e) {
        setBusy(false);
        toast(e && e.message ? e.message : String(e), 'error');
      });
    }

    function changeInterval(v) {
      var minutes = Number(v);
      call('domain-manager.sync.setInterval', { minutes: minutes }).then(function (res) {
        if (res && res.ok) {
          toast(t('sync.intervalSaved'), 'success');
          loadStatus();
        } else {
          toast(res && res.error && res.error.message ? res.error.message : t('common.error'), 'error');
        }
      }).catch(function (e) {
        toast(e && e.message ? e.message : String(e), 'error');
      });
    }

    var counts = (status && status.counts) || {};
    return h('div', { className: 'dm-page dm-sync' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t('sync.title')),
        h('p', { className: 'dm-page__desc' }, t('sync.description'))
      ),
      error ? h(C.Notice, { tone: 'error' }, error) : null,
      h(C.Section, { title: t('sync.status') },
        h('div', { className: 'dm-form-grid' },
          h('div', null, h('strong', null, t('sync.lastSync')), ' ', h('span', null, fmtTime(status && status.lastSyncAt))),
          h('div', null, h('strong', null, t('sync.lastStatus')), ' ', h('span', null, (status && status.lastStatus) || '—')),
          h('div', null, h('strong', null, t('sync.nextSync')), ' ', h('span', null, fmtTime(status && status.nextSyncAt))),
          h('div', null, h('strong', null, t('sync.users')), ' ', h('span', null, counts.users != null ? counts.users : '—')),
          h('div', null, h('strong', null, t('sync.computers')), ' ', h('span', null, counts.computers != null ? counts.computers : '—')),
          h('div', null, h('strong', null, t('sync.groups')), ' ', h('span', null, counts.groups != null ? counts.groups : '—')),
          h('div', null, h('strong', null, t('sync.ous')), ' ', h('span', null, counts.ous != null ? counts.ous : '—')),
          h('div', null, h('strong', null, t('sync.gpos')), ' ', h('span', null, counts.gpos != null ? counts.gpos : '—'))
        ),
        h('div', { className: 'dm-form-actions' },
          h(C.Button, { variant: 'primary', onClick: doSync, loading: busy }, t('sync.now')),
          h(C.Button, { variant: 'ghost', onClick: loadStatus }, t('common.refresh'))
        )
      ),
      h(C.Section, { title: t('sync.schedule') },
        h(C.Field, { id: 'dm-sync-interval', label: t('sync.interval') },
          h(C.Select, {
            id: 'dm-sync-interval',
            value: status && status.intervalMinutes != null ? String(status.intervalMinutes) : '10',
            options: INTERVALS.map(function (m) {
              return { value: String(m), label: m === 0 ? t('sync.interval.off') : t('sync.interval.minutes', { n: m }) };
            }),
            onChange: changeInterval
          })
        ),
        h('p', { className: 'dm-field__hint' }, t('sync.scheduleHint'))
      )
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.SyncPanel = SyncPanel;
})(typeof window !== 'undefined' ? window : this);
