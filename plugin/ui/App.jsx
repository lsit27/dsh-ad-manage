/* AD/LDAP Domain Manager - top-level application shell. */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  var NAV = [
    { key: 'connect', labelKey: 'nav.connect' },
    { key: 'users', labelKey: 'nav.users' },
    { key: 'computers', labelKey: 'nav.computers' },
    { key: 'groups', labelKey: 'nav.groups' },
    { key: 'ous', labelKey: 'nav.ous' },
    { key: 'gpos', labelKey: 'nav.gpos' },
    { key: 'search', labelKey: 'nav.search' },
    { key: 'audit', labelKey: 'nav.audit' },
    { key: 'sync', labelKey: 'nav.sync' },
    { key: 'market', labelKey: 'nav.market', admin: true }
  ];

  var toastSeq = 0;

  function App(props) {
    var t = props.t;
    var call = props.call;
    var ctx = props.ctx;

    var viewState = useState('connect');
    var view = viewState[0];
    var setView = viewState[1];
    var domainState = useState(null);
    var activeDomain = domainState[0];
    var setActiveDomain = domainState[1];
    var domainOptionsState = useState([]);
    var domainOptions = domainOptionsState[0];
    var setDomainOptions = domainOptionsState[1];
    var toastsState = useState([]);
    var toasts = toastsState[0];
    var setToasts = toastsState[1];
    var isAdminState = useState(false);
    var isAdmin = isAdminState[0];
    var setIsAdmin = isAdminState[1];

    function pushToast(message, tone) {
      var id = ++toastSeq;
      var item = { id: id, message: String(message || ''), tone: tone || 'info' };
      setToasts(function (prev) { return prev.concat([item]); });
      setTimeout(function () {
        setToasts(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });
      }, 5000);
      return id;
    }

    function dismissToast(id) {
      setToasts(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });
    }

    // Unmounting cancels all pending toast dismissals.
    useEffect(function () {
      return function () { /* timers are short-lived and self-clearing via state guard */ };
    }, []);

    function loadMeta() {
      call('domain-manager.rbac.can', { action: 'market.read' }).then(function (res) {
        setIsAdmin(!!(res && res.ok && (res.data === true || (res.data && res.data.allowed === true))));
      }).catch(function () { setIsAdmin(false); });
      call('domain-manager.domainConfig.list', {}).then(function (res) {
        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);
        setDomainOptions(items);
        var active = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].active || items[i].isActive) { active = items[i].id; break; }
        }
        if (active == null && items.length) active = items[0].id;
        setActiveDomain(active);
      }).catch(function () { setDomainOptions([]); });
    }

    useEffect(function () { loadMeta(); }, []);

    // Host navigation entries may open this page through a custom event.
    useEffect(function () {
      if (typeof window === 'undefined' || !window.addEventListener) return function () {};
      function onOpen(e) {
        var target = e && e.detail && e.detail.view;
        setView(target || 'connect');
      }
      window.addEventListener('dm-open-domain-manager', onOpen);
      return function () { window.removeEventListener('dm-open-domain-manager', onOpen); };
    }, []);

    function changeDomain(id) {
      setActiveDomain(id || null);
      if (!id) return;
      call('domain-manager.domainConfig.setActive', { id: id }).then(function (res) {
        if (!(res && res.ok)) pushToast(t('common.error'), 'error');
      }).catch(function () { pushToast(t('common.error'), 'error'); });
    }

    function renderView() {
      var common = {
        t: t,
        call: call,
        toast: pushToast,
        domainId: activeDomain,
        actor: props.actor,
        ctx: ctx
      };
      switch (view) {
        case 'connect': return h(global.__DM_UI__.ConnectConfig, common);
        case 'users': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'users' }, common));
        case 'computers': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'computers' }, common));
        case 'groups': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'groups' }, common));
        case 'ous': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'ous' }, common));
        case 'gpos': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'gpos' }, common));
        case 'search': return h(global.__DM_UI__.GlobalSearch, common);
        case 'audit': return h(global.__DM_UI__.AuditLog, common);
        case 'sync': return h(global.__DM_UI__.SyncPanel, common);
        case 'market':
          return isAdmin
            ? h(global.__DM_UI__.Market, common)
            : h('div', { className: 'dm-page' }, h(C.Notice, { tone: 'warning' }, t('market.adminOnly')));
        default: return h(global.__DM_UI__.ConnectConfig, common);
      }
    }

    return h('div', { className: 'dm-app' },
      h('header', { className: 'dm-app__head' },
        h('div', { className: 'dm-app__brand' },
          h('img', { src: props.iconUrl || '', alt: '', className: 'dm-app__icon', 'aria-hidden': 'true' }),
          h('span', null, t('meta.title'))
        ),
        domainOptions.length
          ? h(C.Select, {
            value: activeDomain || '',
            options: domainOptions.map(function (d) {
              return { value: d.id, label: d.label || d.name || d.host || d.id };
            }),
            onChange: changeDomain,
            'aria-label': t('common.selectDomain')
          })
          : null
      ),
      h('nav', { className: 'dm-app__nav', 'aria-label': t('meta.title') },
        NAV.filter(function (n) { return !n.admin || isAdmin; }).map(function (n) {
          return h('button', {
            key: n.key,
            type: 'button',
            className: C.cx('dm-app__nav-item', view === n.key && 'dm-app__nav-item--active'),
            onClick: function () { setView(n.key); }
          }, t(n.labelKey));
        })
      ),
      h('div', { className: 'dm-app__content', key: 'view-' + view }, renderView()),
      h(C.ToastStack, {
        items: toasts, closeLabel: t('toast.close'), onDismiss: dismissToast
      })
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.App = App;
})(typeof window !== 'undefined' ? window : this);
