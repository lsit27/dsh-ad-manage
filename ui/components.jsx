/* AD/LDAP Domain Manager - self-drawn UI primitives (no Harness UI packages). */
(function (global) {
  'use strict';
  var React = require('react');
  var h = React.createElement;
  var useRef = React.useRef;
  var useEffect = React.useEffect;
  var useState = React.useState;

  // ---------- helpers ----------
  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (!a) continue;
      if (typeof a === 'string' || typeof a === 'number') out.push(a);
      else if (Array.isArray(a)) out.push(cx.apply(null, a));
      else if (typeof a === 'object') {
        for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k) && a[k]) out.push(k);
      }
    }
    return out.join(' ');
  }

  // Interpolate {name} placeholders in locale strings.
  function fmt(tpl, vars) {
    if (typeof tpl !== 'string') return String(tpl == null ? '' : tpl);
    if (!vars) return tpl;
    return tpl.replace(/\{([a-zA-Z0-9_.]+)\}/g, function (m, key) {
      var v = vars[key];
      return v == null ? m : String(v);
    });
  }

  // Fire an event handler without leaking the React synthetic event into async code.
  function stop(fn) {
    return function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      return fn(e);
    };
  }

  // ---------- Button ----------
  function Button(props) {
    var variant = props.variant || 'default';
    var cls = cx('dm-btn', 'dm-btn--' + variant, props.className, props.block && 'dm-btn--block');
    var tag = props.href ? 'a' : 'button';
    var attrs = {
      className: cls,
      type: props.href ? null : (props.type || 'button'),
      disabled: props.disabled || props.loading,
      title: props.title,
      'aria-label': props['aria-label'],
      onClick: props.disabled || props.loading ? undefined : props.onClick
    };
    if (props.href) attrs.href = props.href;
    var children = props.loading
      ? [h(Spinner, { key: 's' }), props.children]
      : props.children;
    return h(tag, attrs, children);
  }

  // ---------- Spinner ----------
  function Spinner(props) {
    return h('span', {
      className: cx('dm-spinner', props && props.className),
      role: 'progressbar',
      'aria-label': props && props.label
    });
  }

  // ---------- Field / Form ----------
  function Field(props) {
    var label = props.label;
    var required = props.required;
    var hint = props.hint;
    var error = props.error;
    var control = props.children;
    var id = props.id;
    return h('div', { className: cx('dm-field', props.className) },
      label ? h('label', { className: 'dm-field__label', htmlFor: id },
        label, required ? h('span', { className: 'dm-field__required', 'aria-hidden': 'true' }, ' *') : null
      ) : null,
      control,
      hint && !error ? h('div', { className: 'dm-field__hint' }, hint) : null,
      error ? h('div', { className: 'dm-field__error', role: 'alert' }, error) : null
    );
  }

  function Input(props) {
    var type = props.type || 'text';
    return h('input', {
      ref: props.inputRef,
      id: props.id,
      className: cx('dm-input', props.className),
      type: type,
      value: props.value == null ? '' : props.value,
      placeholder: props.placeholder,
      disabled: props.disabled,
      readOnly: props.readOnly,
      min: props.min,
      max: props.max,
      step: props.step,
      autoComplete: props.autoComplete || (type === 'password' ? 'new-password' : 'off'),
      'aria-label': props['aria-label'],
      onChange: props.onChange ? function (e) { props.onChange(e.target.value, e); } : undefined,
      onKeyDown: props.onKeyDown,
      onBlur: props.onBlur
    });
  }

  function Textarea(props) {
    return h('textarea', {
      id: props.id,
      className: cx('dm-input', 'dm-textarea', props.className),
      value: props.value == null ? '' : props.value,
      placeholder: props.placeholder,
      disabled: props.disabled,
      rows: props.rows || 4,
      'aria-label': props['aria-label'],
      onChange: props.onChange ? function (e) { props.onChange(e.target.value, e); } : undefined
    });
  }

  function Checkbox(props) {
    return h('label', { className: cx('dm-checkbox', props.className) },
      h('input', {
        type: 'checkbox',
        checked: !!props.checked,
        disabled: props.disabled,
        onChange: function (e) { if (props.onChange) props.onChange(e.target.checked, e); }
      }),
      h('span', null, props.label)
    );
  }

  function Select(props) {
    var options = props.options || [];
    var children = options.map(function (opt, i) {
      var value = opt && typeof opt === 'object' ? opt.value : opt;
      var label = opt && typeof opt === 'object' ? opt.label : opt;
      return h('option', { key: 'opt-' + i + '-' + value, value: value }, label);
    });
    return h('select', {
      id: props.id,
      className: cx('dm-input', 'dm-select', props.className),
      value: props.value == null ? '' : props.value,
      disabled: props.disabled,
      'aria-label': props['aria-label'],
      onChange: function (e) { if (props.onChange) props.onChange(e.target.value, e); }
    }, children);
  }

  // ---------- Table ----------
  // columns: [{ key, title, width, render(row, index) }]
  function Table(props) {
    var columns = props.columns || [];
    var rows = props.rows || [];
    var rowKey = props.rowKey || function (r, i) { return r && (r.id || r.dn || r.name) || i; };
    var selectable = !!props.onSelectRow;
    var selected = props.selectedKeys || [];
    var head = h('thead', null, h('tr', null,
      selectable ? h('th', { className: 'dm-table__check', scope: 'col' },
        h('input', {
          type: 'checkbox',
          'aria-label': props.selectAllLabel || 'Select all',
          checked: rows.length > 0 && selected.length === rows.length,
          onChange: function (e) {
            if (props.onSelectAll) props.onSelectAll(e.target.checked ? rows.map(rowKey) : []);
          }
        })
      ) : null,
      columns.map(function (col, i) {
        return h('th', {
          key: 'th-' + i,
          scope: 'col',
          style: col.width ? { width: col.width } : undefined
        }, col.title);
      })
    ));
    var body;
    if (props.loading) {
      body = h('tbody', null, h('tr', null, h('td', {
        colSpan: columns.length + (selectable ? 1 : 0),
        className: 'dm-table__placeholder'
      }, h(Spinner, { label: props.loadingLabel }), ' ', props.loadingLabel || '')));
    } else if (!rows.length) {
      body = h('tbody', null, h('tr', null, h('td', {
        colSpan: columns.length + (selectable ? 1 : 0),
        className: 'dm-table__placeholder'
      }, props.emptyText || '')));
    } else {
      body = h('tbody', null, rows.map(function (row, ri) {
        var key = rowKey(row, ri);
        var isSel = selected.indexOf(key) >= 0;
        return h('tr', {
          key: 'row-' + ri + '-' + key,
          className: cx(isSel && 'dm-table__row--selected'),
          onClick: selectable ? function () { props.onSelectRow(key, row); } : undefined
        },
          selectable ? h('td', { className: 'dm-table__check' },
            h('input', {
              type: 'checkbox',
              checked: isSel,
              'aria-label': props.selectRowLabel || 'Select row',
              onClick: function (e) { e.stopPropagation(); },
              onChange: function (e) {
                var next = selected.slice();
                var idx = next.indexOf(key);
                if (e.target.checked && idx < 0) next.push(key);
                if (!e.target.checked && idx >= 0) next.splice(idx, 1);
                if (props.onSelectAll) props.onSelectAll(next);
              }
            })
          ) : null,
          columns.map(function (col, ci) {
            return h('td', { key: 'td-' + ci }, col.render ? col.render(row, ri) : (row[col.key] == null ? '' : String(row[col.key])));
          })
        );
      }));
    }
    return h('div', { className: cx('dm-table-wrap', props.className) },
      h('table', { className: 'dm-table' }, head, body)
    );
  }

  // ---------- Pagination ----------
  function Pagination(props) {
    var page = props.page || 1;
    var pageSize = props.pageSize || 20;
    var total = props.total || 0;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    return h('div', { className: 'dm-pagination' },
      h('span', { className: 'dm-pagination__info' }, props.totalText || ''),
      h('div', { className: 'dm-pagination__controls' },
        h(Button, {
          size: 'sm', disabled: page <= 1, onClick: function () { props.onChange(Math.max(1, page - 1)); }
        }, props.prevText || 'Prev'),
        h('span', { className: 'dm-pagination__page' }, props.pageText || ''),
        h(Button, {
          size: 'sm', disabled: page >= pages, onClick: function () { props.onChange(Math.min(pages, page + 1)); }
        }, props.nextText || 'Next')
      )
    );
  }

  // ---------- Modal ----------
  // Lifecycle: Escape key closes, backdrop click closes, focus moves into the dialog.
  function Modal(props) {
    var dialogRef = useRef(null);
    var onCloseRef = useRef(props.onClose);
    onCloseRef.current = props.onClose;
    var size = props.size || 'md';

    useEffect(function () {
      function keyHandler(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCloseRef.current && onCloseRef.current();
        }
      }
      document.addEventListener('keydown', keyHandler, true);
      return function () { document.removeEventListener('keydown', keyHandler, true); };
    }, []);

    useEffect(function () {
      var node = dialogRef.current;
      if (!node) return;
      var focusable = node.querySelectorAll('input:not([type=hidden]),select,textarea,button,[tabindex]:not([tabindex="-1"])');
      if (focusable && focusable.length) focusable[0].focus();
    }, []);

    return h('div', {
      className: 'dm-modal-backdrop',
      onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose && props.onClose(); }
    },
      h('div', {
        ref: dialogRef,
        className: cx('dm-modal', 'dm-modal--' + size),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': props.title || undefined
      },
        h('div', { className: 'dm-modal__head' },
          h('h2', { className: 'dm-modal__title' }, props.title || ''),
          h('button', {
            type: 'button', className: 'dm-modal__close', 'aria-label': props.closeLabel || 'Close',
            onClick: props.onClose
          }, '×')
        ),
        h('div', { className: 'dm-modal__body' }, props.children),
        props.footer ? h('div', { className: 'dm-modal__foot' }, props.footer) : null
      )
    );
  }

  // ---------- ConfirmDialog (dangerous actions) ----------
  // Requires the literal CONFIRMED token before the confirm button enables.
  function ConfirmDialog(props) {
    var isDanger = !!props.danger;
    var tokenState = useState('');
    var token = tokenState[0];
    var setToken = tokenState[1];
    var inputRef = useRef(null);
    var t = props.t || function (x) { return x; };
    var title = props.title || t('danger.title');
    var message = props.message || t('danger.message', { action: props.action || '' });
    var confirmLabel = props.confirmLabel || (isDanger ? t('danger.confirm') : t('common.ok'));
    var cancelLabel = props.cancelLabel || t('common.cancel');

    function onConfirm() {
      if (isDanger && token !== 'CONFIRMED') return;
      if (props.onConfirm) props.onConfirm('CONFIRMED');
    }

    return h(Modal, {
      title: title,
      size: 'sm',
      onClose: props.onClose,
      closeLabel: t('common.close'),
      footer: h('div', { className: 'dm-dialog-actions' },
        h(Button, { variant: 'ghost', onClick: props.onClose }, cancelLabel),
        h(Button, {
          variant: isDanger ? 'danger' : 'primary',
          onClick: onConfirm,
          disabled: isDanger && token !== 'CONFIRMED'
        }, confirmLabel)
      )
    },
      h('p', { className: 'dm-dialog-message' }, message),
      isDanger ? h(Field, { label: t('danger.tip') },
        h(Input, {
          id: 'dm-confirm-token',
          inputRef: inputRef,
          value: token,
          placeholder: 'CONFIRMED',
          autoComplete: 'off',
          onChange: setToken
        })
      ) : null
    );
  }

  // ---------- Tree ----------
  // nodes: [{ id, label, children: [...] }] ; selectedId + onSelect(id, node)
  function TreeNode(props) {
    var node = props.node;
    var depth = props.depth || 0;
    var expanded = props.expandedMap[node.id] !== false;
    var hasChildren = node.children && node.children.length;
    var isSelected = props.selectedId === node.id;
    return h('div', { className: 'dm-tree__node' },
      h('div', {
        className: cx('dm-tree__row', isSelected && 'dm-tree__row--selected'),
        style: { paddingLeft: (8 + depth * 16) + 'px' },
        role: 'treeitem',
        'aria-selected': isSelected,
        'aria-expanded': hasChildren ? expanded : undefined,
        tabIndex: 0,
        onClick: function () { props.onSelect(node.id, node); },
        onKeyDown: function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onSelect(node.id, node); }
        }
      },
        hasChildren
          ? h('button', {
            type: 'button', className: 'dm-tree__toggle', 'aria-label': expanded ? 'Collapse' : 'Expand',
            onClick: stop(function () { props.onToggle(node.id, !expanded); })
          }, expanded ? '▾' : '▸')
          : h('span', { className: 'dm-tree__toggle' }),
        h('span', { className: 'dm-tree__label' }, node.label),
        node.count != null ? h('span', { className: 'dm-tree__count' }, node.count) : null
      ),
      hasChildren && expanded
        ? h('div', { role: 'group' }, node.children.map(function (child) {
          return h(TreeNode, {
            key: child.id,
            node: child,
            depth: depth + 1,
            expandedMap: props.expandedMap,
            selectedId: props.selectedId,
            onSelect: props.onSelect,
            onToggle: props.onToggle
          });
        }))
        : null
    );
  }

  function Tree(props) {
    var expandedMap = props.expandedMap || {};
    return h('div', { className: cx('dm-tree', props.className), role: 'tree' },
      props.nodes && props.nodes.length
        ? props.nodes.map(function (node) {
          return h(TreeNode, {
            key: node.id,
            node: node,
            expandedMap: expandedMap,
            selectedId: props.selectedId,
            onSelect: props.onSelect,
            onToggle: props.onToggle
          });
        })
        : h('div', { className: 'dm-tree__empty' }, props.emptyText || '')
    );
  }

  // ---------- Toast ----------
  function Toast(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('dm-toast', 'dm-toast--' + tone), role: 'status' },
      h('span', { className: 'dm-toast__icon' }, tone === 'error' ? '!' : tone === 'success' ? '✓' : 'i'),
      h('span', { className: 'dm-toast__text' }, props.message),
      h('button', {
        type: 'button', className: 'dm-toast__close', 'aria-label': props.closeLabel || 'Close',
        onClick: props.onClose
      }, '×')
    );
  }

  function ToastStack(props) {
    return h('div', { className: 'dm-toast-stack', 'aria-live': 'polite' },
      (props.items || []).map(function (item) {
        return h(Toast, {
          key: item.id,
          tone: item.tone,
          message: item.message,
          closeLabel: props.closeLabel,
          onClose: function () { props.onDismiss(item.id); }
        });
      })
    );
  }

  // ---------- Inline notice ----------
  function Notice(props) {
    return h('div', {
      className: cx('dm-notice', 'dm-notice--' + (props.tone || 'error')),
      role: props.tone === 'error' ? 'alert' : 'status'
    }, props.children);
  }

  // ---------- Section ----------
  function Section(props) {
    return h('section', { className: cx('dm-section', props.className) },
      props.title ? h('h3', { className: 'dm-section__title' }, props.title) : null,
      props.children
    );
  }

  // ---------- Badge ----------
  function Badge(props) {
    return h('span', { className: cx('dm-badge', 'dm-badge--' + (props.tone || 'default')) }, props.children);
  }

  // ---------- Spacer / empty ----------
  function Empty(props) {
    return h('div', { className: 'dm-empty' }, props.children);
  }

  var api = {
    cx: cx,
    fmt: fmt,
    stop: stop,
    Button: Button,
    Spinner: Spinner,
    Field: Field,
    Input: Input,
    Textarea: Textarea,
    Checkbox: Checkbox,
    Select: Select,
    Table: Table,
    Pagination: Pagination,
    Modal: Modal,
    ConfirmDialog: ConfirmDialog,
    Tree: Tree,
    Toast: Toast,
    ToastStack: ToastStack,
    Notice: Notice,
    Section: Section,
    Badge: Badge,
    Empty: Empty
  };

  if (!global.__DM_UI__) global.__DM_UI__ = {};
  global.__DM_UI__.components = api;
})(typeof window !== 'undefined' ? window : this);
