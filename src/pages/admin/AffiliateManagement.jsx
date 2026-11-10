import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_BASE } from '../../config/api';
import { vndAsUsd } from '../../utils/money';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('vi-VN'));
// Global: wallet amounts are integers in the currency's minor unit (VND: 1 = 1đ,
// USD: 1 = 1 cent). `cur` comes from /admin/affiliate/overview.
const money = (n, cur) => {
    const d = (cur && cur.unit_divisor) || 1;
    const v = Number(n || 0) / d;
    const t = v.toLocaleString('vi-VN', d === 1 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (cur && cur.currency === 'USD') return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${t} ${(cur && cur.currency) || ''}`.trim();
};
// QR images live in R2 (absolute URL); older values may be relative.
const absUrl = (u) => (/^https?:\/\//.test(u || '') ? u : `${API_BASE}${u}`);
const getToken = () => localStorage.getItem('access_token');
const authed = async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
    });
    const t = await res.text();
    const data = t ? JSON.parse(t) : null;
    if (!res.ok) throw new Error((data && data.detail) || 'Lỗi');
    return data;
};

// Download the QR image (fetch as blob so it downloads across origins).
const downloadQr = async (absUrl, name) => {
    try {
        const res = await fetch(absUrl);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name || 'qr.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { window.open(absUrl, '_blank'); }
};

const pctText = (p) => `${Number(p).toLocaleString('vi-VN')}%`;

/**
 * Tỷ lệ hoa hồng riêng từng tài khoản (06/11). Mặc định 5% (global, 2026-11); mức riêng chỉ áp dụng cho
 * đơn tạo SAU lúc lưu (backend ghi lịch sử, đơn cũ giữ tỷ lệ cũ).
 */
function CommissionRates() {
    const [data, setData] = useState({ default_pct: 5, custom: [], results: [] });
    const [q, setQ] = useState('');
    const [edit, setEdit] = useState({});   // user_id -> chuỗi % đang gõ
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [defEdit, setDefEdit] = useState('');

    const load = useCallback(async (query) => {
        setErr('');
        try {
            const d = await authed(`/admin/affiliate/rates${query ? `?q=${encodeURIComponent(query)}` : ''}`);
            setData(d);
        } catch (e) { setErr(e.message); }
    }, []);
    useEffect(() => { load(''); }, [load]);

    const save = async (r, reset) => {
        setErr(''); setMsg('');
        let rate = null;
        if (!reset) {
            const raw = String(edit[r.user_id] ?? '').replace(',', '.').trim();
            rate = Number(raw);
            if (raw === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
                setErr('Nhập tỷ lệ từ 0 đến 100.'); return;
            }
        }
        setBusy(r.user_id);
        try {
            await authed('/admin/affiliate/rates', { method: 'POST', body: JSON.stringify({ user_id: r.user_id, rate_pct: rate }) });
            setMsg(reset ? `${r.username}: đã trả về mặc định ${pctText(data.default_pct)}`
                : `${r.username}: đã đặt ${pctText(rate)} — áp dụng cho đơn phát sinh từ bây giờ`);
            setEdit(e => ({ ...e, [r.user_id]: '' }));
            await load(q);
        } catch (e) { setErr(e.message); } finally { setBusy(null); }
    };

    const saveDefault = async () => {
        setErr(''); setMsg('');
        const rate = Number(String(defEdit).replace(',', '.').trim());
        if (defEdit === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) { setErr('Nhập tỷ lệ từ 0 đến 100.'); return; }
        if (!window.confirm(`Đổi mức mặc định thành ${pctText(rate)} cho mọi tài khoản không có mức riêng (áp dụng cho đơn phát sinh từ bây giờ)?`)) return;
        setBusy('default');
        try {
            await authed('/admin/affiliate/rates/default', { method: 'POST', body: JSON.stringify({ rate_pct: rate }) });
            setMsg(`Mức mặc định: ${pctText(rate)} — áp dụng cho đơn phát sinh từ bây giờ`);
            setDefEdit('');
            await load(q);
        } catch (e) { setErr(e.message); } finally { setBusy(null); }
    };

    const renderRow = (r) => (
        <tr key={r.user_id}>
            <td className="px-3 py-2">
                <div className="font-medium text-gray-800 dark:text-gray-100">{r.username}</div>
                <div className="text-xs text-gray-500">{r.email || '—'}{r.referral_code ? ` · mã ${r.referral_code}` : ''}</div>
            </td>
            <td className="px-3 py-2 text-right text-gray-600">{fmt(r.signups)}</td>
            <td className="px-3 py-2 text-right">
                {r.custom_pct != null
                    ? <span className="font-semibold text-indigo-600">{pctText(r.custom_pct)}</span>
                    : <span className="text-gray-500">{pctText(data.default_pct)} <span className="text-[11px]">(mặc định)</span></span>}
                {r.since && <div className="text-[11px] text-gray-400">từ {new Date(r.since).toLocaleString('vi-VN')}</div>}
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-2">
                    <input value={edit[r.user_id] ?? ''} onChange={e => setEdit(x => ({ ...x, [r.user_id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && save(r, false)}
                        inputMode="decimal" placeholder="%" className="form-input w-20 text-right py-1" />
                    <button onClick={() => save(r, false)} disabled={busy === r.user_id}
                        className="btn-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">Lưu</button>
                    {r.custom_pct != null && (
                        <button onClick={() => save(r, true)} disabled={busy === r.user_id}
                            className="btn-sm border-gray-200 hover:border-gray-300 text-gray-600 whitespace-nowrap">Về mặc định</button>
                    )}
                </div>
            </td>
        </tr>
    );

    const renderTable = (rows) => (
        <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm">
                <thead className="text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                    <tr>
                        <th className="px-3 py-2 text-left">Tài khoản</th>
                        <th className="px-3 py-2 text-right">Đã giới thiệu</th>
                        <th className="px-3 py-2 text-right">Tỷ lệ hiện tại</th>
                        <th className="px-3 py-2 text-right">Đặt tỷ lệ riêng</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {rows.map(renderRow)}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 mb-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Tỷ lệ hoa hồng · mặc định <span className="text-indigo-600">{pctText(data.default_pct)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 mb-3">
                Tài khoản không được chỉnh sẽ theo mức mặc định. Tỷ lệ mới chỉ áp dụng cho đơn phát sinh sau lúc lưu;
                đơn tạo trước đó vẫn tính theo tỷ lệ cũ.
            </div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Đổi mức mặc định:</span>
                <input value={defEdit} onChange={e => setDefEdit(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDefault()}
                    inputMode="decimal" placeholder="%" className="form-input w-20 text-right py-1" />
                <button onClick={saveDefault} disabled={busy === 'default'}
                    className="btn-sm border-gray-200 hover:border-gray-300 text-gray-600 disabled:opacity-50">Lưu mặc định</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(q)}
                    placeholder="Tìm tài khoản (tên, email hoặc mã giới thiệu)…" className="form-input w-full sm:flex-1" />
                <button onClick={() => load(q)} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Tìm</button>
            </div>
            {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</div>}
            {err && <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}
            {data.results.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Kết quả tìm</div>
                    {renderTable(data.results)}
                </div>
            )}
            <div className="mt-4">
                <div className="text-xs font-semibold text-gray-500 mb-1">Tài khoản đang có tỷ lệ riêng ({data.custom.length})</div>
                {data.custom.length ? renderTable(data.custom)
                    : <div className="text-sm text-gray-400">Chưa có — mọi tài khoản đang theo mức mặc định.</div>}
            </div>
        </div>
    );
}

/**
 * Assign a referrer by hand (ported from the Vietnam admin), for accounts whose
 * referral code was lost at sign-up.
 *
 * Global difference: commission is credited by reconciliation, so every VIP order the
 * account has already paid for is credited to the affiliate as soon as it is assigned —
 * there is no "assign without paying past orders" option. The amount is shown first.
 */
function ManualAttribution({ cur }) {
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(null);      // user đang gán
    const [code, setCode] = useState('');
    const [owner, setOwner] = useState(null);    // chủ mã, tra ra để nhìn trước khi bấm
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const search = async () => {
        setLoading(true); setErr('');
        try {
            const d = await authed(`/admin/affiliate/unattributed?q=${encodeURIComponent(q)}`);
            setRows(d.users || []);
        } catch (e) { setErr(e.message); } finally { setLoading(false); }
    };

    const lookup = async (value) => {
        setCode(value); setOwner(null); setErr('');
        const c = value.trim();
        if (c.length < 4) return;
        try { setOwner(await authed(`/admin/affiliate/lookup?code=${encodeURIComponent(c)}`)); }
        catch (e) { setOwner(null); }
    };

    const submit = async () => {
        setBusy(true); setErr(''); setMsg('');
        try {
            const d = await authed('/admin/affiliate/attribute', {
                method: 'POST',
                body: JSON.stringify({ user_id: open.user_id, ref_code: code.trim() }),
            });
            setMsg(`Đã gán ${open.username} cho ${d.referrer_name}`
                + (d.backfilled_orders ? `, bù ${d.backfilled_orders} đơn = ${money(d.backfilled_xu, cur)}` : ''));
            setOpen(null); setCode(''); setOwner(null);
            setRows(rows.filter(r => r.user_id !== open.user_id));
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 mb-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Gán người giới thiệu thủ công</div>
            <div className="text-xs text-gray-500 mt-1 mb-3">
                Dành cho tài khoản chưa thuộc affiliate nào (mã giới thiệu bị rơi mất lúc đăng ký).
                Gán xong, hoa hồng của các đơn VIP tài khoản đó đã mua sẽ được cộng ngay cho affiliate.
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input value={q} onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Tìm tài khoản chưa có người giới thiệu (tên hoặc email)…"
                    className="form-input w-full sm:flex-1" />
                <button onClick={search} disabled={loading}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                    {loading ? 'Đang tìm…' : 'Tìm'}
                </button>
            </div>

            {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</div>}
            {err && <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

            {rows.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                            <tr>
                                <th className="px-3 py-2 text-left">Tài khoản</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Đăng ký</th>
                                <th className="px-3 py-2 text-right">Đơn VIP đã mua</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                            {rows.map(r => (
                                <tr key={r.user_id}>
                                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{r.username}</td>
                                    <td className="px-3 py-2 text-gray-500">{r.email || '—'}</td>
                                    <td className="px-3 py-2 text-gray-500">
                                        {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '—'}
                                        {r.via_google && <span className="ml-1 text-[11px] text-amber-600">Google</span>}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-600">
                                        {r.paid_orders ? `${r.paid_orders} đơn · ${vndAsUsd(r.paid_amount)}` : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button onClick={() => { setOpen(r); setCode(''); setOwner(null); setMsg(''); }}
                                            className="text-indigo-600 hover:underline font-medium">Gán</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {open && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-700/60 pt-4">
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                        Gán <b>{open.username}</b> cho affiliate nào?
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input value={code} onChange={e => lookup(e.target.value)}
                            placeholder="Mã giới thiệu của affiliate" className="form-input w-full sm:flex-1" />
                        <button onClick={submit} disabled={busy || !owner}
                            className="btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                            {busy ? 'Đang gán…' : 'Xác nhận'}
                        </button>
                        <button onClick={() => { setOpen(null); setCode(''); setOwner(null); }}
                            className="btn border-gray-200 hover:border-gray-300 text-gray-600">Huỷ</button>
                    </div>
                    {/* Bắt buộc tra ra chủ mã rồi mới cho bấm: gõ nhầm một ký tự là tiền chạy
                        sang tài khoản khác, mà gán rồi thì không gỡ được bằng giao diện. */}
                    <div className="text-xs mt-2">
                        {owner
                            ? <span className="text-green-700">Mã này của <b>{owner.username}</b> ({owner.email})</span>
                            : code.trim().length >= 4
                                ? <span className="text-red-600">Không tìm thấy mã này</span>
                                : <span className="text-gray-400">Nhập mã để kiểm tra chủ sở hữu</span>}
                    </div>
                    {open.paid_orders > 0 && (
                        <div className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                            Affiliate sẽ được cộng hoa hồng cho {open.paid_orders} đơn VIP đã mua trước đó
                            <span className="text-amber-600"> (≈ {vndAsUsd(Math.round(open.paid_amount * 0.1))})</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const STATUS = {
    pending: { label: 'Chờ xử lý', cls: 'text-amber-700 bg-amber-100' },
    paid: { label: 'Đã thanh toán', cls: 'text-green-700 bg-green-100' },
    rejected: { label: 'Bị từ chối', cls: 'text-red-600 bg-red-100' },
};

// Bảng top affiliate (2026-11): ai mang lại lượt nhấp, đăng ký, VIP, hoa hồng — để đánh giá hiệu quả creator.
function Leaderboard() {
    const [data, setData] = useState(null);
    const [sort, setSort] = useState('commission');
    const [err, setErr] = useState('');
    useEffect(() => {
        authed(`/admin/affiliate/leaderboard?sort=${sort}&limit=50`).then(setData).catch(e => setErr(e.message));
    }, [sort]);
    const cols = [['clicks', 'Lượt nhấp'], ['signups', 'Đăng ký TK'], ['vip', 'Đăng ký VIP'], ['commission', 'Hoa hồng']];
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Top người giới thiệu</div>
                    <div className="text-xs text-gray-500">Xếp theo cột đang chọn — dùng để đánh giá hiệu quả từng creator.</div>
                </div>
                <div className="flex gap-1">
                    {cols.map(([k, l]) => (
                        <button key={k} onClick={() => setSort(k)} className={`btn-sm ${sort === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                    ))}
                </div>
            </div>
            {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
            <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Tài khoản</th>
                            <th className="px-3 py-2 text-right">Lượt nhấp</th><th className="px-3 py-2 text-right">Đăng ký TK</th>
                            <th className="px-3 py-2 text-right">Đăng ký VIP</th><th className="px-3 py-2 text-right">Tỷ lệ VIP/ĐK</th>
                            <th className="px-3 py-2 text-right">Hoa hồng</th><th className="px-3 py-2 text-right">Số dư ví</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(data?.items || []).map((r, i) => (
                            <tr key={r.user_id}>
                                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                <td className="px-3 py-2"><span className="font-medium text-gray-800 dark:text-gray-100">{r.username}</span><div className="text-xs text-gray-500">{r.email}</div></td>
                                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.clicks)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.signups)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.vip_buyers)}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-500">{r.signups ? `${r.conversion_pct}%` : '—'}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-600">{money(r.commission, data)}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-600">{money(r.balance, data)}</td>
                            </tr>
                        ))}
                        {data && !data.items.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Chưa có dữ liệu giới thiệu.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AffiliateManagement() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [overview, setOverview] = useState(null);
    const [rows, setRows] = useState([]);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, list] = await Promise.all([
                authed('/admin/affiliate/overview'),
                authed(`/admin/affiliate/withdrawals${statusFilter ? `?status=${statusFilter}` : ''}`),
            ]);
            setOverview(ov);
            setRows(Array.isArray(list) ? list : []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    const openDetail = async (id) => {
        try { setDetail(await authed(`/admin/affiliate/withdrawals/${id}`)); } catch (e) { alert(e.message); }
    };

    const act = async (id, action) => {
        let body;
        if (action === 'reject') {
            const reason = window.prompt(
                'Nhập lý do từ chối (sẽ hiển thị cho user để họ sửa & gửi lại, vd: "Email PayPal không nhận được tiền").\nSố tiền sẽ được hoàn lại vào ví của user.'
            );
            if (reason === null) return;            // user cancelled
            if (!reason.trim()) { alert('Vui lòng nhập lý do từ chối.'); return; }
            body = JSON.stringify({ reason: reason.trim() });
        }
        setBusy(true);
        try {
            await authed(`/admin/affiliate/withdrawals/${id}/${action}`, { method: 'POST', body });
            setDetail(null);
            load();
        } catch (e) { alert(e.message); } finally { setBusy(false); }
    };

    const filtered = rows.filter(r => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (r.username || '').toLowerCase().includes(s) || (r.email || '').toLowerCase().includes(s);
    });

    const cards = overview ? [
        { label: 'Tổng hoa hồng phát sinh', value: `${money(overview.total_commission, overview)}` },
        { label: 'Tổng đã chi trả', value: `${money(overview.total_paid, overview)}` },
        { label: 'Số dư ví chưa rút', value: `${money(overview.total_unwithdrawn, overview)}` },
        { label: 'Request đang chờ', value: fmt(overview.pending_requests) },
    ] : [];

    // Funnel hiệu quả affiliate: nhấp -> đăng ký TK -> đăng ký VIP (+ % chuyển đổi).
    const funnelCards = overview ? [
        { label: 'Tổng lượt nhấp qua link', value: fmt(overview.total_clicks), tone: 'text-sky-600', sub: null },
        {
            label: 'Đăng ký tài khoản qua link', value: fmt(overview.total_referred_signups), tone: 'text-[#0096b1]',
            sub: overview.total_clicks ? `${((overview.total_referred_signups / overview.total_clicks) * 100).toFixed(1)}% từ lượt nhấp` : null,
        },
        {
            label: 'Đăng ký VIP qua link', value: fmt(overview.total_vip_signups), tone: 'text-amber-600',
            sub: overview.total_referred_signups ? `${((overview.total_vip_signups / overview.total_referred_signups) * 100).toFixed(1)}% từ đăng ký` : null,
        },
    ] : [];

    return (
        <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Affiliate</h1>

                        {/* Hiệu quả chương trình (funnel) */}
                        {overview && (
                            <div className="mb-6">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Hiệu quả chương trình Affiliate</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {funnelCards.map((c, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
                                            <div className={`text-2xl font-bold ${c.tone} break-words`}>{c.value}</div>
                                            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
                                            {c.sub && <div className="text-[11px] font-medium text-emerald-600 mt-0.5">↑ {c.sub}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Overview (tiền) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            {cards.map((c, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
                                    <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 break-words">{c.value}</div>
                                    <div className="text-xs text-gray-500 mt-1">{c.label}</div>
                                </div>
                            ))}
                        </div>


                        <Leaderboard />

                        <CommissionRates />

                        <ManualAttribution cur={overview} />

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tài khoản / email…"
                                className="form-input w-full sm:flex-1" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-full sm:w-auto">
                                <option value="pending">Chờ xử lý</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="rejected">Bị từ chối</option>
                                <option value="">Tất cả</option>
                            </select>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl">Đang tải…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl">Không có yêu cầu</div>
                        ) : (
                            <>
                                {/* Mobile cards */}
                                <div className="md:hidden space-y-3">
                                    {filtered.map(r => (
                                        <div key={r.withdrawal_id} onClick={() => openDetail(r.withdrawal_id)}
                                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-4 cursor-pointer">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{r.username}</div>
                                                    <div className="text-xs text-gray-500 truncate">{r.email || '—'}</div>
                                                </div>
                                                <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${STATUS[r.status]?.cls || ''}`}>{STATUS[r.status]?.label || r.status}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                                <div><span className="text-gray-400 text-xs block">Số tiền rút</span><span className="font-semibold text-gray-800 dark:text-gray-100">{money(r.amount, overview)}</span></div>
                                                <div><span className="text-gray-400 text-xs block">Số dư ví</span><span className="text-gray-600">{money(r.balance, overview)}</span></div>
                                                <div><span className="text-gray-400 text-xs block">Ngày gửi</span><span className="text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '—'}</span></div>
                                                <div><span className="text-gray-400 text-xs block">Đã chờ</span><span className="text-gray-600">{r.days_waiting} ngày</span></div>
                                            </div>
                                            {r.status === 'pending' && (
                                                <button onClick={e => { e.stopPropagation(); act(r.withdrawal_id, 'paid'); }} disabled={busy}
                                                    className="mt-3 w-full text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg py-2 disabled:opacity-50">Đã chuyển tiền</button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden md:block bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="table-auto w-full text-sm">
                                            <thead className="text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Tài khoản</th>
                                                    <th className="px-4 py-3 text-left">Email</th>
                                                    <th className="px-4 py-3 text-right">Số dư ví</th>
                                                    <th className="px-4 py-3 text-right">Số tiền rút</th>
                                                    <th className="px-4 py-3 text-left">Ngày gửi</th>
                                                    <th className="px-4 py-3 text-center">Chờ</th>
                                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                                    <th className="px-4 py-3 text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                                {filtered.map(r => (
                                                    <tr key={r.withdrawal_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => openDetail(r.withdrawal_id)}>
                                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{r.username}</td>
                                                        <td className="px-4 py-3 text-gray-500">{r.email || '—'}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">{money(r.balance, overview)}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-800 dark:text-gray-100">{money(r.amount, overview)}</td>
                                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                                                        <td className="px-4 py-3 text-center text-gray-500">{r.days_waiting} ngày</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS[r.status]?.cls || ''}`}>{STATUS[r.status]?.label || r.status}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                            {r.status === 'pending' ? (
                                                                <button onClick={() => act(r.withdrawal_id, 'paid')} disabled={busy} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 disabled:opacity-50">Đã chuyển tiền</button>
                                                            ) : (
                                                                <button onClick={() => openDetail(r.withdrawal_id)} className="text-xs text-indigo-500 hover:text-indigo-600">Chi tiết</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Detail modal */}
            {detail && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetail(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Yêu cầu rút tiền #{detail.withdrawal_id}</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Tài khoản', detail.username],
                                ['Email', detail.email || '—'],
                                ['Tên trên PayPal', detail.account_holder || '—'],
                                ['Email PayPal', detail.account_number || '—'],
                                ['Phương thức', detail.bank || 'PayPal'],
                                ['Số tiền yêu cầu', `${money(detail.amount, overview)}`],
                                ['Số dư ví hiện tại', `${money(detail.current_balance, overview)}`],
                                ['Ngày gửi', detail.created_at ? new Date(detail.created_at).toLocaleString('vi-VN') : '—'],
                                ['Số ngày đã chờ', `${detail.days_waiting} ngày`],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 border-b border-gray-50 dark:border-gray-700/40 pb-1.5">
                                    <span className="text-gray-500 shrink-0">{k}</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-100 text-right break-all">{v}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-1">
                                <span className="text-gray-500">Trạng thái</span>
                                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS[detail.status]?.cls || ''}`}>{STATUS[detail.status]?.label || detail.status}</span>
                            </div>
                        </div>
                        {detail.status === 'rejected' && detail.admin_note && (
                            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                                <span className="font-semibold">Lý do từ chối: </span>{detail.admin_note}
                            </div>
                        )}
                        {detail.qr_url && (
                            <div className="mt-4 text-center">
                                <div className="text-xs text-gray-500 mb-2">Mã QR nhận tiền (quét để chuyển khoản)</div>
                                <img src={absUrl(detail.qr_url)} alt="QR" className="mx-auto w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg border border-gray-200 bg-white" />
                                <button
                                    onClick={() => downloadQr(absUrl(detail.qr_url), `qr-affiliate-${detail.withdrawal_id}.png`)}
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#0096b1] hover:underline"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                                    Tải ảnh QR
                                </button>
                            </div>
                        )}
                        {detail.status === 'pending' && (
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                                <button onClick={() => act(detail.withdrawal_id, 'reject')} disabled={busy} className="btn w-full sm:w-auto text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50">Từ chối (hoàn tiền)</button>
                                <button onClick={() => act(detail.withdrawal_id, 'paid')} disabled={busy} className="btn w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Đã chuyển tiền</button>
                            </div>
                        )}
                        <div className="flex justify-center sm:justify-end mt-3">
                            <button onClick={() => setDetail(null)} className="text-sm text-gray-500 hover:text-gray-700">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AffiliateManagement;
