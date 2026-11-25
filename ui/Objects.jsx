/* AD/LDAP Domain Manager - directory object pages, dialogs and global search. */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};

  // Object type metadata: query method, create method, columns and title keys.
  var TYPES = {
    users: {
      list: 'domain-manager.directory.listUsers',
      title: 'objects.users',
      columns: [
        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.displayName || r.name || r.cn || r.sAMAccountName || r.uid || ''; } },
        { key: 'sAMAccountName', titleKey: 'objects.col.sam', render: function (r) { return r.sAMAccountName || r.uid || ''; } },
        { key: 'userPrincipalName', titleKey: 'objects.col.upn', render: function (r) { return r.userPrincipalName || ''; } },
        { key: 'mail', titleKey: 'objects.col.mail', render: function (r) { return r.mail || ''; } },
        { key: 'mobile', titleKey: 'objects.col.mobile', render: function (r) { return r.mobile || ''; } },
        { key: 'department', titleKey: 'objects.col.department', render: function (r) { return r.department || ''; } },
        { key: 'title', titleKey: 'objects.col.title', render: function (r) { return r.title || ''; } },
        { key: 'employeeID', titleKey: 'objects.col.employeeID', render: function (r) { return r.employeeID || ''; } },
        { key: 'enabled', titleKey: 'objects.col.enabled', render: function (r) { return flag(r, 'enabled', true); } },
        { key: 'locked', titleKey: 'objects.col.locked', render: function (r) { return flag(r, 'locked', false); } },
        { key: 'pwdLastSet', titleKey: 'objects.col.pwdLastSet', render: function (r) { return r.pwdLastSet || ''; } }
      ],
      filters: [
        { key: 'enabled', labelKey: 'objects.filter.enabled', options: [['', 'common.all'], ['true', 'common.enabled'], ['false', 'common.disabled']] },
        { key: 'locked', labelKey: 'objects.filter.locked', options: [['', 'common.all'], ['true', 'common.yes'], ['false', 'common.no']] }
      ]
    },
    computers: {
      list: 'domain-manager.directory.listComputers',
      title: 'objects.computers',
      columns: [
        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.cn || ''; } },
        { key: 'dnsHostName', titleKey: 'objects.col.dnsHost', render: function (r) { return r.dnsHostName || r.dnshostname || ''; } },
        { key: 'operatingSystem', titleKey: 'objects.col.os', render: function (r) { return r.operatingSystem || ''; } },
        { key: 'ou', titleKey: 'objects.col.ou', render: function (r) { return ouOfDn(r.dn); } },
        { key: 'enabled', titleKey: 'objects.col.enabled', render: function (r) { return flag(r, 'enabled', true); } },
        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }
      ],
      filters: [
        { key: 'enabled', labelKey: 'objects.filter.enabled', options: [['', 'common.all'], ['true', 'common.enabled'], ['false', 'common.disabled']] }
      ]
    },
    groups: {
      list: 'domain-manager.directory.listGroups',
      title: 'objects.groups',
      columns: [
        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.cn || ''; } },
        { key: 'sAMAccountName', titleKey: 'objects.col.sam', render: function (r) { return r.sAMAccountName || ''; } },
        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } },
        { key: 'memberCount', titleKey: 'objects.col.memberCount', render: function (r) { return r.memberCount != null ? r.memberCount : (Array.isArray(r.members) ? r.members.length : ''); } },
        { key: 'dn', titleKey: 'objects.col.dn', render: function (r) { return r.dn || ''; } }
      ],
      filters: []
    },
    ous: {
      list: 'domain-manager.directory.listOUs',
      title: 'objects.ous',
      columns: [
        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.ou || r.cn || ''; } },
        { key: 'dn', titleKey: 'objects.col.dn', render: function (r) { return r.dn || ''; } },
        { key: 'parent', titleKey: 'objects.col.parent', render: function (r) { return r.parent || r.parentDn || ''; } },
        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }
      ],
      filters: []
    },
    gpos: {
      list: 'domain-manager.directory.listGPOs',
      title: 'objects.gpos',
      columns: [
        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.displayName || ''; } },
        { key: 'enabled', titleKey: 'objects.col.gpoStatus', render: function (r) { return flag(r, 'enabled', true); } },
        { key: 'links', titleKey: 'objects.col.gpoLinks', render: function (r) {
          // 选中 OU 时展示作用域：直接链接 / 继承自某 OU
          if (r.scopeType === 'direct') return t('objects.scope.direct') + (r.enforced ? ' [强制]' : '');
          if (r.scopeType === 'inherited') return t('objects.scope.inherited') + ' ' + ouOfDn(r.inheritedFrom || '');
          var links = Array.isArray(r.gpoLinks) && r.gpoLinks.length ? r.gpoLinks : (Array.isArray(r.linkedOUs) ? r.linkedOUs.map(function (u) { return { ou: u }; }) : []);
          if (!links.length) return '—';
          return links.map(function (l) {
            var ou = l.ou || l;
            var tag = l.enforced ? ' [强制]' : (l.inheritanceBlocked ? ' [阻止继承]' : '');
            return ouOfDn(ou) + tag;
          }).join('; ');
        } },
        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }
      ],
      filters: []
    }
  };

  function flag(row, key, goodWhenTrue) {
    var raw = row[key];
    if (raw == null) return '—';
    var enabled = raw === true || raw === 1 || raw === 'true' || raw === 'TRUE' || raw === 'enabled';
    var good = goodWhenTrue ? enabled : !enabled;
    return h(C.Badge, { tone: good ? 'success' : 'muted' }, enabled ? 'true' : 'false');
  }

  function rowName(row) {
    return row.displayName || row.name || row.cn || row.sAMAccountName || row.uid || row.dn || '';
  }
  // 从 DN 提取所属 OU（去掉首个 RDN 后的部分，显示为可读的 OU 路径）
  function ouOfDn(dn) {
    if (!dn) return '';
    var parts = String(dn).split(',');
    if (parts.length < 2) return '';
    return parts.slice(1).map(function (p) { return p.replace(/^OU=/i, ''); }).join(' / ');
  }

  function toBool(v) { return v === true || v === 'true' || v === 1; }

  // -------------------- OU tree --------------------
  function buildOUTree(ous) {
    var nodes = [];
    var map = {};
    var byId = {}; // 短 id -> DN，便于 parentId 关联
    (ous || []).forEach(function (o) {
      var id = o.dn || o.id || o.name;
      if (o.id) byId[o.id] = id;
      map[id] = {
        id: id,
        label: o.name || o.cn || id,
        dn: o.dn || id,
        raw: o,
        children: []
      };
    });
    (ous || []).forEach(function (o) {
      var id = o.dn || o.id || o.name;
      var node = map[id];
      // listOUs 返回 parentId；也兼容 parent/parentDn。父节点可能是 id 也可能是 DN。
      var parent = o.parentId || o.parent || o.parentDn;
      var parentNode = parent && (map[parent] || map[byId[parent]]);
      if (parentNode && parentNode !== node) parentNode.children.push(node);
      else nodes.push(node);
    });
    return nodes;
  }

  function OUTree(props) {
    var t = props.t;
    var call = props.call;
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var nodesState = useState([]);
    var nodes = nodesState[0];
    var setNodes = nodesState[1];
    var selectedState = useState(null);
    var selected = selectedState[0];
    var setSelectedFn = selectedState[1];
    var expandedState = useState({});
    var expanded = expandedState[0];
    var setExpanded = expandedState[1];
    var errorState = useState('');
    var error = errorState[0];
    var setError = errorState[1];

    function loadTree() {
      setLoading(true);
      setError('');
      call('domain-manager.directory.listOUs', { page: 1, pageSize: 1000 }).then(function (res) {
        setLoading(false);
        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);
        var tree = buildOUTree(items);
        setNodes(tree);
        var exp = {};
        tree.forEach(function (n) { exp[n.id] = true; });
        setExpanded(exp);
      }).catch(function (err) {
        setLoading(false);
        setError(C.fmt(t('objects.loadOUError'), { message: err && err.message ? err.message : '' }));
      });
    }

    useEffect(function () { loadTree(); }, []);

    function onSelect(id, node) {
      setSelectedFn(id);
      props.onSelect(node && node.dn ? node.dn : id);
    }

    function onToggle(id, open) {
      setExpanded(function (prev) {
        var next = Object.assign({}, prev);
        next[id] = open;
        return next;
      });
    }

    return h('div', { className: 'dm-ou-tree' },
      h('div', { className: 'dm-ou-tree__head' }, t('objects.ouTree'),
        h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadTree, loading: loading, title: t('common.refresh') }, '↻')
      ),
      error ? h(C.Notice, { tone: 'error' }, error) : null,
      h('button', {
        type: 'button',
        className: C.cx('dm-tree__all', selected === null && 'dm-tree__all--active'),
        onClick: function () { setSelectedFn(null); props.onSelect(null); }
      }, t('objects.allObjects')),
      h(C.Tree, {
        nodes: nodes,
        expandedMap: expanded,
        selectedId: selected,
        emptyText: loading ? t('common.loading') : t('common.empty'),
        onSelect: onSelect,
        onToggle: onToggle
      })
    );
  }

  // -------------------- Object list page --------------------
  function ObjectsPage(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;
    var typeKey = props.type || 'users';
    var meta = TYPES[typeKey] || TYPES.users;
    var domainId = props.domainId;

    var keywordState = useState('');
    var keyword = keywordState[0];
    var setKeyword = keywordState[1];
    var appliedKeywordState = useState('');
    var appliedKeyword = appliedKeywordState[0];
    var setAppliedKeyword = appliedKeywordState[1];
    var filtersState = useState({});
    var filters = filtersState[0];
    var setFilters = filtersState[1];
    var ouDnState = useState(null);
    var ouDn = ouDnState[0];
    var setOuDn = ouDnState[1];
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
    var selectedState = useState([]);
    var selected = selectedState[0];
    var setSelected = selectedState[1];
    var dialogState = useState(null);
    var dialog = dialogState[0];
    var setDialog = dialogState[1];
    var busyState = useState(false);
    var busy = busyState[0];
    var setBusy = busyState[1];
    var gpoOptionsState = useState([]);
    var gpoOptions = gpoOptionsState[0];
    var setGpoOptions = gpoOptionsState[1];

    function loadList() {
      setLoading(true);
      setError('');
      var q = {
        domainId: domainId,
        keyword: appliedKeyword,
        filters: filters,
        ouDn: ouDn,
        page: page,
        pageSize: 20
      };
      call(meta.list, q).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          var data = res.data || {};
          setRows(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));
          setTotal(data.total != null ? data.total : (Array.isArray(data.items) ? data.items.length : 0));
          setSelected([]);
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          setError(C.fmt(t('objects.loadListError'), { message: msg }));
        }
      }).catch(function (err) {
        setLoading(false);
        setError(C.fmt(t('objects.loadListError'), { message: err && err.message ? err.message : '' }));
      });
    }

    useEffect(function () { loadList(); }, [typeKey, domainId, page, appliedKeyword, JSON.stringify(filters), ouDn]);

    function loadGpoOptions() {
      call('domain-manager.directory.listGPOs', { page: 1, pageSize: 1000, domainId: domainId }).then(function (res) {
        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);
        setGpoOptions(items);
      }).catch(function () { setGpoOptions([]); });
    }

    function applySearch() {
      setPage(1);
      setAppliedKeyword(keyword);
    }

    function changeFilter(key, value) {
      setPage(1);
      setFilters(function (prev) {
        var next = Object.assign({}, prev);
        if (!value) delete next[key];
        else next[key] = value;
        return next;
      });
    }

    function clearFilters() {
      setFilters({});
      setKeyword('');
      setAppliedKeyword('');
      setPage(1);
    }

    function onOUSelect(dn) {
      setOuDn(dn);
      setPage(1);
    }

    function runAction(method, params, successKey, dangerInfo, extras) {
      setBusy(true);
      setDialog(null);
      var payload = Object.assign({}, params, { domainId: domainId, actor: props.actor });
      if (dangerInfo) payload.confirmToken = 'CONFIRMED';
      call(method, payload).then(function (res) {
        setBusy(false);
        if (res && res.ok) {
          toast(t(successKey || 'objects.operationOk'), 'success');
          loadList();
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          toast(C.fmt(t('objects.operationFail'), { message: msg }), 'error');
        }
      }).catch(function (err) {
        setBusy(false);
        toast(C.fmt(t('objects.operationFail'), { message: err && err.message ? err.message : '' }), 'error');
      });
    }

    // Open dialogs -------------------------------------------------------
    function openCreate() {
      var d = { kind: 'create' };
      if (typeKey === 'gpos') { loadGpoOptions(); }
      setDialog(d);
    }

    function openEdit(row) {
      setDialog({ kind: 'edit', row: row });
    }

    function openGpoEdit(row) {
      setDialog({ kind: 'gpoEdit', row: row });
    }

    function openDelete(row) {
      setDialog({ kind: 'delete', row: row, danger: true });
    }

    function openResetPw(row) {
      setDialog({ kind: 'resetPw', row: row, danger: true });
    }

    function openToggle(row) {
      var enabled = toBool(row.enabled);
      setDialog({
        kind: 'toggle', row: row, danger: false,
        nextEnabled: !enabled,
        message: C.fmt(t('objects.confirm.toggle'), { action: enabled ? t('common.disable') : t('common.enable'), name: rowName(row) })
      });
    }

    function openUnlock(row) {
      setDialog({
        kind: 'unlock', row: row,
        message: C.fmt(t('objects.confirm.unlock'), { name: rowName(row) })
      });
    }

    function openMove(row) {
      setDialog({ kind: 'move', row: row });
    }

    function openGroups(row) {
      setDialog({ kind: 'groups', row: row, membersText: '' });
      call('domain-manager.directory.listGroupMembers', { id: row.id || row.dn, domainId: domainId }).then(function (res) {
        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);
        setDialog(function (prev) {
          if (!prev || prev.kind !== 'groups') return prev;
          return Object.assign({}, prev, {
            members: items.map(function (m) { return (m && (m.dn || m.name || m.id)) || String(m); })
          });
        });
      }).catch(function () { /* leave members empty */ });
    }

    function openRename(row) {
      setDialog({ kind: 'rename', row: row });
    }

    function openBindGpo(row) {
      loadGpoOptions();
      setDialog({ kind: 'bindGpo', row: row });
    }

    function openUnbindGpo(row) {
      var links = Array.isArray(row.links) ? row.links : (row.links ? String(row.links).split(',') : []);
      setDialog({ kind: 'unbindGpo', row: row, links: links, danger: true });
    }

    function openBatch(action) {
      setDialog({ kind: 'batch', action: action, danger: true });
    }

    // Action columns -----------------------------------------------------
    function actionsFor(row) {
      var acts = [];
      var id = row.id || row.dn;
      function btn(key, label, fn, variant) {
        return h(C.Button, { key: key, size: 'sm', variant: variant || 'ghost', onClick: fn }, label);
      }
      if (typeKey === 'users') {
        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));
        acts.push(btn('resetPw', t('objects.action.resetPw'), function () { openResetPw(row); }));
        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));
        acts.push(btn('unlock', t('objects.action.unlock'), function () { openUnlock(row); }));
        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));
        acts.push(btn('groups', t('objects.action.groups'), function () { openGroups(row); }));
        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));
      } else if (typeKey === 'computers') {
        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));
        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));
        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));
        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));
      } else if (typeKey === 'groups') {
        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));
        acts.push(btn('members', t('objects.action.groups'), function () { openGroups(row); }));
        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));
      } else if (typeKey === 'ous') {
        acts.push(btn('rename', t('objects.action.rename'), function () { openRename(row); }));
        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));
        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));
      } else if (typeKey === 'gpos') {
        acts.push(btn('edit', t('common.edit'), function () { openGpoEdit(row); }));
        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));
        acts.push(btn('bind', t('objects.action.bindGpo'), function () { openBindGpo(row); }));
        acts.push(btn('unbind', t('objects.action.unbindGpo'), function () { openUnbindGpo(row); }, 'danger'));
        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));
      }
      return h('div', { className: 'dm-row-actions' }, acts);
    }

    var columns = meta.columns.map(function (col) {
      return {
        key: col.key,
        title: t(col.titleKey),
        render: col.render
      };
    });
    columns.push({ key: '__actions', title: t('common.actions'), render: actionsFor });

    // Dialog contents ----------------------------------------------------
    function renderDialog() {
      if (!dialog) return null;
      var d = dialog;
      var row = d.row || {};
      var id = row.id || row.dn;
      // A fresh keyed sub-component resets local form state on each dialog open.
      return h(ObjectDialog, {
        key: d.kind + '-' + (id || ''),
        t: t, dialog: d, meta: meta, typeKey: typeKey,
        row: row, domainId: domainId, actor: props.actor,
        call: call,
        gpoOptions: gpoOptions,
        selectedIds: selected,
        busy: busy,
        close: function () { setDialog(null); },
        submit: function (method, params, successKey) {
          runAction(method, params, successKey, !!d.danger);
        },
        runAction: runAction
      });
    }

    return h('div', { className: 'dm-page dm-objects' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t(meta.title)),
        h('p', { className: 'dm-page__desc' }, t('objects.description'))
      ),
      h('div', { className: 'dm-objects-layout' },
        h('aside', { className: 'dm-objects-side' },
          h(OUTree, { t: t, call: call, onSelect: onOUSelect })
        ),
        h('main', { className: 'dm-objects-main' },
          h('div', { className: 'dm-toolbar' },
            h(C.Input, {
              value: keyword,
              placeholder: t('objects.searchPlaceholder'),
              onChange: setKeyword,
              onKeyDown: function (e) { if (e.key === 'Enter') applySearch(); }
            }),
            h(C.Button, { variant: 'primary', onClick: applySearch }, t('common.search')),
            h(C.Button, { variant: 'ghost', onClick: clearFilters }, t('common.clearFilter')),
            h(C.Button, { variant: 'primary', onClick: openCreate }, t('objects.action.create')),
            selected.length
              ? h(C.Select, {
                value: '',
                options: [{ value: '', label: t('objects.batchAction') }].concat(
                  typeKey === 'gpos'
                    ? [{ value: 'toggle', label: t('objects.action.toggle') }, { value: 'unbindGpo', label: t('objects.action.unbindGpo') }]
                    : [{ value: 'delete', label: t('common.delete') }, { value: 'toggle', label: t('objects.action.toggle') }]
                ),
                onChange: function (v) { if (v) openBatch(v); }
              })
              : null,
            selected.length ? h('span', { className: 'dm-selected-count' }, C.fmt(t('objects.selected'), { count: selected.length })) : null
          ),
          meta.filters && meta.filters.length
            ? h('div', { className: 'dm-filter-bar' },
                h('span', { className: 'dm-filter-bar__label' }, t('common.filter')),
                meta.filters.map(function (f) {
                  return h('label', { key: f.key, className: 'dm-filter-bar__item' },
                    h('span', { className: 'dm-filter-bar__item-label' }, t(f.labelKey)),
                    h(C.Select, {
                      value: filters[f.key] || '',
                      options: f.options.map(function (o) { return { value: o[0], label: t(o[1]) }; }),
                      onChange: function (v) { changeFilter(f.key, v); },
                      'aria-label': t(f.labelKey)
                    })
                  );
                }),
                Object.keys(filters).length
                  ? h(C.Button, { size: 'sm', variant: 'ghost', onClick: clearFilters }, t('common.clearFilter'))
                  : null
              )
            : null,
          error ? h(C.Notice, { tone: 'error' }, error,
            h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadList }, t('common.retry'))
          ) : null,
          // 分页放在表格上方，避免数据多时下方按钮超出屏幕不可见
          h(C.Pagination, {
            page: page, pageSize: 20, total: total,
            totalText: C.fmt(t('common.total'), { total: total }),
            pageText: C.fmt(t('common.page'), { page: page, pages: Math.max(1, Math.ceil(total / 20)) }),
            prevText: t('common.prev'), nextText: t('common.next'),
            onChange: function (p) { setPage(p); }
          }),
          h(C.Table, {
            columns: columns,
            rows: rows,
            loading: loading,
            loadingLabel: t('common.loading'),
            emptyText: t('common.empty'),
            rowKey: function (r, i) { return (r.id || r.dn || rowName(r) || i); },
            selectable: true,
            selectedKeys: selected,
            onSelectAll: setSelected,
            selectAllLabel: t('common.all'),
            selectRowLabel: t('objects.selected')
          })
        )
      ),
      renderDialog()
    );
  }

  // -------------------- Object dialog form --------------------
  function ObjectDialog(props) {
    var t = props.t;
    var d = props.dialog;
    var row = props.row || {};
    var kind = d.kind;
    var id = row.id || row.dn;
    var initial = Object.assign({}, row, {
      sam: row.sAMAccountName || row.uid || '',
      upn: row.userPrincipalName || '',
      displayName: row.displayName || '',
      givenName: row.givenName || '',
      sn: row.sn || '',
      mail: row.mail || '',
      mobile: row.mobile || '',
      employeeID: row.employeeID || row.employeeNumber || '',
      department: row.department || '',
      title: row.title || '',
      telephoneNumber: row.telephoneNumber || '',
      dnsHostName: row.dnsHostName || row.dnshostname || '',
      operatingSystem: row.operatingSystem || '',
      description: row.description || ''
    });
    var formState = useState(initial);
    var form = formState[0];
    var setForm = formState[1];
    var localErrorState = useState('');
    var localError = localErrorState[0];
    var setLocalError = localErrorState[1];
    var tokenState = useState('');
    var token = tokenState[0];
    var setToken = tokenState[1];
    var typeKey = props.typeKey;

    // 移动/绑定 GPO 时，目标 OU 从组织树点选（不手填 DN）
    var ouNodesState = useState([]);
    var ouNodes = ouNodesState[0];
    var setOuNodes = ouNodesState[1];
    var ouExpandedState = useState({});
    var ouExpanded = ouExpandedState[0];
    var setOuExpanded = ouExpandedState[1];
    var ouLoadedState = useState(false);
    var ouLoaded = ouLoadedState[0];
    var setOuLoaded = ouLoadedState[1];

    function ensureOuTree() {
      if (ouLoaded) return;
      setOuLoaded(true);
      props.call('domain-manager.directory.listOUs', { page: 1, pageSize: 1000 }).then(function (res) {
        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : [];
        var tree = buildOUTree(items);
        setOuNodes(tree);
        var exp = {};
        tree.forEach(function (n) { exp[n.id] = true; });
        setOuExpanded(exp);
      }).catch(function () {});
    }

    function set(key, value) {
      setForm(function (prev) {
        var next = Object.assign({}, prev);
        next[key] = value;
        return next;
      });
    }

    function titleForDialog() {
      if (kind === 'create') {
        if (typeKey === 'users') return t('objects.createUser');
        if (typeKey === 'computers') return t('objects.createComputer');
        if (typeKey === 'groups') return t('objects.createGroup');
        if (typeKey === 'ous') return t('objects.createOU');
        return t('objects.action.create');
      }
      if (kind === 'edit') {
        if (typeKey === 'users') return t('objects.editUser');
        if (typeKey === 'computers') return t('objects.editComputer');
        if (typeKey === 'groups') return t('objects.editGroup');
        return t('common.edit');
      }
      if (kind === 'rename') return t('objects.renameOU');
      if (kind === 'gpoEdit') return t('objects.editGpo');
      if (kind === 'move') return t('objects.move');
      if (kind === 'resetPw') return t('objects.resetPw');
      if (kind === 'groups') return t('objects.groups');
      if (kind === 'bindGpo') return t('objects.bindGpo');
      if (kind === 'unbindGpo') return t('objects.action.unbindGpo');
      if (kind === 'batch') return t('objects.batchAction');
      if (kind === 'delete') return t('common.delete');
      if (kind === 'unlock') return t('objects.action.unlock');
      if (kind === 'toggle') return t('objects.action.toggle');
      return t('common.details');
    }

    function basePayload() {
      var p = {
        domainId: props.domainId,
        actor: props.actor,
        id: id,
        dn: row.dn,
        dnRaw: row.dnRaw || row.dn,
        sAMAccountName: form.sam || row.sAMAccountName || row.username || '',
        name: form.name || form.cn || rowName(row),
        sAMAccountName: form.sam,
        userPrincipalName: form.upn,
        displayName: form.displayName,
        givenName: form.givenName,
        sn: form.sn,
        mail: form.mail,
        mobile: form.mobile,
        employeeID: form.employeeID,
        department: form.department,
        title: form.title,
        telephoneNumber: form.telephoneNumber,
        dnsHostName: form.dnsHostName,
        operatingSystem: form.operatingSystem,
        description: form.description,
        enabled: toBool(form.enabled)
      };
      return p;
    }

    function validateForm() {
      if (kind === 'resetPw') {
        if (!form.newPassword) { setLocalError(t('objects.passwordEmpty')); return false; }
        if (form.newPassword !== form.confirmPassword) { setLocalError(t('objects.passwordMismatch')); return false; }
      }
      if (kind === 'create' || kind === 'edit') {
        if (!String(form.sam || '').trim() && typeKey === 'users') {
          setLocalError(t('common.required', { fields: t('objects.field.sam') }));
          return false;
        }
      }
      setLocalError('');
      return true;
    }

    function submitSimple() {
      if (!validateForm()) return;
      if (d.danger && kind !== 'delete' && kind !== 'resetPw' && kind !== 'batch' && kind !== 'unbindGpo') {
        // non-token dialogs do not need confirmation
      }
      var danger = !!d.danger;
      if (danger && token !== 'CONFIRMED') {
        setLocalError(t('common.confirmTokenInvalid'));
        return;
      }
      var p = basePayload();
      switch (kind) {
        case 'create':
          if (typeKey === 'users') props.submit('domain-manager.directory.createUser', p, 'objects.operationOk');
          else if (typeKey === 'computers') props.submit('domain-manager.directory.createComputer', p, 'objects.operationOk');
          else if (typeKey === 'groups') props.submit('domain-manager.directory.createGroup', p, 'objects.operationOk');
          else if (typeKey === 'ous') props.submit('domain-manager.directory.createOU', p, 'objects.operationOk');
          else if (typeKey === 'gpos') props.submit('domain-manager.directory.createGPO', Object.assign(p, { name: form.name }), 'objects.operationOk');
          break;
        case 'edit':
          if (typeKey === 'users') props.submit('domain-manager.directory.updateUser', p, 'objects.operationOk');
          else if (typeKey === 'computers') props.submit('domain-manager.directory.updateComputer', p, 'objects.operationOk');
          else if (typeKey === 'groups') props.submit('domain-manager.directory.updateGroup', p, 'objects.operationOk');
          break;
        case 'rename':
          props.submit('domain-manager.directory.renameOU', Object.assign(p, { id: id, name: form.newName || form.name }), 'objects.operationOk');
          break;
        case 'move':
          props.submit(
            typeKey === 'computers' ? 'domain-manager.directory.moveComputer' : 'domain-manager.directory.moveUser',
            Object.assign(p, { id: id, ou: form.targetOU, parent: form.targetOU }), 'objects.operationOk'
          );
          break;
        case 'resetPw':
          props.submit('domain-manager.directory.resetPassword', Object.assign(p, { id: id, password: form.newPassword }), 'objects.operationOk');
          break;
        case 'unlock':
          props.runAction('domain-manager.directory.unlockUser', { id: id }, 'objects.operationOk', false);
          props.close();
          break;
        case 'toggle':
          if (typeKey === 'gpos') {
            props.runAction('domain-manager.directory.toggleGPO', { id: id, enabled: d.nextEnabled }, 'objects.operationOk', false);
          } else if (typeKey === 'computers') {
            props.runAction('domain-manager.directory.toggleComputer', Object.assign(p, { id: id, enabled: d.nextEnabled }), 'objects.operationOk', false);
          } else {
            props.runAction('domain-manager.directory.toggleUser', Object.assign(p, { id: id, enabled: d.nextEnabled }), 'objects.operationOk', false);
          }
          props.close();
          break;
        case 'delete':
          props.submit(
            typeKey === 'users' ? 'domain-manager.directory.deleteUser' :
              typeKey === 'computers' ? 'domain-manager.directory.deleteComputer' :
                typeKey === 'groups' ? 'domain-manager.directory.deleteGroup' :
                  typeKey === 'ous' ? 'domain-manager.directory.deleteOU' :
                    typeKey === 'gpos' ? 'domain-manager.directory.deleteGPO' : 'domain-manager.directory.deleteUser',
            Object.assign(p, { id: id }), 'objects.operationOk'
          );
          break;
        case 'gpoEdit':
          props.submit('domain-manager.directory.updateGPO', Object.assign(p, { id: id, name: form.name, description: form.description }), 'objects.operationOk');
          break;
        case 'groups':
          props.submit('domain-manager.directory.addGroupMembers', Object.assign(p, { id: id, members: splitLines(form.membersText) }), 'objects.operationOk');
          break;
        case 'bindGpo':
          props.submit('domain-manager.directory.bindGPO', Object.assign(p, { id: form.gpoId, ou: form.targetOU || ouDnFrom(row), ouDn: form.targetOU || ouDnFrom(row) }), 'objects.operationOk');
          break;
        case 'unbindGpo':
          props.submit('domain-manager.directory.unbindGPO', Object.assign(p, {
            id: form.gpoId || row.id,
            ou: form.unbindOu || (d.links && d.links[0]) || row.dn,
            ouDn: form.unbindOu || (d.links && d.links[0]) || row.dn
          }), 'objects.operationOk');
          break;
        case 'batch': {
          var ids = props.selectedIds || [];
          var action = d.action;
          var method = action === 'delete' ? 'domain-manager.directory.deleteUser' : 'domain-manager.directory.toggleUser';
          props.submit(method, Object.assign(p, { ids: ids, action: action, enabled: false }), 'objects.operationOk');
          break;
        }
        default:
          props.close();
      }
    }

    function ouDnFrom(row) { return row.ou || row.dn || ''; }
    function splitLines(v) {
      return String(v || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }

    var isDanger = !!d.danger;
    var footer = h('div', { className: 'dm-dialog-actions' },
      h(C.Button, { variant: 'ghost', onClick: props.close }, t('common.cancel')),
      h(C.Button, {
        variant: isDanger ? 'danger' : 'primary',
        loading: props.busy,
        disabled: isDanger && token !== 'CONFIRMED',
        onClick: submitSimple
      }, t('common.ok'))
    );

    // Form body ----------------------------------------------------------
    var body;
    if (kind === 'delete') {
      body = h(C.ConfirmDialogBody, {
        t: t, danger: true,
        message: C.fmt(t('objects.confirm.delete'), { name: rowName(row) }),
        token: token, onToken: setToken
      });
    } else if (kind === 'resetPw') {
      body = h('div', null,
        h(C.Notice, { tone: 'warning' }, C.fmt(t('objects.confirm.resetPw'), { name: rowName(row) })),
        h(C.Field, { id: 'dm-pw1', label: t('objects.field.newPassword'), required: true },
          h(C.Input, { id: 'dm-pw1', type: 'password', value: form.newPassword || '', onChange: function (v) { set('newPassword', v); } })
        ),
        h(C.Field, { id: 'dm-pw2', label: t('objects.field.confirmPassword'), required: true },
          h(C.Input, { id: 'dm-pw2', type: 'password', value: form.confirmPassword || '', onChange: function (v) { set('confirmPassword', v); } })
        ),
        isDanger ? h(C.Field, { id: 'dm-token', label: t('danger.tip') },
          h(C.Input, { id: 'dm-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })
        ) : null
      );
    } else if (kind === 'toggle' || kind === 'unlock') {
      body = h(C.ConfirmDialogBody, {
        t: t, danger: false,
        message: d.message || C.fmt(t('danger.message'), { action: titleForDialog() }),
        token: token, onToken: setToken
      });
    } else if (kind === 'batch') {
      body = h(C.ConfirmDialogBody, {
        t: t, danger: true,
        message: C.fmt(t('objects.confirm.batch'), { count: (props.selectedIds || []).length, action: t(d.action === 'delete' ? 'common.delete' : 'objects.action.toggle') }),
        token: token, onToken: setToken
      });
    } else if (kind === 'unbindGpo') {
      body = h('div', null,
        h(C.Notice, { tone: 'warning' }, C.fmt(t('objects.confirm.unbindGpo'), { gpo: rowName(row), ou: (d.links && d.links[0]) || row.dn || '' })),
        h(C.Field, { id: 'dm-unbind-ou', label: t('objects.field.targetOU') },
          h(C.Select, {
            id: 'dm-unbind-ou',
            value: form.unbindOu || (d.links && d.links[0]) || '',
            options: (d.links || []).map(function (l) { return { value: l, label: l }; }),
            onChange: function (v) { set('unbindOu', v); }
          })
        ),
        h(C.Field, { id: 'dm-token', label: t('danger.tip') },
          h(C.Input, { id: 'dm-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })
        )
      );
    } else if (kind === 'move') {
      ensureOuTree();
      body = h('div', null,
        h(C.Field, { id: 'dm-move-ou', label: t('objects.field.targetOU'), required: true },
          h('div', { className: 'dm-ou-picker' },
            h(C.Tree, {
              nodes: ouNodes,
              expandedMap: ouExpanded,
              selectedId: form.targetOU || '',
              onSelect: function (id, node) { set('targetOU', node && node.dn ? node.dn : id); },
              onToggle: function (id, open) {
                setOuExpanded(function (prev) { var n = Object.assign({}, prev); n[id] = open; return n; });
              }
            })
          )
        ),
        form.targetOU ? h('p', { className: 'dm-field__hint' }, t('objects.selectedOU') + '：' + form.targetOU) : null
      );
    } else if (kind === 'groups') {
      body = h('div', null,
        h(C.Notice, { tone: 'info' }, (form.members || []).join(', ') || t('common.empty')),
        h(C.Field, { id: 'dm-members', label: t('objects.field.members') },
          h(C.Textarea, { id: 'dm-members', value: form.membersText || '', rows: 6, onChange: function (v) { set('membersText', v); } })
        )
      );
    } else if (kind === 'bindGpo') {
      body = h('div', null,
        h(C.Field, { id: 'dm-gpo', label: t('objects.field.gpo'), required: true },
          h(C.Select, {
            id: 'dm-gpo',
            value: form.gpoId || '',
            options: [{ value: '', label: t('common.selectDomain') }].concat(props.gpoOptions.map(function (g) {
              return { value: g.id || g.dn, label: g.name || g.displayName || g.id };
            })),
            onChange: function (v) { set('gpoId', v); }
          })
        ),
        h(C.Field, { id: 'dm-bind-ou', label: t('objects.field.targetOU') },
          h('div', { className: 'dm-ou-picker' },
            h(C.Tree, {
              nodes: ouNodes,
              expandedMap: ouExpanded,
              selectedId: form.targetOU || '',
              onSelect: function (id, node) { set('targetOU', node && node.dn ? node.dn : id); },
              onToggle: function (id, open) {
                setOuExpanded(function (prev) { var n = Object.assign({}, prev); n[id] = open; return n; });
              }
            })
          )
        )
      );
      ensureOuTree();
    } else if (kind === 'rename') {
      body = h(C.Field, { id: 'dm-newname', label: t('objects.field.newName'), required: true },
        h(C.Input, { id: 'dm-newname', value: form.newName || '', onChange: function (v) { set('newName', v); } })
      );
    } else if (kind === 'gpoEdit') {
      body = h('div', null,
        h(C.Field, { id: 'dm-gpo-name', label: t('objects.field.name'), required: true },
          h(C.Input, { id: 'dm-gpo-name', value: form.name || '', onChange: function (v) { set('name', v); } })
        ),
        h(C.Field, { id: 'dm-gpo-desc', label: t('objects.col.description') },
          h(C.Input, { id: 'dm-gpo-desc', value: form.description || '', onChange: function (v) { set('description', v); } })
        )
      );
    } else {
      // create / edit
      var fields = [];
      function f(key, labelKey, opts) {
        opts = opts || {};
        fields.push(h(C.Field, { key: key, id: 'dm-obj-' + key, label: t(labelKey), required: opts.required },
          h(C.Input, {
            id: 'dm-obj-' + key,
            type: opts.type || 'text',
            value: form[key] == null ? '' : form[key],
            placeholder: opts.placeholder,
            onChange: function (v) { set(key, v); }
          })
        ));
      }
      if (typeKey === 'users') {
        f('sam', 'objects.field.sam', { required: true });
        f('upn', 'objects.field.upn');
        f('displayName', 'objects.field.displayName');
        f('givenName', 'objects.field.firstName');
        f('sn', 'objects.field.lastName');
        f('mail', 'objects.field.mail');
        f('mobile', 'objects.field.mobile');
        f('employeeID', 'objects.field.employeeID');
        f('department', 'objects.field.department');
        f('title', 'objects.field.title');
        f('telephoneNumber', 'objects.field.telephoneNumber');
      } else if (typeKey === 'computers') {
        f('name', 'objects.field.name', { required: true });
        f('dnsHostName', 'objects.field.dn');
        f('operatingSystem', 'objects.field.os');
      } else if (typeKey === 'groups') {
        f('name', 'objects.field.name', { required: true });
        f('sam', 'objects.field.sam');
      } else if (typeKey === 'ous') {
        f('name', 'objects.field.name', { required: true });
      } else if (typeKey === 'gpos') {
        f('name', 'objects.field.name', { required: true });
      }
      f('description', 'objects.field.description');
      body = h('div', { className: 'dm-form-grid' }, fields);
    }

    return h(C.Modal, {
      title: titleForDialog(),
      size: kind === 'create' || kind === 'edit' ? 'md' : 'sm',
      onClose: props.close,
      closeLabel: t('common.close'),
      footer: footer
    },
      localError ? h(C.Notice, { tone: 'error' }, localError) : null,
      body
    );
  }

  // Shared body for non-form confirmation dialogs.
  C.ConfirmDialogBody = function ConfirmDialogBody(props) {
    var t = props.t;
    return h('div', null,
      h('p', { className: 'dm-dialog-message' }, props.message),
      props.danger ? h(C.Field, { id: 'dm-token-body', label: t('danger.tip') },
        h(C.Input, {
          id: 'dm-token-body', value: props.token || '', placeholder: 'CONFIRMED',
          onChange: function (v) { props.onToken(v); }
        })
      ) : null
    );
  };

  // -------------------- Global search --------------------
  function GlobalSearch(props) {
    var t = props.t;
    var call = props.call;
    var toast = props.toast;
    var keywordState = useState('');
    var keyword = keywordState[0];
    var setKeyword = keywordState[1];
    var typeState = useState('');
    var type = typeState[0];
    var setType = typeState[1];
    var resultsState = useState([]);
    var results = resultsState[0];
    var setResults = resultsState[1];
    var loadingState = useState(false);
    var loading = loadingState[0];
    var setLoading = loadingState[1];
    var errorState = useState('');
    var error = errorState[0];
    var setError = errorState[1];
    var searchedState = useState(false);
    var searched = searchedState[0];
    var setSearched = searchedState[1];

    function doSearch() {
      setLoading(true);
      setError('');
      setSearched(true);
      call('domain-manager.directory.search', {
        keyword: keyword, type: type, domainId: props.domainId
      }).then(function (res) {
        setLoading(false);
        if (res && res.ok) {
          var data = res.data;
          setResults(Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []));
        } else {
          var msg = res && res.error && res.error.message ? res.error.message : '';
          setError(C.fmt(t('common.inlineError'), { message: msg }));
        }
      }).catch(function (err) {
        setLoading(false);
        setError(C.fmt(t('common.inlineError'), { message: err && err.message ? err.message : '' }));
      });
    }

    var columns = [
      { key: 'type', title: t('objects.searchType'), render: function (r) { return r.type || r.objectType || '—'; } },
      { key: 'name', title: t('objects.col.name'), render: rowName },
      { key: 'sam', title: t('objects.col.sam'), render: function (r) { return r.sAMAccountName || r.uid || ''; } },
      { key: 'dn', title: t('objects.col.dn'), render: function (r) { return r.dn || ''; } }
    ];

    return h('div', { className: 'dm-page dm-search' },
      h('header', { className: 'dm-page__head' },
        h('h1', { className: 'dm-page__title' }, t('objects.searchTitle')),
        h('p', { className: 'dm-page__desc' }, t('objects.description'))
      ),
      h('div', { className: 'dm-toolbar' },
        h(C.Input, {
          value: keyword, placeholder: t('objects.searchPlaceholder'),
          onChange: setKeyword,
          onKeyDown: function (e) { if (e.key === 'Enter') doSearch(); }
        }),
        h(C.Select, {
          value: type,
          options: [
            { value: '', label: t('objects.searchAll') },
            { value: 'user', label: t('nav.users') },
            { value: 'computer', label: t('nav.computers') },
            { value: 'group', label: t('nav.groups') },
            { value: 'ou', label: t('nav.ous') }
          ],
          onChange: setType
        }),
        h(C.Button, { variant: 'primary', onClick: doSearch, loading: loading }, t('objects.searchButton'))
      ),
      error ? h(C.Notice, { tone: 'error' }, error) : null,
      searched ? h(C.Section, { title: t('objects.searchResult') },
        h(C.Table, {
          columns: columns, rows: results, loading: loading,
          emptyText: t('objects.searchNoResult'), loadingLabel: t('common.loading')
        })
      ) : null
    );
  }

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.ObjectsPage = ObjectsPage;
  global.__DM_UI__.GlobalSearch = GlobalSearch;
})(typeof window !== 'undefined' ? window : this);
